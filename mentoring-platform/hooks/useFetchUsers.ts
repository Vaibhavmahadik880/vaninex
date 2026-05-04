"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  QueryConstraint,
} from "firebase/firestore";
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

export function useFetchUsers(role?: string, filters?: QueryConstraint[]) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        let q: ReturnType<typeof query> | ReturnType<typeof collection> =
          collection(db, "users");

        if (role) {
          q = query(
            collection(db, "users"),
            where("role", "==", role),
            ...(filters || []),
          );
        } else if (filters && filters.length > 0) {
          q = query(collection(db, "users"), ...filters);
        }

        const snapshot = await getDocs(q);
        const usersList: UserProfile[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            email: data.email || "",
            fullName: data.fullName || data.email?.split("@")[0] || "User",
            role: data.role || "mentee",
            createdAt: data.createdAt?.toDate() || new Date(),
            menteeIds: (data.menteeIds as string[]) || [],
            mentorId: (data.mentorId as string | null) || null,
          };
        });

        setUsers(usersList);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role, filters]);

  return { users, loading, error };
}
