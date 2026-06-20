<div align="center">

# 💧 WNTR-EPANET Explorer

### An interactive web client for water distribution network modeling, analysis & resilience simulation

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![TanStack](https://img.shields.io/badge/TanStack-Router%20%2B%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![EPANET](https://img.shields.io/badge/EPANET-2.2-0077B6?style=for-the-badge&logo=watertight&logoColor=white)](https://www.epa.gov/water-research/epanet)
[![WNTR](https://img.shields.io/badge/WNTR-Resilience-1B998B?style=for-the-badge)](https://github.com/USEPA/WNTR)
[![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)](LICENSE)

</div>

---

## 🌊 Overview

**WNTR-EPANET Explorer** is a modern, browser-based front end for inspecting and analyzing water distribution systems built on the **EPANET 2.2** hydraulic & water-quality solver and the EPA **Water Network Tool for Resilience (WNTR)**. It turns `.inp` network models into interactive, navigable visualizations — letting engineers explore topology, run hydraulic scenarios, and evaluate system resilience without leaving the browser.

> Built for hydraulic modelers, utility engineers, and researchers who need fast, shareable, no-install access to network model results.

---

## ⚙️ Engineering Capabilities

| Domain | Capability | Engineering Detail |
| :----- | :--------- | :----------------- |
| 🗺️ **Topology** | Network graph rendering | Junctions, reservoirs, tanks, pipes, pumps & valves parsed from EPANET `[JUNCTIONS]`, `[PIPES]`, `[PUMPS]` sections |
| 🌡️ **Hydraulics** | Pressure & flow analysis | Demand-driven and pressure-dependent demand (PDD) result inspection per node/link |
| 🧪 **Water Quality** | Constituent transport | Age, source tracing, and chlorine decay result visualization |
| 🛡️ **Resilience** | WNTR scenario metrics | Pipe-break, pump-failure, and segment-isolation impact analysis |
| 📈 **Time Series** | EPS support | Extended-period simulation playback across reporting time steps |
| 🔌 **Interoperability** | Model I/O | Import EPANET `.inp`; export results to CSV/JSON for downstream tooling |

---

## 🧱 Tech Stack

<details>
<summary><b>🖥️ Core Framework</b></summary>

- **React 19.2** + **React DOM** — component runtime
- **TanStack Router** — type-safe, file-based routing
- **Nitro** — server engine / SSR runtime
- **Vite 7.3** — build tooling & dev server

</details>

<details>
<summary><b>🎨 UI & Visualization</b></summary>

- **Tailwind CSS 4.2** — utility-first styling
- **Radix UI** — accessible primitives (accordion, dialog, dropdown, hover-card, etc.)
- **shadcn/ui** — component layer over Radix

</details>

<details>
<summary><b>📊 Data & Forms</b></summary>

- **TanStack Query** — async state & caching for model/result fetching
- **React Hook Form** + **Zod** — validated scenario configuration inputs

</details>

<details>
<summary><b>🔧 Developer Experience</b></summary>

- **TypeScript 5.8** — end-to-end type safety
- **ESLint** + **Prettier** — linting & formatting
- **Bun** — package manager & runtime
- **Lovable.dev** TanStack config — scaffolding integration

</details>

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/SWMMEnablement/wntr-epanet-explorer.git
cd wntr-epanet-explorer

# Install (Bun)
bun install

# Run the dev server
bun run dev
```

### Available Scripts

| Script | Action |
| :----- | :----- |
| `bun run dev` | Start Vite dev server |
| `bun run build` | Production build |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview the production build |
| `bun run lint` | Run ESLint |
| `bun run format` | Format with Prettier |

---

## 📂 Project Structure

```text
wntr-epanet-explorer/
├── src/                 # Application source
│   ├── routes/          # TanStack file-based routes
│   ├── components/      # UI components (Radix + shadcn)
│   ├── lib/             # EPANET/WNTR parsing & analysis helpers
│   └── hooks/           # React hooks (queries, model state)
├── .lovable/            # Lovable.dev project config
├── components.json      # shadcn/ui config
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json
```

---

## 🔗 SWMMEnablement Ecosystem

This project is part of the **SWMMEnablement** family of open-source water-engineering tooling, complementing:

- **EPANET-UI** — pressurized distribution network interface
- **Alt-SWMM5** — stormwater & combined-sewer modeling
- **InfoWorks ICM** integration utilities

Together these provide a browser-native workflow spanning **stormwater (SWMM5)**, **potable distribution (EPANET)**, and **resilience analytics (WNTR)**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using conventional commits: `git commit -m "feat: add pipe-break scenario view"`
4. Push and open a Pull Request

---

<div align="center">

**Built with 💧 by SWMMEnablement** · Powered by EPANET 2.2 & EPA WNTR

</div>
