import { createStore } from "zustand/vanilla";
import type { MonumentDraft } from "@/lib/config/monument-schema";

export type WizardState = {
  orderId: string;
  step: number;
  draft: MonumentDraft;
  setStep: (step: number) => void;
  patchDraft: (patch: Partial<MonumentDraft>) => void;
  replaceDraft: (draft: MonumentDraft) => void;
};

export function createWizardStore(orderId: string, initial: MonumentDraft) {
  return createStore<WizardState>((set) => ({
    orderId,
    step: 1,
    draft: { ...initial, schemaVersion: 1 },
    setStep: (step) => set({ step }),
    patchDraft: (patch) =>
      set((s) => ({
        draft: { ...s.draft, ...patch, schemaVersion: 1 as const },
      })),
    replaceDraft: (draft) =>
      set({ draft: { ...draft, schemaVersion: 1 as const } }),
  }));
}

export type WizardStore = ReturnType<typeof createWizardStore>;
