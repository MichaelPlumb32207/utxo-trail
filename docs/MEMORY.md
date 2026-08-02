# UTXO Trail — Memory

Last Updated: 2026-08-02

Durable project facts for future sessions (not a chat log).

## Product

- Name: **UTXO Trail**
- Scope: public Bitcoin flow research UI — not a wallet
- First practical dataset: Coldcard July 2026 seed-gen incident consolidators

## Deploy

- **GitHub:** `MichaelPlumb32207/utxo-trail` (public)
- **Vercel:** Liberty Concierge project `utxo-trail` · auto-deploy from `main`
- **Production:** https://utxo-trail.vercel.app/
- No required env vars for MVP (optional `NEXT_PUBLIC_MEMPOOL_API`)

## Technical choices

- Client-side mempool.space; `NEXT_PUBLIC_MEMPOOL_API` for alternate Esplora base
- Money math: **bigint sats** in `lib/bitcoin/units.ts` (never float for exact amounts)
- Graph pure logic in `lib/graph/*` so tests need no network
- `react-force-graph-2d` must load with `dynamic(..., { ssr: false })`
- Labels: zustand `persist` → `localStorage` key `utxo-trail-labels`

## Reuse

- Copy/adapt from sibling `BitTools/satchel-wallet` API + units; no shared package yet

## Investigation ergonomics

- Default `minAmountSats = 1_000_000` (0.01 BTC) to suppress dust on sweep graphs
- Default `maxNewNodes = 40` per expand
- Default `maxTxPages = 2` (25 confirmed txs per page after first mixed page)

## Coldcard preset addresses (public)

1. Intermediate: `bc1qnk4zh9qcnap2mycp56qjrgza3cc8ylrh8fecp0`
2. Holding: `bc1qq85v2c926eg6pgxhwp6q7lf6cnsz80qs3fcu9r`
