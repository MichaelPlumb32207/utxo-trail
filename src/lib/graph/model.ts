/**
 * Graph data model for UTXO Trail.
 *
 * Primary nodes = addresses.
 * Directed links = value flowing A → B via a specific transaction.
 * UTXOs are shown in the address panel (not as separate graph nodes in MVP)
 * to keep the canvas readable at investigation scale.
 *
 * Future seams (do not block MVP):
 * - Entity / cluster super-nodes
 * - UTXO sub-nodes on expand
 * - Path-finding overlays between two seeds
 */

export type NodeRole =
  | "seed"
  | "attacker"
  | "victim"
  | "external"
  | "change"
  | "unknown";

export interface GraphNode {
  /** Address string — also the force-graph node id. */
  id: string;
  label?: string;
  role: NodeRole;
  /** Chain balance in sats (funded - spent on chain), if known. */
  balanceSats: number;
  /** Total funded on chain (lifetime inflow proxy for sizing). */
  fundedSats: number;
  txCount: number;
  /**
   * Investigation bookmark (highlight / keep in focus list).
   * Distinct from layout fixation via `fx`/`fy`.
   */
  pinned: boolean;
  /** True once we have fetched txs for this address at least once. */
  expanded: boolean;
  /** Hop distance from nearest seed (0 = seed). */
  hop: number;
  /**
   * Force-graph fixed coordinates. When set, the simulation will not
   * move the node — used so drag-and-drop layout sticks during research.
   */
  fx?: number;
  fy?: number;
}

/** True when the user has placed this node and it should stay put. */
export function isLayoutFixed(node: GraphNode): boolean {
  return node.fx != null && node.fy != null;
}

export interface GraphLink {
  /**
   * Stable id: `${from}->${to}:${txid}`
   * Force-graph also accepts source/target as node ids.
   */
  id: string;
  source: string;
  target: string;
  txid: string;
  valueSats: number;
  blockTime?: number;
  fee?: number;
  weight?: number;
  confirmed: boolean;
}

export interface ExpandOptions {
  /** Minimum edge value to include (sats). Default 1_000_000 (0.01 BTC). */
  minAmountSats: number;
  /** Cap on newly introduced neighbor addresses per expand call. */
  maxNewNodes: number;
  /** How many confirmed tx pages to pull (25 txs each). */
  maxTxPages: number;
  direction: "forward" | "backward" | "both";
}

export const DEFAULT_EXPAND: ExpandOptions = {
  minAmountSats: 1_000_000, // 0.01 BTC — cuts dust on consolidators
  maxNewNodes: 40,
  maxTxPages: 2,
  direction: "both",
};

export function linkId(from: string, to: string, txid: string): string {
  return `${from}->${to}:${txid}`;
}

export function emptyNode(
  address: string,
  partial?: Partial<GraphNode>,
): GraphNode {
  return {
    id: address,
    role: "unknown",
    balanceSats: 0,
    fundedSats: 0,
    txCount: 0,
    pinned: false,
    expanded: false,
    hop: partial?.hop ?? 99,
    ...partial,
  };
}
