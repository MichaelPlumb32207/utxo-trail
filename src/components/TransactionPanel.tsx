"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { useGraphStore } from "@/stores/graphStore";
import type { Tx } from "@/lib/api/types";
import { formatBtc, formatBtcCompact } from "@/lib/bitcoin/units";
import { formatFeeRate, formatUnixTime, shortAddr } from "@/lib/format";

export function TransactionPanel({ txid }: { txid: string }) {
  return <TransactionPanelInner key={txid} txid={txid} />;
}

function TransactionPanelInner({ txid }: { txid: string }) {
  const cached = useGraphStore((s) => s.txCache.get(txid));
  const loadTransaction = useGraphStore((s) => s.loadTransaction);
  const followAddress = useGraphStore((s) => s.followAddress);
  const clearSelection = useGraphStore((s) => s.clearSelection);
  const loading = useGraphStore((s) => s.loading);

  // Prefer live cache; fetch only when missing.
  const [fetched, setFetched] = useState<Tx | null>(null);
  const tx = cached ?? fetched;

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    void loadTransaction(txid).then((t) => {
      if (!cancelled && t) setFetched(t);
    });
    return () => {
      cancelled = true;
    };
  }, [txid, cached, loadTransaction]);

  if (!tx) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-panel-border px-4 py-3">
          <div className="text-sm text-muted">Loading transaction…</div>
          <button type="button" onClick={() => clearSelection()}>
            <X className="size-4 text-muted" />
          </button>
        </header>
        <div className="p-4 text-sm text-muted">
          {loading ? "Fetching from mempool.space…" : "Waiting for data…"}
        </div>
      </div>
    );
  }

  const totalIn = tx.vin.reduce((s, v) => s + (v.prevout?.value ?? 0), 0);
  const totalOut = tx.vout.reduce((s, v) => s + v.value, 0);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-2 border-b border-panel-border px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Transaction
          </div>
          <div className="mono mt-1 break-all text-xs">{tx.txid}</div>
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
            label="Status"
            value={
              tx.status.confirmed
                ? `Block ${tx.status.block_height ?? "—"}`
                : "Mempool"
            }
          />
          <Stat label="Time" value={formatUnixTime(tx.status.block_time)} />
          <Stat label="Fee" value={formatBtc(BigInt(tx.fee))} />
          <Stat label="Fee rate" value={formatFeeRate(tx.fee, tx.weight)} />
          <Stat label="Size" value={`${tx.size} B`} />
          <Stat label="Weight" value={`${tx.weight} WU`} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(tx.txid)}
            className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs hover:border-accent/40"
          >
            <Copy className="size-3.5" />
            Copy txid
          </button>
          <a
            href={`https://mempool.space/tx/${tx.txid}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-panel-border px-2 py-1.5 text-xs hover:border-accent/40"
          >
            <ExternalLink className="size-3.5" />
            mempool.space
          </a>
        </div>

        <section>
          <h3 className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            <ArrowDownLeft className="size-3.5" />
            Inputs ({tx.vin.length}) · {formatBtcCompact(totalIn)}
          </h3>
          <ul className="space-y-1">
            {tx.vin.map((vin, i) => {
              const addr = vin.prevout?.scriptpubkey_address;
              const value = vin.prevout?.value ?? 0;
              return (
                <li
                  key={`${vin.txid}:${vin.vout}:${i}`}
                  className="rounded-md border border-panel-border/60 bg-black/20 px-2 py-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {vin.is_coinbase ? (
                        <span className="text-muted">Coinbase</span>
                      ) : addr ? (
                        <button
                          type="button"
                          className="mono text-left text-link hover:underline"
                          onClick={() => void followAddress(addr)}
                          title="Follow this input address"
                        >
                          {shortAddr(addr)}
                        </button>
                      ) : (
                        <span className="text-muted">Unknown</span>
                      )}
                      <div className="mono mt-0.5 text-[10px] text-muted">
                        {vin.txid.slice(0, 12)}…:{vin.vout}
                      </div>
                    </div>
                    <span className="shrink-0 tabular-nums">
                      {formatBtcCompact(value)}
                    </span>
                  </div>
                  {addr && (
                    <button
                      type="button"
                      onClick={() => void followAddress(addr)}
                      className="mt-1 text-[10px] text-accent hover:underline"
                    >
                      Follow input →
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3 className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            <ArrowUpRight className="size-3.5" />
            Outputs ({tx.vout.length}) · {formatBtcCompact(totalOut)}
          </h3>
          <ul className="space-y-1">
            {tx.vout.map((vout, i) => {
              const addr = vout.scriptpubkey_address;
              return (
                <li
                  key={i}
                  className="rounded-md border border-panel-border/60 bg-black/20 px-2 py-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {addr ? (
                        <button
                          type="button"
                          className="mono text-left text-link hover:underline"
                          onClick={() => void followAddress(addr)}
                        >
                          {shortAddr(addr)}
                        </button>
                      ) : (
                        <span className="text-muted">
                          {vout.scriptpubkey_type || "OP_RETURN / nonstd"}
                        </span>
                      )}
                      <div className="mt-0.5 text-[10px] text-muted">
                        vout {i} · {vout.scriptpubkey_type}
                      </div>
                    </div>
                    <span className="shrink-0 tabular-nums">
                      {formatBtcCompact(vout.value)}
                    </span>
                  </div>
                  {addr && (
                    <button
                      type="button"
                      onClick={() => void followAddress(addr)}
                      className="mt-1 text-[10px] text-accent hover:underline"
                    >
                      Follow output →
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
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
