"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AppSettings {
  videoCallsEnabled: boolean;
  audioOnlyDefault: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  videoCallsEnabled: true,
  audioOnlyDefault: true,
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription to settings
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        doc(db, "config", "appSettings"),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setSettings({
              ...DEFAULT_SETTINGS,
              ...docSnapshot.data(),
            });
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching settings:", err);
          setError(err.message);
          setSettings(DEFAULT_SETTINGS);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up settings listener:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      try {
        setError(null);
        const settingsRef = doc(db, "config", "appSettings");
        await setDoc(
          settingsRef,
          {
            ...settings,
            ...updates,
            updatedAt: new Date(),
          },
          { merge: true },
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update settings";
        setError(message);
        console.error("Error updating settings:", err);
      }
    },
    [settings],
  );

  return { settings, loading, error, updateSettings };
};
