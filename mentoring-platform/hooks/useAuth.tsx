"use client";

import {
  useEffect,
  useState,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserData extends User {
  role?: "mentor" | "mentee" | "admin";
  fullName?: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  role: "mentor" | "mentee" | "admin" | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"mentor" | "mentee" | "admin" | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data();
          const userRole = userData?.role || "mentee";
          const fullName =
            userData?.fullName || firebaseUser.displayName || "User";

          setUser({ ...firebaseUser, role: userRole, fullName } as UserData);
          setRole(userRole);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUser(firebaseUser as UserData);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
