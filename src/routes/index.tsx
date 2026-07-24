import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpDown,
  Download,
  FileJson,
  FileText,
  Github,
  HelpCircle,
  Info,
  LineChart,
  MessageCircle,
  Notebook,
  Scale,
  Search,
  Shield,
  Terminal,
  Waves,
  GitBranch,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WNTR Toolkit — Resilience Ensembles for EPANET Networks" },
      {
        name: "description",
        content:
          "Python toolkit built on WNTR: Monte Carlo scenario runner, pipe-break notebook, and a step-by-step EPANET .inp guide.",
      },
      { property: "og:title", content: "WNTR Toolkit — Resilience Ensembles for EPANET" },
      {
        property: "og:description",
        content:
          "CLI + notebook + guide for running pipe-break, leak, and earthquake scenarios on EPANET water networks.",
      },
    ],
  }),
  component: Index,
});

const artifacts = [
  {
    icon: Terminal,
    title: "ensemble_runner.py",
    tag: "CLI + Python API",
    bestFor: "Best for batch simulations & CI pipelines",
    tagline: "Run 100 pipe-break scenarios in ~3 minutes on Net3.",
    desc: "Monte Carlo runner for leaks, pipe breaks, and seismic scenarios. Persists per-run JSON and aggregates WSA, Todini, low-pressure fraction, and population impact into summary.csv/json.",
    cmd: "python ensemble_runner.py --inp Net3.inp --scenario earthquake --n 50",
    href: "/downloads/ensemble_runner.py",
    mime: "text/x-python",
    cta: "Download CLI runner",
  },
  {
    icon: Notebook,
    title: "pipe_break_scenario.ipynb",
    tag: "Jupyter notebook",
    bestFor: "Best for interactive exploration & teaching",
    tagline: "One pipe closure, four plots, every metric — reproducible end-to-end.",
    desc: "End-to-end pipe-break scenario on Net3: baseline vs 24-h closure of pipe 125, with resilience and water-quality metrics, pressure timeseries, delivered demand, a min-pressure map, and chlorine plots.",
    cmd: "jupyter lab pipe_break_scenario.ipynb",
    href: "/downloads/pipe_break_scenario.ipynb",
    mime: "application/x-ipynb+json",
    cta: "Download notebook",
  },
  {
    icon: FileText,
    title: "WNTR_GUIDE.md",
    tag: "Step-by-step guide",
    bestFor: "Best for onboarding a new team member",
    tagline: "From pip install to round-tripped .inp in under 20 minutes.",
    desc: "Install → load .inp → mutate model (PDD, controls, leaks) → run EpanetSimulator vs WNTRSimulator → compute metrics → write back to .inp v2.2, including the leak-export caveat.",
    cmd: "open WNTR_GUIDE.md",
    href: "/downloads/WNTR_GUIDE.md",
    mime: "text/markdown",
    cta: "Download guide",
  },
];

// Scenario families — renamed to distinguish idealized closure from physical break morphologies.
const scenarios = [
  {
    icon: GitBranch,
    name: "Pipe isolation / breaks",
    desc: "Five distinct perturbations, from a single closed status to a valve-isolated repair cycle.",
    variants: [
      { id: "pipe_closure", label: "Single pipe status → closed (idealized outage)" },
      { id: "pipe_break_with_leak", label: "Split pipe + emitter at break location" },
      { id: "pipe_break_unisolated", label: "Disconnected pipe segments, no valve action" },
      { id: "pipe_break_isolated", label: "Break + valve segment closure (customers cut off)" },
      { id: "pipe_break_repair", label: "Break → isolate → repair → restore timeline" },
    ],
  },
  {
    icon: Waves,
    name: "Leaks",
    desc: "Random junction leaks sampled by discharge area, start time, and duration.",
    variants: [
      { id: "junction_leak", label: "add_leak() emitter — WNTRSimulator only" },
      { id: "emitter_export", label: "Emitter coefficient (round-trips to .inp)" },
    ],
  },
  {
    icon: Activity,
    name: "Earthquake (fragility)",
    desc: "Framework, not turnkey — you supply damage states and network mutations.",
    variants: [
      { id: "eq_intensity", label: "Magnitude + epicenter → PGA/PGV attenuation" },
      { id: "eq_fragility", label: "Pipe-material / diameter fragility curves" },
      { id: "eq_damage_states", label: "Minor / major damage → status or leak" },
      { id: "eq_tank_damage", label: "Tank fragility (user-defined)" },
    ],
  },
];


// Mock summary rows for the "example output" preview
const summaryRows = [
  { run: "run_00", wsa: 0.994, tod: 0.612, low: 0.021, pop: 1240 },
  { run: "run_01", wsa: 0.871, tod: 0.418, low: 0.184, pop: 18420 },
  { run: "run_02", wsa: 0.932, tod: 0.507, low: 0.096, pop: 8930 },
  { run: "run_03", wsa: 0.688, tod: 0.271, low: 0.342, pop: 41200 },
  { run: "run_04", wsa: 0.945, tod: 0.548, low: 0.074, pop: 6110 },
];

// Per-scenario details loaded from results/run_XX.json (mocked here)
type RunDetail = {
  run: string;
  scenario: string;
  seed: number;
  perturbation: { type: string; target: string; start_h: number; duration_h: number };
  metrics: { wsa: number; todini: number; low_pressure_frac: number; pop_impacted: number };
  worst_nodes: { node: string; min_pressure_m: number }[];
  runtime_s: number;
};

