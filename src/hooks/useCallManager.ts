"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Unsubscribe } from "firebase/firestore";

import {
  addCallCandidate,
  createCall,
  createCallSession,
  subscribeCall,
  subscribeCallCandidates,
  subscribeIncomingCalls,
  updateCall,
  updateCallSession,
  type CallDoc,
} from "../lib/firestore";

export type CallState =
  | "idle"
  | "calling"
  | "ringing"
  | "accepted"
  | "ongoing"
  | "ended"
  | "missed";

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useCallManager = (userId: string) => {
  const [callState, setCallState] = useState<CallState>("idle");
  const [currentCall, setCurrentCall] = useState<CallDoc | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallDoc | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(
    null,
  );
  const remoteMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(
    null,
  );
  const callUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const candidateUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const answeredRef = useRef(false);
  const callStartTimeRef = useRef<number | null>(null);

  const stopRealtimeListeners = useCallback(() => {
    callUnsubscribeRef.current?.();
    candidateUnsubscribeRef.current?.();
    callUnsubscribeRef.current = null;
    candidateUnsubscribeRef.current = null;
  }, []);

  const attachStreams = useCallback(() => {
    if (localMediaRef.current && localStreamRef.current) {
      localMediaRef.current.srcObject = localStreamRef.current;
    }

    if (remoteMediaRef.current && remoteStreamRef.current) {
      remoteMediaRef.current.srcObject = remoteStreamRef.current;
    }
  }, []);

  const resetLocalState = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerConnectionRef.current?.close();

    if (localMediaRef.current) {
      localMediaRef.current.srcObject = null;
    }

    if (remoteMediaRef.current) {
      remoteMediaRef.current.srcObject = null;
    }

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    peerConnectionRef.current = null;
    answeredRef.current = false;
    callStartTimeRef.current = null;
    setIsMuted(false);
    setIsVideoEnabled(false);
  }, []);

  const ensureLocalStream = useCallback(
    async (withVideo = false) => {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support microphone access.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });

      localStreamRef.current = stream;
      setIsVideoEnabled(withVideo);
      attachStreams();

      return stream;
    },
    [attachStreams],
  );

  const createPeerConnection = useCallback(
    (stream: MediaStream, callId: string, side: "caller" | "callee") => {
      const peerConnection = new RTCPeerConnection(rtcConfig);
      const remoteStream = new MediaStream();

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        remoteStreamRef.current = remoteStream;
        attachStreams();
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          void addCallCandidate(callId, side, event.candidate.toJSON());
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          setCallState("ongoing");
          setError(null);
        }

        if (
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "disconnected"
        ) {
          setError("The call connection was interrupted.");
        }
      };

      remoteStreamRef.current = remoteStream;
      peerConnectionRef.current = peerConnection;
      attachStreams();

      return peerConnection;
    },
    [attachStreams],
  );

  const listenToCall = useCallback(
    (callId: string, side: "caller" | "callee") => {
      callUnsubscribeRef.current?.();
      candidateUnsubscribeRef.current?.();

      callUnsubscribeRef.current = subscribeCall(
        callId,
        async (nextCall) => {
          if (!nextCall) {
            return;
          }

          setCurrentCall(nextCall);
          setRemoteUserId(
            nextCall.callerId === userId
              ? nextCall.receiverId
              : nextCall.callerId,
          );

          if (nextCall.status === "ongoing" || nextCall.status === "accepted") {
            setCallState("ongoing");
            if (!callStartTimeRef.current) {
              callStartTimeRef.current = Date.now();
            }
          }

          if (
            side === "caller" &&
            nextCall.answer &&
            peerConnectionRef.current &&
            !answeredRef.current
          ) {
            answeredRef.current = true;
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(nextCall.answer),
            );
            setCallState("ongoing");
          }

          if (nextCall.status === "ended" || nextCall.status === "missed") {
            setCallState(nextCall.status === "missed" ? "missed" : "ended");
            stopRealtimeListeners();
            resetLocalState();
          }
        },
        (nextError) => setError(nextError.message),
      );

      candidateUnsubscribeRef.current = subscribeCallCandidates(
        callId,
        side === "caller" ? "callee" : "caller",
        async (candidate) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          }
        },
        (nextError) => setError(nextError.message),
      );
    },
    [resetLocalState, stopRealtimeListeners, userId],
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeIncomingCalls(
      userId,
      (call) => {
        setIncomingCall(call);
        if (call && callState === "idle") {
          setCallState("ringing");
          setRemoteUserId(call.callerId);
        }
      },
      (nextError) => setError(nextError.message),
    );
  }, [callState, userId]);

  useEffect(() => {
    if (callState !== "ongoing") {
      return;
    }

    const interval = window.setInterval(() => {
      if (!callStartTimeRef.current) {
        return;
      }

      setCallDuration(
        Math.max(0, Math.floor((Date.now() - callStartTimeRef.current) / 1000)),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    return () => {
      stopRealtimeListeners();
      resetLocalState();
    };
  }, [resetLocalState, stopRealtimeListeners]);

  const initiateCall = useCallback(
    async (recipientId: string, withVideo = false) => {
      if (!userId) {
        throw new Error("Sign in before starting a call.");
      }

      try {
        setError(null);
        setCallDuration(0);
        setRemoteUserId(recipientId);
        setCallState("calling");
        resetLocalState();

        const callId = await createCall({
          callerId: userId,
          receiverId: recipientId,
          mentorId: userId,
          menteeId: recipientId,
          status: "ringing",
          startTime: new Date(),
        });

        const stream = await ensureLocalStream(withVideo);
        const peerConnection = createPeerConnection(stream, callId, "caller");
        const offer = await peerConnection.createOffer();

        await peerConnection.setLocalDescription(offer);
        await updateCall(callId, {
          offer: { type: offer.type, sdp: offer.sdp },
          status: "ringing",
        });

        const sessionId = await createCallSession({
          callId,
          participants: [userId, recipientId],
          startTime: new Date(),
          status: "missed",
        });

        setCurrentSessionId(sessionId);
        listenToCall(callId, "caller");
      } catch (err) {
        resetLocalState();
        setCallState("idle");
        setError(err instanceof Error ? err.message : "Failed to start call.");
      }
    },
    [
      createPeerConnection,
      ensureLocalStream,
      listenToCall,
      resetLocalState,
      userId,
    ],
  );

  const acceptCall = useCallback(
    async (callId?: string, withVideo = false) => {
      const callToAccept = callId
        ? currentCall?.id === callId
          ? currentCall
          : incomingCall
        : incomingCall;

      if (!callToAccept?.offer) {
        setError("The incoming call is missing its WebRTC offer.");
        return;
      }

      try {
        setError(null);
        setCallDuration(0);
        setCurrentCall(callToAccept);
        setRemoteUserId(callToAccept.callerId);
        setCallState("accepted");
        resetLocalState();

        const stream = await ensureLocalStream(withVideo);
        const peerConnection = createPeerConnection(
          stream,
          callToAccept.id,
          "callee",
        );

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(callToAccept.offer),
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await updateCall(callToAccept.id, {
          answer: { type: answer.type, sdp: answer.sdp },
          status: "ongoing",
        });

        const sessionId = await createCallSession({
          callId: callToAccept.id,
          participants: [callToAccept.callerId, userId],
          startTime: new Date(),
          status: "missed",
        });

        setCurrentSessionId(sessionId);
        callStartTimeRef.current = Date.now();
        listenToCall(callToAccept.id, "callee");
        setIncomingCall(null);
        setCallState("ongoing");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept call.");
      }
    },
    [
      createPeerConnection,
      currentCall,
      ensureLocalStream,
      incomingCall,
      listenToCall,
      resetLocalState,
      userId,
    ],
  );

  const rejectCall = useCallback(
    async (callId?: string) => {
      const targetCallId = callId ?? incomingCall?.id ?? currentCall?.id;

      if (!targetCallId) {
        return;
      }

      await updateCall(targetCallId, {
        status: "missed",
        endTime: new Date(),
      });

      setIncomingCall(null);
      setCallState("idle");
      resetLocalState();
    },
    [currentCall?.id, incomingCall?.id, resetLocalState],
  );

  const endCall = useCallback(
    async (status: "completed" | "missed" = "completed") => {
      const targetCallId = currentCall?.id;
      const duration =
        callStartTimeRef.current === null
          ? callDuration
          : Math.floor((Date.now() - callStartTimeRef.current) / 1000);

      try {
        if (targetCallId) {
          await updateCall(targetCallId, {
            status: status === "completed" ? "ended" : "missed",
            endTime: new Date(),
            duration,
          });
        }

        if (currentSessionId) {
          await updateCallSession(currentSessionId, {
            endTime: new Date(),
            duration,
            status,
          });
        }
      } finally {
        stopRealtimeListeners();
        resetLocalState();
        setCallState(status === "completed" ? "ended" : "missed");
        setCurrentCall(null);
        setIncomingCall(null);
        setCurrentSessionId(null);
        setCallDuration(0);
      }
    },
    [
      callDuration,
      currentCall?.id,
      currentSessionId,
      resetLocalState,
      stopRealtimeListeners,
    ],
  );

  const toggleAudio = useCallback(() => {
    const nextMuted = !isMuted;

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
  }, [isMuted]);

  const toggleVideo = useCallback(async () => {
    const stream = localStreamRef.current;

    if (!stream) {
      try {
        // Get video if no stream exists
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoStream.getVideoTracks().forEach((track) => {
          stream?.addTrack(track);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
        setIsVideoEnabled(true);
        attachStreams();
      } catch (err) {
        console.error("Failed to enable video:", err);
        setError("Failed to enable video. Check permissions.");
      }
      return;
    }

    const videoTracks = stream.getVideoTracks();

    if (videoTracks.length === 0) {
      // No video tracks, try to add video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        videoStream.getVideoTracks().forEach((track) => {
          stream.addTrack(track);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
        setIsVideoEnabled(true);
      } catch (err) {
        console.error("Failed to add video:", err);
        setError("Failed to enable video. Check permissions.");
      }
    } else {
      // Stop video tracks
      videoTracks.forEach((track) => {
        track.stop();
        stream.removeTrack(track);
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track === track);
          if (sender) {
            void peerConnectionRef.current.removeTrack(sender);
          }
        }
      });
      setIsVideoEnabled(false);
    }

    attachStreams();
  }, [attachStreams]);

  return {
    callState,
    currentCall,
    incomingCall,
    currentCallId: currentCall?.id ?? null,
    currentSessionId,
    callDuration,
    remoteUserId,
    error,
    isMuted,
    isVideoEnabled,
    localMediaRef,
    remoteMediaRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    attachStreams,
  };
};
