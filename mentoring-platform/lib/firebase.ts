import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// 🔥 Lazy initialization
function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase should only be used on client side");
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// ✅ Export SAME TYPE (no null)
export function getAuthInstance(): Auth {
  return getAuth(getFirebaseApp());
}

export function getDbInstance(): Firestore {
  return getFirestore(getFirebaseApp());
}