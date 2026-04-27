import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  DocumentData,
  writeBatch,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { User, CallSession, Call, UserRole } from "../types";

export interface AppUserDoc {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mentorId?: string | null;
  menteeIds?: string[];
  createdAt?: unknown;
  lastLogin?: unknown;
}

export interface CallDoc extends Omit<Partial<Call>, "id"> {
  id: string;
  callerId: string;
  receiverId: string;
  mentorId?: string;
  menteeId?: string;
  status: NonNullable<Call["status"]>;
  createdAt?: Date | undefined;
  startTime?: Date | undefined;
  endTime?: Date | undefined;
}


const withId = <T extends DocumentData>(id: string, data: T) =>
  ({ id, ...data }) as T & { id: string };

// USERS
export const getUser = async (userId: string): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const createOrUpdateUser = async (
  userId: string,
  userData: Partial<User>,
) => {
  try {
    const docRef = doc(db, "users", userId);
    const payload: Partial<User> & {
      createdAt?: Date;
      lastLogin: Date;
      menteeIds?: string[];
      mentorId?: string | null;
    } = {
      ...userData,
      createdAt: userData.createdAt ?? new Date(),
      lastLogin: new Date(),
    };

    if ("menteeIds" in userData) {
      payload.menteeIds = userData.menteeIds ?? [];
    }

    if ("mentorId" in userData) {
      payload.mentorId = userData.mentorId ?? null;
    }

    await setDoc(
      docRef,
      payload,
      { merge: true },
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating/updating user:", error);
    throw error;
  }
};

export const subscribeUser = (
  userId: string,
  callback: (user: AppUserDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  if (!userId) {
    callback(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(db, "users", userId),
    (snapshot) => {
      callback(snapshot.exists() ? withId(snapshot.id, snapshot.data() as AppUserDoc) : null);
    },
    (error) => onError?.(error),
  );
};

// GET MENTEES FOR A MENTOR
export const getMenteesByMentor = async (
  mentorId: string,
): Promise<DocumentData[]> => {
  try {
    const q = query(collection(db, "users"), where("mentorId", "==", mentorId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching mentees:", error);
    throw error;
  }
};

export const subscribeMenteesByMentor = (
  mentorId: string,
  callback: (mentees: AppUserDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  if (!mentorId) {
    callback([]);
    return () => undefined;
  }

  const q = query(collection(db, "users"), where("mentorId", "==", mentorId));

  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => withId(item.id, item.data()) as AppUserDoc),
      );
    },
    (error) => onError?.(error),
  );
};

export const subscribeAvailableMentees = (
  callback: (mentees: AppUserDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const q = query(collection(db, "users"), where("role", "==", "mentee"));

  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs
          .map((item) => withId(item.id, item.data()) as AppUserDoc)
          .filter((mentee) => !mentee.mentorId),
      );
    },
    (error) => onError?.(error),
  );
};

// GET ALL MENTEES (for mentor to select from)
export const getAllMentees = async (): Promise<DocumentData[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "mentee"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all mentees:", error);
    throw error;
  }
};

// ASSIGN MENTEE TO MENTOR (no duplicates)
export const assignMenteeToMentor = async (
  menteeId: string,
  mentorId: string,
) => {
  try {
    const menteeData = await getUser(menteeId);
    const previousMentorId = menteeData?.mentorId;

    if (menteeData?.mentorId === mentorId) {
      return;
    }

    const batch = writeBatch(db);

    batch.set(
      doc(db, "users", menteeId),
      {
        mentorId,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    batch.set(
      doc(db, "users", mentorId),
      {
        menteeIds: arrayUnion(menteeId),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    if (previousMentorId) {
      batch.set(
        doc(db, "users", previousMentorId),
        {
          menteeIds: arrayRemove(menteeId),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    await batch.commit();
  } catch (error) {
    console.error("Error assigning mentee to mentor:", error);
    throw error;
  }
};

export const subscribeIncomingCalls = (
  userId: string,
  callback: (call: CallDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  if (!userId) {
    callback(null);
    return () => undefined;
  }

  const q = query(
    collection(db, "calls"),
    where("receiverId", "==", userId),
    where("status", "==", "ringing"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const first = snapshot.docs[0];
      callback(first ? (withId(first.id, first.data()) as CallDoc) : null);
    },
    (error) => onError?.(error),
  );
};

export const subscribeCall = (
  callId: string,
  callback: (call: CallDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  if (!callId) {
    callback(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(db, "calls", callId),
    (snapshot) => {
      callback(snapshot.exists() ? (withId(snapshot.id, snapshot.data()) as CallDoc) : null);
    },
    (error) => onError?.(error),
  );
};

// CALLS
export const createCall = async (callData: Partial<Call>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "calls"), {
      ...callData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating call:", error);
    throw error;
  }
};

export const addCallCandidate = async (
  callId: string,
  side: "caller" | "callee",
  candidate: RTCIceCandidateInit,
) => {
  const collectionName =
    side === "caller" ? "callerCandidates" : "calleeCandidates";

  await addDoc(collection(db, "calls", callId, collectionName), {
    ...candidate,
    createdAt: serverTimestamp(),
  });
};

export const subscribeCallCandidates = (
  callId: string,
  side: "caller" | "callee",
  callback: (candidate: RTCIceCandidateInit) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const collectionName =
    side === "caller" ? "callerCandidates" : "calleeCandidates";

  return onSnapshot(
    collection(db, "calls", callId, collectionName),
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          callback(change.doc.data() as RTCIceCandidateInit);
        }
      });
    },
    (error) => onError?.(error),
  );
};

export const updateCall = async (callId: string, callData: Partial<Call>) => {
  try {
    await updateDoc(doc(db, "calls", callId), callData);
  } catch (error) {
    console.error("Error updating call:", error);
    throw error;
  }
};

export const getCall = async (callId: string): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, "calls", callId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching call:", error);
    throw error;
  }
};

// CALL SESSIONS (for tracking and analytics)
export const createCallSession = async (
  sessionData: Partial<CallSession>,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "callSessions"), {
      ...sessionData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating call session:", error);
    throw error;
  }
};

export const updateCallSession = async (
  sessionId: string,
  sessionData: Partial<CallSession>,
) => {
  try {
    await updateDoc(doc(db, "callSessions", sessionId), sessionData);
  } catch (error) {
    console.error("Error updating call session:", error);
    throw error;
  }
};

export const getCallSessionsByUser = async (
  userId: string,
): Promise<DocumentData[]> => {
  try {
    const q = query(
      collection(db, "callSessions"),
      where("participants", "array-contains", userId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching call sessions:", error);
    throw error;
  }
};

// ANALYTICS - Get weekly stats
export const getWeeklyStats = async (
  week: string,
): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, "weeklyStats", week);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    throw error;
  }
};

export const updateWeeklyStats = async (
  week: string,
  statsData: DocumentData,
) => {
  try {
    await setDoc(doc(db, "weeklyStats", week), statsData, { merge: true });
  } catch (error) {
    console.error("Error updating weekly stats:", error);
    throw error;
  }
};
