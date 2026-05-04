"use client";

import { useSchedulingStore } from "@/store/schedulingStore";

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

export function useScheduling() {
  const schedules = useSchedulingStore((state) => state.schedules);
  const loading = useSchedulingStore((state) => state.loading);
  const error = useSchedulingStore((state) => state.error);
  const successMessage = useSchedulingStore((state) => state.successMessage);
  const fetchSchedules = useSchedulingStore((state) => state.fetchSchedules);
  const createSchedule = useSchedulingStore((state) => state.createSchedule);
  const updateScheduleStatus = useSchedulingStore(
    (state) => state.updateScheduleStatus,
  );
  const cancelSchedule = useSchedulingStore((state) => state.cancelSchedule);
  const clearSchedules = useSchedulingStore((state) => state.clearSchedules);
  const clearMessages = useSchedulingStore((state) => state.clearMessages);

  return {
    schedules,
    loading,
    error,
    successMessage,
    fetchSchedules,
    createSchedule,
    updateScheduleStatus,
    cancelSchedule,
    clearSchedules,
    clearMessages,
  };
}
