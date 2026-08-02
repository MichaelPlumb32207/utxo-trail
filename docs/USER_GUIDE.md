# UTXO Trail — User Guide

Last Updated: 2026-08-02  
Version: 0.1.0

## What this is

A browser tool for exploring **how bitcoin moved** between addresses. It is **not** a wallet. It never asks for seeds or private keys.

## Getting started

1. Open **https://utxo-trail.vercel.app/** (production) or run locally with `npm run dev`.
2. Either:
   - Click **Load Coldcard investigation** for known public consolidators from the July 2026 incident, or
   - Paste one or more **mainnet addresses** (and/or 64-character **txids**) into the left panel and click **Explore**.

## Graph basics

| Action | Result |
|---|---|
| Click an **address node** | Right panel: balance, UTXOs, connected flows, expand controls |
| Click a **link (edge)** | Right panel: full transaction inputs/outputs, fee rate |
| **Drag node** | Place it — it **stays put** (dashed ring). Research layout sticks while you expand. |
| **Double-click** a placed node | Free it so the force layout can move it again |
| **Free layout** (left rail) | Release all placed positions at once |
| Scroll / pinch | Zoom |
| Drag background | Pan |
| **Esc** | Close the right panel |

**Node colors:** red = attacker/flagged · blue = seed · amber = inbound source · slate = external · purple stroke = pinned.

**Node size** roughly tracks lifetime funded amount (log scale).

## Expanding flows

On an address panel:

- **Expand in** — where funds came from (backward)
- **Expand out** — where funds went (forward)
- **Expand both** — both directions

Filters (left rail) apply to the next expand:

- **Min edge amount** — hide dust (default ≥ 0.01 BTC is good for consolidators)
- **Max new nodes** — stop fan-in from freezing the graph
- **Tx history pages** — how deep confirmed history to pull (25 txs/page)

## Labels

Save a human label on any address (stored only in **your browser**). Exports include labels.

## Export

- **JSON** — full graph + labels for tooling
- **CSV** — nodes and links for spreadsheets

## Coldcard preset (research)

Two public addresses associated with consolidation during the reported sweeps. Use for visualization and education. Always re-verify on a block explorer before publishing claims.

## Privacy

No accounts. No analytics in the app design. Labels stay local. API calls go to mempool.space (or your configured Esplora base).
