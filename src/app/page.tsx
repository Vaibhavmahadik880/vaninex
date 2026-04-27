"use client";

import { useAuth } from "../lib/auth-context";
import Login from "../components/Login";
import EnhancedDashboard from "../components/EnhancedDashboard";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? <EnhancedDashboard /> : <Login />;
}
