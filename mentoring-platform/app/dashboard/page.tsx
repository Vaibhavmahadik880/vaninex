"use client";

import { useAuth } from "@/hooks/useAuth";
import { useFetchUsers } from "@/hooks/useFetchUsers";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import MentorList from "@/components/MentorList";
import MenteeList from "@/components/MenteeList";
import AdminPairing from "@/components/AdminPairing";
import CallScheduling from "@/components/CallScheduling";

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // Fetch users based on role
  const { users: mentors } = useFetchUsers("mentor");
  const { users: mentees } = useFetchUsers("mentee");

  // Find paired user for non-admin users
  const pairedMentor =
    role === "mentee"
      ? mentors.find((m) => m.menteeIds?.includes(user?.uid || ""))
      : null;
  const pairedMentee =
    role === "mentor" ? mentees.find((m) => m.mentorId === user?.uid) : null;

  useEffect(() => {
    // 🔐 Redirect to auth if not logged in
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mentoring Platform</h1>
            <p className="text-blue-100">
              Welcome, {user.fullName || user.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
            <p className="mb-2">
              <strong>Name:</strong>
            </p>
            <p className="text-sm text-blue-100 mb-4">
              {user.fullName || "User"}
            </p>
            <p className="mb-2">
              <strong>Email:</strong>
            </p>
            <p className="text-sm text-blue-100 mb-4">{user.email}</p>
            <p className="mb-2">
              <strong>Role:</strong>
            </p>
            <p className="text-lg font-bold capitalize">{role}</p>
            <p className="text-xs text-blue-100 mt-4">
              UID: {user.uid.substring(0, 12)}...
            </p>
          </div>

          {/* Role Info Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Role Details</h3>
            {role === "mentor" ? (
              <>
                <p className="mb-2">
                  ✅ <strong>Mentor</strong>
                </p>
                <p className="text-sm text-green-100">
                  You can manage mentees and schedule calls.
                </p>
                <div className="mt-4 pt-4 border-t border-green-400">
                  <p className="text-xs">
                    Active Mentees:{" "}
                    <span className="font-bold">
                      {mentees.filter((m) => m.mentorId === user?.uid).length}
                    </span>
                  </p>
                  {pairedMentee && (
                    <p className="text-xs mt-2">
                      Paired with:{" "}
                      <span className="font-bold">{pairedMentee.email}</span>
                    </p>
                  )}
                </div>
              </>
            ) : role === "mentee" ? (
              <>
                <p className="mb-2">
                  ✅ <strong>Mentee</strong>
                </p>
                <p className="text-sm text-green-100">
                  You can join scheduled calls with your mentor.
                </p>
                <div className="mt-4 pt-4 border-t border-green-400">
                  <p className="text-xs">
                    Assigned Mentor:{" "}
                    <span className="font-bold">
                      {pairedMentor?.email || "None"}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2">
                  ✅ <strong>Admin</strong>
                </p>
                <p className="text-sm text-green-100">
                  Manage all pairings and monitor platform activity.
                </p>
                <div className="mt-4 pt-4 border-t border-green-400">
                  <p className="text-xs">
                    Total Mentors:{" "}
                    <span className="font-bold">{mentors.length}</span>
                  </p>
                  <p className="text-xs mt-1">
                    Total Mentees:{" "}
                    <span className="font-bold">{mentees.length}</span>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Platform Status</h3>
            <div className="space-y-2 text-sm">
              <p>🟢 Connected to Firebase</p>
              <p>🟢 Authentication Active</p>
              <p>🟢 Admin Pairing System</p>
              <p>🟢 Call Scheduling Ready</p>
              <p>🟢 WebRTC Foundation Active</p>
              <p className="text-xs text-purple-100 mt-4">
                Phase 7: WebRTC Foundation Complete
              </p>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          {/* Mentors List - shown to mentees */}
          {role === "mentee" && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-green-600">
                👨‍🏫 Available Mentors
              </h3>
              <MentorList mentors={mentors} loading={false} />
            </div>
          )}

          {/* Mentees List - shown to mentors */}
          {role === "mentor" && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-600">
                👥 All Mentees
              </h3>
              <MenteeList mentees={mentees} loading={false} />
            </div>
          )}
        </div>

        {/* PHASE 4: ADMIN PAIRING SYSTEM */}
        {role === "admin" && (
          <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 border-l-4 border-purple-600">
            <h2 className="text-3xl font-bold mb-6 text-purple-900">
              🔗 PHASE 4: Admin Pairing System
            </h2>
            <AdminPairing mentors={mentors} mentees={mentees} loading={false} />
          </div>
        )}

        {/* PHASE 5: CALL SCHEDULING */}
        {(role === "mentor" || role === "mentee" || role === "admin") && (
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <h2 className="text-3xl font-bold mb-6 text-blue-900">
              📞 PHASE 5: Call Scheduling
            </h2>
            <CallScheduling
              currentUserId={user.uid}
              currentUserRole={role as "mentor" | "mentee" | "admin"}
              pairedUser={
                role === "mentor"
                  ? mentees.find((m) => user.uid && m.mentorId === user.uid) ||
                    null
                  : role === "mentee"
                    ? mentors.find(
                        (m) => user.uid && m.menteeIds?.includes(user.uid),
                      ) || null
                    : null
              }
            />
          </div>
        )}

        {/* Feature Roadmap */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-6">🗺️ Feature Roadmap</h3>
          <div className="grid grid-cols-7 gap-4">
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg mb-2">✅</div>
              <p className="font-semibold text-sm">Phase 0-2</p>
              <p className="text-xs text-gray-500">Setup & Auth</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg mb-2">✅</div>
              <p className="font-semibold text-sm">Phase 3</p>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg mb-2">✅</div>
              <p className="font-semibold text-sm">Phase 4</p>
              <p className="text-xs text-gray-500">Pairing</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg mb-2">✅</div>
              <p className="font-semibold text-sm">Phase 5</p>
              <p className="text-xs text-gray-500">Scheduling</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg mb-2">✅</div>
              <p className="font-semibold text-sm">Phase 6</p>
              <p className="text-xs text-gray-500">Reminders</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-lg mb-2">✅</div>
              <p className="font-semibold text-sm">Phase 7</p>
              <p className="text-xs text-gray-500">WebRTC</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-2">⏳</div>
              <p className="font-semibold text-sm">Phase 8+</p>
              <p className="text-xs text-gray-500">Signaling</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
