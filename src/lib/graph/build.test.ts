import { describe, expect, it } from "vitest";
import type { AddressInfo, Tx } from "@/lib/api/types";
import { buildAddressFlow, flowsFromTxs, mergeNode } from "./build";
import { DEFAULT_EXPAND, emptyNode } from "./model";

const focus = "bc1qfocus0000000000000000000000000000000";
const victim = "bc1qvictim000000000000000000000000000000";
const next = "bc1qnext00000000000000000000000000000000";

function mockTx(partial: {
  txid: string;
  from: string;
  to: string;
  value: number;
  fee?: number;
}): Tx {
  return {
    txid: partial.txid,
    version: 2,
    locktime: 0,
    size: 200,
    weight: 800,
    fee: partial.fee ?? 500,
    status: { confirmed: true, block_time: 1_700_000_000, block_height: 800_000 },
    vin: [
      {
        txid: "prev",
        vout: 0,
        is_coinbase: false,
        sequence: 0xffffffff,
        prevout: {
          scriptpubkey: "",
          scriptpubkey_type: "v0_p2wpkh",
          scriptpubkey_address: partial.from,
          value: partial.value + (partial.fee ?? 500),
        },
      },
    ],
    vout: [
      {
        scriptpubkey: "",
        scriptpubkey_type: "v0_p2wpkh",
        scriptpubkey_address: partial.to,
        value: partial.value,
      },
    ],
  };
}

const info: AddressInfo = {
  address: focus,
  chain_stats: {
    funded_txo_count: 1,
    funded_txo_sum: 5_000_000,
    spent_txo_count: 1,
    spent_txo_sum: 4_000_000,
    tx_count: 2,
  },
  mempool_stats: {
    funded_txo_count: 0,
    funded_txo_sum: 0,
    spent_txo_count: 0,
    spent_txo_sum: 0,
    tx_count: 0,
  },
};

describe("flowsFromTxs", () => {
  it("draws backward edges when focus receives", () => {
    const txs = [
      mockTx({ txid: "aa".repeat(32), from: victim, to: focus, value: 2_000_000 }),
    ];
    const { links, neighborValue } = flowsFromTxs(focus, txs, {
      minAmountSats: 1_000_000,
      direction: "backward",
    });
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe(victim);
    expect(links[0].target).toBe(focus);
    expect(neighborValue.get(victim)).toBeGreaterThan(0);
  });

  it("draws forward edges when focus spends", () => {
    const txs = [
      mockTx({ txid: "bb".repeat(32), from: focus, to: next, value: 3_000_000 }),
    ];
    const { links } = flowsFromTxs(focus, txs, {
      minAmountSats: 1_000_000,
      direction: "forward",
    });
    expect(links).toHaveLength(1);
    expect(links[0].source).toBe(focus);
    expect(links[0].target).toBe(next);
  });

  it("filters dust below minAmountSats", () => {
    const txs = [
      mockTx({ txid: "cc".repeat(32), from: victim, to: focus, value: 546 }),
    ];
    const { links } = flowsFromTxs(focus, txs, {
      minAmountSats: 1_000_000,
      direction: "both",
    });
    expect(links).toHaveLength(0);
  });
});

describe("buildAddressFlow", () => {
  it("caps neighbors by value ranking", () => {
    const txs: Tx[] = [];
    for (let i = 0; i < 10; i++) {
      const addr = `bc1qvic${i.toString().padStart(35, "0")}`;
      txs.push(
        mockTx({
          txid: i.toString(16).padStart(64, "0"),
          from: addr,
          to: focus,
          value: (i + 1) * 1_000_000,
        }),
      );
    }
    const result = buildAddressFlow(info, txs, {
      ...DEFAULT_EXPAND,
      maxNewNodes: 3,
      direction: "backward",
    });
    expect(result.neighbors).toHaveLength(3);
    // Highest value neighbors win
    expect(result.rankedNeighborIds[0]).toContain("9");
  });

  it("marks focus expanded with balance", () => {
    const result = buildAddressFlow(info, [], DEFAULT_EXPAND, {
      role: "attacker",
      hop: 0,
    });
    expect(result.node.expanded).toBe(true);
    expect(result.node.balanceSats).toBe(1_000_000);
    expect(result.node.role).toBe("attacker");
  });
});

describe("mergeNode", () => {
  it("preserves seed/attacker role and min hop", () => {
    const a = emptyNode(focus, { role: "seed", hop: 0, fundedSats: 100 });
    const b = emptyNode(focus, { role: "external", hop: 2, fundedSats: 500, expanded: true });
    const m = mergeNode(a, b);
    expect(m.role).toBe("seed");
    expect(m.hop).toBe(0);
    expect(m.fundedSats).toBe(500);
    expect(m.expanded).toBe(true);
  });
});
