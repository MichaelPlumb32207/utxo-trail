/** Presentation helpers (no money math — that lives in units.ts). */

export function timeAgo(unixSeconds: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

export function formatUnixTime(unixSeconds?: number): string {
  if (unixSeconds == null) return "unconfirmed";
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** bc1qcr8…306fyu — readable middle-truncation for addresses/txids. */
export function truncateMiddle(value: string, keep = 8): string {
  if (value.length <= keep * 2 + 1) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

export function shortAddr(address: string): string {
  return truncateMiddle(address, 6);
}

export function shortTxid(txid: string): string {
  return truncateMiddle(txid, 8);
}

/** Fee rate sats/vB from fee (sats) and weight (WU). weight/4 = vbytes. */
export function feeRateSatsPerVbyte(fee: number, weight: number): number | null {
  if (!weight || weight <= 0) return null;
  const vbytes = weight / 4;
  return fee / vbytes;
}

export function formatFeeRate(fee: number, weight: number): string {
  const rate = feeRateSatsPerVbyte(fee, weight);
  if (rate == null) return "—";
  return `${rate.toFixed(1)} sat/vB`;
}
