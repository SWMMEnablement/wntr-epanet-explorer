import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";
import { Waves, Activity, MapPin, Gauge, Droplets } from "lucide-react";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Interactive Pressure & Demand Maps | WNTR Toolkit" },
      {
        name: "description",
        content:
          "Interactive time-series charts and a spatial network map for pressure and delivered demand from a sample WNTR pipe-break scenario.",
      },
      { property: "og:title", content: "Explore WNTR Simulation Outputs" },
      {
        property: "og:description",
        content:
          "Scrub time, pick a node, and compare baseline vs pipe-break pressure and demand on a live network map.",
      },
    ],
  }),
  component: Explore,
  errorComponent: ({ error }) => (
    <div className="p-8 text-slate-200" role="alert">
      Failed to render explorer: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-slate-200">Not found.</div>,
});

/* ---------- Synthetic Net3-like dataset (client demo) ---------- */

type Node = {
  id: string;
  x: number;
  y: number;
  kind: "junction" | "tank" | "reservoir";
  baseP: number; // baseline mean pressure (m)
  baseD: number; // baseline demand (L/s)
  impact: number; // 0..1 severity during outage
};

type Pipe = { id: string; from: string; to: string; broken?: boolean };

const NODES: Node[] = [
  { id: "R1", x: 40, y: 60, kind: "reservoir", baseP: 0, baseD: 0, impact: 0 },
  { id: "T1", x: 760, y: 90, kind: "tank", baseP: 0, baseD: 0, impact: 0 },
  { id: "T2", x: 720, y: 380, kind: "tank", baseP: 0, baseD: 0, impact: 0 },
  { id: "J10", x: 160, y: 140, kind: "junction", baseP: 36, baseD: 8, impact: 0.05 },
  { id: "J15", x: 260, y: 200, kind: "junction", baseP: 34, baseD: 12, impact: 0.1 },
  { id: "J20", x: 360, y: 160, kind: "junction", baseP: 33, baseD: 14, impact: 0.15 },
  { id: "J25", x: 300, y: 300, kind: "junction", baseP: 31, baseD: 10, impact: 0.35 },
  { id: "J30", x: 430, y: 260, kind: "junction", baseP: 30, baseD: 18, impact: 0.55 },
  { id: "J35", x: 520, y: 200, kind: "junction", baseP: 32, baseD: 16, impact: 0.4 },
  { id: "J40", x: 500, y: 340, kind: "junction", baseP: 28, baseD: 20, impact: 0.75 },
  { id: "J45", x: 380, y: 400, kind: "junction", baseP: 27, baseD: 15, impact: 0.85 },
  { id: "J50", x: 600, y: 300, kind: "junction", baseP: 29, baseD: 22, impact: 0.6 },
  { id: "J55", x: 640, y: 420, kind: "junction", baseP: 26, baseD: 14, impact: 0.9 },
  { id: "J60", x: 210, y: 380, kind: "junction", baseP: 30, baseD: 11, impact: 0.5 },
];

const PIPES: Pipe[] = [
  { id: "P1", from: "R1", to: "J10" },
  { id: "P5", from: "J10", to: "J15" },
  { id: "P10", from: "J15", to: "J20" },
  { id: "P15", from: "J20", to: "J30" },
  { id: "P20", from: "J15", to: "J25" },
  { id: "P25", from: "J25", to: "J30" },
  { id: "P30", from: "J30", to: "J35" },
  { id: "P35", from: "J35", to: "T1" },
  { id: "P40", from: "J30", to: "J40" },
  { id: "P45", from: "J40", to: "J50" },
  { id: "P50", from: "J50", to: "T2" },
  { id: "P55", from: "J40", to: "J45" },
  { id: "P60", from: "J45", to: "J55" },
  { id: "P65", from: "J50", to: "J55" },
  { id: "P70", from: "J25", to: "J60" },
  { id: "P75", from: "J60", to: "J45" },
  { id: "P125", from: "J20", to: "J35", broken: true }, // broken pipe
];

const HOURS = 48;
const OUTAGE_START = 6;
const OUTAGE_END = 30;

/** Diurnal demand multiplier (0..1.4) */
function diurnal(h: number) {
  return 0.7 + 0.35 * Math.sin(((h - 6) * Math.PI) / 12) + 0.05 * Math.sin((h * Math.PI) / 3);
}

function seriesFor(node: Node, scenario: "baseline" | "break") {
  const rows = [];
  for (let h = 0; h <= HOURS; h++) {
    const d = diurnal(h);
    const inOutage = scenario === "break" && h >= OUTAGE_START && h <= OUTAGE_END;
    const pFactor = inOutage ? 1 - node.impact * 0.9 : 1 - node.impact * 0.05;
    const dFactor = inOutage ? 1 - node.impact * 0.8 : 1;
    const noise = (Math.sin(h * 1.7 + node.baseP) + Math.cos(h * 0.9)) * 0.4;
    rows.push({
      h,
      pressure: Math.max(0, node.baseP * pFactor * (1 - 0.05 * (1 - d)) + noise),
      demand: Math.max(0, node.baseD * d * dFactor),
    });
  }
  return rows;
}

