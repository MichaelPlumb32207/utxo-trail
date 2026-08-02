"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LabelsState {
  labels: Record<string, string>;
  setLabel: (address: string, label: string) => void;
  removeLabel: (address: string) => void;
  getLabel: (address: string) => string | undefined;
}

export const useLabelsStore = create<LabelsState>()(
  persist(
    (set, get) => ({
      labels: {},
      setLabel: (address, label) =>
        set((s) => {
          const labels = { ...s.labels };
          const trimmed = label.trim();
          if (!trimmed) delete labels[address];
          else labels[address] = trimmed;
          return { labels };
        }),
      removeLabel: (address) =>
        set((s) => {
          const labels = { ...s.labels };
          delete labels[address];
          return { labels };
        }),
      getLabel: (address) => get().labels[address],
    }),
    { name: "utxo-trail-labels" },
  ),
);
