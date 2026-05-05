"use client";

import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useScheduling } from "@/hooks/useScheduling";
import { UserProfile } from "@/hooks/useFetchUsers";
import { readDate } from "@/lib/firestoreData";
import { motion } from "framer-motion";
import WebRTCCall from "./WebRTCCall";

interface CallSchedulingProps {
  currentUserId: string;
  currentUserRole: "mentor" | "mentee" | "admin";
  pairedUser?: UserProfile | null;
}

type ScheduleFormValues = {
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  notes: string;
};

function isScheduleReaderRole(
  role: "mentor" | "mentee" | "admin",
): role is "mentor" | "mentee" {
  return role === "mentor" || role === "mentee";
}

export default function CallScheduling({
  currentUserId,
  currentUserRole,
  pairedUser,
}: CallSchedulingProps) {
  const {
    schedules,
    loading: schedulesLoading,
    fetchSchedules,
    createSchedule,
    cancelSchedule,
    updateScheduleStatus,
    clearSchedules,
  } = useScheduling();
  const { register, handleSubmit, reset } = useForm<ScheduleFormValues>({
    defaultValues: {
      scheduledDate: "",
      scheduledTime: "",
      duration: 30,
      notes: "",
    },
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [joinableSchedules, setJoinableSchedules] = useState<Set<string>>(
    new Set(),
  );
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  useEffect(() => {
    if (pairedUser && isScheduleReaderRole(currentUserRole)) {
      fetchSchedules(currentUserId, currentUserRole);
    } else {
      clearSchedules();
    }
  }, [
    currentUserId,
    currentUserRole,
    pairedUser,
    fetchSchedules,
    clearSchedules,
  ]);

  // Countdown and status management effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newCountdowns: Record<string, string> = {};
      const newJoinable = new Set<string>();

      schedules.forEach((schedule) => {
        const scheduledTime = readDate(schedule.scheduledAt);
        const timeDiff = scheduledTime.getTime() - now.getTime();

        if (schedule.status === "scheduled") {
          if (timeDiff <= 0) {
            // Call time has arrived - enable join button
            newJoinable.add(schedule.id);
            newCountdowns[schedule.id] = "Ready to join!";
          } else if (timeDiff <= 5 * 60 * 1000) {
            // Within 5 minutes
            // Show countdown
            const minutes = Math.floor(timeDiff / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            newCountdowns[schedule.id] =
              `${minutes}:${seconds.toString().padStart(2, "0")}`;
          } else {
            // Show time until call
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor(
              (timeDiff % (1000 * 60 * 60)) / (1000 * 60),
            );
            if (hours > 0) {
              newCountdowns[schedule.id] = `${hours}h ${minutes}m`;
            } else {
              newCountdowns[schedule.id] = `${minutes}m`;
            }
          }

          // Check if call was missed (15 minutes past scheduled time)
          if (timeDiff <= -15 * 60 * 1000) {
            updateScheduleStatus(schedule.id, "missed");
          }
        } else if (schedule.status === "ongoing") {
          const endTime =
            scheduledTime.getTime() + schedule.duration * 60 * 1000;
          const timeUntilEnd = endTime - now.getTime();

          if (timeUntilEnd <= 0) {
            // Call should be completed
            updateScheduleStatus(schedule.id, "completed");
          } else {
            const minutes = Math.floor(timeUntilEnd / (1000 * 60));
            const seconds = Math.floor((timeUntilEnd % (1000 * 60)) / 1000);
            newCountdowns[schedule.id] =
              `Ongoing - ${minutes}:${seconds.toString().padStart(2, "0")} left`;
          }
        }
      });

      setCountdowns(newCountdowns);
      setJoinableSchedules(newJoinable);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [schedules, updateScheduleStatus]);

  const refreshSchedules = async () => {
    if (isScheduleReaderRole(currentUserRole)) {
      await fetchSchedules(currentUserId, currentUserRole);
    }
  };

  const handleScheduleCall: SubmitHandler<ScheduleFormValues> = async (
    formData,
  ) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!pairedUser) {
      setErrorMessage("No paired user found. Cannot schedule.");
      return;
    }

    if (!formData.scheduledDate || !formData.scheduledTime) {
      setErrorMessage("Please select date and time");
      return;
    }

    try {
      const scheduledAt = new Date(
        `${formData.scheduledDate}T${formData.scheduledTime}`,
      );

      const mentorId =
        currentUserRole === "mentor" ? currentUserId : pairedUser.id;
      const menteeId =
        currentUserRole === "mentee" ? currentUserId : pairedUser.id;

      const result = await createSchedule(
        mentorId,
        menteeId,
        scheduledAt,
        formData.duration,
        formData.notes,
      );

      if (result.success) {
        setSuccessMessage("Call scheduled successfully!");
        reset({
          scheduledDate: "",
          scheduledTime: "",
          duration: 30,
          notes: "",
        });
        await refreshSchedules();
      } else {
        setErrorMessage(result.error || "Failed to schedule call");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to schedule call";
      setErrorMessage(message);
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (confirm("Are you sure you want to cancel this schedule?")) {
      const result = await cancelSchedule(scheduleId);
      if (result.success) {
        setSuccessMessage("Schedule cancelled");
        await refreshSchedules();
      } else {
        setErrorMessage(result.error || "Failed to cancel schedule");
      }
    }
  };

  const handleJoinCall = async (scheduleId: string) => {
    setActiveCallId(scheduleId);
  };

  const handleCallStart = () => {
    // Call has started via WebRTC
    console.log("WebRTC call started for schedule:", activeCallId);
  };

  const handleCallEnd = async () => {
    if (activeCallId) {
      const result = await updateScheduleStatus(activeCallId, "completed");
      if (result.success) {
        setSuccessMessage("Call completed!");
        await refreshSchedules();
      } else {
        setErrorMessage(result.error || "Failed to update call status");
      }
    }
    setActiveCallId(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "missed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isMentorCanSchedule = currentUserRole === "mentor" && pairedUser;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* WebRTC Call Modal */}
      <WebRTCCall
        isCallActive={activeCallId !== null}
        onCallStart={handleCallStart}
        onCallEnd={handleCallEnd}
      />
      {successMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-800"
        >
          {successMessage}
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-800"
        >
          {errorMessage}
        </motion.div>
      )}

      {isMentorCanSchedule && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Schedule Call
          </h3>

          <form
            onSubmit={handleSubmit(handleScheduleCall)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  {...register("scheduledDate", { required: true })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  {...register("scheduledTime", { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                {...register("duration", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                {...register("notes")}
                placeholder="Add any notes for this call..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={schedulesLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              {schedulesLoading ? "Scheduling..." : "Schedule Call"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          {currentUserRole === "mentor" ? "Your" : "Scheduled"} Calls
        </h3>

        {schedulesLoading ? (
          <div className="text-center py-8">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No scheduled calls yet
          </p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => {
              const scheduledAt = readDate(schedule.scheduledAt);

              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {scheduledAt.toLocaleDateString()} at{" "}
                        {scheduledAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Duration: {schedule.duration} minutes
                      </p>
                      {schedule.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Notes: {schedule.notes}
                        </p>
                      )}
                      {countdowns[schedule.id] && (
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          {countdowns[schedule.id]}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadgeColor(
                        schedule.status,
                      )}`}
                    >
                      {schedule.status}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {joinableSchedules.has(schedule.id) &&
                      schedule.status === "scheduled" && (
                        <button
                          type="button"
                          onClick={() => handleJoinCall(schedule.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          Join Call
                        </button>
                      )}

                    {(schedule.status === "scheduled" ||
                      schedule.status === "ongoing") &&
                      currentUserRole === "mentor" && (
                        <button
                          type="button"
                          onClick={() => handleCancelSchedule(schedule.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold transition"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
