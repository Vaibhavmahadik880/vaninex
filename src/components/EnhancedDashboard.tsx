"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "firebase/auth";

import { auth } from "../lib/firebase";
import {
  subscribeMenteesByMentor,
  subscribeUser,
  type AppUserDoc,
} from "../lib/firestore";
import { useAuth } from "../lib/auth-context";
import MenteeList from "./MenteeList";
import CallInterface from "./CallInterface";
import IncomingCall from "./IncomingCall";
import { useCallManager } from "../hooks/useCallManager";

export default function EnhancedDashboard() {
  const { user: authUser } = useAuth();
  const [dashboardUser, setDashboardUser] = useState<AppUserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentees, setMentees] = useState<AppUserDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "assign">("home");

  const callManager = useCallManager(authUser?.uid ?? "");

  useEffect(() => {
    if (!authUser?.uid) {
      return;
    }

    return subscribeUser(
      authUser.uid,
      (profile) => {
        setDashboardUser(profile);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError.message || "Failed to load profile.");
        setLoading(false);
      },
    );
  }, [authUser?.uid]);

  useEffect(() => {
    if (!authUser?.uid || dashboardUser?.role !== "mentor") {
      return;
    }

    return subscribeMenteesByMentor(
      authUser.uid,
      setMentees,
      (nextError) => setError(nextError.message || "Failed to load mentees."),
    );
  }, [authUser?.uid, dashboardUser?.role]);

  const assignedMentorLabel = useMemo(() => {
    if (!dashboardUser?.mentorId) {
      return "No mentor assigned yet";
    }

    return dashboardUser.mentorId;
  }, [dashboardUser?.mentorId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-cyan-300 border-t-transparent"
        />
      </div>
    );
  }

  if (!dashboardUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Sign up again or ask an admin to create your Firestore user profile.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#020617_0%,#111827_52%,#0f172a_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/70">
              Uday workspace
            </p>
            <h1 className="mt-1 text-2xl font-bold">{dashboardUser.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm capitalize text-slate-200">
              {dashboardUser.role}
            </span>
            <button
              type="button"
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {(error || callManager.error) && (
          <motion.div
            className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error ?? callManager.error}
          </motion.div>
        )}

        {dashboardUser.role === "mentor" && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Assigned mentees
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    {mentees.length} active pairing{mentees.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab((current) =>
                      current === "assign" ? "home" : "assign",
                    )
                  }
                  className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  {activeTab === "assign" ? "Hide assignment" : "Assign mentees"}
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {mentees.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/60 p-6 text-sm leading-6 text-slate-300">
                    No mentees assigned yet. Use the assignment panel to pair
                    mentees with your mentor account.
                  </div>
                ) : (
                  mentees.map((mentee) => (
                    <motion.article
                      key={mentee.id}
                      className="rounded-xl border border-white/10 bg-slate-950/60 p-5"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h3 className="text-lg font-semibold">{mentee.name}</h3>
                      <p className="mt-1 break-words text-sm text-slate-400">
                        {mentee.email}
                      </p>
                      <button
                        type="button"
                        onClick={() => void callManager.initiateCall(mentee.id)}
                        className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                      >
                        Start call
                      </button>
                    </motion.article>
                  ))
                )}
              </div>
            </section>

            <AnimatePresence initial={false}>
              {activeTab === "assign" && (
                <motion.section
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                >
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Pairing control
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Available mentees
                  </h2>
                  <div className="mt-5">
                    <MenteeList
                      mentorId={dashboardUser.id}
                      onAssigned={() => setActiveTab("home")}
                    />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        )}

        {dashboardUser.role === "mentee" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Your mentor
            </p>
            <h2 className="mt-3 text-3xl font-semibold">{assignedMentorLabel}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Keep this page open to receive incoming mentor calls in realtime.
              When your mentor starts a session, the call prompt appears here.
            </p>
          </section>
        )}

        {dashboardUser.role === "admin" && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Admin
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Firestore user directory is active
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Mentor accounts can assign available mentees directly. Admins can
              inspect and edit the `users` collection in Firebase if manual role
              corrections are needed.
            </p>
          </section>
        )}
      </main>

      <AnimatePresence>
        {callManager.incomingCall && callManager.callState === "ringing" && (
          <IncomingCall
            callerId={callManager.incomingCall.callerId}
            onAccept={() => void callManager.acceptCall()}
            onReject={() => void callManager.rejectCall()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(callManager.callState === "calling" ||
          callManager.callState === "accepted" ||
          callManager.callState === "ongoing") && (
          <CallInterface
            callState={callManager.callState}
            callDuration={callManager.callDuration}
            remoteUserId={callManager.remoteUserId}
            error={callManager.error}
            isMuted={callManager.isMuted}
            isVideoEnabled={callManager.isVideoEnabled}
            localMediaRef={callManager.localMediaRef}
            remoteMediaRef={callManager.remoteMediaRef}
            onToggleAudio={callManager.toggleAudio}
            onToggleVideo={callManager.toggleVideo}
            onEndCall={() => void callManager.endCall("completed")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