const runDetails: RunDetail[] = [
  {
    run: "run_00",
    scenario: "pipe_break",
    seed: 1000,
    perturbation: { type: "pipe_closure", target: "pipe_231", start_h: 6, duration_h: 12 },
    metrics: { wsa: 0.994, todini: 0.612, low_pressure_frac: 0.021, pop_impacted: 1240 },
    worst_nodes: [
      { node: "J-89", min_pressure_m: 18.4 },
      { node: "J-142", min_pressure_m: 19.7 },
      { node: "J-33", min_pressure_m: 20.1 },
    ],
    runtime_s: 1.8,
  },
  {
    run: "run_01",
    scenario: "pipe_break",
    seed: 1001,
    perturbation: { type: "pipe_closure", target: "pipe_125", start_h: 8, duration_h: 24 },
    metrics: { wsa: 0.871, todini: 0.418, low_pressure_frac: 0.184, pop_impacted: 18420 },
    worst_nodes: [
      { node: "J-35", min_pressure_m: 6.2 },
      { node: "J-58", min_pressure_m: 8.9 },
      { node: "J-201", min_pressure_m: 11.4 },
    ],
    runtime_s: 2.1,
  },
  {
    run: "run_02",
    scenario: "leak",
    seed: 1002,
    perturbation: { type: "junction_leak", target: "J-172", start_h: 4, duration_h: 20 },
    metrics: { wsa: 0.932, todini: 0.507, low_pressure_frac: 0.096, pop_impacted: 8930 },
    worst_nodes: [
      { node: "J-172", min_pressure_m: 9.8 },
      { node: "J-170", min_pressure_m: 13.1 },
      { node: "J-99", min_pressure_m: 15.5 },
    ],
    runtime_s: 2.4,
  },
  {
    run: "run_03",
    scenario: "earthquake",
    seed: 1003,
    perturbation: { type: "seismic_fragility", target: "M6.8 @ (34.0,-118.3)", start_h: 0, duration_h: 48 },
    metrics: { wsa: 0.688, todini: 0.271, low_pressure_frac: 0.342, pop_impacted: 41200 },
    worst_nodes: [
      { node: "J-14", min_pressure_m: 0.0 },
      { node: "J-27", min_pressure_m: 2.3 },
      { node: "J-88", min_pressure_m: 4.7 },
    ],
    runtime_s: 4.9,
  },
  {
    run: "run_04",
    scenario: "pipe_break",
    seed: 1004,
    perturbation: { type: "pipe_closure", target: "pipe_47", start_h: 10, duration_h: 8 },
    metrics: { wsa: 0.945, todini: 0.548, low_pressure_frac: 0.074, pop_impacted: 6110 },
    worst_nodes: [
      { node: "J-47", min_pressure_m: 12.0 },
      { node: "J-51", min_pressure_m: 14.2 },
      { node: "J-52", min_pressure_m: 16.9 },
    ],
    runtime_s: 1.9,
  },
];

// Extend with synthetic runs so pagination/filtering are meaningful in the demo.
const scenariosPool = ["pipe_break", "leak", "earthquake"] as const;
for (let i = 5; i < 32; i++) {
  const scenario = scenariosPool[i % 3];
  const seed = 1000 + i;
  // Deterministic pseudo-random from seed
  const r = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const severity = r(1);
  const wsa = +(1 - severity * (scenario === "earthquake" ? 0.55 : 0.3)).toFixed(3);
  const todini = +(0.7 - severity * 0.55).toFixed(3);
  const low_pressure_frac = +(severity * (scenario === "earthquake" ? 0.5 : 0.28)).toFixed(3);
  const pop_impacted = Math.round(severity * (scenario === "earthquake" ? 60000 : 25000));
  const target =
    scenario === "pipe_break"
      ? `pipe_${Math.round(r(2) * 300)}`
      : scenario === "leak"
        ? `J-${Math.round(r(2) * 250)}`
        : `M${(5.5 + r(2) * 2).toFixed(1)} @ (${(33 + r(3) * 3).toFixed(2)},${(-119 + r(4) * 3).toFixed(2)})`;
  runDetails.push({
    run: `run_${String(i).padStart(2, "0")}`,
    scenario,
    seed,
    perturbation: {
      type: scenario === "pipe_break" ? "pipe_closure" : scenario === "leak" ? "junction_leak" : "seismic_fragility",
      target,
      start_h: Math.round(r(5) * 12),
      duration_h: Math.round(4 + r(6) * 24),
    },
    metrics: { wsa, todini, low_pressure_frac, pop_impacted },
    worst_nodes: [
      { node: `J-${Math.round(r(7) * 250)}`, min_pressure_m: +(r(8) * 20).toFixed(1) },
      { node: `J-${Math.round(r(9) * 250)}`, min_pressure_m: +(5 + r(10) * 15).toFixed(1) },
      { node: `J-${Math.round(r(11) * 250)}`, min_pressure_m: +(10 + r(12) * 15).toFixed(1) },
    ],
    runtime_s: +(1.5 + r(13) * 4).toFixed(2),
  });
}

