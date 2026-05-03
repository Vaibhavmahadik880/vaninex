"use client";

import { useAuth } from "@/hooks/useAuth";
import { useFetchUsers } from "@/hooks/useFetchUsers";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import MentorList from "@/components/MentorList";
import MenteeList from "@/components/MenteeList";

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Fetch users based on role
  const { users: mentors } = useFetchUsers("mentor");
  const { users: mentees } = useFetchUsers("mentee");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 🔐 Redirect to auth if not logged in
    if (mounted && !loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router, mounted]);


  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mentoring Platform</h1>
            <p className="text-blue-100">Welcome, {user.fullName || user.email}</p>
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
            <p className="text-sm text-blue-100 mb-4">{user.fullName || "User"}</p>
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
                    Active Mentees: <span className="font-bold">0</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2">
                  ✅ <strong>Mentee</strong>
                </p>
                <p className="text-sm text-green-100">
                  You can request a mentor and join scheduled calls.
                </p>
                <div className="mt-4 pt-4 border-t border-green-400">
                  <p className="text-xs">
                    Assigned Mentor: <span className="font-bold">None</span>
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
              <p>🟢 Dashboard Ready</p>
              <p className="text-xs text-purple-100 mt-4">
                Phase 3: Dashboard Base
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

          {/* Info Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-4">📋 Next Steps</h3>
            <div className="space-y-3 text-sm text-gray-700">
              {role === "mentor" ? (
                <>
                  <p>
                    ✅ <strong>Phase 3:</strong> Dashboard Base - Done!
                  </p>
                  <p>
                    ⏳ <strong>Phase 4:</strong> Assign mentees to manage
                  </p>
                  <p>
                    ⏳ <strong>Phase 5:</strong> Schedule calls with mentees
                  </p>
                </>
              ) : (
                <>
                  <p>
                    ✅ <strong>Phase 3:</strong> Dashboard Base - Done!
                  </p>
                  <p>
                    ⏳ <strong>Phase 4:</strong> Request a mentor to pair with
                  </p>
                  <p>
                    ⏳ <strong>Phase 5:</strong> Schedule calls with your mentor
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feature Roadmap */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-6">🗺️ Feature Roadmap</h3>
          <div className="grid grid-cols-5 gap-4">
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
              <div className="bg-yellow-100 p-4 rounded-lg mb-2">⏳</div>
              <p className="font-semibold text-sm">Phase 4</p>
              <p className="text-xs text-gray-500">Pairing</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-2">◻️</div>
              <p className="font-semibold text-sm">Phase 5</p>
              <p className="text-xs text-gray-500">Scheduling</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-2">◻️</div>
              <p className="font-semibold text-sm">Phase 6+</p>
              <p className="text-xs text-gray-500">WebRTC</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
