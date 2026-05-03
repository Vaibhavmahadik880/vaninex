"use client";

import { UserProfile } from "@/hooks/useFetchUsers";

interface MenteeListProps {
  mentees: UserProfile[];
  loading: boolean;
  onSelectMentee?: (mentee: UserProfile) => void;
}

export default function MenteeList({
  mentees,
  loading,
  onSelectMentee,
}: MenteeListProps) {
  if (loading) {
    return <div className="text-center py-4">Loading mentees...</div>;
  }

  if (mentees.length === 0) {
    return <div className="text-center py-4 text-gray-500">No mentees yet</div>;
  }

  return (
    <div className="space-y-3">
      {mentees.map((mentee) => (
        <div
          key={mentee.id}
          className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 hover:shadow-md transition cursor-pointer"
          onClick={() => onSelectMentee?.(mentee)}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-blue-900">
                {mentee.fullName || mentee.email}
              </p>
              <p className="text-xs text-blue-600">{mentee.email}</p>
              <p className="text-xs text-blue-500 mt-1">
                ID: {mentee.id.substring(0, 8)}...
              </p>
            </div>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Mentee
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
