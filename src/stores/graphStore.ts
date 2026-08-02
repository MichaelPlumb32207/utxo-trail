"use client";

/**
 * Investigation graph state + expansion orchestration.
 * Fetches via mempool.space client; pure merge in lib/graph/build.
 */

import { create } from "zustand";
import {
  getAddressInfo,
  getAddressTxs,
  getAddressTxsChain,
  getTx,
  looksLikeAddress,
  looksLikeTxid,
} from "@/lib/api/mempool";
import type { Tx } from "@/lib/api/types";
import {
  buildAddressFlow,
  mergeLinks,
  mergeNode,
} from "@/lib/graph/build";
import {
  DEFAULT_EXPAND,
  type ExpandOptions,
  type GraphLink,
  type GraphNode,
  type NodeRole,
  emptyNode,
} from "@/lib/graph/model";
import { COLDCARD_PRESETS } from "@/data/coldcard-presets";

export type Selection =
  | { kind: "address"; id: string }
  | { kind: "tx"; id: string }
  | null;

interface GraphState {
  nodes: Map<string, GraphNode>;
  links: Map<string, GraphLink>;
  /** Cached full txs for the detail panel. */
  txCache: Map<string, Tx>;
  selection: Selection;
  filters: ExpandOptions;
  loading: boolean;
  status: string | null;
  error: string | null;

  // derived helpers exposed for UI
  nodeList: () => GraphNode[];
  linkList: () => GraphLink[];

  setFilters: (partial: Partial<ExpandOptions>) => void;
  selectAddress: (id: string | null) => void;
  selectTx: (txid: string | null) => void;
  clearSelection: () => void;
  pinAddress: (id: string, pinned?: boolean) => void;
  clearGraph: () => void;

  addAddresses: (
    addresses: Array<{ address: string; label?: string; role?: NodeRole }>,
    opts?: { autoExpand?: boolean },
  ) => Promise<void>;
  loadColdcardPresets: () => Promise<void>;
  expandAddress: (
    address: string,
    direction?: ExpandOptions["direction"],
  ) => Promise<void>;
  loadTransaction: (txid: string) => Promise<Tx | null>;
  followAddress: (address: string) => Promise<void>;
}

function snapshotLists(nodes: Map<string, GraphNode>, links: Map<string, GraphLink>) {
  return {
    nodeList: () => [...nodes.values()],
    linkList: () => [...links.values()],
  };
}

