"use client";

import { useCallback, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CallSchedule {
  id: string;
  mentorId: string;
  menteeId: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: "scheduled" | "ongoing" | "completed" | "missed" | "cancelled";
  createdAt: Date;
  notes?: string;
}

export function useScheduling() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<CallSchedule[]>([]);

  // Fetch schedules for a user (mentor or mentee)
  const fetchSchedules = useCallback(
    async (userId: string, role: "mentor" | "mentee") => {
      setLoading(true);
      setError(null);

      try {
        const field = role === "mentor" ? "mentorId" : "menteeId";
        const q = query(
          collection(db, "schedules"),
          where(field, "==", userId),
          where("status", "!=", "cancelled"),
        );

        const snapshot = await getDocs(q);
        const scheduleList: CallSchedule[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            mentorId: data.mentorId,
            menteeId: data.menteeId,
            scheduledAt: data.scheduledAt || new Date(),
            duration: data.duration || 30,
            status: data.status || "scheduled",
            createdAt: data.createdAt || new Date(),
            notes: data.notes,
          };
        });

        // Sort by date
        scheduleList.sort(
          (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
        );

        setSchedules(scheduleList);
        setLoading(false);
        return scheduleList;
      } catch (err: unknown) {
        const errorMessage =
          (err instanceof Error ? err.message : String(err)) ||
          "Failed to fetch schedules";
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  // Create a new schedule
  const createSchedule = useCallback(
    async (
      mentorId: string,
      menteeId: string,
      scheduledAt: Date,
      duration: number,
      notes?: string,
    ) => {
      setLoading(true);
      setError(null);

      try {
        // 🚨 RULE 1: No past time
        if (scheduledAt < new Date()) {
          throw new Error("Cannot schedule in the past");
        }

        // 🚨 RULE 2: Check for overlapping schedules
        const q = query(
          collection(db, "schedules"),
          where("mentorId", "==", mentorId),
          where("status", "in", ["scheduled", "ongoing"]),
        );

        const snapshot = await getDocs(q);
        const scheduleStart = scheduledAt.getTime();
        const scheduleEnd = scheduleStart + duration * 60 * 1000;

        for (const doc of snapshot.docs) {
          const data = doc.data() as Record<string, unknown>;
          const existingStart = data.scheduledAt?.toDate()?.getTime() || 0;
          const existingEnd = existingStart + data.duration * 60 * 1000;

          // Check for overlap
          if (
            (scheduleStart >= existingStart && scheduleStart < existingEnd) ||
            (scheduleEnd > existingStart && scheduleEnd <= existingEnd) ||
            (scheduleStart <= existingStart && scheduleEnd >= existingEnd)
          ) {
            throw new Error(
              "Time slot overlaps with existing schedule for this mentor",
            );
          }
        }

        // Create schedule
        const scheduleRef = await addDoc(collection(db, "schedules"), {
          mentorId,
          menteeId,
          scheduledAt: Timestamp.fromDate(scheduledAt),
          duration,
          status: "scheduled",
          createdAt: Timestamp.now(),
          notes: notes || "",
        });

        setLoading(false);
        return {
          success: true,
          id: scheduleRef.id,
          message: "Schedule created successfully",
        };
      } catch (err: unknown) {
        const errorMessage =
          (err instanceof Error ? err.message : String(err)) ||
          "Failed to create schedule";
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: "Schedule creation failed",
          error: errorMessage,
        };
      }
    },
    [],
  );

  // Update schedule status
  const updateScheduleStatus = useCallback(
    async (
      scheduleId: string,
      status: "scheduled" | "ongoing" | "completed" | "missed" | "cancelled",
    ) => {
      setLoading(true);
      setError(null);

      try {
        const scheduleRef = doc(db, "schedules", scheduleId);
        await updateDoc(scheduleRef, { status });

        setLoading(false);
        return { success: true, message: "Schedule updated" };
      } catch (err: unknown) {
        const errorMessage =
          (err instanceof Error ? err.message : String(err)) ||
          "Failed to update schedule";
        setError(errorMessage);
        setLoading(false);
        return {
          success: false,
          message: "Update failed",
          error: errorMessage,
        };
      }
    },
    [],
  );

  // Cancel a schedule
  const cancelSchedule = useCallback(async (scheduleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const scheduleRef = doc(db, "schedules", scheduleId);
      await deleteDoc(scheduleRef);

      setLoading(false);
      return { success: true, message: "Schedule cancelled" };
    } catch (err: unknown) {
      const errorMessage =
        (err instanceof Error ? err.message : String(err)) ||
        "Failed to cancel schedule";
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        message: "Cancellation failed",
        error: errorMessage,
      };
    }
  }, []);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateScheduleStatus,
    cancelSchedule,
  };
}
