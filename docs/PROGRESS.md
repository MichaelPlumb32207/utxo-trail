# UTXO Trail — Progress

Last Updated: 2026-08-02

## 2026-08-02 — v0.1.0 MVP foundation

- Scaffolded Next.js 16 + Tailwind v4 + TypeScript project as **utxo-trail**
- Ported satchel-style mempool client (concurrency, spacing, backoff) and sats units
- Graph model + pure `buildAddressFlow` / merge helpers with vitest coverage
- Zustand graph store: add seeds, expand in/out/both, tx cache, Coldcard presets
- Labels store with localStorage persistence
- UI: left rail (search, Coldcard load, filters, export), force graph, address + tx panels
- Preset addresses verified against live mempool.space:
  - `bc1qnk4zh9qcnap2mycp56qjrgza3cc8ylrh8fecp0` (intermediate consolidation)
  - `bc1qq85v2c926eg6pgxhwp6q7lf6cnsz80qs3fcu9r` (holding / consolidation)
- Living docs suite created

### Known limitations (expected for MVP)

- First ~25–50 txs per address by default (paging capped via filter)
- High fan-in consolidators need min-amount + max-nodes to stay usable
- No clustering / path-find / session share yet
- Graph UTXOs listed in panel only (not sub-nodes on canvas)
