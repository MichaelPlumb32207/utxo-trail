"use client";

import {
  Download,
  Eraser,
  Filter,
  Move,
} from "lucide-react";
import { useGraphStore } from "@/stores/graphStore";
import { useLabelsStore } from "@/stores/labelsStore";
import { downloadText, toExportCsv, toExportJson } from "@/lib/graph/export";
import { SATS_PER_BTC } from "@/lib/bitcoin/units";

const MIN_AMOUNT_OPTIONS: Array<{ label: string; sats: number }> = [
  { label: "Any", sats: 0 },
  { label: "≥ 0.001 BTC", sats: Number(SATS_PER_BTC) / 1000 },
  { label: "≥ 0.01 BTC", sats: Number(SATS_PER_BTC) / 100 },
  { label: "≥ 0.1 BTC", sats: Number(SATS_PER_BTC) / 10 },
  { label: "≥ 1 BTC", sats: Number(SATS_PER_BTC) },
];

export function Toolbar() {
  const filters = useGraphStore((s) => s.filters);
  const setFilters = useGraphStore((s) => s.setFilters);
  const clearGraph = useGraphStore((s) => s.clearGraph);
  const releaseAllPositions = useGraphStore((s) => s.releaseAllPositions);
  const nodes = useGraphStore((s) => s.nodes);
  const links = useGraphStore((s) => s.links);
  const labels = useLabelsStore((s) => s.labels);
  const status = useGraphStore((s) => s.status);
  const error = useGraphStore((s) => s.error);
  const loading = useGraphStore((s) => s.loading);

  const fixedCount = [...nodes.values()].filter(
    (n) => n.fx != null && n.fy != null,
  ).length;

  function exportJson() {
    const data = toExportJson(
      [...nodes.values()],
      [...links.values()],
      labels,
    );
    downloadText(
      `utxo-trail-${Date.now()}.json`,
      JSON.stringify(data, null, 2),
      "application/json",
    );
  }

  function exportCsv() {
    const csv = toExportCsv([...nodes.values()], [...links.values()]);
    downloadText(`utxo-trail-${Date.now()}.csv`, csv, "text/csv");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        <Filter className="size-3.5" />
        Expansion filters
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] text-muted">Min edge amount</span>
        <select
          value={filters.minAmountSats}
          onChange={(e) =>
            setFilters({ minAmountSats: Number(e.target.value) })
          }
          className="w-full rounded-lg border border-panel-border bg-black/40 px-2 py-1.5 text-xs text-foreground focus:border-accent/50 focus:outline-none"
        >
          {MIN_AMOUNT_OPTIONS.map((o) => (
            <option key={o.sats} value={o.sats}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] text-muted">Max new nodes / expand</span>
        <input
          type="number"
          min={5}
          max={200}
          value={filters.maxNewNodes}
          onChange={(e) =>
            setFilters({
              maxNewNodes: Math.min(200, Math.max(5, Number(e.target.value) || 40)),
            })
          }
          className="w-full rounded-lg border border-panel-border bg-black/40 px-2 py-1.5 text-xs text-foreground focus:border-accent/50 focus:outline-none"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[11px] text-muted">Tx history pages (×25)</span>
        <input
          type="number"
          min={1}
          max={10}
          value={filters.maxTxPages}
          onChange={(e) =>
            setFilters({
              maxTxPages: Math.min(10, Math.max(1, Number(e.target.value) || 2)),
            })
          }
          className="w-full rounded-lg border border-panel-border bg-black/40 px-2 py-1.5 text-xs text-foreground focus:border-accent/50 focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={exportJson}
          disabled={nodes.size === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs text-foreground hover:border-accent/40"
        >
          <Download className="size-3.5" />
          JSON
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={nodes.size === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs text-foreground hover:border-accent/40"
        >
          <Download className="size-3.5" />
          CSV
        </button>
        <button
          type="button"
          onClick={() => releaseAllPositions()}
          disabled={fixedCount === 0}
          title="Let the force layout move all nodes again"
          className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs text-foreground hover:border-accent/40"
        >
          <Move className="size-3.5" />
          Free layout{fixedCount > 0 ? ` (${fixedCount})` : ""}
        </button>
        <button
          type="button"
          onClick={() => clearGraph()}
          disabled={nodes.size === 0 && !error}
          className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs text-muted hover:border-danger/40 hover:text-danger"
        >
          <Eraser className="size-3.5" />
          Clear
        </button>
      </div>
      <p className="text-[11px] leading-snug text-muted">
        Drag a node to place it — it stays put. Double-click a placed node (or
        Free layout) to release.
      </p>

      <div className="text-[11px] text-muted">
        {nodes.size} nodes · {links.size} links
        {loading && status ? (
          <span className="mt-1 block text-accent">{status}</span>
        ) : status ? (
          <span className="mt-1 block">{status}</span>
        ) : null}
        {error ? (
          <span className="mt-1 block text-danger">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
