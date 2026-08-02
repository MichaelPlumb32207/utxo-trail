# UTXO Trail — Project Intelligence (CLAUDE.md)

Last Updated: 2026-08-02  
Version: 0.1.0

Authoritative context for AI assistants. Root `/CLAUDE.md` is a thin pointer here.

## Project context

**UTXO Trail** is an interactive **Bitcoin UTXO flow explorer** for research, education, and analysis. Primary mental model:

- **Nodes** = addresses (labeled wallets/clusters later)
- **Links** = directed value flows via transactions
- **Panels** = address detail (UTXOs, expand) and transaction drill-down

Public blockchain data only — **no private keys, no custody, no tracking**.

Motivating dataset: known public consolidation addresses from the **July 2026 Coldcard seed-generation incident** (presets in `src/data/coldcard-presets.ts`). The product is general-purpose; the incident is the first practical seed list.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · `react-force-graph-2d` · lucide-react · vitest. Client-side first against mempool.space (Esplora-compatible). No database, no auth.

**Deploy:** GitHub `MichaelPlumb32207/utxo-trail` → Vercel Liberty Concierge project `utxo-trail` → https://utxo-trail.vercel.app/ (auto-deploy on push to `main`).

## Sibling reuse

Patterns and thin modules adapted from **`../satchel-wallet`** (do not create a monorepo package yet):

| Source | Local |
|---|---|
| `src/lib/api/mempool.ts` | Rate-limited mempool client |
| `src/lib/api/types.ts` | Tx / address / UTXO shapes |
| `src/lib/bitcoin/units.ts` | bigint sats math |

**Do not import** satchel vault, keyring, PSBT, derivation, or send paths — custody is out of scope.

## Mandatory protocol

For every code change: (1) implement well, (2) update **all eight** living docs in `/docs/` even if “no change”, (3) commit. Prefer `npm run verify` before push to a deploy branch.

Eight docs: `BACKLOG.md`, `CLAUDE.md`, `MEMORY.md`, `PROGRESS.md`, `README.md`, `ROADMAP.md`, `USE_CASE_CATALOG.md`, `USER_GUIDE.md`.

## External API verification

Public **mempool.space REST API** (keyless). Do **not** pin rate limits or prices. Docs: <https://mempool.space/docs/api/rest>.

| Capability | Endpoint | Last verified |
|---|---|---|
| Address info | `GET /address/:a` | 2026-08-02 |
| Address txs | `GET /address/:a/txs` | 2026-08-02 |
| Address txs chain (page) | `GET /address/:a/txs/chain[/:after_txid]` | 2026-08-02 |
| UTXOs | `GET /address/:a/utxo` | 2026-08-02 |
| Transaction | `GET /tx/:txid` | 2026-08-02 |

Override base URL with `NEXT_PUBLIC_MEMPOOL_API` (no trailing slash) for self-hosted Esplora later.

Client protections (`src/lib/api/mempool.ts`): max 2 concurrent, ~250ms spacing, exponential backoff on 429/5xx, 15s per-attempt timeout.

## Architecture map

```
src/
  app/                 # Next App Router shell
  components/          # Graph, panels, search, toolbar
  data/                # Coldcard presets (public labels)
  lib/api/             # mempool client + types
  lib/graph/           # pure build/expand/export (testable)
  lib/bitcoin/units.ts # sats math
  stores/              # graphStore, labelsStore (localStorage labels)
```

**Expansion:** fetch address info + txs → `buildAddressFlow` extracts directed edges → merge into Zustand Maps. Caps: `minAmountSats`, `maxNewNodes`, `maxTxPages`.

**Graph library:** `react-force-graph-2d` via `next/dynamic({ ssr: false })`.

### Future seams (keep open)

- Address clustering / entity labels / common-input ownership
- Change-detection heuristics
- Multi-hop path finding between two seeds
- Timeline scrubber
- Import external label DBs
- Save/share investigation sessions
- Next.js API proxy if CORS/rate limits force server-side fetch
- Self-hosted node / better indexer

## Common tasks

- Dev: `npm run dev`
- Verify: `npm run verify` (typecheck → lint → test → build)
- Tests: pure graph tests in `src/lib/graph/build.test.ts` (no network)

## Security / privacy

- No keys, seeds, or wallet connectivity
- No analytics / user tracking by design
- CSP allows `connect-src` to `mempool.space` only (+ self)
- Labels persist only in browser `localStorage`
