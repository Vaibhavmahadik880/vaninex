import { create } from "zustand";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  mentors: UserProfile[];
  mentees: UserProfile[];
  loading: boolean;
  error: string | null;
  fetchMentors: () => Promise<void>;
  fetchMentees: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUsersStore = create<UsersStore>((set) => ({
  mentors: [],
  mentees: [],
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchMentors: async () => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, "users"), where("role", "==", "mentor"));
      const snapshot = await getDocs(q);
      const mentorList: UserProfile[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          email: (data.email as string) || "",
          fullName:
            (data.fullName as string) ||
            (data.email as string)?.split("@")[0] ||
            "User",
          role: (data.role as "mentor") || "mentor",
          createdAt: (data.createdAt as any)?.toDate() || new Date(),
          menteeIds: (data.menteeIds as string[]) || [],
          mentorId: (data.mentorId as string | null) || null,
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
        return {
          id: doc.id,
          email: (data.email as string) || "",
          fullName:
            (data.fullName as string) ||
            (data.email as string)?.split("@")[0] ||
            "User",
          role: (data.role as "mentee") || "mentee",
          createdAt: (data.createdAt as any)?.toDate() || new Date(),
          menteeIds: (data.menteeIds as string[]) || [],
          mentorId: (data.mentorId as string | null) || null,
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
            return {
              id: doc.id,
              email: (data.email as string) || "",
              fullName:
                (data.fullName as string) ||
                (data.email as string)?.split("@")[0] ||
                "User",
              role: (data.role as "mentor") || "mentor",
              createdAt: (data.createdAt as any)?.toDate() || new Date(),
              menteeIds: (data.menteeIds as string[]) || [],
              mentorId: (data.mentorId as string | null) || null,
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
            return {
              id: doc.id,
              email: (data.email as string) || "",
              fullName:
                (data.fullName as string) ||
                (data.email as string)?.split("@")[0] ||
                "User",
              role: (data.role as "mentee") || "mentee",
              createdAt: (data.createdAt as any)?.toDate() || new Date(),
              menteeIds: (data.menteeIds as string[]) || [],
              mentorId: (data.mentorId as string | null) || null,
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
