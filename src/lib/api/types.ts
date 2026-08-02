/**
 * mempool.space REST API response shapes (fields UTXO Trail reads).
 * Amounts are satoshis as JSON numbers — safe in doubles for Bitcoin supply.
 * Adapted from satchel-wallet/src/lib/api/types.ts
 */

export interface AddressStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

export interface AddressInfo {
  address: string;
  chain_stats: AddressStats;
  mempool_stats: AddressStats;
}

export interface TxStatus {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

export interface Utxo {
  txid: string;
  vout: number;
  value: number;
  status: TxStatus;
}

export interface Vout {
  scriptpubkey: string;
  scriptpubkey_type: string;
  scriptpubkey_address?: string;
  value: number;
}

export interface Vin {
  txid: string;
  vout: number;
  is_coinbase: boolean;
  sequence: number;
  prevout: Vout | null;
}

export interface Tx {
  txid: string;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  size: number;
  weight: number;
  fee: number;
  status: TxStatus;
}
