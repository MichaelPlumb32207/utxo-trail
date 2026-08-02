import type { GraphLink, GraphNode } from "./model";

export interface GraphExport {
  exportedAt: string;
  nodes: GraphNode[];
  links: Array<
    Omit<GraphLink, "source" | "target"> & { source: string; target: string }
  >;
  labels: Record<string, string>;
}

export function toExportJson(
  nodes: GraphNode[],
  links: GraphLink[],
  labels: Record<string, string>,
): GraphExport {
  return {
    exportedAt: new Date().toISOString(),
    nodes,
    links: links.map((l) => ({
      ...l,
      source: typeof l.source === "string" ? l.source : String(l.source),
      target: typeof l.target === "string" ? l.target : String(l.target),
    })),
    labels,
  };
}

export function toExportCsv(nodes: GraphNode[], links: GraphLink[]): string {
  const nodeHeader = "type,id,label,role,balanceSats,fundedSats,txCount,hop,pinned";
  const nodeRows = nodes.map(
    (n) =>
      [
        "node",
        n.id,
        csvEscape(n.label ?? ""),
        n.role,
        n.balanceSats,
        n.fundedSats,
        n.txCount,
        n.hop,
        n.pinned,
      ].join(","),
  );

  const linkHeader =
    "type,id,source,target,txid,valueSats,blockTime,fee,confirmed";
  const linkRows = links.map((l) => {
    const source = typeof l.source === "string" ? l.source : String(l.source);
    const target = typeof l.target === "string" ? l.target : String(l.target);
    return [
      "link",
      l.id,
      source,
      target,
      l.txid,
      l.valueSats,
      l.blockTime ?? "",
      l.fee ?? "",
      l.confirmed,
    ].join(",");
  });

  return [nodeHeader, ...nodeRows, "", linkHeader, ...linkRows].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
