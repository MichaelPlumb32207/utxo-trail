/**
 * Known Coldcard seed-generation incident addresses (public chain data only).
 * Sources: community / Galaxy Research reporting on the July 2026 sweeps.
 * Verify against chain explorers before drawing investigative conclusions.
 *
 * Architecture: presets are just labeled seeds — any investigation can load
 * arbitrary address lists the same way.
 */

import type { NodeRole } from "@/lib/graph/model";

export interface PresetAddress {
  address: string;
  label: string;
  role: NodeRole;
  note?: string;
}

export const COLDCARD_PRESETS: PresetAddress[] = [
  {
    address: "bc1qnk4zh9qcnap2mycp56qjrgza3cc8ylrh8fecp0",
    label: "Coldcard · intermediate consolidation",
    role: "attacker",
    note: "Received ~594 BTC from many victim addresses in the initial sweep wave.",
  },
  {
    address: "bc1qq85v2c926eg6pgxhwp6q7lf6cnsz80qs3fcu9r",
    label: "Coldcard · holding / consolidation",
    role: "attacker",
    note: "Received ~562 BTC from intermediate consolidation; largely unspent as of early reporting.",
  },
];

export const COLDCARD_INVESTIGATION = {
  id: "coldcard-seed-2026",
  title: "Coldcard seed-generation incident",
  description:
    "Public addresses associated with the July 2026 sweeps tied to weak Coldcard seed generation. Use for research and visualization only.",
  addresses: COLDCARD_PRESETS,
};
