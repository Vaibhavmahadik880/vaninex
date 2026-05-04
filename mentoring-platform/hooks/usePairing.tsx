"use client";

import { usePairingStore } from "@/store/pairingStore";

export interface PairingResult {
  success: boolean;
  message: string;
  error?: string;
}

export function usePairing() {
  const assignMentorToMentee = usePairingStore(
    (state) => state.assignMentorToMentee,
  );
  const removePairing = usePairingStore((state) => state.removePairing);
  const reassignMentee = usePairingStore((state) => state.reassignMentee);
  const loading = usePairingStore((state) => state.loading);
  const error = usePairingStore((state) => state.error);
  const successMessage = usePairingStore((state) => state.successMessage);
  const clearMessages = usePairingStore((state) => state.clearMessages);

  return {
    assignMentorToMentee,
    removePairing,
    reassignMentee,
    loading,
    error,
    successMessage,
    clearMessages,
  };
}
