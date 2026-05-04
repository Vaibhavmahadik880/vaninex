"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type AuthFormValues = {
  email: string;
  password: string;
  fullName: string;
  role: "mentor" | "mentee";
};

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const googleProvider = new GoogleAuthProvider();
  const { register, handleSubmit } = useForm<AuthFormValues>({
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      role: "mentee",
    },
  });

  const handleAuth: SubmitHandler<AuthFormValues> = async (formData) => {
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
      } else {
        if (!formData.fullName.trim()) {
          throw new Error("Please enter your full name");
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: formData.fullName,
        });

        const userData: {
          email: string;
          fullName: string;
          role: "mentor" | "mentee";
          createdAt: Date;
          menteeIds?: string[];
          mentorId?: string | null;
        } = {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          createdAt: new Date(),
        };

        if (formData.role === "mentor") {
          userData.menteeIds = [];
        } else {
          userData.mentorId = null;
        }

        await setDoc(doc(db, "users", user.uid), userData);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        const userData = {
          email: user.email,
          fullName: user.displayName || user.email?.split("@")[0] || "User",
          role: "mentee",
          createdAt: new Date(),
          mentorId: null,
        };

        await setDoc(doc(db, "users", user.uid), userData);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? "Login" : "Register"}
        </h1>

        <form onSubmit={handleSubmit(handleAuth)} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            {...register("email", { required: true })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              {...register("fullName", { required: !isLogin })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            {...register("password", { required: true })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {!isLogin && (
            <select
              {...register("role", { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:bg-gray-100"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}

        <p className="text-center mt-6 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
