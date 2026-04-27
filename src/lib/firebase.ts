import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const requiredFirebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseEnv = Object.entries(requiredFirebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const invalidFirebaseEnv = [
  requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  (!requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.includes(".") ||
    requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.startsWith("AIza"))
    ? "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    : null,
].filter((value): value is string => Boolean(value));

export const firebaseConfigIssues = [
  ...missingFirebaseEnv,
  ...invalidFirebaseEnv,
];

export const isFirebaseConfigured = firebaseConfigIssues.length === 0;

const firebaseConfig = {
  apiKey: requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain:
    requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "demo-project.firebaseapp.com",
  projectId:
    requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
  storageBucket:
    requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "demo-project.appspot.com",
  messagingSenderId:
    requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    "0000000000",
  appId:
    requiredFirebaseEnv.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:0000000000:web:demo0000000000",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
