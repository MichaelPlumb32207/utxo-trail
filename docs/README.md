# UTXO Trail

Interactive Bitcoin **UTXO flow explorer** — research address and transaction histories as a visual trail.

## What it does

- Load one or more seed addresses (or known Coldcard-incident consolidators)
- Force-directed graph of address → transaction → address flows
- Expand forward (outflows) and backward (inflows) with amount / fan-out caps
- Transaction detail panel with follow-input / follow-output
- Manual labels (local only) and JSON/CSV export

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Load Coldcard investigation** or paste mainnet addresses.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Zustand · react-force-graph-2d · mempool.space API

Sibling patterns adapted from `satchel-wallet` (API client, sats units) without custody code.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (graph pure functions) |
| `npm run build` | Production build |
| `npm run verify` | typecheck → lint → test → build |

## Docs

Full living set in this folder — start with [USER_GUIDE.md](./USER_GUIDE.md) and [CLAUDE.md](./CLAUDE.md).

## Philosophy

Public chain data only. Progressive enhancement. Dense, dark, keyboard-friendly research UI.
