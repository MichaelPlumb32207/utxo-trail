/**
 * Pure graph merge helpers — given address stats + txs, produce nodes/links
 * to merge into the investigation graph. Unit-tested without network I/O.
 */

import type { AddressInfo, Tx } from "@/lib/api/types";
import {
  type ExpandOptions,
  type GraphLink,
  type GraphNode,
  emptyNode,
  linkId,
} from "./model";

export interface AddressFlowResult {
  node: GraphNode;
  neighbors: GraphNode[];
  links: GraphLink[];
  /** Neighbor addresses sorted by connected value (desc) — for capping. */
  rankedNeighborIds: string[];
}

function balanceFromInfo(info: AddressInfo): {
  balanceSats: number;
  fundedSats: number;
  txCount: number;
} {
  const c = info.chain_stats;
  const m = info.mempool_stats;
  const funded = c.funded_txo_sum + m.funded_txo_sum;
  const spent = c.spent_txo_sum + m.spent_txo_sum;
  return {
    balanceSats: funded - spent,
    fundedSats: funded,
    txCount: c.tx_count + m.tx_count,
  };
}

/**
 * Extract directed address flows involving `focus` from a list of txs.
 * - Backward: prevout addresses → focus (focus is an output)
 * - Forward: focus → output addresses (focus is an input)
 */
export function flowsFromTxs(
  focus: string,
  txs: Tx[],
  opts: Pick<ExpandOptions, "minAmountSats" | "direction">,
): { links: GraphLink[]; neighborValue: Map<string, number> } {
  const links: GraphLink[] = [];
  const neighborValue = new Map<string, number>();
  const seen = new Set<string>();

  const bump = (addr: string, value: number) => {
    neighborValue.set(addr, (neighborValue.get(addr) ?? 0) + value);
  };

  for (const tx of txs) {
    const inputsFromFocus = tx.vin.some(
      (vin) => vin.prevout?.scriptpubkey_address === focus,
    );
    const outputsToFocus = tx.vout.some(
      (vout) => vout.scriptpubkey_address === focus,
    );

    // Forward: focus spent → other outputs
    if (
      inputsFromFocus &&
      (opts.direction === "forward" || opts.direction === "both")
    ) {
      for (const vout of tx.vout) {
        const to = vout.scriptpubkey_address;
        if (!to || to === focus) continue;
        if (vout.value < opts.minAmountSats) continue;
        const id = linkId(focus, to, tx.txid);
        if (seen.has(id)) continue;
        seen.add(id);
        links.push({
          id,
          source: focus,
          target: to,
          txid: tx.txid,
          valueSats: vout.value,
          blockTime: tx.status.block_time,
          fee: tx.fee,
          weight: tx.weight,
          confirmed: tx.status.confirmed,
        });
        bump(to, vout.value);
      }
    }

    // Backward: other inputs → focus (when focus received)
    if (
      outputsToFocus &&
      (opts.direction === "backward" || opts.direction === "both")
    ) {
      // Value attributed to each input proportionally is complex; for graph
      // edges we draw each input address → focus with the input's prevout value
      // when that input is large enough. Multi-input consolidations show many
      // inbound edges (correct for investigation of sweeps).
      for (const vin of tx.vin) {
        const from = vin.prevout?.scriptpubkey_address;
        if (!from || from === focus) continue;
        const value = vin.prevout?.value ?? 0;
        if (value < opts.minAmountSats) continue;
        const id = linkId(from, focus, tx.txid);
        if (seen.has(id)) continue;
        seen.add(id);
        links.push({
          id,
          source: from,
          target: focus,
          txid: tx.txid,
          valueSats: value,
          blockTime: tx.status.block_time,
          fee: tx.fee,
          weight: tx.weight,
          confirmed: tx.status.confirmed,
        });
        bump(from, value);
      }
    }
  }

  return { links, neighborValue };
}

/**
 * Build a focus node + neighbor stubs + links, applying maxNewNodes cap
 * by total connected value.
 */
export function buildAddressFlow(
  info: AddressInfo,
  txs: Tx[],
  opts: ExpandOptions,
  base?: Partial<GraphNode>,
): AddressFlowResult {
  const stats = balanceFromInfo(info);
  const node = emptyNode(info.address, {
    ...base,
    balanceSats: stats.balanceSats,
    fundedSats: stats.fundedSats,
    txCount: stats.txCount,
    expanded: true,
  });

  const { links: allLinks, neighborValue } = flowsFromTxs(info.address, txs, opts);

  const rankedNeighborIds = [...neighborValue.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const allowed = new Set(rankedNeighborIds.slice(0, opts.maxNewNodes));
  // Always keep neighbors already referenced if under cap — ranked list is source of truth
  const links = allLinks.filter(
    (l) =>
      (l.source === info.address && allowed.has(l.target)) ||
      (l.target === info.address && allowed.has(l.source)),
  );

  const hop = (base?.hop ?? 0) + 1;
  const neighbors = rankedNeighborIds
    .filter((id) => allowed.has(id))
    .map((id) =>
      emptyNode(id, {
        hop,
        role: base?.role === "attacker" ? "victim" : "external",
      }),
    );

  return { node, neighbors, links, rankedNeighborIds };
}

/** Merge two node maps; prefer richer data (higher funded, expanded wins). */
export function mergeNode(
  existing: GraphNode | undefined,
  incoming: GraphNode,
): GraphNode {
  if (!existing) return incoming;
  return {
    ...existing,
    ...incoming,
    label: incoming.label ?? existing.label,
    role:
      existing.role === "seed" || existing.role === "attacker"
        ? existing.role
        : incoming.role === "seed" || incoming.role === "attacker"
          ? incoming.role
          : existing.role !== "unknown"
            ? existing.role
            : incoming.role,
    balanceSats: Math.max(existing.balanceSats, incoming.balanceSats) ||
      incoming.balanceSats ||
      existing.balanceSats,
    fundedSats: Math.max(existing.fundedSats, incoming.fundedSats),
    txCount: Math.max(existing.txCount, incoming.txCount),
    pinned: existing.pinned || incoming.pinned,
    expanded: existing.expanded || incoming.expanded,
    hop: Math.min(existing.hop, incoming.hop),
    // Keep user-dragged layout unless the incoming node explicitly sets fx/fy.
    fx: incoming.fx !== undefined ? incoming.fx : existing.fx,
    fy: incoming.fy !== undefined ? incoming.fy : existing.fy,
  };
}

export function mergeLinks(
  existing: Map<string, GraphLink>,
  incoming: GraphLink[],
): Map<string, GraphLink> {
  const next = new Map(existing);
  for (const link of incoming) {
    const prev = next.get(link.id);
    if (!prev || link.valueSats > prev.valueSats) next.set(link.id, link);
  }
  return next;
}
