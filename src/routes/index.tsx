import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
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

const scenarios = [
  { icon: Waves, name: "Leaks", desc: "Random junction leaks sampled by area and start time." },
  { icon: GitBranch, name: "Pipe breaks", desc: "Random pipe closures over a configurable duration window." },
  { icon: Activity, name: "Earthquake", desc: "WNTR seismic fragility model across pipes and tanks." },
];


// Mock summary rows for the "example output" preview
const summaryRows = [
  { run: "run_00", wsa: 0.994, tod: 0.612, low: 0.021, pop: 1240 },
  { run: "run_01", wsa: 0.871, tod: 0.418, low: 0.184, pop: 18420 },
  { run: "run_02", wsa: 0.932, tod: 0.507, low: 0.096, pop: 8930 },
  { run: "run_03", wsa: 0.688, tod: 0.271, low: 0.342, pop: 41200 },
  { run: "run_04", wsa: 0.945, tod: 0.548, low: 0.074, pop: 6110 },
];

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
              Drop in an EPANET <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px]">.inp</code>, run
              hundreds of leak, pipe-break, or earthquake scenarios, and summarize WSA, Todini, and pressure resilience
              across the whole ensemble.
            </p>
            <p className="mt-3 max-w-xl text-sm text-slate-400">
              Designed for utility resilience teams stress-testing distribution networks — from 500-pipe demo systems
              to 10,000+ pipe production models.
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
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" /> baseline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" /> pipe break
                </span>
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
                      tip="WNTR computes WSA as the fraction of required demand actually delivered under pressure-driven demand."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.hydraulic.water_service_availability.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">wsa</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    Fraction of total demand that is actually delivered to customers under pressure-driven demand (PDD).
                    0 = no service, 1 = full supply.
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">0 – 1</td>
                </tr>
                <tr className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                    <MetricTooltip
                      label="Todini Resilience Index"
                      tip="The Todini index measures surplus power at demand junctions relative to the minimum required power."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.hydraulic.todini_index.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">todini</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    Energy-based resilience: 1 – (total dissipated power / total input power). Values near 1 mean the network
                    has lots of surplus capacity.
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">0 – 1</td>
                </tr>
                <tr className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                    <MetricTooltip
                      label="Low-pressure fraction"
                      tip="WNTR's query helper flags node-time pairs where pressure drops below a critical threshold."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.misc.query.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">low_pressure_frac</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    Fraction of time-steps (or node-time instances) where junction pressure falls below the critical
                    threshold (default 20 psi).
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">0 – 1</td>
                </tr>
                <tr className="border-t border-white/10 align-top">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                    <MetricTooltip
                      label="Population impact"
                      tip="Population impacted counts people attached to nodes that fail a comparison, such as demand below 90% of expected."
                      href="https://usepa.github.io/WNTR/apidoc/wntr.metrics.misc.population_impacted.html"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[12px] text-cyan-200">pop_impact</code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    Estimated number of people underserved, based on nodal base demand and population. Only meaningful if your
                    model includes population data per node.
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-400">0 – total pop.</td>
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
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Example output</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            A slice of <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">summary.csv</code> after a
            100-run pipe-break ensemble on Net3. One row per scenario, ready to feed into pandas or your BI tool.
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
              <span className="font-semibold text-slate-100">Don&apos;t have Net3.inp?</span> It ships with the WNTR
              examples. Grab it from{" "}
              <a
                href="https://github.com/USEPA/WNTR/blob/main/examples/networks/Net3.inp"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 underline decoration-cyan-400/40 underline-offset-2 hover:decoration-cyan-300"
              >
                USEPA/WNTR · examples/networks/Net3.inp
              </a>{" "}
              or load it in Python with{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px]">
                wntr.examples.networks.Net3().inp_file_name
              </code>
              .
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
            <div className="mt-3 text-sm font-semibold group-hover:text-cyan-200">Source &amp; issues</div>
            <p className="mt-1.5 text-sm text-slate-400">
              File bugs, request scenarios, or send a pull request on the upstream WNTR repository.
            </p>
          </a>
          <a
            href="https://github.com/USEPA/WNTR/discussions"
            target="_blank"
            rel="noreferrer"
            className="group rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/40"
          >
            <MessageCircle className="h-5 w-5 text-cyan-300" />
            <div className="mt-3 text-sm font-semibold group-hover:text-cyan-200">Ask a question</div>
            <p className="mt-1.5 text-sm text-slate-400">
              Community discussions for modeling questions, PDD tuning, and scenario design.
            </p>
          </a>
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