// Synthetic pressure curve for the hero preview chart
function pressurePath(broken: boolean) {
  const pts: string[] = [];
  for (let h = 0; h <= 48; h++) {
    const diurnal = 42 + 6 * Math.sin((h / 24) * Math.PI * 2 - Math.PI / 2);
    let p = diurnal;
    if (broken && h >= 8 && h <= 32) {
      const t = (h - 8) / 24;
      p -= 22 * Math.sin(t * Math.PI);
    }
    const x = (h / 48) * 560 + 40;
    const y = 160 - (p - 10) * 3.2;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

function Index() {
  return (
    <div className="min-h-screen bg-[oklch(0.16_0.04_240)] text-slate-100">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-400/15 ring-1 ring-cyan-400/40">
              <Waves className="h-4.5 w-4.5 text-cyan-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">WNTR Toolkit</div>
              <div className="text-[11px] text-slate-400">Resilience ensembles for EPANET</div>
            </div>
          </div>
          <a
            href="https://github.com/USEPA/WNTR"
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs text-slate-400 hover:text-cyan-300 sm:inline"
          >
            Upstream: USEPA/WNTR ↗
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60rem 30rem at 80% -10%, oklch(0.55 0.18 220 / 0.25), transparent 60%), radial-gradient(40rem 24rem at 10% 110%, oklch(0.55 0.15 200 / 0.20), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
              <Shield className="h-3 w-3" /> Built on WNTR + EPANET 2.2
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Stress-test water networks with reproducible scenario ensembles.
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-300">
              Download the toolkit, point it at an EPANET{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">.inp</code> locally, and run reproducible
              leak, pipe-isolation, or earthquake ensembles with WSA, Todini, and pressure resilience metrics.
            </p>
            <p className="mt-3 max-w-xl text-sm text-slate-400">
              Designed for utility resilience teams stress-testing distribution networks — from 500-pipe demo systems
              to 10,000+ pipe production models. Runs entirely local; nothing is uploaded from this site.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#artifacts"
                className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
              >
                <Download className="h-4 w-4" /> Download Toolkit
              </a>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
              >
                <LineChart className="h-4 w-4" /> See it in action
              </Link>
              <a
                href="#quickstart"
                className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/5"
              >
                Quickstart
              </a>
            </div>
          </div>

          {/* Preview chart — visual proof */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 shadow-2xl shadow-cyan-500/5 backdrop-blur">
            <div className="flex items-center justify-between px-1 pb-2 text-[11px] text-slate-400">
              <span className="font-mono">J35 · pressure (m) · 48 h</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                Synthetic
              </span>
            </div>
            <div className="flex items-center gap-3 px-1 pb-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-300" /> baseline
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> pipe isolation (P125 closed)
              </span>
            </div>
            <svg viewBox="0 0 600 180" className="w-full">
              {/* grid */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="40"
                  x2="600"
                  y1={20 + i * 35}
                  y2={20 + i * 35}
                  stroke="oklch(1 0 0 / 0.06)"
                  strokeWidth="1"
                />
              ))}
              {/* outage window */}
              <rect
                x={40 + (8 / 48) * 560}
                y="20"
                width={(24 / 48) * 560}
                height="140"
                fill="oklch(0.65 0.22 25 / 0.08)"
              />
              <text x={40 + (20 / 48) * 560} y="34" className="fill-rose-300" fontSize="9" textAnchor="middle">
                pipe 125 closed
              </text>
              {/* baseline */}
              <path d={pressurePath(false)} stroke="oklch(0.85 0.15 210)" strokeWidth="1.75" fill="none" />
              {/* broken */}
              <path d={pressurePath(true)} stroke="oklch(0.72 0.20 25)" strokeWidth="1.75" fill="none" />
              {/* threshold */}
              <line
                x1="40"
                x2="600"
                y1={160 - (14 - 10) * 3.2}
                y2={160 - (14 - 10) * 3.2}
                stroke="oklch(0.7 0.05 240 / 0.5)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text x="46" y={160 - (14 - 10) * 3.2 - 4} fontSize="9" className="fill-slate-400">
                14 m threshold
              </text>
            </svg>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[11px]">
              <Stat label="WSA" val="0.87" />
              <Stat label="Todini" val="0.42" />
              <Stat label="Pop. impacted" val="18.4k" />
            </div>
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Scenario families</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Each family expands into named variants so &ldquo;pipe break&rdquo; never silently means
          &ldquo;pipe closure&rdquo;. Choose the perturbation that matches the physical failure you&apos;re modelling.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {scenarios.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/40"
            >
              <s.icon className="h-5 w-5 text-cyan-300" />
              <div className="mt-3 text-sm font-semibold">{s.name}</div>
              <p className="mt-1.5 text-sm text-slate-400">{s.desc}</p>
              <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                {s.variants.map((v) => (
                  <li key={v.id} className="flex items-start gap-2 text-[12px] text-slate-300">
                    <code className="rounded bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan-200">
                      {v.id}
                    </code>
                    <span className="text-slate-400">{v.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      {/* Resilience metrics in the summary output */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          Resilience metrics in the summary output
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Each ensemble run calculates the following four metrics. They are averaged across all scenarios and saved in{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">summary.csv</code>/
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">summary.json</code>.
        </p>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Per-run values are also stored inside the{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">results/</code> directory in individual JSON
          files so you can drill into any scenario.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
          <TooltipProvider delayDuration={150}>
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Metric</th>
                  <th className="px-4 py-2.5 font-medium">Column name</th>
                  <th className="px-4 py-2.5 font-medium">What it measures</th>
                  <th className="px-4 py-2.5 font-medium">Range</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                    <MetricTooltip
                      label="Water Service Availability"
                      tip="WNTR computes WSA as delivered demand divided by expected demand at each node and timestep."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.hydraulic.water_service_availability.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">wsa_volume_weighted</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    <code className="text-cyan-200">Σ delivered / Σ expected</code> across junctions and timesteps under PDD.
                    Zero-expected-demand nodes yield <code>NaN</code> and are dropped. Toolkit also emits{" "}
                    <code>wsa_node_time_mean</code> for the un-weighted average.
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">≥ 0 (typ. 0 – 1; &gt;1 possible when delivered exceeds expected)</td>
                </tr>
                <tr className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                    <MetricTooltip
                      label="Todini Resilience Index"
                      tip="Surplus hydraulic power above the required-pressure threshold, returned as a time series."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.hydraulic.todini_index.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">todini_outage_mean</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    <code className="text-cyan-200">(P_out − P_required) / (P_in,res + P_in,pump − P_required)</code>,
                    per timestep, with <code>P_required</code> at 14.06 m (20 psi). Toolkit reports mean over the outage
                    window plus <code>todini_min</code>; values <em>can</em> be negative under severe stress.
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">unbounded (typ. ≈ 0 – 1, negative under stress)</td>
                </tr>
                <tr className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                    <MetricTooltip
                      label="Low-pressure fraction"
                      tip="Fraction of node-time pairs where junction pressure falls below the critical threshold."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.misc.query.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">low_pressure_node_time_frac</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    <code className="text-cyan-200">count(p &lt; 14.06 m) / count(all junction-time pairs)</code>.
                    Toolkit also emits <code>junctions_ever_low_pressure_frac</code> so you can distinguish
                    "brief dip" from "sustained outage".
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">0 – 1</td>
                </tr>
                <tr className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                    <MetricTooltip
                      label="Population impacted (estimated)"
                      tip="Population is derived from expected demand at 200 gal/person/day by default; not a demographic count."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.misc.population_impacted.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">peak_population_impacted</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    Uses <code>wntr.metrics.population</code>, which estimates residents from average expected demand at
                    a default rate of <strong>200 gal/person/day</strong>. Industrial, commercial, and irrigation demand
                    inflate this estimate — supply your own per-node population or a demand-category filter for real
                    demographic impact.
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">0 – estimated total pop.</td>
                </tr>

              </tbody>
            </table>
          </TooltipProvider>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          <em>
            All metrics are computed using WNTR&apos;s built-in resilience functions. See the{" "}
            <a
              href="https://wntr.readthedocs.io/"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 underline decoration-cyan-400/40 underline-offset-2 hover:decoration-cyan-300"
            >
              WNTR documentation
            </a>{" "}
            for deeper mathematical definitions.
          </em>
        </p>
      </section>

      {/* Example output — visual proof */}
      <section className="border-y border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Example output</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              Synthetic
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Illustrative shape of <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">summary.csv</code>
            {" "}after a 100-run pipe-<em>isolation</em> ensemble on Net3 (single pipe status → closed; not a physical
            burst with valve isolation and repair). Numbers below are not from a real WNTR run — replace with your own
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">results/summary.csv</code>.
          </p>
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.19_0.04_245)]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2 text-[11px] font-mono text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3">results/summary.csv</span>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">run_id</th>
                  <th className="px-4 py-2 font-medium">wsa</th>
                  <th className="px-4 py-2 font-medium">todini</th>
                  <th className="px-4 py-2 font-medium">low_pressure_frac</th>
                  <th className="px-4 py-2 font-medium">pop_impacted</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {summaryRows.map((r) => (
                  <tr key={r.run} className="border-t border-white/5">
                    <td className="px-4 py-2 text-slate-300">{r.run}</td>
                    <td className={`px-4 py-2 ${r.wsa < 0.8 ? "text-rose-300" : "text-emerald-300"}`}>
                      {r.wsa.toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-cyan-200">{r.tod.toFixed(3)}</td>
                    <td className={`px-4 py-2 ${r.low > 0.2 ? "text-rose-300" : "text-slate-300"}`}>
                      {r.low.toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-slate-300">{r.pop.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Per-scenario drill-down */}
      <ScenarioDrilldown />


      {/* Artifacts */}
      <section id="artifacts" className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Toolkit artifacts</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Three drop-in pieces: an ensemble runner, a worked notebook, and a guide. Use them stand-alone or wire them
            into your own pipeline.
          </p>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {artifacts.map((a) => (
              <div
                key={a.title}
                className="flex flex-col rounded-xl border border-white/10 bg-[oklch(0.21_0.04_245)] p-6 transition hover:border-cyan-400/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-400/15 ring-1 ring-cyan-400/30">
                    <a.icon className="h-4 w-4 text-cyan-300" />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{a.tag}</span>
                </div>
                <div className="mt-4 font-mono text-sm font-semibold text-slate-100">{a.title}</div>
                <div className="mt-1 text-[12px] text-cyan-300/80">{a.bestFor}</div>
                <p className="mt-2 text-[13px] italic text-slate-300">{a.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{a.desc}</p>
                <pre className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-3 text-[12px] text-cyan-200">
                  <code>{a.cmd}</code>
                </pre>
                <a
                  href={a.href}
                  download
                  type={a.mime}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  <Download className="h-4 w-4" /> {a.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Net3.inp helper note */}
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.04] p-4 text-sm text-slate-300">
            <Info className="mt-0.5 h-4 w-4 flex-none text-cyan-300" />
            <div>
              <span className="font-semibold text-slate-100">Don&apos;t have Net3.inp?</span> WNTR&apos;s{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">examples/</code> folder is{" "}
              <em>not</em> shipped with the PyPI or conda package — clone the repo to get it:
              <pre className="mt-2 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-3 text-[12px] text-slate-200">
                <code>{`git clone --depth 1 https://github.com/USEPA/WNTR.git
cp WNTR/examples/networks/Net3.inp .`}</code>
              </pre>
            </div>
          </div>

        </div>
      </section>

      {/* Leak-export caveat */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.04] p-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-300" />
            <span className="text-sm font-semibold text-amber-100">Caveat · leak export</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Leaks added via <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">Junction.add_leak()</code>{" "}
            live in WNTR&apos;s object model but are not part of the EPANET <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">.inp</code>{" "}
            schema, so <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">write_inpfile()</code> silently
            drops them. The guide shows the workaround: emulate the leak as an emitter coefficient on the junction, or
            keep the leak definition in a sidecar JSON that the runner re-applies on load.
          </p>
        </div>
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Quickstart</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-semibold">1. Install (pinned)</div>
              <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-4 text-[12px] text-slate-200">
                <code>{`# EPANET 2.2 ships with WNTR
pip install wntr==1.4.0 pandas==2.2.* numpy==1.26.* matplotlib==3.9.*
# optional, for the notebook
pip install jupyterlab==4.*`}</code>
              </pre>
              <p className="mt-2 text-[11px] text-slate-500">
                Pin your stack so re-running the same seed next quarter gives byte-identical metrics.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-semibold">2. Run an ensemble</div>
              <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-4 text-[12px] text-slate-200">
                <code>{`python ensemble_runner.py \\
  --inp Net3.inp \\
  --scenario pipe_isolation \\
  --n 100 --seed 1000 \\
  --simulator wntr --demand-model PDD \\
  --required-pressure-m 14.06 \\
  --out results/`}</code>
              </pre>
              <p className="mt-2 text-[11px] text-slate-500">
                <code>pipe_isolation</code> closes a single pipe (status → 0). Use <code>pipe_break_unisolated</code> or
                <code> pipe_break_repair</code> for physical bursts with valve isolation and restoration.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-semibold">3. Inspect resilience</div>
              <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-4 text-[12px] text-slate-200">
                <code>{`import pandas as pd
df = pd.read_csv("results/summary.csv")
df[["run_id", "wsa", "todini", "low_pressure_frac"]].describe()`}</code>
              </pre>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-sm font-semibold">4. Round-trip the model</div>
              <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-4 text-[12px] text-slate-200">
                <code>{`import wntr
wn = wntr.network.WaterNetworkModel("Net3.inp")
# ... mutate (PDD, controls, leaks) ...
wntr.network.write_inpfile(wn, "Net3.modified.inp", version=2.2)`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Reproducibility — run-record provenance */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          Run-record provenance
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          A random seed alone doesn&apos;t make an ensemble reproducible. Every run JSON records the exact software
          stack, solver, thresholds, and convergence status so a re-run next year gives the same numbers.
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.19_0.04_245)]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2 text-[11px] font-mono text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-3">results/run_0042.json</span>
          </div>
          <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-slate-200">
            <code>{`{
  "schema_version": "1.0",
  "toolkit_version": "0.3.1",
  "wntr_version": "1.4.0",
  "epanet_version": "2.2",
  "python_version": "3.11.9",
  "model_sha256": "b4e1…9a2c",
  "scenario_config_sha256": "77f0…41de",
  "simulator": "WNTRSimulator",
  "demand_model": "PDD",
  "pressure_threshold_m": 14.06,
  "seed": 1000,
  "scenario": {
    "family": "pipe_isolation",
    "target": "P125",
    "start_hr": 8.0,
    "duration_hr": 24.0
  },
  "converged": true,
  "warnings": [],
  "metrics": {
    "wsa_volume_weighted": 0.871,
    "wsa_node_time_mean": 0.902,
    "todini_outage_mean": 0.418,
    "todini_min": 0.127,
    "low_pressure_node_time_frac": 0.184,
    "junctions_ever_low_pressure_frac": 0.320,
    "peak_population_impacted": 18420,
    "population_hours_impacted": 128900
  },
  "population_estimator": { "method": "demand_derived", "gpcd": 200 }
}`}</code>
          </pre>
        </div>
      </section>

      {/* Ensemble health — convergence & failure handling */}
      <section className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Ensemble health — failures are first-class
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            EPANET&apos;s <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">convergence_error=False</code>{" "}
            default returns partial results after nonconvergence. The runner never treats partial output as a valid
            scenario — every run carries an explicit status, and the ensemble summary breaks down why runs failed.
          </p>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.19_0.04_245)]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2 text-[11px] font-mono text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-3">results/run_0187.json (failed)</span>
              </div>
              <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-slate-200">
                <code>{`{
  "run_id": "run_0187",
  "status": "failed",
  "failure_type": "hydraulic_nonconvergence",
  "partial_results": true,
  "metrics_valid": false,
  "retry_count": 1,
  "solver_message": "System unbalanced at hour 12:45",
  "scenario": { "family": "earthquake", "magnitude": 7.2 }
}`}</code>
              </pre>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                summary.json → ensemble.health
              </div>
              <table className="mt-3 w-full text-left font-mono text-[13px]">
                <tbody>
                  {[
                    ["requested", "1,000", "text-slate-300"],
                    ["successful", "971", "text-emerald-300"],
                    ["hydraulic_nonconvergent", "18", "text-rose-300"],
                    ["timed_out", "7", "text-rose-300"],
                    ["invalid_metrics", "4", "text-amber-300"],
                  ].map(([k, v, cls]) => (
                    <tr key={k} className="border-t border-white/5">
                      <td className="py-2 pr-4 text-slate-400">{k}</td>
                      <td className={`py-2 text-right ${cls}`}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-slate-500">
                Failed runs are excluded from aggregate metrics but retained on disk for diagnostics — never averaged
                into WSA or Todini.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator matrix */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          EpanetSimulator vs WNTRSimulator
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          The two solvers are not interchangeable. Mixing them across metrics blends solver differences into scenario
          effects. The runner logs the simulator used for every run so comparisons stay honest.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Capability</th>
                <th className="px-4 py-2.5 font-medium">EpanetSimulator</th>
                <th className="px-4 py-2.5 font-medium">WNTRSimulator</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-300">
              {[
                ["Hydraulics (DDA)", "✓ EPANET 2.2 solver", "✓ Python solver"],
                ["Pressure-dependent demand (PDD)", "✓ (EPANET 2.2)", "✓"],
                ["Native leaks (add_leak)", "— emulate via emitter", "✓ discharge model"],
                ["Water quality (age, chlorine, source)", "✓", "✗ (hydraulics only)"],
                ["Mid-simulation controls (breaks, repair)", "limited", "✓ event-driven"],
                ["Convergence on severely disconnected networks", "may fail", "generally more robust"],
              ].map(([cap, ep, wn]) => (
                <tr key={cap} className="border-t border-white/10">
                  <td className="px-4 py-2.5 font-medium text-slate-200">{cap}</td>
                  <td className="px-4 py-2.5">{ep}</td>
                  <td className="px-4 py-2.5">{wn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Rule of thumb: <strong className="text-slate-300">WNTRSimulator</strong> for native leaks and event-driven
          resilience; <strong className="text-slate-300">EpanetSimulator</strong> when water-quality metrics
          (chlorine, age, source trace) are required. Never blend the two into a single metric column.
        </p>
      </section>

      {/* Earthquake disclosure */}
      <section className="border-y border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Earthquake scenario disclosure
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            WNTR provides intensity attenuation and fragility primitives — <em>you</em> supply damage states and the
            network mutations that follow. Every earthquake ensemble must disclose these choices in the run record;
            otherwise two &ldquo;M7 on Net3&rdquo; ensembles are not comparable.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Source", "Magnitude, hypocenter depth, epicenter coordinates"],
              ["Attenuation", "PGA/PGV model, site amplification"],
              ["Asset modifiers", "Pipe material, diameter, age, joint type"],
              ["Fragility curves", "Per-material minor/major damage curves"],
              ["Correlation", "Spatial correlation of damage draws"],
              ["Damage states", "How minor damage → leak, major → break/closure"],
              ["Tank model", "Anchored/unanchored fragility, sloshing"],
              ["Recovery", "Repair crews, restoration sequence, time to repair"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{k}</div>
                <div className="mt-1 text-[13px] text-slate-200">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Roadmap</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          The toolkit is a downloadable starter kit today. These are the tracks that move it toward a utility-grade
          decision-support platform.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            {
              tier: "P0",
              label: "Correctness & trust",
              tone: "border-rose-400/30 bg-rose-400/5",
              chip: "text-rose-200 bg-rose-400/10 border-rose-400/40",
              items: [
                "Correct Todini definition & aggregation",
                "Rename closures vs physical breaks",
                "First-class convergence/partial-result handling",
                "Pin WNTR 1.4.0 + full dependency lock",
                "Model & scenario sha256 in every run record",
                "Keep synthetic labels on all example results",
              ],
            },
            {
              tier: "P1",
              label: "Professional toolkit",
              tone: "border-cyan-400/30 bg-cyan-400/5",
              chip: "text-cyan-200 bg-cyan-400/10 border-cyan-400/40",
              items: [
                "Scenario Studio — YAML/UI-driven ensemble config",
                "Real-result upload for the explorer (local, no upload to site)",
                "Asset-criticality maps (probability × impact × duration)",
                "Valve-isolation segment analysis",
                "Recovery curves + area-under-service-loss",
                "Resumable, parallel execution + HTML/JSON reports",
              ],
            },
            {
              tier: "P2",
              label: "Utility decision platform",
              tone: "border-fuchsia-400/30 bg-fuchsia-400/5",
              chip: "text-fuchsia-200 bg-fuchsia-400/10 border-fuchsia-400/40",
              items: [
                "Repair crews & restoration scheduling",
                "Spatially correlated earthquake damage",
                "Demographic & equity analysis",
                "Capital-strategy comparison dashboard",
                "Annualized risk & intervention optimization",
                "Power-outage / cross-infrastructure scenarios",
                "Offline Docker deployment",
              ],
            },
          ].map((track) => (
            <div key={track.tier} className={`rounded-xl border p-5 ${track.tone}`}>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold ${track.chip}`}>
                  {track.tier}
                </span>
                <span className="text-sm font-semibold text-slate-100">{track.label}</span>
              </div>
              <ul className="mt-4 space-y-2 text-[13px] text-slate-300">
                {track.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-slate-500" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Sub-metric breakdowns (low-pressure & population variants) */}
      <section className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            One number is never enough — sub-metric breakdowns
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            &ldquo;Low-pressure fraction&rdquo; and &ldquo;population impacted&rdquo; each collapse a spatiotemporal
            surface into a scalar. The runner emits the full set so downstream analysis can pick the aggregation that
            matches the decision being made.
          </p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-slate-100">Low-pressure family</div>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-300">
                {[
                  ["low_pressure_node_time_frac", "share of (junction × timestep) pairs below threshold"],
                  ["junctions_ever_low_pressure_frac", "share of junctions that dipped at any timestep"],
                  ["peak_junctions_low_pressure_frac", "worst timestep — max share simultaneously low"],
                  ["hours_any_low_pressure", "total hours with ≥ 1 low-pressure junction"],
                  ["demand_weighted_low_pressure_frac", "weighted by expected demand — captures &lsquo;who&rsquo; not just &lsquo;how many&rsquo;"],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-col gap-0.5">
                    <code className="font-mono text-[12px] text-cyan-200">{k}</code>
                    <span className="text-slate-400">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-semibold text-slate-100">Population impact family</div>
              <ul className="mt-3 space-y-2 text-[13px] text-slate-300">
                {[
                  ["population_source", "demand_derived (gpcd) · census_gis · user_supplied_attribute"],
                  ["peak_population_impacted", "max residents affected at any timestep"],
                  ["unique_population_impacted", "distinct residents ever below threshold"],
                  ["mean_population_impacted_outage", "average during the outage window"],
                  ["population_hours_impacted", "∫ impacted(t) dt — usually the most informative single number"],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-col gap-0.5">
                    <code className="font-mono text-[12px] text-cyan-200">{k}</code>
                    <span className="text-slate-400">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            <strong className="text-slate-300">Pick before you present.</strong> Peak vs population-hours can differ by
            an order of magnitude for the same scenario — always state which aggregation the headline number uses.
          </p>
        </div>
      </section>


      {/* License & support */}
      <section className="mx-auto max-w-6xl px-6 py-14">

        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">License &amp; support</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <Scale className="h-5 w-5 text-cyan-300" />
            <div className="mt-3 text-sm font-semibold">MIT-licensed toolkit</div>
            <p className="mt-1.5 text-sm text-slate-400">
              Wraps USEPA/WNTR (BSD-3-Clause). Use, fork, and adapt freely for internal or commercial resilience work.
            </p>
          </div>
          <a
            href="https://github.com/USEPA/WNTR"
            target="_blank"
            rel="noreferrer"
            className="group rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/40"
          >
            <Github className="h-5 w-5 text-cyan-300" />
            <div className="mt-3 text-sm font-semibold group-hover:text-cyan-200">Upstream WNTR</div>
            <p className="mt-1.5 text-sm text-slate-400">
              Solver, metric implementations, and <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">.inp</code>{" "}
              I/O live in USEPA/WNTR. File engine/metric bugs there.
            </p>
          </a>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <MessageCircle className="h-5 w-5 text-cyan-300" />
            <div className="mt-3 text-sm font-semibold">Toolkit issues</div>
            <p className="mt-1.5 text-sm text-slate-400">
              Ensemble runner, scenario samplers, JSON schema, or notebook bugs belong in this toolkit&apos;s own
              repository — <em>not</em> upstream WNTR. Publish under your org and link here.
            </p>
          </div>

        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <div>WNTR Toolkit · scenarios, metrics, and round-trip tooling for EPANET .inp models.</div>
          <div>Wraps USEPA/WNTR (BSD). Not affiliated with US EPA.</div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="font-mono text-sm text-slate-100">{val}</div>
    </div>
  );
}

function MetricTooltip({ label, tip, href }: { label: string; tip: string; href: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1.5 underline decoration-cyan-400/40 decoration-dashed underline-offset-4 hover:text-cyan-200 hover:decoration-cyan-300">
          {label}
          <HelpCircle className="h-3.5 w-3.5 text-cyan-300/70" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xs border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-xl"
      >
        <p className="leading-relaxed">{tip}</p>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
        >
          WNTR docs <span className="text-[10px]">↗</span>
        </a>
      </TooltipContent>
    </Tooltip>
  );
}

function ScenarioDrilldown() {
  const [selectedRun, setSelectedRun] = useState(runDetails[1].run);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"run" | "scenario" | "wsa" | "todini" | "low_pressure_frac" | "pop_impacted" | "runtime_s">("run");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  type MetricKey = "wsa" | "todini" | "low_pressure_frac" | "pop_impacted";
  const metricRanges: Record<MetricKey, { min: number; max: number; step: number }> = {
    wsa: { min: 0, max: 1, step: 0.01 },
    todini: { min: 0, max: 1, step: 0.01 },
    low_pressure_frac: { min: 0, max: 1, step: 0.01 },
    pop_impacted: { min: 0, max: 60000, step: 100 },
  };
  const [filters, setFilters] = useState<Record<MetricKey, { min: string; max: string }>>({
    wsa: { min: "", max: "" },
    todini: { min: "", max: "" },
    low_pressure_frac: { min: "", max: "" },
    pop_impacted: { min: "", max: "" },
  });

  const filteredRuns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runDetails.filter((r) => {
      if (q) {
        const hay = [r.run, r.scenario, r.perturbation.type, r.perturbation.target, String(r.seed)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      for (const key of Object.keys(filters) as MetricKey[]) {
        const { min, max } = filters[key];
        const v = r.metrics[key];
        if (min !== "" && v < Number(min)) return false;
        if (max !== "" && v > Number(max)) return false;
      }
      return true;
    });
  }, [query, filters]);

  const sortedRuns = useMemo(() => {
    const sorted = [...filteredRuns].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "run": cmp = a.run.localeCompare(b.run); break;
        case "scenario": cmp = a.scenario.localeCompare(b.scenario); break;
        case "wsa": cmp = a.metrics.wsa - b.metrics.wsa; break;
        case "todini": cmp = a.metrics.todini - b.metrics.todini; break;
        case "low_pressure_frac": cmp = a.metrics.low_pressure_frac - b.metrics.low_pressure_frac; break;
        case "pop_impacted": cmp = a.metrics.pop_impacted - b.metrics.pop_impacted; break;
        case "runtime_s": cmp = a.runtime_s - b.runtime_s; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredRuns, sortKey, sortDir]);

  useEffect(() => { setPage(0); }, [query, filters, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedRuns.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRuns = sortedRuns.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (sortedRuns.length && !sortedRuns.some((r) => r.run === selectedRun)) {
      setSelectedRun(sortedRuns[0].run);
    }
  }, [sortedRuns, selectedRun]);

  const active = runDetails.find((r) => r.run === selectedRun) ?? runDetails[0];

  const json = JSON.stringify(
    {
      run_id: active.run,
      scenario: active.scenario,
      seed: active.seed,
      perturbation: active.perturbation,
      metrics: active.metrics,
      worst_nodes: active.worst_nodes,
      runtime_s: active.runtime_s,
    },
    null,
    2,
  );

  const scenarioColor: Record<string, string> = {
    pipe_break: "text-rose-300 bg-rose-400/10 border-rose-400/30",
    leak: "text-amber-200 bg-amber-400/10 border-amber-400/30",
    earthquake: "text-fuchsia-200 bg-fuchsia-400/10 border-fuchsia-400/30",
  };

  const sortLabels: Record<typeof sortKey, string> = {
    run: "Run name",
    scenario: "Scenario",
    wsa: "WSA",
    todini: "Todini",
    low_pressure_frac: "Low-pressure fraction",
    pop_impacted: "Population impact",
    runtime_s: "Runtime",
  };

  const exportCsv = () => {
    const headers = [
      "run", "scenario", "seed",
      "perturbation_type", "perturbation_target", "start_h", "duration_h",
      "wsa", "todini", "low_pressure_frac", "pop_impacted", "runtime_s",
    ];
    const rows = sortedRuns.map((r) => [
      r.run, r.scenario, r.seed,
      r.perturbation.type, r.perturbation.target, r.perturbation.start_h, r.perturbation.duration_h,
      r.metrics.wsa, r.metrics.todini, r.metrics.low_pressure_frac, r.metrics.pop_impacted, r.runtime_s,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => {
        const s = String(c);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wntr_runs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="border-b border-white/10 bg-black/10">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Per-scenario drill-down
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Every run writes a{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">results/run_XX.json</code>{" "}
              file with its metrics, perturbation, and the worst-affected nodes. Filter, sort, and
              export the current view — this is exactly what your CI or analysis notebook will load.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={sortedRuns.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> Export {sortedRuns.length} rows to CSV
          </button>
        </div>

        {/* Metric filters */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Metric filters
            </div>
            <button
              type="button"
              onClick={() => setFilters({
                wsa: { min: "", max: "" },
                todini: { min: "", max: "" },
                low_pressure_frac: { min: "", max: "" },
                pop_impacted: { min: "", max: "" },
              })}
              className="text-[11px] text-slate-500 hover:text-cyan-300"
            >
              Reset
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(metricRanges) as MetricKey[]).map((key) => {
              const r = metricRanges[key];
              return (
                <div key={key} className="rounded-md border border-white/10 bg-black/20 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {sortLabels[key]}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={r.min}
                      max={r.max}
                      step={r.step}
                      value={filters[key].min}
                      onChange={(e) => setFilters((f) => ({ ...f, [key]: { ...f[key], min: e.target.value } }))}
                      placeholder="min"
                      className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">–</span>
                    <input
                      type="number"
                      min={r.min}
                      max={r.max}
                      step={r.step}
                      value={filters[key].max}
                      onChange={(e) => setFilters((f) => ({ ...f, [key]: { ...f[key], max: e.target.value } }))}
                      placeholder="max"
                      className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution chart across current view */}
        <EnsembleMetricsChart runs={sortedRuns} />

        <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Run list */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search run, scenario, target..."
                  className="w-full rounded-md border border-white/10 bg-black/20 py-2 pl-8 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                    className="w-full appearance-none rounded-md border border-white/10 bg-black/20 py-1.5 pl-3 pr-8 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
                  >
                    {Object.entries(sortLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        Sort by {label.toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                </div>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  aria-label={sortDir === "asc" ? "Sort descending" : "Sort ascending"}
                  className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-black/20 text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-200"
                >
                  {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>
              <div className="px-1 text-[11px] text-slate-500">
                {sortedRuns.length} run{sortedRuns.length === 1 ? "" : "s"} found
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                results/
              </div>
              {sortedRuns.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  No runs match your filters.
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {pageRuns.map((r) => {
                    const isActive = r.run === selectedRun;
                    const failing = r.metrics.wsa < 0.8;
                    return (
                      <li key={r.run}>
                        <button
                          type="button"
                          onClick={() => setSelectedRun(r.run)}
                          className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                            isActive
                              ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                              : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <FileJson className={`h-3.5 w-3.5 ${isActive ? "text-cyan-300" : "text-slate-500"}`} />
                            <span className="font-mono text-[13px]">{r.run}.json</span>
                          </span>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${failing ? "bg-rose-400" : "bg-emerald-400"}`}
                            aria-label={failing ? "below WSA threshold" : "healthy"}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {sortedRuns.length > PAGE_SIZE && (
                <div className="mt-2 flex items-center justify-between border-t border-white/5 px-3 py-2 text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={clampedPage === 0}
                    className="rounded border border-white/10 px-2 py-0.5 hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="font-mono">
                    {clampedPage + 1} / {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={clampedPage >= pageCount - 1}
                    className="rounded border border-white/10 px-2 py-0.5 hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border border-white/10 bg-[oklch(0.19_0.04_245)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-slate-100">
                  results/{active.run}.json
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    scenarioColor[active.scenario] ?? "text-slate-300 bg-white/5 border-white/10"
                  }`}
                >
                  {active.scenario}
                </span>
                <span className="text-[11px] text-slate-500">seed {active.seed}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                runtime {active.runtime_s.toFixed(2)}s
              </span>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Metrics
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MetricCell label="WSA" value={active.metrics.wsa.toFixed(3)} tone={active.metrics.wsa < 0.8 ? "bad" : "good"} />
                  <MetricCell label="Todini" value={active.metrics.todini.toFixed(3)} tone="info" />
                  <MetricCell label="Low-p frac" value={active.metrics.low_pressure_frac.toFixed(3)} tone={active.metrics.low_pressure_frac > 0.2 ? "bad" : "neutral"} />
                  <MetricCell label="Pop. impact" value={active.metrics.pop_impacted.toLocaleString()} tone={active.metrics.pop_impacted > 20000 ? "bad" : "neutral"} />
                </div>

                <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Perturbation
                </div>
                <dl className="mt-2 space-y-1 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">type</dt>
                    <dd className="font-mono text-slate-200">{active.perturbation.type}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">target</dt>
                    <dd className="font-mono text-slate-200">{active.perturbation.target}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">start / duration</dt>
                    <dd className="font-mono text-slate-200">
                      {active.perturbation.start_h}h / {active.perturbation.duration_h}h
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Worst-affected nodes
                </div>
                <ul className="mt-2 space-y-1 text-[13px] font-mono">
                  {active.worst_nodes.map((n) => (
                    <li key={n.node} className="flex items-center justify-between gap-3">
                      <span className="text-slate-300">{n.node}</span>
                      <span className={n.min_pressure_m < 14 ? "text-rose-300" : "text-slate-400"}>
                        min {n.min_pressure_m.toFixed(1)} m
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Raw JSON
                </div>
                <pre className="mt-3 max-h-[380px] overflow-auto rounded-md border border-white/10 bg-black/40 p-3 text-[12px] leading-relaxed text-slate-200">
                  <code>{json}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Load the same file in Python with{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] text-slate-300">
            json.load(open(&quot;results/{active.run}.json&quot;))
          </code>
          .
        </p>
      </div>
    </section>
  );
}

function EnsembleMetricsChart({ runs }: { runs: RunDetail[] }) {
  const W = 720;
  const H = 180;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 26;

  const series = [
    { key: "wsa", label: "WSA", color: "#67e8f9", max: 1 },
    { key: "todini", label: "Todini", color: "#a5f3fc", max: 1 },
    { key: "low_pressure_frac", label: "Low-p frac", color: "#fda4af", max: 1 },
    { key: "pop_impacted", label: "Pop. impact (norm)", color: "#f0abfc", max: 60000 },
  ] as const;

  if (runs.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-xs text-slate-500">
        No runs to chart. Adjust filters above.
      </div>
    );
  }

  const xFor = (i: number) =>
    PAD_L + (runs.length === 1 ? 0 : (i / (runs.length - 1)) * (W - PAD_L - PAD_R));
  const yFor = (v: number, max: number) =>
    PAD_T + (1 - Math.min(1, v / max)) * (H - PAD_T - PAD_B);

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Metrics across current view ({runs.length} runs, sorted)
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-48 w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={PAD_L} x2={W - PAD_R}
              y1={PAD_T + (1 - g) * (H - PAD_T - PAD_B)}
              y2={PAD_T + (1 - g) * (H - PAD_T - PAD_B)}
              stroke="rgba(255,255,255,0.06)"
            />
            <text
              x={PAD_L - 6}
              y={PAD_T + (1 - g) * (H - PAD_T - PAD_B) + 3}
              textAnchor="end"
              fontSize="9"
              fill="rgba(148,163,184,0.7)"
              fontFamily="monospace"
            >
              {g.toFixed(2)}
            </text>
          </g>
        ))}
        {series.map((s) => {
          const path = runs
            .map((r, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(r.metrics[s.key], s.max).toFixed(1)}`)
            .join(" ");
          return (
            <g key={s.key}>
              <path d={path} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.9" />
              {runs.map((r, i) => (
                <circle key={r.run} cx={xFor(i)} cy={yFor(r.metrics[s.key], s.max)} r={2} fill={s.color} />
              ))}
            </g>
          );
        })}
        <text x={PAD_L} y={H - 6} fontSize="9" fill="rgba(148,163,184,0.7)" fontFamily="monospace">
          {runs[0].run}
        </text>
        <text x={W - PAD_R} y={H - 6} textAnchor="end" fontSize="9" fill="rgba(148,163,184,0.7)" fontFamily="monospace">
          {runs[runs.length - 1].run}
        </text>
      </svg>
    </div>
  );
}

function MetricCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "info" | "neutral";
}) {
  const toneClass = {
    good: "text-emerald-300",
    bad: "text-rose-300",
    info: "text-cyan-200",
    neutral: "text-slate-200",
  }[tone];
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-mono text-sm ${toneClass}`}>{value}</div>
    </div>
  );
}
