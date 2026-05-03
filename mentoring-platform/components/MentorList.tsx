"use client";

import { UserProfile } from "@/hooks/useFetchUsers";

interface MentorListProps {
  mentors: UserProfile[];
  loading: boolean;
  onSelectMentor?: (mentor: UserProfile) => void;
}

export default function MentorList({
  mentors,
  loading,
  onSelectMentor,
}: MentorListProps) {
  if (loading) {
    return <div className="text-center py-4">Loading mentors...</div>;
  }

  if (mentors.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">No mentors available</div>
    );
  }

  return (
    <div className="space-y-3">
      {mentors.map((mentor) => (
        <div
          key={mentor.id}
          className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 hover:shadow-md transition cursor-pointer"
          onClick={() => onSelectMentor?.(mentor)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-green-900">{mentor.email}</p>
              <p className="text-sm text-green-600">
                Mentees: {mentor.menteeIds?.length || 0}
              </p>
              <p className="text-xs text-green-500 mt-1">
                ID: {mentor.id.substring(0, 8)}...
              </p>
            </div>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Mentor
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
