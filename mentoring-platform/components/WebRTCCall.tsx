"use client";

import { useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { motion } from "framer-motion";

interface WebRTCCallProps {
  isCallActive: boolean;
  onCallStart: () => void;
  onCallEnd: () => void;
}

export default function WebRTCCall({
  isCallActive,
  onCallStart,
  onCallEnd,
}: WebRTCCallProps) {
  const {
    isConnected,
    isAudioEnabled,
    isVideoEnabled, // eslint-disable-line @typescript-eslint/no-unused-vars
    localStream, // eslint-disable-line @typescript-eslint/no-unused-vars
    remoteStream, // eslint-disable-line @typescript-eslint/no-unused-vars
    error,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTC();

  const [isStarting, setIsStarting] = useState(false);

  const handleStartCall = async () => {
    setIsStarting(true);
    try {
      const success = await startCall();
      if (success) {
        onCallStart();
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndCall = () => {
    endCall();
    onCallEnd();
  };

  if (!isCallActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isConnected ? "Call Connected" : "Starting Call..."}
          </h2>
          <p className="text-gray-600">
            {isConnected
              ? "WebRTC connection established"
              : "Initializing peer connection and accessing microphone"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Connection Status:
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Microphone:
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isAudioEnabled
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isAudioEnabled ? "Enabled" : "Muted"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Video:</span>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
              Audio Only
            </span>
          </div>
        </div>

        {/* Media Controls */}
        {isConnected && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition ${
                isAudioEnabled
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 5.586A2 2 0 017 5V5a2 2 0 114 0v6a2 2 0 01-1.414 1.414L12 17.414l4.586-4.586A2 2 0 0117 11V5a2 2 0 114 0v6a2 2 0 01-2 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={toggleVideo}
              disabled
              className="p-3 rounded-full bg-gray-400 text-white cursor-not-allowed"
              title="Video not available in this phase"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {!isConnected ? (
            <button
              onClick={handleStartCall}
              disabled={isStarting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              {isStarting ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Start Call
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m-6 6.5a9 9 0 1112.5 0M12 6v6l4 2"
                />
              </svg>
              End Call
            </button>
          )}
        </div>

        {/* Technical Info */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          WebRTC Foundation - Phase 7
        </div>
      </motion.div>
    </motion.div>
  );
}
