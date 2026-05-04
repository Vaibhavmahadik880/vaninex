import { create } from "zustand";
import {
  collection,
  getDocs,
  query,
  where,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { readDate, readString, readStringArray } from "@/lib/firestoreData";

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: "mentor" | "mentee" | "admin";
  createdAt: Date;
  menteeIds?: string[];
  mentorId?: string | null;
}

interface UsersStore {
  users: UserProfile[];
  mentors: UserProfile[];
  mentees: UserProfile[];
  loading: boolean;
  error: string | null;
  fetchUsers: (role?: string, filters?: QueryConstraint[]) => Promise<void>;
  fetchMentors: () => Promise<void>;
  fetchMentees: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
  mentors: [],
  mentees: [],
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchUsers: async (role?: string, filters?: QueryConstraint[]) => {
    set({ loading: true, error: null });
    try {
      const constraints = [
        ...(role ? [where("role", "==", role)] : []),
        ...(filters || []),
      ];
      const q =
        constraints.length > 0
          ? query(collection(db, "users"), ...constraints)
          : query(collection(db, "users"));
      const snapshot = await getDocs(q);
      const userList: UserProfile[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const email = readString(data.email);
        const fullName =
          readString(data.fullName) || email.split("@")[0] || "User";
        const userRole =
          data.role === "mentor" || data.role === "admin" ? data.role : "mentee";

        return {
          id: doc.id,
          email,
          fullName,
          role: userRole,
          createdAt: readDate(data.createdAt),
          menteeIds: readStringArray(data.menteeIds),
          mentorId:
            typeof data.mentorId === "string" || data.mentorId === null
              ? data.mentorId
              : null,
        };
      });

      set({
        users: userList,
        ...(role === "mentor" ? { mentors: userList } : {}),
        ...(role === "mentee" ? { mentees: userList } : {}),
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage });
      console.error("Error fetching users:", err);
    } finally {
      set({ loading: false });
    }
  },

  fetchMentors: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, "users"), where("role", "==", "mentor"));
      const snapshot = await getDocs(q);
      const mentorList: UserProfile[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const email = readString(data.email);
        return {
          id: doc.id,
          email,
          fullName: readString(data.fullName) || email.split("@")[0] || "User",
          role: (data.role as "mentor") || "mentor",
          createdAt: readDate(data.createdAt),
          menteeIds: readStringArray(data.menteeIds),
          mentorId:
            typeof data.mentorId === "string" || data.mentorId === null
              ? data.mentorId
              : null,
        };
      });
      set({ mentors: mentorList });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage });
      console.error("Error fetching mentors:", err);
    } finally {
      set({ loading: false });
    }
  },

  fetchMentees: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, "users"), where("role", "==", "mentee"));
      const snapshot = await getDocs(q);
      const menteeList: UserProfile[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const email = readString(data.email);
        return {
          id: doc.id,
          email,
          fullName: readString(data.fullName) || email.split("@")[0] || "User",
          role: (data.role as "mentee") || "mentee",
          createdAt: readDate(data.createdAt),
          menteeIds: readStringArray(data.menteeIds),
          mentorId:
            typeof data.mentorId === "string" || data.mentorId === null
              ? data.mentorId
              : null,
        };
      });
      set({ mentees: menteeList });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage });
      console.error("Error fetching mentees:", err);
    } finally {
      set({ loading: false });
    }
  },

  fetchAllUsers: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        (async () => {
          const q = query(
            collection(db, "users"),
            where("role", "==", "mentor"),
          );
          const snapshot = await getDocs(q);
          const mentorList: UserProfile[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Record<string, unknown>;
            const email = readString(data.email);
            return {
              id: doc.id,
              email,
              fullName:
                readString(data.fullName) || email.split("@")[0] || "User",
              role: (data.role as "mentor") || "mentor",
              createdAt: readDate(data.createdAt),
              menteeIds: readStringArray(data.menteeIds),
              mentorId:
                typeof data.mentorId === "string" || data.mentorId === null
                  ? data.mentorId
                  : null,
            };
          });
          set({ mentors: mentorList });
        })(),
        (async () => {
          const q = query(
            collection(db, "users"),
            where("role", "==", "mentee"),
          );
          const snapshot = await getDocs(q);
          const menteeList: UserProfile[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Record<string, unknown>;
            const email = readString(data.email);
            return {
              id: doc.id,
              email,
              fullName:
                readString(data.fullName) || email.split("@")[0] || "User",
              role: (data.role as "mentee") || "mentee",
              createdAt: readDate(data.createdAt),
              menteeIds: readStringArray(data.menteeIds),
              mentorId:
                typeof data.mentorId === "string" || data.mentorId === null
                  ? data.mentorId
                  : null,
            };
          });
          set({ mentees: menteeList });
        })(),
      ]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage });
      console.error("Error fetching users:", err);
    } finally {
      set({ loading: false });
    }
  },
}));
