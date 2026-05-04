"use client";

import { useEffect } from "react";
import { QueryConstraint } from "firebase/firestore";
import { useUsersStore } from "@/store/usersStore";

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
  const users = useUsersStore((state) => state.users);
  const mentors = useUsersStore((state) => state.mentors);
  const mentees = useUsersStore((state) => state.mentees);
  const loading = useUsersStore((state) => state.loading);
  const error = useUsersStore((state) => state.error);
  const fetchUsers = useUsersStore((state) => state.fetchUsers);

  useEffect(() => {
    fetchUsers(role, filters);
  }, [fetchUsers, role, filters]);

  const selectedUsers =
    role === "mentor" ? mentors : role === "mentee" ? mentees : users;

  return { users: selectedUsers, loading, error };
}
