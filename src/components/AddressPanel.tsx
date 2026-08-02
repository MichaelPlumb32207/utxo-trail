"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  Pin,
  Tag,
  X,
} from "lucide-react";
import { useGraphStore } from "@/stores/graphStore";
import { useLabelsStore } from "@/stores/labelsStore";
import { getAddressUtxos } from "@/lib/api/mempool";
import type { Utxo } from "@/lib/api/types";
import { formatBtc, formatBtcCompact } from "@/lib/bitcoin/units";
import { shortTxid } from "@/lib/format";

export function AddressPanel({ address }: { address: string }) {
  // Remount when address changes so draft label + UTXO fetch reset cleanly.
  return <AddressPanelInner key={address} address={address} />;
}

function AddressPanelInner({ address }: { address: string }) {
  const node = useGraphStore((s) => s.nodes.get(address));
  const expandAddress = useGraphStore((s) => s.expandAddress);
  const pinAddress = useGraphStore((s) => s.pinAddress);
  const clearSelection = useGraphStore((s) => s.clearSelection);
  const loadTransaction = useGraphStore((s) => s.loadTransaction);
  const links = useGraphStore((s) => s.links);
  const loading = useGraphStore((s) => s.loading);
  const storedLabel = useLabelsStore((s) => s.labels[address]);
  const setLabel = useLabelsStore((s) => s.setLabel);

  const [labelDraft, setLabelDraft] = useState(
    () => storedLabel ?? node?.label ?? "",
  );
  const [utxos, setUtxos] = useState<Utxo[] | null>(null);
  const [utxoError, setUtxoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAddressUtxos(address)
      .then((u) => {
        if (!cancelled) setUtxos(u);
      })
      .catch((e) => {
        if (!cancelled)
          setUtxoError(e instanceof Error ? e.message : "Failed to load UTXOs");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const relatedLinks = [...links.values()]
    .filter((l) => l.source === address || l.target === address)
    .sort((a, b) => b.valueSats - a.valueSats)
    .slice(0, 30);

  function copy() {
    void navigator.clipboard.writeText(address);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-2 border-b border-panel-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Address · {node?.role ?? "unknown"}
          </div>
          <div className="mono mt-1 break-all text-xs text-foreground">{address}</div>
        </div>
        <button
          type="button"
          onClick={() => clearSelection()}
          className="rounded p-1 text-muted hover:bg-white/5 hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="panel-scroll flex-1 space-y-4 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat
            label="Balance"
            value={formatBtc(BigInt(node?.balanceSats ?? 0))}
          />
          <Stat
            label="Funded (lifetime)"
            value={formatBtcCompact(node?.fundedSats ?? 0)}
          />
          <Stat label="Tx count" value={String(node?.txCount ?? "—")} />
          <Stat label="Hop" value={String(node?.hop ?? "—")} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs hover:border-accent/40"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
          <a
            href={`https://mempool.space/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs hover:border-accent/40"
          >
            <ExternalLink className="size-3.5" />
            mempool.space
          </a>
          <button
            type="button"
            onClick={() => pinAddress(address, !node?.pinned)}
            className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs hover:border-accent/40"
          >
            <Pin className="size-3.5" />
            {node?.pinned ? "Unpin" : "Pin"}
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <Tag className="size-3.5" />
            Label
          </label>
          <div className="flex gap-2">
            <input
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              placeholder="e.g. Attacker consolidation"
              className="min-w-0 flex-1 rounded-md border border-panel-border bg-black/40 px-2 py-1.5 text-xs focus:border-accent/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setLabel(address, labelDraft)}
              className="rounded-md bg-accent/90 px-2 py-1.5 text-xs font-semibold text-black hover:bg-accent-strong"
            >
              Save
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void expandAddress(address, "backward")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-panel-border bg-black/30 px-2 py-2 text-xs font-medium hover:border-accent/40"
          >
            <ArrowDownLeft className="size-3.5" />
            Expand in
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void expandAddress(address, "forward")}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-panel-border bg-black/30 px-2 py-2 text-xs font-medium hover:border-accent/40"
          >
            <ArrowUpRight className="size-3.5" />
            Expand out
          </button>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void expandAddress(address, "both")}
          className="w-full rounded-lg border border-accent/30 bg-accent-dim px-2 py-2 text-xs font-medium text-accent-strong hover:border-accent/60"
        >
          Expand both directions
        </button>

        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
            Connected flows ({relatedLinks.length})
          </h3>
          <ul className="space-y-1">
            {relatedLinks.map((l) => {
              const inbound = l.target === address;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => void loadTransaction(l.txid)}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-xs hover:border-panel-border hover:bg-white/[0.03]"
                  >
                    <span className="mono text-muted">
                      {inbound ? "← in" : "out →"} {shortTxid(l.txid)}
                    </span>
                    <span className="tabular-nums text-foreground">
                      {formatBtcCompact(l.valueSats)}
                    </span>
                  </button>
                </li>
              );
            })}
            {!relatedLinks.length && (
              <li className="text-xs text-muted">
                No linked edges yet — expand this address.
              </li>
            )}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
            UTXOs {utxos ? `(${utxos.length})` : ""}
          </h3>
          {utxoError && <p className="text-xs text-danger">{utxoError}</p>}
          {!utxos && !utxoError && (
            <p className="text-xs text-muted">Loading UTXOs…</p>
          )}
          {utxos && (
            <ul className="space-y-1">
              {utxos.slice(0, 40).map((u) => (
                <li
                  key={`${u.txid}:${u.vout}`}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs"
                >
                  <button
                    type="button"
                    className="mono text-link hover:underline"
                    onClick={() => void loadTransaction(u.txid)}
                  >
                    {shortTxid(u.txid)}:{u.vout}
                  </button>
                  <span className="tabular-nums">
                    {formatBtcCompact(u.value)}
                  </span>
                </li>
              ))}
              {utxos.length === 0 && (
                <li className="text-xs text-muted">No unspent outputs.</li>
              )}
              {utxos.length > 40 && (
                <li className="text-[11px] text-muted">
                  +{utxos.length - 40} more — open on mempool.space
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-panel-border bg-black/25 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
