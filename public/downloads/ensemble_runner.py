"""
ensemble_runner.py
==================

CLI + importable API to run Monte Carlo / scenario ensembles on an EPANET
network with WNTR, persist results to disk, and summarize resilience metrics
across runs.

Supported scenario families
---------------------------
* `leaks`        — random leaks on junctions (count, size, start time sampled)
* `pipe_breaks`  — random pipe closures (count, duration sampled)
* `earthquake`   — WNTR's seismic fragility model: damages pipes/tanks/pumps
                   based on PGA/PGV from a random epicenter + magnitude

Outputs (under --outdir)
------------------------
runs/run_<i>/                      per-run pickled SimulationResults
runs/run_<i>/scenario.json         the sampled scenario parameters
summary.csv                        one row per run with headline metrics
summary.json                       aggregate stats across the ensemble

Install
-------
    pip install wntr numpy pandas matplotlib

CLI
---
    python ensemble_runner.py \
        --inp Net3.inp \
        --scenario earthquake \
        --n 50 \
        --duration 48 \
        --outdir ./ensemble_out

API
---
    from ensemble_runner import run_ensemble
    summary_df = run_ensemble("Net3.inp", scenario="leaks", n=100,
                              duration_hours=48, outdir="out")
"""

from __future__ import annotations

import argparse
import json
import pickle
import random
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

import wntr


# ---------------------------------------------------------------------------
# Scenario sampling
# ---------------------------------------------------------------------------

@dataclass
class Scenario:
    kind: str
    seed: int
    params: dict[str, Any]


