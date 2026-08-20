# GitHub Usage Report Viewer

**Drag, drop, done.** Turn GitHub billing CSVs into interactive dashboards. Everything runs in your browser.

**[→ Try it now](https://austenstone.github.io/github-actions-usage-report/?demo=auto)** · **[Live App](https://austenstone.github.io/github-actions-usage-report/)**

## Supported Reports

Auto-detects the report type from CSV headers. Drop one file or a whole zip.

| Report | What you get |
|---|---|
| **Metered Usage** | Actions minutes, runner SKU breakdown, Copilot seats, Packages, LFS, storage costs. Detailed and summarized exports both supported |
| **Copilot Premium Requests** | Per-user PRU consumption, model breakdown, quota tracking, AI credit costs |
| **Copilot Token Usage** | Input/output tokens, cache creation/read, per-model cost with token-level granularity |
| **GHAS Active Committers** | Advanced Security license consumption by user and repository |
| **Copilot Seat Activity** | Seat assignment, last activity timestamps, IDE/surface usage breakdown |
| **Dormant Users** | Org member audit with 2FA status, last login, outside collaborator flags |
| **Enterprise Members** | Enterprise licensing, org roles, SAML/GHES status, Visual Studio subscriptions |

## Features

**Charts & Visualization**
- Time series with raw, 7-day rolling average, and cumulative views
- Stacked cost breakdown by top 10 groups (model, user, SKU, org)
- Sankey flow diagrams showing org → user → model relationships
- Token breakdown charts for cache hit analysis
- AI model color-coding (Claude, GPT, Gemini, Grok)

**Data Table**
- Group by any dimension: user, model, org, SKU, cost center, repository
- Sortable columns with visibility controls
- Paginated with virtualized rendering for large datasets

**Filtering & Navigation**
- GitHub-style autocomplete filter bar across any field
- Period selector for monthly or full-range views
- URL-encoded state for every filter, grouping, and view

**Hero Cards**
- At-a-glance KPIs: gross/net spend, total requests, minutes, token counts
- Expandable breakdowns by top models, users, or SKUs

**Multi-Report Support**
- Load multiple CSVs (or zips) and switch between them
- Auto-combines same-type reports from the same enterprise with date range labels
- Duplicate detection via content hashing

**Sharing**
- One-click shareable URLs with compressed filter state + data (LZ-String)
- Falls back to clipboard if URL exceeds 8,000 characters

**Privacy**
- Your CSVs never leave the browser. No server, no uploads, no telemetry
- Reports cached in IndexedDB across sessions
- Sample data auto-removed when real data is imported
- The one outbound request is an avatar lookup to `api.github.com` for names matching a bot pattern (`*[bot]`). Human usernames are never sent anywhere

## Quick Start

```bash
npm ci
npm run dev
```

Drop a CSV onto the upload area, or append `?demo=auto` to load sample data instantly.

### Where to Get the CSVs

Each report lives in a different part of GitHub's billing and admin UI. The app auto-detects the type from the headers, so you never have to say which one you're uploading.

| Report | Where to export it |
|---|---|
| **Metered Usage** | Billing & Licensing → Usage → Metered Usage → **Get usage report** |
| **Copilot Premium Requests** | Billing & Licensing → Usage → Premium request analytics → **Get usage report** |
| **Copilot Token Usage** | Billing & Licensing → Usage → Premium request analytics → **Get usage report** |
| **GHAS Active Committers** | Licensing → GitHub Advanced Security → **Download CSV Report** |
| **Copilot Seat Activity** | AI Controls → Copilot → Access Management → **Download CSV report** |
| **Dormant Users** | Settings → Compliance → **Export** |
| **Enterprise Members** | Licensing → **Export** (next to GitHub Enterprise) |

Metered usage exports come in two shapes and both work: **detailed** (up to 31 days, includes the user and workflow that incurred the cost) and **summarized** (up to a year, drops those columns). Pick summarized for long-range trends, detailed when you need to attribute spend to a person or workflow.

## Tech Stack

| | |
|---|---|
| React 19 + TypeScript | [Primer React](https://primer.style/react) (GitHub's design system) |
| [Highcharts](https://www.highcharts.com/) | [TanStack Table](https://tanstack.com/table) + [Virtual](https://tanstack.com/virtual) |
| Vite | Vitest |

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Type-check + production build
npm run test         # Unit tests
npm run lint         # ESLint
npm run typecheck    # TypeScript (no emit)
```

## Deployment

Pushed to `main` → lint → typecheck → test → build → deployed to [GitHub Pages](https://austenstone.github.io/github-actions-usage-report/) via Actions.
