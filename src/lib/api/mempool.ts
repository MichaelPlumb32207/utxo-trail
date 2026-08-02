/**
 * Thin typed client for the mempool.space REST API.
 * Adapted from satchel-wallet/src/lib/api/mempool.ts — same concurrency
 * pacing and 429/5xx backoff so we do not hammer the public API when
 * expanding high-fan-in consolidator addresses.
 */

import type { AddressInfo, Tx, Utxo } from "./types";

const MAX_CONCURRENT = 2;
const MAX_RETRIES = 4;
const MIN_SPACING_MS = 250;
const ATTEMPT_TIMEOUT_MS = 15_000;

/** Default mainnet Esplora-compatible base. Swap for self-hosted later. */
export const DEFAULT_API_BASE = "https://mempool.space/api";

export function getApiBase(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MEMPOOL_API) {
    return process.env.NEXT_PUBLIC_MEMPOOL_API.replace(/\/$/, "");
  }
  return DEFAULT_API_BASE;
}

let active = 0;
let lastStart = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  while (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  active++;
  const wait = lastStart + MIN_SPACING_MS - Date.now();
  lastStart = Math.max(Date.now(), lastStart + MIN_SPACING_MS);
  if (wait > 0) await sleep(wait);
}

function releaseSlot(): void {
  active--;
  waiters.shift()?.();
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string, init?: RequestInit): Promise<Response> {
  await acquireSlot();
  try {
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        const timeout = AbortSignal.timeout(ATTEMPT_TIMEOUT_MS);
        const signal = init?.signal
          ? AbortSignal.any([init.signal, timeout])
          : timeout;
        response = await fetch(url, { ...init, signal });
      } catch (err) {
        if (init?.signal?.aborted) throw err;
        if (attempt >= MAX_RETRIES) {
          throw new ApiError(
            `${init?.method ?? "GET"} ${url} failed: network error`,
            0,
          );
        }
        await sleep(2000 * 2 ** attempt + Math.random() * 1000);
        continue;
      }
      if (response.ok) return response;

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= MAX_RETRIES) {
        throw new ApiError(
          `${init?.method ?? "GET"} ${url} failed: ${response.status} ${await response
            .text()
            .catch(() => "")}`.trim(),
          response.status,
        );
      }
      await sleep(2000 * 2 ** attempt + Math.random() * 1000);
    }
  } finally {
    releaseSlot();
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await request(url, { signal });
  return (await response.json()) as T;
}

export function getAddressInfo(
  address: string,
  signal?: AbortSignal,
  base = getApiBase(),
): Promise<AddressInfo> {
  return getJson(`${base}/address/${address}`, signal);
}

export function getAddressUtxos(
  address: string,
  signal?: AbortSignal,
  base = getApiBase(),
): Promise<Utxo[]> {
  return getJson(`${base}/address/${address}/utxo`, signal);
}

/**
 * Address txs (mempool + first confirmed page), newest first.
 * Up to ~50 mempool + 25 confirmed. For deeper history use chain paging.
 */
export function getAddressTxs(
  address: string,
  signal?: AbortSignal,
  base = getApiBase(),
): Promise<Tx[]> {
  return getJson(`${base}/address/${address}/txs`, signal);
}

/** Confirmed txs, newest first, 25 per page; pass last txid for next page. */
export function getAddressTxsChain(
  address: string,
  afterTxid?: string,
  signal?: AbortSignal,
  base = getApiBase(),
): Promise<Tx[]> {
  const suffix = afterTxid ? `/${afterTxid}` : "";
  return getJson(`${base}/address/${address}/txs/chain${suffix}`, signal);
}

export function getTx(
  txid: string,
  signal?: AbortSignal,
  base = getApiBase(),
): Promise<Tx> {
  return getJson(`${base}/tx/${txid}`, signal);
}

/** Best-effort address validation shape for bech32/base58 mainnet-ish strings. */
export function looksLikeAddress(value: string): boolean {
  const v = value.trim();
  if (/^(bc1|tb1|bcrt1)[a-z0-9]{14,}$/i.test(v)) return true;
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(v)) return true;
  return false;
}

export function looksLikeTxid(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value.trim());
}
