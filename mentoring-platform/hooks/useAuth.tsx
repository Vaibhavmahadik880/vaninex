"use client";

import { ReactNode, useEffect } from "react";
import { User } from "firebase/auth";
import { useAuthStore } from "@/store/authStore";

export interface UserData extends User {
  role?: "mentor" | "mentee" | "admin";
  fullName?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => initializeAuth(), [initializeAuth]);

  return <>{children}</>;
}

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const role = useAuthStore((state) => state.role);

  return { user, loading, role };
}
