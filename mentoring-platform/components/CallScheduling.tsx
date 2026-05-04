"use client";

import { useState, useEffect } from "react";
import { useScheduling } from "@/hooks/useScheduling";
import { UserProfile } from "@/hooks/useFetchUsers";
import { motion } from "framer-motion";

interface CallSchedulingProps {
  currentUserId: string;
  currentUserRole: "mentor" | "mentee" | "admin";
  pairedUser?: UserProfile | null;
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
  } = useScheduling();

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pairedUser) {
      // Fetch schedules for the current user
      fetchSchedules(currentUserId, currentUserRole);
    }
  }, [currentUserId, currentUserRole, pairedUser, fetchSchedules]);

  const handleScheduleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!pairedUser) {
      setErrorMessage("No paired user found. Cannot schedule.");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setErrorMessage("Please select date and time");
      return;
    }

    setLoading(true);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

      const mentorId =
        currentUserRole === "mentor" ? currentUserId : pairedUser.id;
      const menteeId =
        currentUserRole === "mentee" ? currentUserId : pairedUser.id;

      const result = await createSchedule(
        mentorId,
        menteeId,
        scheduledAt,
        duration,
        notes,
      );

      if (result.success) {
        setSuccessMessage("✅ Call scheduled successfully!");
        setScheduledDate("");
        setScheduledTime("");
        setDuration(30);
        setNotes("");

        // Refresh schedules
        await fetchSchedules(currentUserId, currentUserRole);
      } else {
        setErrorMessage(result.error || "Failed to schedule call");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to schedule call";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (confirm("Are you sure you want to cancel this schedule?")) {
      const result = await cancelSchedule(scheduleId);
      if (result.success) {
        setSuccessMessage("Schedule cancelled");
        await fetchSchedules(currentUserId, currentUserRole);
      } else {
        setErrorMessage(result.error || "Failed to cancel schedule");
      }
    }
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
      {/* Messages */}
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

      {/* Schedule Form - Only for mentors with paired mentees */}
      {isMentorCanSchedule && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Schedule Call
          </h3>

          <form onSubmit={handleScheduleCall} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
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

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this call..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              {loading ? "Scheduling..." : "Schedule Call"}
            </button>
          </form>
        </div>
      )}

      {/* Schedules List */}
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
            {schedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {/* 📅 {schedule.scheduledAt.toLocaleDateString()} at{" "}
                      {schedule.scheduledAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} */}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Duration: {schedule.duration} minutes
                    </p>
                    {schedule.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Notes: {schedule.notes}
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

                {/* Actions */}
                {(schedule.status === "scheduled" ||
                  schedule.status === "ongoing") &&
                  currentUserRole === "mentor" && (
                    <button
                      onClick={() => handleCancelSchedule(schedule.id)}
                      className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                  )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