def sample_leak_scenario(wn: wntr.network.WaterNetworkModel, rng: random.Random) -> Scenario:
    junctions = wn.junction_name_list
    n_leaks = rng.randint(1, max(2, len(junctions) // 50))
    targets = rng.sample(junctions, k=min(n_leaks, len(junctions)))
    return Scenario(
        kind="leaks",
        seed=rng.randint(0, 2**31 - 1),
        params={
            "leaks": [
                {
                    "node": j,
                    "area_m2": rng.uniform(0.001, 0.05),    # ~ 1 cm² – 500 cm²
                    "start_hr": rng.uniform(0, 6),
                    "discharge_coeff": 0.75,
                }
                for j in targets
            ]
        },
    )


def sample_pipe_break_scenario(wn: wntr.network.WaterNetworkModel, rng: random.Random) -> Scenario:
    pipes = wn.pipe_name_list
    n_breaks = rng.randint(1, max(2, len(pipes) // 40))
    targets = rng.sample(pipes, k=min(n_breaks, len(pipes)))
    return Scenario(
        kind="pipe_breaks",
        seed=rng.randint(0, 2**31 - 1),
        params={
            "breaks": [
                {
                    "pipe": p,
                    "start_hr": rng.uniform(1, 12),
                    "duration_hr": rng.uniform(4, 24),
                }
                for p in targets
            ]
        },
    )


def sample_earthquake_scenario(wn: wntr.network.WaterNetworkModel, rng: random.Random) -> Scenario:
    # WNTR ships a seismic fragility model. We sample magnitude + epicenter
    # within the network's bounding box and let WNTR compute per-element damage.
    coords = np.array([wn.get_node(n).coordinates for n in wn.node_name_list])
    xmin, ymin = coords.min(axis=0)
    xmax, ymax = coords.max(axis=0)
    return Scenario(
        kind="earthquake",
        seed=rng.randint(0, 2**31 - 1),
        params={
            "epicenter": [rng.uniform(xmin, xmax), rng.uniform(ymin, ymax)],
            "magnitude": rng.uniform(5.5, 7.5),
            "depth_m": rng.uniform(5000, 15000),
            "start_hr": rng.uniform(0, 6),
            "repair_rate_threshold": 0.1,   # breaks per km above which we close
        },
    )


SCENARIO_SAMPLERS = {
    "leaks": sample_leak_scenario,
    "pipe_breaks": sample_pipe_break_scenario,
    "earthquake": sample_earthquake_scenario,
}


# ---------------------------------------------------------------------------
# Scenario application
# ---------------------------------------------------------------------------

def apply_scenario(wn: wntr.network.WaterNetworkModel, scen: Scenario) -> None:
    """Mutate `wn` in place to encode the scenario as controls/leaks."""
    if scen.kind == "leaks":
        for leak in scen.params["leaks"]:
            node = wn.get_node(leak["node"])
            node.add_leak(
                wn,
                area=leak["area_m2"],
                discharge_coeff=leak["discharge_coeff"],
                start_time=leak["start_hr"] * 3600,
            )

    elif scen.kind == "pipe_breaks":
        for br in scen.params["breaks"]:
            pipe = wn.get_link(br["pipe"])
            t0 = br["start_hr"] * 3600
            t1 = (br["start_hr"] + br["duration_hr"]) * 3600
            close = wntr.network.controls.ControlAction(pipe, "status", 0)
            open_ = wntr.network.controls.ControlAction(pipe, "status", 1)
            wn.add_control(
                f"close_{br['pipe']}",
                wntr.network.controls.Control.time_control(wn, t0, "SIM_TIME", False, close),
            )
            wn.add_control(
                f"open_{br['pipe']}",
                wntr.network.controls.Control.time_control(wn, t1, "SIM_TIME", False, open_),
            )

    elif scen.kind == "earthquake":
        eq = wntr.scenario.Earthquake(
            tuple(scen.params["epicenter"]),
            scen.params["magnitude"],
            scen.params["depth_m"],
        )
        pipe_pga = eq.pga_attenuation_model(wn)
        pipe_pgv = eq.pgv_attenuation_model(wn)
        repair_rate = eq.repair_rate_model(pipe_pgv)
        t_eq = scen.params["start_hr"] * 3600
        for pipe_name, rr in repair_rate.items():
            if rr > scen.params["repair_rate_threshold"]:
                pipe = wn.get_link(pipe_name)
                close = wntr.network.controls.ControlAction(pipe, "status", 0)
                wn.add_control(
                    f"eq_close_{pipe_name}",
                    wntr.network.controls.Control.time_control(
                        wn, t_eq, "SIM_TIME", False, close
                    ),
                )
    else:
        raise ValueError(f"Unknown scenario kind: {scen.kind}")


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def compute_metrics(wn: wntr.network.WaterNetworkModel, results) -> dict[str, float]:
    """Compute headline resilience metrics for a single run."""
    pressure = results.node["pressure"]
    demand = results.node["demand"]

    # Expected demand (what each junction *would* have consumed)
    expected = wntr.metrics.expected_demand(wn)

    # Align: only junction nodes present in both
    common_nodes = [n for n in wn.junction_name_list if n in demand.columns]
    delivered = demand[common_nodes].clip(lower=0)
    expected_aligned = expected[common_nodes].reindex(delivered.index, method="nearest")

    # Water Service Availability (WSA): delivered / expected, averaged
    total_expected = expected_aligned.sum().sum()
    total_delivered = delivered.sum().sum()
    wsa = float(total_delivered / total_expected) if total_expected > 0 else float("nan")

    # Pressure stats
    p_junc = pressure[common_nodes]
    frac_low_pressure = float((p_junc < 14.0).values.mean())  # < 14 m ≈ 20 psi
    min_pressure = float(p_junc.min().min())
    mean_pressure = float(p_junc.mean().mean())

    # Population impacted (uses default 1 person per m³/day basis)
    try:
        pop = wntr.metrics.population(wn)
        pop_impacted = float(
            wntr.metrics.population_impacted(pop, p_junc, np.less, 14.0).sum().max()
        )
    except Exception:
        pop_impacted = float("nan")

    # Todini resilience index (network-level hydraulic resilience)
    try:
        head = results.node["head"]
        todini = wntr.metrics.todini_index(
            head, pressure, demand, wn, Pstar=21.097
        )
        todini_mean = float(np.nanmean(todini))
    except Exception:
        todini_mean = float("nan")

    return {
        "wsa": wsa,
        "frac_timesteps_low_pressure": frac_low_pressure,
        "min_pressure_m": min_pressure,
        "mean_pressure_m": mean_pressure,
        "population_impacted_peak": pop_impacted,
        "todini_index_mean": todini_mean,
    }


# ---------------------------------------------------------------------------
# Single run
# ---------------------------------------------------------------------------

def run_single(
    inp_file: str,
    scen: Scenario,
    duration_hours: float,
    simulator: str = "wntr",
) -> tuple[wntr.network.WaterNetworkModel, Any]:
    wn = wntr.network.WaterNetworkModel(inp_file)
    wn.options.time.duration = int(duration_hours * 3600)
    wn.options.hydraulic.demand_model = "PDD"
    wn.options.hydraulic.required_pressure = 21.0
    wn.options.hydraulic.minimum_pressure = 0.0
    apply_scenario(wn, scen)
    sim = (
        wntr.sim.WNTRSimulator(wn)
        if simulator == "wntr"
        else wntr.sim.EpanetSimulator(wn)
    )
    results = sim.run_sim()
    return wn, results


# ---------------------------------------------------------------------------
# Ensemble driver
# ---------------------------------------------------------------------------

def run_ensemble(
    inp_file: str,
    scenario: str,
    n: int,
    duration_hours: float = 48.0,
    outdir: str = "./ensemble_out",
    seed: int = 0,
    simulator: str = "wntr",
    save_full_results: bool = False,
) -> pd.DataFrame:
    if scenario not in SCENARIO_SAMPLERS:
        raise ValueError(f"scenario must be one of {list(SCENARIO_SAMPLERS)}")

    outroot = Path(outdir)
    (outroot / "runs").mkdir(parents=True, exist_ok=True)

    # Use one reference network for sampling (cheap; never simulated)
    ref_wn = wntr.network.WaterNetworkModel(inp_file)
    rng = random.Random(seed)
    sampler = SCENARIO_SAMPLERS[scenario]

    rows = []
    for i in range(n):
        scen = sampler(ref_wn, rng)
        run_dir = outroot / "runs" / f"run_{i:04d}"
        run_dir.mkdir(parents=True, exist_ok=True)
        (run_dir / "scenario.json").write_text(json.dumps(asdict(scen), indent=2))

        try:
            wn, results = run_single(inp_file, scen, duration_hours, simulator)
            metrics = compute_metrics(wn, results)
            status = "ok"
            if save_full_results:
                with (run_dir / "results.pkl").open("wb") as f:
                    pickle.dump(results, f)
        except Exception as e:  # pragma: no cover — log + continue
            metrics = {k: float("nan") for k in (
                "wsa", "frac_timesteps_low_pressure", "min_pressure_m",
                "mean_pressure_m", "population_impacted_peak", "todini_index_mean"
            )}
            status = f"error: {type(e).__name__}: {e}"

        rows.append({"run": i, "scenario": scenario, "status": status,
                     **metrics, "scenario_params": json.dumps(scen.params)})
        print(f"[{i+1:>4}/{n}] {scenario} WSA={metrics['wsa']:.3f}  "
              f"min_p={metrics['min_pressure_m']:.1f}m  status={status}")

    df = pd.DataFrame(rows)
    df.to_csv(outroot / "summary.csv", index=False)

    numeric = df.select_dtypes("number").drop(columns=["run"], errors="ignore")
    agg = {
        "n_runs": int(len(df)),
        "n_failed": int((df["status"] != "ok").sum()),
        "metrics": {
            col: {
                "mean": float(numeric[col].mean()),
                "std": float(numeric[col].std()),
                "p05": float(numeric[col].quantile(0.05)),
                "p50": float(numeric[col].quantile(0.50)),
                "p95": float(numeric[col].quantile(0.95)),
            }
            for col in numeric.columns
        },
    }
    (outroot / "summary.json").write_text(json.dumps(agg, indent=2))
    print("\n=== Ensemble summary ===")
    print(json.dumps(agg, indent=2))
    return df


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _cli() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--inp", required=True, help="Path to EPANET .inp file")
    p.add_argument("--scenario", required=True, choices=list(SCENARIO_SAMPLERS))
    p.add_argument("--n", type=int, default=25, help="Number of Monte Carlo runs")
    p.add_argument("--duration", type=float, default=48.0, help="Sim duration in hours")
    p.add_argument("--outdir", default="./ensemble_out")
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--simulator", choices=["wntr", "epanet"], default="wntr")
    p.add_argument("--save-full-results", action="store_true")
    args = p.parse_args()

    run_ensemble(
        inp_file=args.inp,
        scenario=args.scenario,
        n=args.n,
        duration_hours=args.duration,
        outdir=args.outdir,
        seed=args.seed,
        simulator=args.simulator,
        save_full_results=args.save_full_results,
    )


if __name__ == "__main__":
    _cli()
