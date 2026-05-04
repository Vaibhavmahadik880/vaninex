import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const isBrowser = typeof window !== "undefined";

const app = isBrowser
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : undefined;

// ✅ Use correct types instead of `any`
export const auth: Auth = isBrowser
  ? getAuth(app!)
  : ({} as unknown as Auth);

export const db: Firestore = isBrowser
  ? getFirestore(app!)
  : ({} as unknown as Firestore);