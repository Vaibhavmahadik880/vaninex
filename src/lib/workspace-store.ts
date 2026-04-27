"use client";

import type {
  AppUserProfile,
  ConversationMessage,
  MentorshipAssignment,
  UserRole,
  WorkspaceState,
} from "../types";

const STORAGE_KEY = "uday-workspace-state-v1";
const UPDATE_EVENT = "uday-workspace-updated";

const emptyState: WorkspaceState = {
  profiles: [],
  assignments: [],
  messages: [],
};
let cachedRawState: string | null | undefined;
let cachedWorkspaceState: WorkspaceState = emptyState;

function canUseStorage() {
  return typeof window !== "undefined";
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readWorkspaceState(): WorkspaceState {
  if (!canUseStorage()) {
    return emptyState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    cachedRawState = raw;
    cachedWorkspaceState = emptyState;
    return emptyState;
  }

  if (raw === cachedRawState) {
    return cachedWorkspaceState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;

    cachedRawState = raw;
    cachedWorkspaceState = {
      profiles: parsed.profiles ?? [],
      assignments: parsed.assignments ?? [],
      messages: parsed.messages ?? [],
    };

    return cachedWorkspaceState;
  } catch {
    cachedRawState = raw;
    cachedWorkspaceState = emptyState;
    return emptyState;
  }
}

function writeWorkspaceState(nextState: WorkspaceState) {
  if (!canUseStorage()) {
    return;
  }

  const raw = JSON.stringify(nextState);

  cachedRawState = raw;
  cachedWorkspaceState = nextState;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function subscribeToWorkspaceUpdates(callback: () => void) {
  if (!canUseStorage()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(UPDATE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getProfileByEmail(email: string) {
  return readWorkspaceState().profiles.find(
    (profile) => profile.email.toLowerCase() === email.toLowerCase(),
  );
}

export function ensureUserProfile(input: {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
}) {
  const state = readWorkspaceState();
  const now = new Date().toISOString();
  const existing = state.profiles.find(
    (profile) => profile.email.toLowerCase() === input.email.toLowerCase(),
  );

  const nextProfile: AppUserProfile = existing
    ? {
        ...existing,
        uid: input.uid,
        name: input.name || existing.name,
        role: existing.role,
        lastLogin: now,
      }
    : {
        uid: input.uid,
        email: input.email,
        role: input.role,
        name: input.name,
        createdAt: now,
        lastLogin: now,
      };

  const nextProfiles = existing
    ? state.profiles.map((profile) =>
        profile.email.toLowerCase() === input.email.toLowerCase()
          ? nextProfile
          : profile,
      )
    : [...state.profiles, nextProfile];

  writeWorkspaceState({
    ...state,
    profiles: nextProfiles,
  });

  return nextProfile;
}

export function getProfilesByRole(role: UserRole) {
  return readWorkspaceState().profiles.filter((profile) => profile.role === role);
}

export function createAssignment(input: {
  mentorEmail: string;
  menteeEmail: string;
  createdBy: string;
}) {
  const state = readWorkspaceState();
  const now = new Date().toISOString();

  const nextAssignment: MentorshipAssignment = {
    id: makeId("assignment"),
    mentorEmail: input.mentorEmail,
    menteeEmail: input.menteeEmail,
    createdBy: input.createdBy,
    createdAt: now,
    status: "active",
  };

  const nextAssignments = state.assignments
    .filter(
      (assignment) =>
        assignment.mentorEmail.toLowerCase() !== input.mentorEmail.toLowerCase() &&
        assignment.menteeEmail.toLowerCase() !== input.menteeEmail.toLowerCase(),
    )
    .concat(nextAssignment);

  writeWorkspaceState({
    ...state,
    assignments: nextAssignments,
  });

  return nextAssignment;
}

export function getAssignmentForUser(email: string) {
  return readWorkspaceState().assignments.find(
    (assignment) =>
      assignment.mentorEmail.toLowerCase() === email.toLowerCase() ||
      assignment.menteeEmail.toLowerCase() === email.toLowerCase(),
  );
}

export function getMessagesForAssignment(assignmentId: string) {
  return readWorkspaceState().messages
    .filter((message) => message.assignmentId === assignmentId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function addConversationMessage(input: {
  assignmentId: string;
  senderEmail: string;
  senderRole: UserRole;
  text: string;
}) {
  const state = readWorkspaceState();

  const nextMessage: ConversationMessage = {
    id: makeId("message"),
    assignmentId: input.assignmentId,
    senderEmail: input.senderEmail,
    senderRole: input.senderRole,
    text: input.text,
    createdAt: new Date().toISOString(),
  };

  writeWorkspaceState({
    ...state,
    messages: [...state.messages, nextMessage],
  });

  return nextMessage;
}
