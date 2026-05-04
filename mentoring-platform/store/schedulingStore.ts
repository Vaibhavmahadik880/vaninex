import { create } from "zustand";
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
  duration: number;
  status: "scheduled" | "ongoing" | "completed" | "missed" | "cancelled";
  createdAt: Date;
  notes?: string;
}

interface SchedulingStore {
  schedules: CallSchedule[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchSchedules: (userId: string, role: "mentor" | "mentee") => Promise<void>;
  createSchedule: (
    mentorId: string,
    menteeId: string,
    scheduledAt: Date,
    duration: number,
    notes?: string,
  ) => Promise<{
    success: boolean;
    id?: string;
    message: string;
    error?: string;
  }>;
  updateScheduleStatus: (
    scheduleId: string,
    status: "scheduled" | "ongoing" | "completed" | "missed" | "cancelled",
  ) => Promise<{ success: boolean; message: string; error?: string }>;
  cancelSchedule: (
    scheduleId: string,
  ) => Promise<{ success: boolean; message: string; error?: string }>;
  clearMessages: () => void;
}

export const useSchedulingStore = create<SchedulingStore>((set) => ({
  schedules: [],
  loading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchSchedules: async (userId: string, role: "mentor" | "mentee") => {
    set({ loading: true, error: null });
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
          mentorId: data.mentorId as string,
          menteeId: data.menteeId as string,
          scheduledAt: (data.scheduledAt as any)?.toDate() || new Date(),
          duration: (data.duration as number) || 30,
          status: (data.status as CallSchedule["status"]) || "scheduled",
          createdAt: (data.createdAt as any)?.toDate() || new Date(),
          notes: data.notes as string,
        };
      });

      scheduleList.sort(
        (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
      );

      set({ schedules: scheduleList });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage });
      console.error("Error fetching schedules:", err);
    } finally {
      set({ loading: false });
    }
  },

  createSchedule: async (
    mentorId: string,
    menteeId: string,
    scheduledAt: Date,
    duration: number,
    notes?: string,
  ) => {
    set({ loading: true, error: null });

    try {
      if (scheduledAt < new Date()) {
        throw new Error("Cannot schedule in the past");
      }

      const q = query(
        collection(db, "schedules"),
        where("mentorId", "==", mentorId),
        where("status", "in", ["scheduled", "ongoing"]),
      );

      const snapshot = await getDocs(q);
      const scheduleStart = scheduledAt.getTime();
      const scheduleEnd = scheduleStart + duration * 60 * 1000;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Record<string, unknown>;
        const existingStart =
          (data.scheduledAt as any)?.toDate()?.getTime() || 0;
        const existingEnd =
          existingStart + (data.duration as number) * 60 * 1000;

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

      const scheduleRef = await addDoc(collection(db, "schedules"), {
        mentorId,
        menteeId,
        scheduledAt: Timestamp.fromDate(scheduledAt),
        duration,
        status: "scheduled",
        createdAt: Timestamp.now(),
        notes: notes || "",
      });

      set({ loading: false, successMessage: "Schedule created successfully" });
      return {
        success: true,
        id: scheduleRef.id,
        message: "Schedule created successfully",
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: "Schedule creation failed",
        error: errorMessage,
      };
    }
  },

  updateScheduleStatus: async (
    scheduleId: string,
    status: "scheduled" | "ongoing" | "completed" | "missed" | "cancelled",
  ) => {
    set({ loading: true, error: null });

    try {
      const scheduleRef = doc(db, "schedules", scheduleId);
      await updateDoc(scheduleRef, { status });

      set({ loading: false, successMessage: "Schedule updated" });
      return { success: true, message: "Schedule updated" };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: "Update failed",
        error: errorMessage,
      };
    }
  },

  cancelSchedule: async (scheduleId: string) => {
    set({ loading: true, error: null });

    try {
      const scheduleRef = doc(db, "schedules", scheduleId);
      await deleteDoc(scheduleRef);

      set({ loading: false, successMessage: "Schedule cancelled" });
      return { success: true, message: "Schedule cancelled" };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: "Cancellation failed",
        error: errorMessage,
      };
    }
  },
}));
