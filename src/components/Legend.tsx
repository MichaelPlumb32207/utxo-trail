"use client";

const ITEMS: Array<{ color: string; label: string }> = [
  { color: "var(--node-attacker)", label: "Attacker / flagged" },
  { color: "var(--node-seed)", label: "Seed / pinned start" },
  { color: "var(--node-victim)", label: "Inbound source" },
  { color: "var(--node-external)", label: "External" },
  { color: "var(--node-pinned)", label: "Pinned" },
];

export function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-panel-border bg-panel/90 px-3 py-2 text-[11px] text-muted backdrop-blur-sm">
      <div className="mb-1.5 font-medium text-foreground/80">Legend</div>
      <ul className="space-y-1">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full ring-1 ring-white/20"
              style={{ background: item.color }}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
