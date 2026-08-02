# UTXO Trail — Use Case Catalog

Last Updated: 2026-08-02  
Version: 0.1.0

Each use case carries happy-path (**·H**) and edge (**·E#**) checks. Automated pure-unit coverage is listed at the bottom.

---

## UC-001 — Load seed addresses and see a graph

Researcher pastes one or more addresses and gets a force-directed graph of connected flows.

**UC-001·H** Paste a known mainnet address with history → nodes/links appear; address panel opens.  
**UC-001·E1** Empty paste → no crash; error or no-op.  
**UC-001·E2** Invalid string → error message, graph unchanged.  
**UC-001·E3** Multiple addresses → all seeds added, each expandable.

---

## UC-002 — Load Coldcard investigation preset

One click loads intermediate + holding consolidators with attacker role labels.

**UC-002·H** Click **Load Coldcard investigation** → two seed nodes load and expand under filters.  
**UC-002·E1** API rate limit → client retries; status/error visible, no uncaught exception.

---

## UC-003 — Expand flows with filters

Researcher expands forward/backward without drowning in dust.

**UC-003·H** Expand out on a seed → new nodes under min-amount + max-nodes caps.  
**UC-003·E1** Min amount higher than all edges → no new links (or empty expand).  
**UC-003·E2** maxNewNodes small → at most N new neighbors.

---

## UC-004 — Transaction drill-down

Click edge or open txid → full vin/vout, fee rate, follow actions.

**UC-004·H** Click link → panel shows inputs/outputs matching explorer.  
**UC-004·E1** Paste raw txid in search → same panel.  
**UC-004·E2** Follow output → address added/selected and expanded.

---

## UC-006 — Sticky node placement

Researcher drags addresses into a custom layout that survives expand.

**UC-006·H** Drag a node and release → dashed ring; node does not drift when expanding another address.  
**UC-006·E1** Double-click placed node → ring clears; layout may move it again.  
**UC-006·E2** Free layout in toolbar → all `fx`/`fy` cleared.

---

## UC-005 — Label and export

**UC-005·H** Save label → appears on node; JSON export includes label.  
**UC-005·E1** Clear label → removed from store.  
**UC-005·E2** CSV export downloads with node and link sections.

---

## Automated core coverage

| Suite | Covers |
|---|---|
| `src/lib/graph/build.test.ts` | flowsFromTxs forward/backward/dust filter; maxNewNodes ranking; mergeNode role/hop |

Manual smoke still required for live mempool + canvas (UC-001–004).
