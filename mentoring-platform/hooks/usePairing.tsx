"use client";

import { useCallback, useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PairingResult {
  success: boolean;
  message: string;
  error?: string;
}

export function usePairing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignMentorToMentee = useCallback(
    async (mentorId: string, menteeId: string): Promise<PairingResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await runTransaction(db, async (transaction) => {
          // Get mentor document
          const mentorRef = doc(db, "users", mentorId);
          const mentorDoc = await transaction.get(mentorRef);

          if (!mentorDoc.exists()) {
            throw new Error("Mentor not found");
          }

          // Get mentee document
          const menteeRef = doc(db, "users", menteeId);
          const menteeDoc = await transaction.get(menteeRef);

          if (!menteeDoc.exists()) {
            throw new Error("Mentee not found");
          }

          // 🚨 CORE RULE 1: Check mentor already has mentee
          const mentorData = mentorDoc.data();
          if (mentorData.menteeIds && mentorData.menteeIds.length > 0) {
            throw new Error(
              `Mentor already has a mentee assigned: ${mentorData.menteeIds[0]}`,
            );
          }

          // 🚨 CORE RULE 2: Check mentee already has mentor
          const menteeData = menteeDoc.data();
          if (menteeData.mentorId) {
            throw new Error(
              `Mentee already has a mentor assigned: ${menteeData.mentorId}`,
            );
          }

          // 🚨 CORE RULE 3: No self-assignment
          if (mentorId === menteeId) {
            throw new Error("Cannot assign mentor to themselves");
          }

          // Update mentor with mentee
          transaction.update(mentorRef, {
            menteeIds: [menteeId],
            lastUpdated: new Date(),
          });

          // Update mentee with mentor
          transaction.update(menteeRef, {
            mentorId: mentorId,
            lastUpdated: new Date(),
          });

          return {
            success: true,
            message: `Mentor ${mentorId} paired with Mentee ${menteeId}`,
          };
        });

        setLoading(false);
        return result;
      } catch (err: unknown) {
        const errorMessage =
          (err instanceof Error ? err.message : String(err)) ||
          "Failed to assign pairing";
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: "Pairing failed",
          error: errorMessage,
        };
      }
    },
    [],
  );

  const removePairing = useCallback(
    async (mentorId: string, menteeId: string): Promise<PairingResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await runTransaction(db, async (transaction) => {
          const mentorRef = doc(db, "users", mentorId);
          const menteeRef = doc(db, "users", menteeId);

          // Update mentor (remove mentee)
          transaction.update(mentorRef, {
            menteeIds: [],
            lastUpdated: new Date(),
          });

          // Update mentee (remove mentor)
          transaction.update(menteeRef, {
            mentorId: null,
            lastUpdated: new Date(),
          });

          return {
            success: true,
            message: `Pairing removed between ${mentorId} and ${menteeId}`,
          };
        });

        setLoading(false);
        return result;
      } catch (err: unknown) {
        const errorMessage =
          (err instanceof Error ? err.message : String(err)) ||
          "Failed to remove pairing";
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: "Remove pairing failed",
          error: errorMessage,
        };
      }
    },
    [],
  );

  const reassignMentee = useCallback(
    async (
      oldMentorId: string,
      newMentorId: string,
      menteeId: string,
    ): Promise<PairingResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await runTransaction(db, async (transaction) => {
          const oldMentorRef = doc(db, "users", oldMentorId);
          const newMentorRef = doc(db, "users", newMentorId);
          const menteeRef = doc(db, "users", menteeId);

          // Remove from old mentor
          transaction.update(oldMentorRef, {
            menteeIds: [],
            lastUpdated: new Date(),
          });

          // Add to new mentor
          transaction.update(newMentorRef, {
            menteeIds: [menteeId],
            lastUpdated: new Date(),
          });

          // Update mentee
          transaction.update(menteeRef, {
            mentorId: newMentorId,
            lastUpdated: new Date(),
          });

          return {
            success: true,
            message: `Mentee reassigned from ${oldMentorId} to ${newMentorId}`,
          };
        });

        setLoading(false);
        return result;
      } catch (err: unknown) {
        const errorMessage =
          (err instanceof Error ? err.message : String(err)) ||
          "Failed to reassign mentee";
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: "Reassignment failed",
          error: errorMessage,
        };
      }
    },
    [],
  );

  return {
    assignMentorToMentee,
    removePairing,
    reassignMentee,
    loading,
    error,
  };
}
