"use client";

import { motion } from "framer-motion";
import type { RefObject } from "react";
import type { CallState } from "../hooks/useCallManager";

interface CallInterfaceProps {
  callState: CallState;
  callDuration: number;
  remoteUserId: string | null;
  error: string | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  localMediaRef: RefObject<HTMLVideoElement | HTMLAudioElement | null>;
  remoteMediaRef: RefObject<HTMLVideoElement | HTMLAudioElement | null>;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  remoteLabel?: string;
}

export default function CallInterface({
  callState,
  callDuration,
  remoteUserId,
  error,
  isMuted,
  isVideoEnabled,
  localMediaRef,
  remoteMediaRef,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  remoteLabel,
}: CallInterfaceProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <motion.div
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 to-slate-900 p-6 shadow-2xl"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/70">
            {callState === "calling" ? "Ringing" : "Live call"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {remoteLabel ?? remoteUserId ?? "Assigned participant"}
          </h2>
          <p className="mt-3 font-mono text-3xl text-cyan-300">
            {formatDuration(callDuration)}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-sm text-slate-300">Your media</p>
            <video
              ref={localMediaRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full rounded-lg bg-slate-950 object-cover"
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-sm text-slate-300">Remote media</p>
            <video
              ref={remoteMediaRef}
              autoPlay
              playsInline
              className="aspect-video w-full rounded-lg bg-slate-950 object-cover"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onToggleAudio}
            className="rounded-xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={onToggleVideo}
            className="rounded-xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
          >
            {isVideoEnabled ? "Video off" : "Video on"}
          </button>
          <button
            type="button"
            onClick={onEndCall}
            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            End call
          </button>
        </div>
      </motion.div>
    </div>
  );
}
