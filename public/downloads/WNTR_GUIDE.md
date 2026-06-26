# WNTR Step-by-Step Guide: Load → Simulate (EPANET + WNTR) → Export

A practical walkthrough that takes an existing EPANET `.inp` file, runs it
through both bundled simulators, modifies the model in Python, and writes
the result back out as a valid `.inp` file you can re-open in EPANET.

## 0. Install

```bash
pip install wntr            # pulls EPANET binaries automatically
python -c "import wntr; print(wntr.__version__)"
```

## 1. Load an EPANET `.inp` into a `WaterNetworkModel`

```python
import wntr

inp_file = "Net3.inp"                                  # any EPANET 2.0/2.2 file
wn = wntr.network.WaterNetworkModel(inp_file)

print(f"{len(wn.junction_name_list)} junctions, "
      f"{len(wn.tank_name_list)} tanks, "
      f"{len(wn.reservoir_name_list)} reservoirs, "
      f"{len(wn.pipe_name_list)} pipes, "
      f"{len(wn.pump_name_list)} pumps, "
      f"{len(wn.valve_name_list)} valves")
```

`wn` is a fully mutable in-memory graph. Every `[SECTION]` of the `.inp`
file (JUNCTIONS, PIPES, PATTERNS, CURVES, CONTROLS, RULES, OPTIONS,
TIMES, REPORT, QUALITY, …) is represented as Python objects you can read
or change.

## 2. Inspect and tweak before simulating

```python
# Simulation horizon and hydraulic timestep
wn.options.time.duration         = 48 * 3600     # 48 h
wn.options.time.hydraulic_timestep = 3600        # 1 h

# Switch to pressure-dependent demand (PDD)
wn.options.hydraulic.demand_model       = "PDD"
wn.options.hydraulic.required_pressure  = 21.097  # m  (≈ 30 psi)
wn.options.hydraulic.minimum_pressure   = 0.0

# Example mutation: close a pipe at t = 4 h, reopen at t = 12 h
import wntr.network.controls as ctrl
pipe = wn.get_link("123")
close = ctrl.ControlAction(pipe, "status", 0)
open_ = ctrl.ControlAction(pipe, "status", 1)
wn.add_control("close_123",
    ctrl.Control.time_control(wn, 4 * 3600,  "SIM_TIME", False, close))
wn.add_control("open_123",
    ctrl.Control.time_control(wn, 12 * 3600, "SIM_TIME", False, open_))

# Example mutation: add a leak (WNTRSimulator only)
wn.get_node("121").add_leak(wn, area=0.01, discharge_coeff=0.75,
                             start_time=6 * 3600)
```

## 3. Run the **EpanetSimulator** (calls the official EPANET solver)

```python
sim     = wntr.sim.EpanetSimulator(wn)
results = sim.run_sim()                # returns SimulationResults
pressure = results.node["pressure"]    # DataFrame: time × node
flow     = results.link["flowrate"]
```

Use this when you want results that match EPANET byte-for-byte and you
do **not** need leak modeling, PDD with intermediate control changes, or
on-the-fly model edits during the run.

## 4. Run the **WNTRSimulator** (pure-Python, extended physics)

```python
sim     = wntr.sim.WNTRSimulator(wn)
results = sim.run_sim()
```

The WNTRSimulator adds:

* **Pressure-dependent demand** at every timestep (EpanetSimulator only
  honors PDD with EPANET 2.2 and not all control combinations).
* **Leak nodes** that respond to local pressure.
* **Mid-simulation network changes** (close pipes, change patterns,
  toggle pumps from Python between `sim.run_sim()` invocations).
* **Stop / resume** workflow for adaptive scenarios.

It is slower and does **not** simulate water quality — for chlorine
decay, age, or source tracing, use the EpanetSimulator.

### When to pick which

| Need                                  | Use                |
| ------------------------------------- | ------------------ |
| Water-quality (chlorine, age, source) | `EpanetSimulator`  |
| Byte-identical EPANET output          | `EpanetSimulator`  |
| Pressure-dependent demand + leaks     | `WNTRSimulator`    |
| Programmatic control mid-run          | `WNTRSimulator`    |
| Largest networks, fastest hydraulics  | `EpanetSimulator`  |

## 5. Compute metrics on the results

```python
import numpy as np

# Water Service Availability
expected  = wntr.metrics.expected_demand(wn)
delivered = results.node["demand"][wn.junction_name_list].clip(lower=0)
wsa = delivered.sum().sum() / expected[wn.junction_name_list].sum().sum()

# Todini hydraulic resilience index
todini = wntr.metrics.todini_index(
    results.node["head"], results.node["pressure"], results.node["demand"],
    wn, Pstar=21.097)
print("WSA:", round(float(wsa), 3), "Todini:", float(np.nanmean(todini)))
```

Other built-ins: `wntr.metrics.population_impacted`, `water_service_availability`,
`tank_capacity`, `entropy`, `modified_resilience_index`,
`average_water_consumed`, plus graph-theory metrics on `wn.to_graph()`.

## 6. Export the modified model back to `.inp`

```python
wntr.network.write_inpfile(wn, "Net3_modified.inp", version=2.2)
# Round-trip check
wn2 = wntr.network.WaterNetworkModel("Net3_modified.inp")
assert len(wn2.pipe_name_list) == len(wn.pipe_name_list)
```

Notes:
* Pass `version=2.0` for legacy EPANET 2.00.12.
* Leak objects added via `add_leak` are a WNTR-only construct and are
  **not** serialized to `.inp` (EPANET has no native leak section). If
  you need them in the exported file, model the leak as an emitter on
  the junction before exporting.
* Controls added via `add_control` are written out as `[CONTROLS]` /
  `[RULES]` entries and will work in any EPANET GUI.

## 7. Minimal end-to-end script

```python
import wntr

wn = wntr.network.WaterNetworkModel("Net3.inp")
wn.options.time.duration = 24 * 3600

# EPANET run
epanet_res = wntr.sim.EpanetSimulator(wn).run_sim()

# WNTR run with PDD
wn.options.hydraulic.demand_model = "PDD"
wn.options.hydraulic.required_pressure = 21.097
wntr_res = wntr.sim.WNTRSimulator(wn).run_sim()

wntr.network.write_inpfile(wn, "Net3_pdd.inp", version=2.2)
```

That's the whole loop: **load → mutate → simulate (either engine) →
measure → export.**
