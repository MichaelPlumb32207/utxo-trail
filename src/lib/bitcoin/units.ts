/**
 * Exact satoshi math — never floats.
 * Adapted from satchel-wallet/src/lib/bitcoin/units.ts
 */

export const SATS_PER_BTC = 100_000_000n;
const BTC_DECIMALS = 8;

/** Parse a BTC decimal string ("0.00012345") into satoshis. */
export function btcToSats(btc: string): bigint {
  const trimmed = btc.trim();
  const match = /^(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) throw new Error(`Invalid BTC amount: "${btc}"`);
  const [, whole, frac = ""] = match;
  if (frac.length > BTC_DECIMALS) {
    throw new Error(`Too many decimal places (max ${BTC_DECIMALS}): "${btc}"`);
  }
  return BigInt(whole) * SATS_PER_BTC + BigInt(frac.padEnd(BTC_DECIMALS, "0"));
}

/** Format satoshis as a BTC decimal string with trailing zeros trimmed. */
export function satsToBtc(sats: bigint): string {
  const negative = sats < 0n;
  const abs = negative ? -sats : sats;
  const whole = abs / SATS_PER_BTC;
  const frac = (abs % SATS_PER_BTC)
    .toString()
    .padStart(BTC_DECIMALS, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** Format satoshis with thousands separators: 1234567n -> "1,234,567". */
export function formatSats(sats: bigint): string {
  const negative = sats < 0n;
  const digits = (negative ? -sats : sats).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}`;
}

/** Display helper: "12.34567890 BTC" (up to 8 decimals, trim trailing zeros). */
export function formatBtc(sats: bigint | number): string {
  const b = typeof sats === "number" ? BigInt(Math.round(sats)) : sats;
  return `${satsToBtc(b)} BTC`;
}

/** Compact BTC for graph labels — e.g. "1.2 BTC", "45.6k sats". */
export function formatBtcCompact(sats: number | bigint): string {
  const n = typeof sats === "bigint" ? Number(sats) : sats;
  if (!Number.isFinite(n) || n === 0) return "0";
  if (Math.abs(n) >= 1e8) {
    const btc = n / 1e8;
    if (btc >= 100) return `${btc.toFixed(1)} BTC`;
    if (btc >= 1) return `${btc.toFixed(3)} BTC`;
    return `${btc.toFixed(4)} BTC`;
  }
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k sats`;
  return `${Math.round(n)} sats`;
}
