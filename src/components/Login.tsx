"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import {
  auth,
  firebaseConfigIssues,
  isFirebaseConfigured,
  googleProvider,
} from "../lib/firebase";
import { createOrUpdateUser, getUser } from "../lib/firestore";
import { ensureUserProfile, getProfileByEmail } from "../lib/workspace-store";
import {
  containerStagger,
  itemVariant,
  fadeInUp,
  fadeInScale,
} from "../lib/animations";
import type { UserRole } from "../types";

const roleCards: Array<{
  role: UserRole;
  title: string;
  description: string;
}> = [
  {
    role: "mentor",
    title: "Mentor Login",
    description:
      "Guide mentees, review assignments, and continue coaching conversations.",
  },
  {
    role: "mentee",
    title: "Mentee Login",
    description:
      "Join your assigned mentor, prepare talking points, and practice confidently.",
  },
  {
    role: "admin",
    title: "Admin Login",
    description:
      "Create accounts, assign mentors to mentees, and unlock conversations.",
  },
];

function deriveNameFromEmail(email: string) {
  return email.split("@")[0].replace(/[._-]+/g, " ");
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("mentor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"info" | "error" | "success">(
    "info",
  );

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      setStatusMessage(
        "Firebase is not fully configured yet. Add the missing environment variables to enable authentication.",
      );
      setStatusType("error");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const storedProfile = getProfileByEmail(result.user.email ?? "");
      const firestoreProfile = await getUser(result.user.uid);
      const accountRole =
        (firestoreProfile?.role as UserRole | undefined) ??
        storedProfile?.role ??
        selectedRole;

      if (accountRole !== selectedRole) {
        await signOut(auth);
        throw new Error(
          `This account is registered as ${accountRole}. Please use the ${accountRole} login layer.`,
        );
      }

      ensureUserProfile({
        uid: result.user.uid,
        email: result.user.email ?? "",
        role: accountRole,
        name:
          (firestoreProfile?.name as string | undefined) ??
          storedProfile?.name ??
          result.user.displayName ??
          result.user.email?.split("@")[0] ??
          "User",
      });

      await createOrUpdateUser(result.user.uid, {
        id: result.user.uid,
        email: result.user.email ?? "",
        role: accountRole,
        name:
          (firestoreProfile?.name as string | undefined) ??
          storedProfile?.name ??
          result.user.displayName ??
          result.user.email?.split("@")[0] ??
          "User",
        lastLogin: new Date(),
      });

      setStatusMessage(`Signed in to the ${accountRole} workspace via Google.`);
      setStatusType("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
              .replace("Firebase: ", "")
              .replace(/\(auth\/.*\)\.?/, "")
              .trim()
          : "Something went wrong with Google sign-in.";

      setStatusMessage(message);
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFirebaseConfigured) {
      setStatusMessage(
        "Firebase is not fully configured yet. Add the missing environment variables to enable authentication.",
      );
      setStatusType("error");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        ensureUserProfile({
          uid: credential.user.uid,
          email: credential.user.email ?? email,
          role: selectedRole,
          name: fullName.trim() || deriveNameFromEmail(email),
        });
        await createOrUpdateUser(credential.user.uid, {
          id: credential.user.uid,
          email: credential.user.email ?? email,
          role: selectedRole,
          name: fullName.trim() || deriveNameFromEmail(email),
          createdAt: new Date(),
          menteeIds: [],
          mentorId: null,
        });

        setStatusMessage(`Created ${selectedRole} account successfully.`);
        setStatusType("success");
      } else {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const storedProfile = getProfileByEmail(email);
        const firestoreProfile = await getUser(credential.user.uid);
        const accountRole =
          (firestoreProfile?.role as UserRole | undefined) ??
          storedProfile?.role ??
          selectedRole;

        if (accountRole !== selectedRole) {
          await signOut(auth);
          throw new Error(
            `This account is registered as ${accountRole}. Please use the ${accountRole} login layer.`,
          );
        }

        ensureUserProfile({
          uid: credential.user.uid,
          email: credential.user.email ?? email,
          role: accountRole,
          name:
            (firestoreProfile?.name as string | undefined) ??
            storedProfile?.name ??
            deriveNameFromEmail(email),
        });
        await createOrUpdateUser(credential.user.uid, {
          id: credential.user.uid,
          email: credential.user.email ?? email,
          role: accountRole,
          name:
            (firestoreProfile?.name as string | undefined) ??
            storedProfile?.name ??
            deriveNameFromEmail(email),
          lastLogin: new Date(),
        });

        setStatusMessage(`Signed in to the ${selectedRole} workspace.`);
        setStatusType("success");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
              .replace("Firebase: ", "")
              .replace(/\(auth\/.*\)\.?/, "")
              .trim()
          : "Something went wrong while signing you in.";

      setStatusMessage(message);
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = () => {
    switch (statusType) {
      case "error":
        return "border-red-400/30 bg-red-500/10 text-red-100";
      case "success":
        return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
      default:
        return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] px-4 py-8 text-white sm:px-6 sm:py-12">
      <motion.div
        className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        variants={containerStagger}
        initial="initial"
        animate="animate"
      >
        {/* Left Section - Role Cards */}
        <motion.section
          className="space-y-4 sm:space-y-6"
          variants={itemVariant}
        >
          <motion.p
            className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs sm:text-sm text-cyan-100"
            variants={fadeInUp}
          >
            Role-based communication workspace
          </motion.p>

          <div className="space-y-3 sm:space-y-4">
            <motion.h1
              className="max-w-2xl text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance leading-tight"
              variants={fadeInUp}
            >
              Separate access for mentor, mentee, and admin.
            </motion.h1>
            <motion.p
              className="max-w-2xl text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-slate-300"
              variants={fadeInUp}
            >
              Admins can assign mentors to mentees, and assigned pairs can move
              straight into a shared conversation board.
            </motion.p>
          </div>

          <motion.div
            className="grid gap-3 sm:gap-4"
            variants={containerStagger}
          >
            {roleCards.map((item) => {
              const isActive = item.role === selectedRole;

              return (
                <motion.button
                  key={item.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(item.role);
                    setStatusMessage(null);
                  }}
                  className={`rounded-xl sm:rounded-[1.5rem] border p-3 sm:p-5 text-left transition ${
                    isActive
                      ? "border-cyan-300 bg-cyan-400/10 shadow-[0_24px_60px_-30px_rgba(14,165,233,0.7)]"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  }`}
                  variants={itemVariant}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg font-semibold text-white line-clamp-1">
                        {item.title}
                      </h2>
                      <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-300 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 sm:px-3 py-1 text-xs uppercase tracking-[0.25em] whitespace-nowrap ${
                        isActive
                          ? "bg-cyan-300 text-slate-950"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {item.role}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Right Section - Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="rounded-2xl sm:rounded-[2rem] border border-white/10 bg-slate-950/75 p-4 sm:p-6 lg:p-8 shadow-2xl shadow-cyan-950/40 backdrop-blur"
          variants={fadeInScale}
        >
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
                {selectedRole}
              </p>
              <h2 className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold">
                {isSignUp ? "Create role account" : "Enter workspace"}
              </h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 p-1 text-xs sm:text-sm w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setStatusMessage(null);
                }}
                className={`rounded-full px-3 sm:px-4 py-2 transition ${
                  !isSignUp ? "bg-cyan-400 text-slate-950" : "text-slate-300"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setStatusMessage(null);
                }}
                className={`rounded-full px-3 sm:px-4 py-2 transition ${
                  isSignUp ? "bg-cyan-400 text-slate-950" : "text-slate-300"
                }`}
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Firebase Config Warning */}
          {!isFirebaseConfigured && (
            <motion.div
              className="mb-4 sm:mb-5 rounded-xl sm:rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 sm:p-4 text-xs sm:text-sm text-amber-100"
              variants={fadeInUp}
            >
              <p className="font-medium">Firebase setup is incomplete.</p>
              <p className="mt-1 sm:mt-2 leading-5 sm:leading-6 text-amber-50/85">
                Fix these Firebase environment values to enable login:
              </p>
              <p className="mt-1 sm:mt-2 break-words font-mono text-xs leading-5 sm:leading-6 text-amber-100/90 max-h-20 overflow-y-auto">
                {firebaseConfigIssues.join(", ")}
              </p>
            </motion.div>
          )}

          {/* Form Fields */}
          <motion.div
            className="space-y-3 sm:space-y-4"
            variants={containerStagger}
          >
            {isSignUp && (
              <motion.label className="block" variants={itemVariant}>
                <span className="mb-1 sm:mb-2 block text-xs sm:text-sm text-slate-300 font-medium">
                  Full name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:bg-white/8"
                  required
                />
              </motion.label>
            )}

            <motion.label className="block" variants={itemVariant}>
              <span className="mb-1 sm:mb-2 block text-xs sm:text-sm text-slate-300 font-medium">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:bg-white/8"
                required
              />
            </motion.label>

            <motion.label className="block" variants={itemVariant}>
              <span className="mb-1 sm:mb-2 block text-xs sm:text-sm text-slate-300 font-medium">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isSignUp ? "Create a secure password" : "Enter your password"
                }
                className="w-full rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:bg-white/8"
                required
                minLength={6}
              />
            </motion.label>
          </motion.div>

          {/* Status Message */}
          {statusMessage && (
            <motion.div
              className={`mt-3 sm:mt-4 rounded-lg sm:rounded-2xl border p-3 sm:p-4 text-xs sm:text-sm leading-5 sm:leading-6 ${getStatusStyles()}`}
              variants={fadeInUp}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {statusMessage}
            </motion.div>
          )}

          {/* Email/Password Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 sm:mt-6 w-full rounded-lg sm:rounded-2xl bg-cyan-400 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variants={itemVariant}
          >
            {isSubmitting
              ? "Please wait..."
              : isSignUp
                ? `Create ${selectedRole} account`
                : `Login as ${selectedRole}`}
          </motion.button>

          {/* Google Sign-In Button */}
          {!isSignUp && (
            <motion.div
              className="mt-3 sm:mt-4 space-y-3 sm:space-y-4"
              variants={itemVariant}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <p className="text-xs sm:text-sm text-slate-400">
                  Or continue with
                </p>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || !isFirebaseConfigured}
                className="w-full rounded-lg sm:rounded-2xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="hidden sm:inline">Google</span>
                <span className="sm:hidden">Sign in with Google</span>
              </motion.button>
            </motion.div>
          )}

          {/* Footer Text */}
          <motion.p
            className="mt-4 sm:mt-6 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-400"
            variants={itemVariant}
          >
            Choose the correct layer before signing in. Admin accounts can
            assign mentors to mentees after login.
          </motion.p>
        </motion.form>
      </motion.div>
    </div>
  );
}
