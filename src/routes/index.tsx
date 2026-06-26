import { createFileRoute } from "@tanstack/react-router";
import { Activity, Download, FileCode, FileText, Notebook, Waves, Shield, GitBranch } from "lucide-react";

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
    icon: FileCode,
    title: "ensemble_runner.py",
    tag: "CLI + Python API",
    desc: "Monte Carlo runner for leaks, pipe breaks, and seismic scenarios. Persists per-run JSON and aggregates WSA, Todini, low-pressure fraction, and population impact into summary.csv/json.",
    cmd: "python ensemble_runner.py --inp Net3.inp --scenario earthquake --n 50",
    href: "/downloads/ensemble_runner.py",
    mime: "text/x-python",
  },
  {
    icon: Notebook,
    title: "pipe_break_scenario.ipynb",
    tag: "Jupyter notebook",
    desc: "End-to-end pipe-break scenario on Net3: baseline vs 24-h closure of pipe 125, with resilience and water-quality metrics, pressure timeseries, delivered demand, a min-pressure map, and chlorine plots.",
    cmd: "jupyter lab pipe_break_scenario.ipynb",
    href: "/downloads/pipe_break_scenario.ipynb",
    mime: "application/x-ipynb+json",
  },
  {
    icon: FileText,
    title: "WNTR_GUIDE.md",
    tag: "Step-by-step guide",
    desc: "Install → load .inp → mutate model (PDD, controls, leaks) → run EpanetSimulator vs WNTRSimulator → compute metrics → write back to .inp v2.2, including the leak-export caveat.",
    cmd: "open WNTR_GUIDE.md",
    href: "/downloads/WNTR_GUIDE.md",
    mime: "text/markdown",
  },
];

const scenarios = [
  { icon: Waves, name: "Leaks", desc: "Random junction leaks sampled by area and start time." },
  { icon: GitBranch, name: "Pipe breaks", desc: "Random pipe closures over a configurable duration window." },
  { icon: Activity, name: "Earthquake", desc: "WNTR seismic fragility model across pipes and tanks." },
];

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
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
            <Shield className="h-3 w-3" /> Built on WNTR + EPANET 2.2
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Stress-test water networks with reproducible scenario ensembles.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            Drop in an EPANET <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">.inp</code>, run hundreds
            of leak, pipe-break, or earthquake scenarios, and summarize WSA, Todini, and pressure resilience across the
            whole ensemble.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#artifacts"
              className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
            >
              <Download className="h-4 w-4" /> Get the toolkit
            </a>
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/5"
            >
              Quickstart
            </a>
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Scenario families</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {scenarios.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/40"
            >
              <s.icon className="h-5 w-5 text-cyan-300" />
              <div className="mt-3 text-sm font-semibold">{s.name}</div>
              <p className="mt-1.5 text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Artifacts */}
      <section id="artifacts" className="border-t border-white/10 bg-black/20">
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
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{a.desc}</p>
                <pre className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-3 text-[12px] text-cyan-200">
                  <code>{a.cmd}</code>
                </pre>
                <a
                  href={a.href}
                  download
                  type={a.mime}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Quickstart</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm font-semibold">1. Install</div>
            <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-4 text-[12px] text-slate-200">
              <code>{`pip install wntr pandas numpy matplotlib
# optional, for the notebook
pip install jupyterlab`}</code>
            </pre>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm font-semibold">2. Run an ensemble</div>
            <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/40 p-4 text-[12px] text-slate-200">
              <code>{`python ensemble_runner.py \\
  --inp Net3.inp \\
  --scenario pipe_breaks \\
  --n 100 \\
  --out results/`}</code>
            </pre>
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
