"use client";

import { useEffect } from "react";
import { GitBranch, Info } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Toolbar } from "./Toolbar";
import { Legend } from "./Legend";
import { GraphCanvas } from "./GraphCanvas";
import { AddressPanel } from "./AddressPanel";
import { TransactionPanel } from "./TransactionPanel";
import { useGraphStore } from "@/stores/graphStore";

export function AppShell() {
  const selection = useGraphStore((s) => s.selection);
  const clearSelection = useGraphStore((s) => s.clearSelection);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") clearSelection();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelection]);

  return (
    <div className="flex h-full flex-col">
      <header className="z-20 flex items-center justify-between gap-4 border-b border-panel-border bg-panel/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent-dim text-accent">
            <GitBranch className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">
              UTXO Trail
            </div>
            <div className="text-[11px] text-muted">
              Bitcoin flow explorer · public chain data
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 text-[11px] text-muted sm:flex">
          <Info className="size-3.5" />
          Drag to place · double-click to free · click edge = tx · Esc closes
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Left rail */}
        <aside className="panel-scroll z-10 flex w-[300px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-panel-border bg-panel/95 p-4 backdrop-blur-md">
          <SearchBar />
          <div className="h-px bg-panel-border" />
          <Toolbar />
        </aside>

        {/* Graph */}
        <main className="graph-bg relative min-w-0 flex-1">
          <GraphCanvas />
          <Legend />
        </main>

        {/* Right detail drawer */}
        {selection && (
          <aside className="z-10 w-[360px] shrink-0 border-l border-panel-border bg-panel/95 backdrop-blur-md">
            {selection.kind === "address" ? (
              <AddressPanel address={selection.id} />
            ) : (
              <TransactionPanel txid={selection.id} />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
