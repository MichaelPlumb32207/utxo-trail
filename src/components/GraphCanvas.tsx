"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useGraphStore } from "@/stores/graphStore";
import { useLabelsStore } from "@/stores/labelsStore";
import type { GraphLink, GraphNode, NodeRole } from "@/lib/graph/model";
import { formatBtcCompact } from "@/lib/bitcoin/units";
import { shortAddr } from "@/lib/format";

// Canvas force-graph requires browser APIs — never SSR.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Loading graph…
    </div>
  ),
});

const ROLE_COLOR: Record<NodeRole, string> = {
  attacker: "#f87171",
  seed: "#38bdf8",
  victim: "#fbbf24",
  external: "#64748b",
  change: "#94a3b8",
  unknown: "#475569",
};

function nodeRadius(n: GraphNode): number {
  const v = Math.max(n.fundedSats, n.balanceSats, 1);
  // log scale: dust ~4px, whale ~18px
  return Math.min(18, Math.max(4, 3 + Math.log10(v) * 1.6));
}

function linkWidth(l: GraphLink): number {
  return Math.min(6, Math.max(0.5, Math.log10(Math.max(l.valueSats, 1)) - 4));
}

type FGNode = GraphNode & { x?: number; y?: number; vx?: number; vy?: number };
type FGLink = GraphLink & {
  source: string | FGNode;
  target: string | FGNode;
};

export function GraphCanvas() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesMap = useGraphStore((s) => s.nodes);
  const linksMap = useGraphStore((s) => s.links);
  const selection = useGraphStore((s) => s.selection);
  const selectAddress = useGraphStore((s) => s.selectAddress);
  const loadTransaction = useGraphStore((s) => s.loadTransaction);
  const labels = useLabelsStore((s) => s.labels);

  const graphData = useMemo(() => {
    const nodes = [...nodesMap.values()];
    const links = [...linksMap.values()].map((l) => ({ ...l }));
    return { nodes, links };
  }, [nodesMap, linksMap]);

  const selectedId =
    selection?.kind === "address"
      ? selection.id
      : selection?.kind === "tx"
        ? selection.id
        : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !fgRef.current) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      fgRef.current?.width?.(width);
      fgRef.current?.height?.(height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paintNode = useCallback(
    // force-graph types are loose; our nodes always carry GraphNode fields.
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as FGNode;
      const r = nodeRadius(n);
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const isSelected =
        selection?.kind === "address" && selection.id === n.id;
      const color =
        n.pinned && n.role !== "attacker" && n.role !== "seed"
          ? "#a78bfa"
          : (ROLE_COLOR[n.role] ?? ROLE_COLOR.unknown);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected || n.pinned) {
        ctx.strokeStyle = isSelected ? "#f7931a" : "rgba(255,255,255,0.55)";
        ctx.lineWidth = isSelected ? 2.5 / globalScale : 1.5 / globalScale;
        ctx.stroke();
      }

      const label = labels[n.id] || n.label || shortAddr(String(n.id));
      const fontSize = Math.max(10 / globalScale, 2.5);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(232,237,245,0.92)";
      ctx.fillText(label, x, y + r + 1);

      if (n.fundedSats > 0 && globalScale > 0.7) {
        ctx.fillStyle = "rgba(139,151,173,0.9)";
        ctx.font = `${fontSize * 0.85}px sans-serif`;
        ctx.fillText(formatBtcCompact(n.fundedSats), x, y + r + fontSize + 2);
      }
    },
    [labels, selection],
  );

  const paintLink = useCallback(
    (link: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const l = link as FGLink;
      const src = l.source as FGNode;
      const tgt = l.target as FGNode;
      if (src.x == null || tgt.x == null || src.y == null || tgt.y == null) return;

      const isSelected =
        selection?.kind === "tx" && selection.id === l.txid;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isSelected
        ? "rgba(247,147,26,0.95)"
        : "rgba(96,165,250,0.45)";
      ctx.lineWidth =
        (isSelected ? linkWidth(l) * 1.8 : linkWidth(l)) /
        Math.max(globalScale * 0.5, 0.5);
      ctx.stroke();

      // Arrow head
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const tr = nodeRadius(tgt as GraphNode);
      const ax = tgt.x - ux * (tr + 1);
      const ay = tgt.y - uy * (tr + 1);
      const size = 5 / Math.max(globalScale, 0.4);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - ux * size - uy * size * 0.5,
        ay - uy * size + ux * size * 0.5,
      );
      ctx.lineTo(
        ax - ux * size + uy * size * 0.5,
        ay - uy * size - ux * size * 0.5,
      );
      ctx.closePath();
      ctx.fillStyle = isSelected
        ? "rgba(247,147,26,0.95)"
        : "rgba(96,165,250,0.55)";
      ctx.fill();
    },
    [selection],
  );

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-lg font-semibold text-foreground">UTXO Trail</div>
        <p className="max-w-md text-sm text-muted">
          Paste Bitcoin addresses or load the Coldcard investigation preset to
          visualize UTXO flows. Expand hops forward (where funds went) and
          backward (where they came from).
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as FGNode;
          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, nodeRadius(n) + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkCanvasObject={paintLink}
        linkDirectionalParticles={selectedId ? 2 : 0}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => "#f7931a"}
        onNodeClick={(node) => {
          selectAddress((node as GraphNode).id);
        }}
        onLinkClick={(link) => {
          const l = link as GraphLink;
          void loadTransaction(l.txid);
        }}
        onBackgroundClick={() => selectAddress(null)}
        cooldownTicks={80}
        d3AlphaDecay={0.04}
        d3VelocityDecay={0.3}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
      />
    </div>
  );
}
