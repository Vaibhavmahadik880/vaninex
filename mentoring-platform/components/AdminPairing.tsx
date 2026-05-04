"use client";

import { useState } from "react";
import { UserProfile } from "@/hooks/useFetchUsers";
import { usePairing } from "@/hooks/usePairing";
import { motion } from "framer-motion";

interface AdminPairingProps {
  mentors: UserProfile[];
  mentees: UserProfile[];
  loading: boolean;
}

export default function AdminPairing({
  mentors,
  mentees,
  loading,
}: AdminPairingProps) {
  const [selectedMentor, setSelectedMentor] = useState<UserProfile | null>(
    null,
  );
  const [selectedMentee, setSelectedMentee] = useState<UserProfile | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const {
    assignMentorToMentee,
    removePairing,
    loading: pairingLoading,
  } = usePairing();

  const handlePair = async () => {
    if (!selectedMentor || !selectedMentee) {
      setErrorMessage("Please select both a mentor and mentee");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const result = await assignMentorToMentee(
      selectedMentor.id,
      selectedMentee.id,
    );

    if (result.success) {
      setSuccessMessage(result.message);
      setSelectedMentor(null);
      setSelectedMentee(null);
      // Refresh would happen via parent component
    } else {
      setErrorMessage(result.error || result.message);
    }
  };

  const handleRemovePairing = async (
    mentor: UserProfile,
    mentee: UserProfile,
  ) => {
    const result = await removePairing(mentor.id, mentee.id);
    if (result.success) {
      setSuccessMessage(result.message);
    } else {
      setErrorMessage(result.error || result.message);
    }
  };

  // Get currently paired mentees for each mentor
  const getPairedMentees = (mentor: UserProfile) => {
    return mentees.filter((m) => mentor.menteeIds?.includes(m.id));
  };

  if (loading) {
    return <div className="text-center py-8">Loading pairings...</div>;
  }

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
          ✅ {successMessage}
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-800"
        >
          ❌ {errorMessage}
        </motion.div>
      )}

      {/* Pairing Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Create New Pairing
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Mentor Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Mentor
            </label>
            <select
              value={selectedMentor?.id || ""}
              onChange={(e) => {
                const mentor = mentors.find((m) => m.id === e.target.value);
                setSelectedMentor(mentor || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Choose Mentor --</option>
              {mentors
                .filter((m) => !m.menteeIds || m.menteeIds.length === 0)
                .map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.email} (Available)
                  </option>
                ))}
            </select>
          </div>

          {/* Mentee Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Mentee
            </label>
            <select
              value={selectedMentee?.id || ""}
              onChange={(e) => {
                const mentee = mentees.find((m) => m.id === e.target.value);
                setSelectedMentee(mentee || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Mentee --</option>
              {mentees
                .filter((m) => !m.mentorId)
                .map((mentee) => (
                  <option key={mentee.id} value={mentee.id}>
                    {mentee.email} (Available)
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          onClick={handlePair}
          disabled={pairingLoading || !selectedMentor || !selectedMentee}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition"
        >
          {pairingLoading ? "Pairing..." : "Create Pairing"}
        </button>
      </div>

      {/* Current Pairings */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Current Pairings
        </h3>

        {mentors.filter((m) => m.menteeIds && m.menteeIds.length > 0).length ===
        0 ? (
          <p className="text-gray-500 text-center py-4">
            No active pairings yet
          </p>
        ) : (
          <div className="space-y-3">
            {mentors.map((mentor) => {
              const pairedMentees = getPairedMentees(mentor);
              if (pairedMentees.length === 0) return null;

              return (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-purple-900">
                        {mentor.email}
                      </p>
                      <div className="mt-2 space-y-1">
                        {pairedMentees.map((mentee) => (
                          <p
                            key={mentee.id}
                            className="text-sm text-blue-700 ml-2"
                          >
                            → {mentee.email}
                          </p>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleRemovePairing(mentor, pairedMentees[0])
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                    >
                      Remove
                    </button>
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