/* ---------- Component ---------- */

function Explore() {
  const [scenario, setScenario] = useState<"baseline" | "break">("break");
  const [nodeId, setNodeId] = useState<string>("J40");
  const [hour, setHour] = useState<number>(18);
  const [metric, setMetric] = useState<"pressure" | "demand">("pressure");

  const junctions = NODES.filter((n) => n.kind === "junction");
  const node = NODES.find((n) => n.id === nodeId) ?? junctions[0];

  const baseline = useMemo(() => seriesFor(node, "baseline"), [node]);
  const broken = useMemo(() => seriesFor(node, "break"), [node]);

  const chartData = baseline.map((row, i) => ({
    h: row.h,
    baseline_pressure: row.pressure,
    scenario_pressure: broken[i].pressure,
    baseline_demand: row.demand,
    scenario_demand: broken[i].demand,
  }));

  // Spatial map values at current hour, current scenario
  const mapValues = useMemo(() => {
    const map: Record<string, { pressure: number; demand: number }> = {};
    for (const n of NODES) {
      if (n.kind !== "junction") {
        map[n.id] = { pressure: 0, demand: 0 };
        continue;
      }
      const s = seriesFor(n, scenario)[hour];
      map[n.id] = { pressure: s.pressure, demand: s.demand };
    }
    return map;
  }, [hour, scenario]);

  const currentVals = mapValues[node.id];
  const domainMax = metric === "pressure" ? 40 : 30;

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.04_240)] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-400/15 ring-1 ring-cyan-400/40">
              <Waves className="h-4.5 w-4.5 text-cyan-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">WNTR Toolkit</div>
              <div className="text-[11px] text-slate-400">Explorer · pressure & demand</div>
            </div>
          </Link>
          <Link to="/" className="text-xs text-slate-400 hover:text-cyan-300">
            ← Back to overview
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Explore a pipe-break scenario
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Synthetic Net3-like outputs. Scrub time, pick a junction, and compare baseline against a
          24-h closure of pipe <code className="rounded bg-white/10 px-1 text-[12px]">P125</code>.
        </p>

        {/* Controls */}
        <div className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Scenario
            </span>
            <div className="inline-flex rounded-md border border-white/10 bg-black/30 p-0.5">
              {(["baseline", "break"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScenario(s)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition ${
                    scenario === s ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {s === "baseline" ? "Baseline" : "Pipe break"}
                </button>
              ))}
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Focus junction
            </span>
            <select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400/60"
            >
              {junctions.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} · base {j.baseP} m
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Map metric
            </span>
            <div className="inline-flex rounded-md border border-white/10 bg-black/30 p-0.5">
              {(["pressure", "demand"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium capitalize transition ${
                    metric === m ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Time · hour {hour}
            </span>
            <input
              type="range"
              min={0}
              max={HOURS}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="mt-2 accent-cyan-400"
            />
          </label>
        </div>

        {/* KPI strip */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Kpi
            icon={Gauge}
            label={`Pressure @ ${node.id}, h=${hour}`}
            value={`${currentVals.pressure.toFixed(1)} m`}
            hint={`baseline mean ${node.baseP} m`}
          />
          <Kpi
            icon={Droplets}
            label={`Delivered demand @ ${node.id}`}
            value={`${currentVals.demand.toFixed(1)} L/s`}
            hint={`peak base ${(node.baseD * 1.4).toFixed(1)} L/s`}
          />
          <Kpi
            icon={Activity}
            label="Outage window"
            value={`h ${OUTAGE_START}–${OUTAGE_END}`}
            hint="pipe P125 closed"
          />
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ChartCard title={`Pressure at ${node.id}`} unit="m">
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="h"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `${v}h`}
              />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<DarkTooltip unit="m" />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
              <ReferenceArea
                x1={OUTAGE_START}
                x2={OUTAGE_END}
                fill="#f43f5e"
                fillOpacity={0.08}
              />
              <ReferenceLine x={hour} stroke="#22d3ee" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="baseline_pressure"
                name="baseline"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scenario_pressure"
                name="pipe break"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartCard>

          <ChartCard title={`Delivered demand at ${node.id}`} unit="L/s">
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="h"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `${v}h`}
              />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip content={<DarkTooltip unit="L/s" />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }} />
              <ReferenceArea
                x1={OUTAGE_START}
                x2={OUTAGE_END}
                fill="#f43f5e"
                fillOpacity={0.08}
              />
              <ReferenceLine x={hour} stroke="#22d3ee" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="baseline_demand"
                name="baseline"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scenario_demand"
                name="pipe break"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartCard>
        </div>

        {/* Spatial map */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-semibold">
                Network map — {metric} · hour {hour} · {scenario === "break" ? "pipe break" : "baseline"}
              </h2>
            </div>
            <ColorLegend metric={metric} max={domainMax} />
          </div>

          <div className="mt-4 overflow-x-auto">
            <svg
              viewBox="0 0 820 480"
              className="w-full min-w-[720px] rounded-lg bg-[oklch(0.13_0.03_240)]"
              role="img"
              aria-label="Network schematic with node values"
            >
              {/* Pipes */}
              {PIPES.map((p) => {
                const a = NODES.find((n) => n.id === p.from)!;
                const b = NODES.find((n) => n.id === p.to)!;
                const isBroken = p.broken && scenario === "break" && hour >= OUTAGE_START && hour <= OUTAGE_END;
                return (
                  <line
                    key={p.id}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={isBroken ? "#f43f5e" : "#475569"}
                    strokeWidth={isBroken ? 2.5 : 1.8}
                    strokeDasharray={isBroken ? "6 5" : undefined}
                  />
                );
              })}
              {/* Nodes */}
              {NODES.map((n) => {
                if (n.kind !== "junction") {
                  const isTank = n.kind === "tank";
                  return (
                    <g key={n.id}>
                      <rect
                        x={n.x - 9}
                        y={n.y - 9}
                        width={18}
                        height={18}
                        fill={isTank ? "#0ea5e9" : "#22d3ee"}
                        opacity={0.85}
                        rx={2}
                      />
                      <text
                        x={n.x + 12}
                        y={n.y + 4}
                        fill="#cbd5e1"
                        fontSize={10}
                        fontFamily="ui-monospace, monospace"
                      >
                        {n.id}
                      </text>
                    </g>
                  );
                }
                const v = mapValues[n.id][metric];
                const t = Math.min(1, Math.max(0, v / domainMax));
                const fill = metric === "pressure" ? pressureColor(t) : demandColor(t);
                const isFocus = n.id === node.id;
                return (
                  <g key={n.id} className="cursor-pointer" onClick={() => setNodeId(n.id)}>
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isFocus ? 12 : 9}
                      fill={fill}
                      stroke={isFocus ? "#22d3ee" : "#0f172a"}
                      strokeWidth={isFocus ? 2.5 : 1.5}
                    />
                    <title>{`${n.id} · ${v.toFixed(1)} ${metric === "pressure" ? "m" : "L/s"}`}</title>
                    <text
                      x={n.x}
                      y={n.y - 14}
                      fill="#e2e8f0"
                      fontSize={10}
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                    >
                      {n.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Click any junction to focus the time-series above. Dashed red pipe = active break.
            Values are synthetic for demonstration — swap in a real{" "}
            <code className="rounded bg-white/10 px-1">SimulationResults</code> object to drive the
            same UI from WNTR output.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- helpers ---------- */

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5 text-cyan-300" />
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-slate-100">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>
    </div>
  );
}

function ChartCard({
  title,
  unit,
  children,
}: {
  title: string;
  unit: string;
  children: React.ReactElement;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-[11px] text-slate-500">{unit}</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: number;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-white/15 bg-slate-950/90 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 text-slate-400">hour {label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}</span>
          <span className="ml-auto font-mono text-slate-100">
            {(p.value ?? 0).toFixed(1)} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function ColorLegend({ metric, max }: { metric: "pressure" | "demand"; max: number }) {
  const gradient =
    metric === "pressure"
      ? "linear-gradient(to right, #7f1d1d, #f59e0b, #22d3ee, #38bdf8)"
      : "linear-gradient(to right, #1e293b, #0ea5e9, #22d3ee, #a5f3fc)";
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-400">
      <span>0</span>
      <div
        className="h-2 w-40 rounded-full ring-1 ring-white/10"
        style={{ background: gradient }}
      />
      <span>
        {max} {metric === "pressure" ? "m" : "L/s"}
      </span>
    </div>
  );
}

// Red→amber→cyan (low pressure = bad)
function pressureColor(t: number) {
  if (t < 0.25) return "#dc2626";
  if (t < 0.5) return "#f59e0b";
  if (t < 0.75) return "#22d3ee";
  return "#38bdf8";
}
// Dark→light cyan (higher demand delivered = better)
function demandColor(t: number) {
  if (t < 0.25) return "#1e293b";
  if (t < 0.5) return "#0ea5e9";
  if (t < 0.75) return "#22d3ee";
  return "#a5f3fc";
}
