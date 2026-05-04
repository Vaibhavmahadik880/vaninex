import { create } from "zustand";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { readString } from "@/lib/firestoreData";

export interface UserData extends User {
  role?: "mentor" | "mentee" | "admin";
  fullName?: string;
}

interface AuthStore {
  user: UserData | null;
  role: "mentor" | "mentee" | "admin" | null;
  loading: boolean;
  setUser: (user: UserData | null) => void;
  setRole: (role: "mentor" | "mentee" | "admin" | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  loading: true,

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data();
          const userRole =
            userData?.role === "mentor" || userData?.role === "admin"
              ? userData.role
              : "mentee";
          const fullName =
            readString(userData?.fullName) ||
            firebaseUser.displayName ||
            "User";

          set({
            user: { ...firebaseUser, role: userRole, fullName } as UserData,
            role: userRole,
            loading: false,
          });
        } catch (error) {
          console.error("Error fetching user role:", error);
          set({
            user: firebaseUser as UserData,
            loading: false,
          });
        }
      } else {
        set({
          user: null,
          role: null,
          loading: false,
        });
      }
    });

    return unsubscribe;
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, role: null });
  },
}));
