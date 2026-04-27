export type UserRole = "mentor" | "mentee" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  lastLogin?: Date;
  mentorId?: string | null;
  menteeIds?: string[];
}

export type CallStatus =
  | "calling"
  | "ringing"
  | "accepted"
  | "ongoing"
  | "ended"
  | "missed"
  | "completed";

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  mentorId?: string;
  menteeId?: string;
  status: CallStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  scheduledAt?: Date;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt?: Date;
}

export interface CallSession {
  id: string;
  callId: string;
  participants: string[];
  audioUrl?: string; // for recorded audio
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  status?: "completed" | "missed";
  aiAnalysis?: AIAnalysis;
}

export interface AIAnalysis {
  confidenceScore: number;
  clarityScore: number;
  fillerWords: string[];
  grammarIssues: string[];
  feedback: string;
  summary: string;
}

export interface Feedback {
  id: string;
  sessionId: string;
  userId: string;
  aiFeedback?: AIAnalysis;
  mentorFeedback?: string;
  createdAt: Date;
}

export interface AppUserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
  lastLogin?: string;
}

export interface MentorshipAssignment {
  id: string;
  mentorEmail: string;
  menteeEmail: string;
  createdBy: string;
  createdAt: string;
  status: "active";
}

export interface ConversationMessage {
  id: string;
  assignmentId: string;
  senderEmail: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}

export interface WorkspaceState {
  profiles: AppUserProfile[];
  assignments: MentorshipAssignment[];
  messages: ConversationMessage[];
}

export interface CallRoomSignal {
  assignmentId: string;
  callerEmail: string;
  calleeEmail: string;
  status: "ringing" | "ongoing" | "ended";
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  updatedAt: string;
}
