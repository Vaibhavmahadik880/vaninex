"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";

import { auth, isFirebaseConfigured } from "../lib/firebase";
import { useAuth } from "../lib/auth-context";
import { containerStagger, itemVariant, fadeInUp } from "../lib/animations";
import CallWorkspace from "./CallWorkspace";
import {
  addConversationMessage,
  createAssignment,
  getAssignmentForUser,
  getProfileByEmail,
  getProfilesByRole,
  readWorkspaceState,
  subscribeToWorkspaceUpdates,
} from "../lib/workspace-store";
import type { ConversationMessage, UserRole } from "../types";

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRoleTone(role: UserRole) {
  switch (role) {
    case "admin":
      return "bg-amber-300 text-slate-950";
    case "mentor":
      return "bg-cyan-300 text-slate-950";
    case "mentee":
      return "bg-emerald-300 text-slate-950";
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedMentorEmail, setSelectedMentorEmail] = useState("");
  const [selectedMenteeEmail, setSelectedMenteeEmail] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const workspace = useSyncExternalStore(
    subscribeToWorkspaceUpdates,
    readWorkspaceState,
    readWorkspaceState,
  );

  const handleSignOut = async () => {
    if (!isFirebaseConfigured) {
      return;
    }

    await signOut(auth);
  };

  const currentEmail = user?.email ?? "";
  const profile = currentEmail
    ? (getProfileByEmail(currentEmail) ?? null)
    : null;
  const assignments = workspace.assignments;
  const mentors = getProfilesByRole("mentor");
  const mentees = getProfilesByRole("mentee");
  const activeAssignment = currentEmail
    ? (getAssignmentForUser(currentEmail) ?? null)
    : null;
  const messages: ConversationMessage[] = activeAssignment
    ? workspace.messages
        .filter((message) => message.assignmentId === activeAssignment.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    : [];
  const mentorSelectValue = selectedMentorEmail || mentors[0]?.email || "";
  const menteeSelectValue = selectedMenteeEmail || mentees[0]?.email || "";

  const handleCreateAssignment = () => {
    if (!profile?.email) {
      return;
    }

    if (!mentorSelectValue || !menteeSelectValue) {
      setStatusMessage("Select both a mentor and a mentee before assigning.");
      return;
    }

    if (mentorSelectValue === menteeSelectValue) {
      setStatusMessage("Mentor and mentee must be different accounts.");
      return;
    }

    createAssignment({
      mentorEmail: mentorSelectValue,
      menteeEmail: menteeSelectValue,
      createdBy: profile.email,
    });

    setStatusMessage(
      "Assignment saved. The mentor and mentee can now converse.",
    );
  };

  const handleSendMessage = () => {
    if (!profile || !user?.email || !activeAssignment || !draftMessage.trim()) {
      return;
    }

    addConversationMessage({
      assignmentId: activeAssignment.id,
      senderEmail: user.email,
      senderRole: profile.role,
      text: draftMessage.trim(),
    });

    setDraftMessage("");
    setStatusMessage("Message sent to the shared conversation.");
  };

  if (!user?.email) {
    return null;
  }

  const partnerEmail =
    activeAssignment && profile?.role === "mentor"
      ? activeAssignment.menteeEmail
      : activeAssignment?.mentorEmail;
  const partnerProfile = partnerEmail ? getProfileByEmail(partnerEmail) : null;
  const totalUsers = mentors.length + mentees.length;

  return (
    <div className="w-full px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(15,23,42,0.92)),linear-gradient(120deg,rgba(59,130,246,0.15),rgba(2,6,23,0.95))] p-8 shadow-[0_40px_120px_-60px_rgba(34,211,238,0.75)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-100/70">
                  Workspace
                </p>
                {profile?.role && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.25em] ${getRoleTone(profile.role)}`}
                  >
                    {profile.role}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {profile?.role === "admin"
                  ? "Assign mentors to mentees"
                  : "Assigned conversation room"}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-200/85 sm:text-base">
                {profile?.name ? `${profile.name} (${user.email})` : user.email}
                .{" "}
                {profile?.role === "admin"
                  ? "Use this layer to connect the right mentor with the right mentee before a coaching session starts."
                  : "This layer becomes active after an admin assigns your mentor-mentee pair."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Sign out
            </button>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Mentors
            </p>
            <p className="mt-4 text-4xl font-semibold text-cyan-200">
              {mentors.length}
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Mentees
            </p>
            <p className="mt-4 text-4xl font-semibold text-emerald-200">
              {mentees.length}
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Active assignments
            </p>
            <p className="mt-4 text-4xl font-semibold text-amber-200">
              {assignments.length}
            </p>
          </article>
        </section>

        {statusMessage && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
            {statusMessage}
          </p>
        )}

        {profile?.role === "admin" ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Assignment control
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Match a mentor with a mentee
                </h2>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm text-slate-300">
                      Mentor
                    </span>
                    <select
                      value={mentorSelectValue}
                      onChange={(e) => setSelectedMentorEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Select mentor</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.email} value={mentor.email}>
                          {mentor.name} - {mentor.email}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-slate-300">
                      Mentee
                    </span>
                    <select
                      value={menteeSelectValue}
                      onChange={(e) => setSelectedMenteeEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    >
                      <option value="">Select mentee</option>
                      {mentees.map((mentee) => (
                        <option key={mentee.email} value={mentee.email}>
                          {mentee.name} - {mentee.email}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleCreateAssignment}
                  disabled={totalUsers < 2}
                  className="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Assign mentor to mentee
                </button>
              </article>

              <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Access notes
                </p>
                <div className="mt-4 space-y-4">
                  {[
                    "Mentor and mentee accounts are created from their separate login layers.",
                    "Every active assignment unlocks one shared conversation room.",
                    "Reassigning a mentor or mentee replaces their previous active pairing.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Active pairings
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Mentor-mentee assignments
                  </h2>
                </div>
                <p className="text-sm text-slate-400">
                  Admin-created pairings become available immediately.
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {assignments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-5 text-sm text-slate-300">
                    No assignments yet. Create one so a mentor and mentee can
                    start conversing.
                  </div>
                ) : (
                  assignments.map((assignment) => {
                    const mentor = getProfileByEmail(assignment.mentorEmail);
                    const mentee = getProfileByEmail(assignment.menteeEmail);

                    return (
                      <article
                        key={assignment.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/65 p-5"
                      >
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                          Active pairing
                        </p>
                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {mentor?.name ?? assignment.mentorEmail} with{" "}
                          {mentee?.name ?? assignment.menteeEmail}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Mentor: {assignment.mentorEmail}
                        </p>
                        <p className="text-sm leading-6 text-slate-300">
                          Mentee: {assignment.menteeEmail}
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                          Created {formatDate(assignment.createdAt)}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Conversation access
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {activeAssignment
                  ? "Your pairing is active"
                  : "Waiting for assignment"}
              </h2>

              {activeAssignment ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Partner</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {partnerProfile?.name ?? partnerEmail}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {partnerProfile?.email ?? partnerEmail}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Conversation room</p>
                    <p className="mt-2 text-xl font-semibold text-cyan-100">
                      {activeAssignment.id}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Assigned on {formatDate(activeAssignment.createdAt)} by{" "}
                      {activeAssignment.createdBy}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                  An admin needs to assign your mentor-mentee pair before the
                  shared conversation opens.
                </div>
              )}
            </article>

            {activeAssignment ? (
              <CallWorkspace
                assignmentId={activeAssignment.id}
                currentEmail={user.email}
                currentRole={profile?.role ?? "mentee"}
                partnerEmail={partnerEmail ?? ""}
                partnerName={partnerProfile?.name ?? null}
              />
            ) : (
              <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      Live call panel
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Waiting for admin assignment
                    </h2>
                  </div>
                </div>

                <div className="mt-6 flex min-h-[20rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/15 bg-slate-950/65 p-5 text-center text-sm leading-6 text-slate-400">
                  An admin must first assign your mentor-mentee pair before the
                  live audio call room can be opened.
                </div>
              </article>
            )}
          </section>
        )}

        {profile?.role !== "admin" && (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Shared conversation
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Mentor and mentee discussion
                </h2>
              </div>
              {activeAssignment && (
                <p className="text-sm text-slate-400">
                  {messages.length} message{messages.length === 1 ? "" : "s"}
                </p>
              )}
            </div>

            <div className="mt-6 flex min-h-[20rem] flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/65 p-4">
              {!activeAssignment ? (
                <div className="flex flex-1 items-center justify-center text-center text-sm leading-6 text-slate-400">
                  This conversation panel will unlock as soon as the admin pairs
                  you with a mentor or mentee.
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-center text-sm leading-6 text-slate-400">
                  Start the first message to begin the mentor-mentee
                  conversation.
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderEmail === user.email;

                  return (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isOwn
                          ? "self-end bg-cyan-400 text-slate-950"
                          : "self-start bg-white/10 text-slate-100"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] opacity-75">
                        {message.senderRole}
                      </p>
                      <p className="mt-1">{message.text}</p>
                      <p className="mt-2 text-[11px] opacity-70">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                placeholder={
                  activeAssignment
                    ? "Write your next conversation message"
                    : "Waiting for admin assignment"
                }
                disabled={!activeAssignment}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!activeAssignment || !draftMessage.trim()}
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
