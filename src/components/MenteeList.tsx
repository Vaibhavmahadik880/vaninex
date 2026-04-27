"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  assignMenteeToMentor,
  subscribeAvailableMentees,
  type AppUserDoc,
} from "../lib/firestore";

interface MenteeListProps {
  mentorId: string;
  onMenteeSelected?: (menteeId: string) => void;
  onAssigned?: () => void;
}

export default function MenteeList({
  mentorId,
  onMenteeSelected,
  onAssigned,
}: MenteeListProps) {
  const [mentees, setMentees] = useState<AppUserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAvailableMentees(
      (data) => {
        setMentees(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load mentees");
        setLoading(false);
      },
    );
  }, []);

  const handleAssignMentee = async (menteeId: string) => {
    try {
      setAssigningId(menteeId);
      setError(null);
      await assignMenteeToMentor(menteeId, mentorId);
      onMenteeSelected?.(menteeId);
      onAssigned?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign mentee");
      console.error("Assign mentee error:", err);
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <motion.div
          className="bg-red-500/10 border border-red-500/50 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {mentees.length === 0 ? (
        <p className="text-zinc-400 text-center py-8">
          No unassigned mentees available
        </p>
      ) : (
        <div className="space-y-3">
          {mentees.map((mentee) => (
            <motion.div
              key={mentee.id}
              className="bg-white/5 backdrop-blur-lg rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div>
                <p className="text-white font-semibold">
                  {mentee.name || "Unknown"}
                </p>
                <p className="text-zinc-400 text-sm">{mentee.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                onClick={() => handleAssignMentee(mentee.id)}
                disabled={assigningId === mentee.id}
              >
                {assigningId === mentee.id ? "Assigning..." : "Assign"}
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
