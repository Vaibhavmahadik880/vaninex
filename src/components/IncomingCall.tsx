"use client";

import { motion } from "framer-motion";

interface IncomingCallProps {
  callerId: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCall({
  callerId,
  onAccept,
  onReject,
}: IncomingCallProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 to-slate-900 p-10 text-center shadow-2xl"
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500 text-lg font-semibold text-slate-950"
          animate={{ scale: [1, 1.08, 1], opacity: [1, 0.72, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Call
        </motion.div>

        <h2 className="text-3xl font-bold text-white">Incoming call</h2>
        <p className="mt-3 break-words text-zinc-300">{callerId}</p>

        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            className="rounded-full bg-red-600 px-7 py-3 font-semibold text-white transition hover:bg-red-700"
            onClick={onReject}
          >
            Reject
          </button>
          <button
            type="button"
            className="rounded-full bg-emerald-500 px-7 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            onClick={onAccept}
          >
            Accept
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
