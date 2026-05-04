import { create } from "zustand";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PairingResult {
  success: boolean;
  message: string;
  error?: string;
}

interface PairingStore {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  assignMentorToMentee: (
    mentorId: string,
    menteeId: string,
  ) => Promise<PairingResult>;
  removePairing: (mentorId: string, menteeId: string) => Promise<PairingResult>;
  reassignMentee: (
    oldMentorId: string,
    newMentorId: string,
    menteeId: string,
  ) => Promise<PairingResult>;
  clearMessages: () => void;
}

export const usePairingStore = create<PairingStore>((set) => ({
  loading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  assignMentorToMentee: async (mentorId: string, menteeId: string) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const result = await runTransaction(db, async (transaction) => {
        const mentorRef = doc(db, "users", mentorId);
        const mentorDoc = await transaction.get(mentorRef);

        if (!mentorDoc.exists()) {
          throw new Error("Mentor not found");
        }

        const menteeRef = doc(db, "users", menteeId);
        const menteeDoc = await transaction.get(menteeRef);

        if (!menteeDoc.exists()) {
          throw new Error("Mentee not found");
        }

        const mentorData = mentorDoc.data();
        if (mentorData.menteeIds && mentorData.menteeIds.length > 0) {
          throw new Error(
            `Mentor already has a mentee assigned: ${mentorData.menteeIds[0]}`,
          );
        }

        const menteeData = menteeDoc.data();
        if (menteeData.mentorId) {
          throw new Error(
            `Mentee already has a mentor assigned: ${menteeData.mentorId}`,
          );
        }

        if (mentorId === menteeId) {
          throw new Error("Cannot assign mentor to themselves");
        }

        transaction.update(mentorRef, {
          menteeIds: [menteeId],
          lastUpdated: new Date(),
        });

        transaction.update(menteeRef, {
          mentorId: mentorId,
          lastUpdated: new Date(),
        });

        return {
          success: true,
          message: `Mentor ${mentorId} paired with Mentee ${menteeId}`,
        };
      });

      set({ loading: false, successMessage: result.message });
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: "Pairing failed",
        error: errorMessage,
      };
    }
  },

  removePairing: async (mentorId: string, menteeId: string) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const result = await runTransaction(db, async (transaction) => {
        const mentorRef = doc(db, "users", mentorId);
        const menteeRef = doc(db, "users", menteeId);

        transaction.update(mentorRef, {
          menteeIds: [],
          lastUpdated: new Date(),
        });

        transaction.update(menteeRef, {
          mentorId: null,
          lastUpdated: new Date(),
        });

        return {
          success: true,
          message: `Pairing removed between ${mentorId} and ${menteeId}`,
        };
      });

      set({ loading: false, successMessage: result.message });
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: "Remove pairing failed",
        error: errorMessage,
      };
    }
  },

  reassignMentee: async (
    oldMentorId: string,
    newMentorId: string,
    menteeId: string,
  ) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const result = await runTransaction(db, async (transaction) => {
        const oldMentorRef = doc(db, "users", oldMentorId);
        const newMentorRef = doc(db, "users", newMentorId);
        const menteeRef = doc(db, "users", menteeId);

        transaction.update(oldMentorRef, {
          menteeIds: [],
          lastUpdated: new Date(),
        });

        transaction.update(newMentorRef, {
          menteeIds: [menteeId],
          lastUpdated: new Date(),
        });

        transaction.update(menteeRef, {
          mentorId: newMentorId,
          lastUpdated: new Date(),
        });

        return {
          success: true,
          message: `Mentee reassigned from ${oldMentorId} to ${newMentorId}`,
        };
      });

      set({ loading: false, successMessage: result.message });
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: "Reassignment failed",
        error: errorMessage,
      };
    }
  },
}));
