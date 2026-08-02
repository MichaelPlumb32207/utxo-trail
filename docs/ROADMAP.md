# UTXO Trail — Roadmap (place-first fishbone)

Last Updated: 2026-08-02

Spine = user outcomes. Each leg names the **place** (what the researcher can do) and the technical **enabler**. Itemized status lives in [BACKLOG.md](./BACKLOG.md).

```
                    [ share sessions ]
                           |
[ path find ] ---- SEE THE TRAIL ---- [ label entities ]
      |                 |                    |
   shortest          force graph          clustering
   path UI           + expand             heuristics
                           |
                    [ start from seeds ]
                           |
              paste / Coldcard presets / lists
                           |
                    [ trust the data ]
                           |
              public API → self-hosted Esplora
```

## Leg 1 — Start from seeds · **spine focus (MVP shipped)**

**Place:** Drop known addresses and immediately see a useful subgraph.  
**Enabler:** mempool client + presets + expand caps.  
**Testable now:** Load Coldcard investigation; paste arbitrary mainnet address.

## Leg 2 — See the trail · **spine focus (MVP shipped)**

**Place:** Follow value forward and backward without drowning in dust.  
**Enabler:** force-directed graph, min amount, max nodes, tx panel.  
**Testable now:** Expand in/out; click edge for tx; follow outputs.

## Leg 3 — Label what matters · **next**

**Place:** Mark attacker / exchange / change / victim in your own words.  
**Enabler:** local labels (done) → heuristics + import DBs (open).  
**Unlocks:** cleaner shared narratives, clustering UI.

## Leg 4 — Answer “how connected?” · **later**

**Place:** Shortest / highest-value path between two seeds.  
**Enabler:** path-finding over current subgraph (then deeper fetch).  
**Unlocks:** incident write-ups, education demos.

## Leg 5 — Scrub time · **later**

**Place:** Watch the trail unfold by block time.  
**Enabler:** timeline view + optional scrubber on same graph data.

## Leg 6 — Own the stack · **optional highway**

**Place:** Researchers with their own node are not rate-limited by public APIs.  
**Enabler:** `NEXT_PUBLIC_MEMPOOL_API` + optional Next proxy; Esplora-compatible only.

## Guiding principles

- Public data only; privacy-respecting client
- Ship dense useful MVP, then open seams already noted in `docs/CLAUDE.md`
- Prefer pure graph functions + thin API layer over monolithic UI logic