async function fetchTxsForAddress(
  address: string,
  maxPages: number,
  signal?: AbortSignal,
): Promise<Tx[]> {
  const first = await getAddressTxs(address, signal);
  const byId = new Map(first.map((t) => [t.txid, t]));
  // Page confirmed history if needed
  let last = first.filter((t) => t.status.confirmed).at(-1)?.txid;
  for (let page = 1; page < maxPages && last; page++) {
    const more = await getAddressTxsChain(address, last, signal);
    if (!more.length) break;
    for (const t of more) byId.set(t.txid, t);
    last = more.at(-1)?.txid;
    if (more.length < 25) break;
  }
  return [...byId.values()];
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: new Map(),
  links: new Map(),
  txCache: new Map(),
  selection: null,
  filters: { ...DEFAULT_EXPAND },
  loading: false,
  status: null,
  error: null,

  nodeList: () => [...get().nodes.values()],
  linkList: () => [...get().links.values()],

  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),

  selectAddress: (id) =>
    set({ selection: id ? { kind: "address", id } : null }),

  selectTx: (txid) =>
    set({ selection: txid ? { kind: "tx", id: txid } : null }),

  clearSelection: () => set({ selection: null }),

  pinAddress: (id, pinned = true) =>
    set((s) => {
      const nodes = new Map(s.nodes);
      const n = nodes.get(id);
      if (n) nodes.set(id, { ...n, pinned });
      return { nodes, ...snapshotLists(nodes, s.links) };
    }),

  clearGraph: () =>
    set({
      nodes: new Map(),
      links: new Map(),
      txCache: new Map(),
      selection: null,
      status: null,
      error: null,
      ...snapshotLists(new Map(), new Map()),
    }),

  addAddresses: async (addresses, opts = { autoExpand: true }) => {
    const valid = addresses
      .map((a) => ({ ...a, address: a.address.trim() }))
      .filter((a) => looksLikeAddress(a.address));
    if (!valid.length) {
      set({ error: "No valid Bitcoin addresses found." });
      return;
    }

    set({ loading: true, error: null, status: `Loading ${valid.length} address(es)…` });

    try {
      const { nodes, links, filters, txCache } = get();
      const nextNodes = new Map(nodes);
      const nextLinks = new Map(links);
      const nextTxCache = new Map(txCache);

      for (const item of valid) {
        const seed = emptyNode(item.address, {
          label: item.label,
          role: item.role ?? "seed",
          hop: 0,
          pinned: true,
        });
        nextNodes.set(
          item.address,
          mergeNode(nextNodes.get(item.address), seed),
        );
      }
      set({
        nodes: nextNodes,
        links: nextLinks,
        ...snapshotLists(nextNodes, nextLinks),
      });

      if (opts.autoExpand !== false) {
        for (const item of valid) {
          set({ status: `Expanding ${item.address.slice(0, 12)}…` });
          await expandOne(
            item.address,
            filters,
            nextNodes,
            nextLinks,
            nextTxCache,
            "both",
          );
          set({
            nodes: new Map(nextNodes),
            links: new Map(nextLinks),
            txCache: new Map(nextTxCache),
            ...snapshotLists(nextNodes, nextLinks),
          });
        }
      }

      set({
        loading: false,
        status: `Loaded ${valid.length} seed address(es)`,
        selection: { kind: "address", id: valid[0].address },
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load addresses",
        status: null,
      });
    }
  },

  loadColdcardPresets: async () => {
    await get().addAddresses(
      COLDCARD_PRESETS.map((p) => ({
        address: p.address,
        label: p.label,
        role: p.role,
      })),
    );
  },

  expandAddress: async (address, direction = "both") => {
    set({
      loading: true,
      error: null,
      status: `Expanding ${direction} from ${address.slice(0, 12)}…`,
    });
    try {
      const { nodes, links, filters, txCache } = get();
      const nextNodes = new Map(nodes);
      const nextLinks = new Map(links);
      const nextTxCache = new Map(txCache);
      await expandOne(
        address,
        { ...filters, direction },
        nextNodes,
        nextLinks,
        nextTxCache,
        direction,
      );
      set({
        nodes: nextNodes,
        links: nextLinks,
        txCache: nextTxCache,
        loading: false,
        status: `Expanded ${address.slice(0, 12)}…`,
        ...snapshotLists(nextNodes, nextLinks),
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Expand failed",
        status: null,
      });
    }
  },

  loadTransaction: async (txid) => {
    const clean = txid.trim();
    if (!looksLikeTxid(clean)) {
      set({ error: "Invalid transaction id" });
      return null;
    }
    const cached = get().txCache.get(clean);
    if (cached) {
      set({ selection: { kind: "tx", id: clean } });
      return cached;
    }
    set({ loading: true, status: `Fetching tx ${clean.slice(0, 12)}…`, error: null });
    try {
      const tx = await getTx(clean);
      const txCache = new Map(get().txCache);
      txCache.set(clean, tx);
      set({
        txCache,
        loading: false,
        status: null,
        selection: { kind: "tx", id: clean },
      });
      return tx;
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load transaction",
      });
      return null;
    }
  },

  followAddress: async (address) => {
    const existing = get().nodes.get(address);
    if (existing?.expanded) {
      set({ selection: { kind: "address", id: address } });
      return;
    }
    await get().addAddresses(
      [{ address, role: existing?.role ?? "external" }],
      { autoExpand: true },
    );
  },
}));

async function expandOne(
  address: string,
  filters: ExpandOptions,
  nodes: Map<string, GraphNode>,
  links: Map<string, GraphLink>,
  txCache: Map<string, Tx>,
  direction: ExpandOptions["direction"],
): Promise<void> {
  const info = await getAddressInfo(address);
  const txs = await fetchTxsForAddress(address, filters.maxTxPages);
  for (const t of txs) txCache.set(t.txid, t);

  const base = nodes.get(address);
  const result = buildAddressFlow(
    info,
    txs,
    { ...filters, direction },
    {
      label: base?.label,
      role: base?.role ?? "external",
      hop: base?.hop ?? 0,
      pinned: base?.pinned,
    },
  );

  nodes.set(address, mergeNode(base, result.node));
  for (const n of result.neighbors) {
    nodes.set(n.id, mergeNode(nodes.get(n.id), n));
  }
  const merged = mergeLinks(links, result.links);
  links.clear();
  for (const [k, v] of merged) links.set(k, v);
}
