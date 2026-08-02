"use client";

import { useState } from "react";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { useGraphStore } from "@/stores/graphStore";
import { looksLikeAddress, looksLikeTxid } from "@/lib/api/mempool";

export function SearchBar() {
  const [text, setText] = useState("");
  const loading = useGraphStore((s) => s.loading);
  const addAddresses = useGraphStore((s) => s.addAddresses);
  const loadTransaction = useGraphStore((s) => s.loadTransaction);
  const loadColdcardPresets = useGraphStore((s) => s.loadColdcardPresets);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tokens = text
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!tokens.length) return;

    const addrs = tokens.filter(looksLikeAddress);
    const txids = tokens.filter(looksLikeTxid);

    if (addrs.length) {
      await addAddresses(addrs.map((address) => ({ address, role: "seed" })));
    }
    for (const txid of txids) {
      await loadTransaction(txid);
    }
    if (!addrs.length && !txids.length) {
      useGraphStore.setState({
        error: "Paste one or more mainnet addresses or 64-char txids.",
      });
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-2">
        <label className="block text-[11px] font-medium uppercase tracking-wide text-muted">
          Addresses or txids
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={"bc1q…\nbc1q…\nor paste a txid"}
          className="mono w-full resize-y rounded-lg border border-panel-border bg-black/40 px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black transition hover:bg-accent-strong"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Explore
        </button>
      </form>

      <button
        type="button"
        disabled={loading}
        onClick={() => void loadColdcardPresets()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger-dim px-3 py-2 text-sm font-medium text-danger transition hover:border-danger/70"
      >
        <ShieldAlert className="size-4" />
        Load Coldcard investigation
      </button>
      <p className="text-[11px] leading-snug text-muted">
        Loads known public consolidation addresses from the July 2026 seed-generation
        incident. Public chain data only — research / education.
      </p>
    </div>
  );
}
