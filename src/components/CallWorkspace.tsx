"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import type { CallRoomSignal, UserRole } from "../types";

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

type CallStage =
  | "idle"
  | "preparing"
  | "ringing"
  | "joining"
  | "connected"
  | "ended"
  | "error";

function formatTimestamp(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function clearCollection(pathRef: ReturnType<typeof collection>) {
  const snapshot = await getDocs(pathRef);

  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
}

export default function CallWorkspace({
  assignmentId,
  currentEmail,
  currentRole,
  partnerEmail,
  partnerName,
}: {
  assignmentId: string;
  currentEmail: string;
  currentRole: UserRole;
  partnerEmail: string;
  partnerName?: string | null;
}) {
  const roomRef = doc(db, "callRooms", assignmentId);
  const callerCandidatesRef = collection(roomRef, "callerCandidates");
  const calleeCandidatesRef = collection(roomRef, "calleeCandidates");

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const roomListenerRef = useRef<(() => void) | null>(null);
  const candidateListenerRef = useRef<(() => void) | null>(null);

  const [roomSignal, setRoomSignal] = useState<CallRoomSignal | null>(null);
  const [callStage, setCallStage] = useState<CallStage>("idle");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Your assigned room is ready for a live audio call.",
  );
  const [isMuted, setIsMuted] = useState(false);
  const [hasLocalAudio, setHasLocalAudio] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRoomSignal(null);
        return;
      }

      setRoomSignal(snapshot.data() as CallRoomSignal);
    });

    return () => {
      unsubscribe();
    };
  }, [assignmentId, roomRef]);

  useEffect(() => {
    if (localAudioRef.current && localStreamRef.current) {
      localAudioRef.current.srcObject = localStreamRef.current;
    }

    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callStage]);

  function stopSnapshotListeners() {
    roomListenerRef.current?.();
    candidateListenerRef.current?.();
    roomListenerRef.current = null;
    candidateListenerRef.current = null;
  }

  async function teardownConnection(markEnded: boolean) {
    stopSnapshotListeners();

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setHasLocalAudio(false);
    setIsMuted(false);

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    if (markEnded) {
      try {
        await updateDoc(roomRef, {
          status: "ended",
          endedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Ignore if room does not exist or update fails after disconnect.
      }
    }

    setCallStage("ended");
    setStatusMessage("Call ended.");
  }

  useEffect(() => {
    return () => {
      stopSnapshotListeners();
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const ensureLocalStream = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;
    setHasLocalAudio(true);

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
    }

    return stream;
  };

  const createPeerConnection = async () => {
    const stream = await ensureLocalStream();
    const peerConnection = new RTCPeerConnection(rtcConfig);
    const remoteStream = new MediaStream();

    remoteStreamRef.current = remoteStream;
    peerConnectionRef.current = peerConnection;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;

      if (state === "connected") {
        setCallStage("connected");
        setStatusMessage("Live audio call connected.");
      }

      if (state === "failed" || state === "disconnected" || state === "closed") {
        setCallStage("ended");
        setStatusMessage("Call connection closed.");
      }
    };

    return peerConnection;
  };

  const startCall = async () => {
    try {
      setCallStage("preparing");
      setStatusMessage("Preparing microphone and call room...");

      await clearCollection(callerCandidatesRef);
      await clearCollection(calleeCandidatesRef);

      const peerConnection = await createPeerConnection();

      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(callerCandidatesRef, event.candidate.toJSON());
        }
      };

      roomListenerRef.current = onSnapshot(roomRef, async (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data() as CallRoomSignal;

        if (
          data.answer &&
          !peerConnection.currentRemoteDescription &&
          data.callerEmail === currentEmail
        ) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );
          setStatusMessage("Partner joined. Establishing the call...");
        }

        if (data.status === "ended") {
          await teardownConnection(false);
        }
      });

      candidateListenerRef.current = onSnapshot(
        calleeCandidatesRef,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const candidate = new RTCIceCandidate(change.doc.data());
              void peerConnection.addIceCandidate(candidate);
            }
          });
        },
      );

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const payload: CallRoomSignal = {
        assignmentId,
        callerEmail: currentEmail,
        calleeEmail: partnerEmail,
        status: "ringing",
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(roomRef, payload);

      setCallStage("ringing");
      setStatusMessage("Calling your assigned partner...");
    } catch (error) {
      setCallStage("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to start the call.",
      );
    }
  };

  const answerCall = async () => {
    try {
      setCallStage("joining");
      setStatusMessage("Joining the incoming call...");

      const snapshot = await getDoc(roomRef);

      if (!snapshot.exists()) {
        throw new Error("No incoming call was found for this room.");
      }

      const data = snapshot.data() as CallRoomSignal;

      if (!data.offer) {
        throw new Error("The incoming call offer is missing.");
      }

      const peerConnection = await createPeerConnection();

      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(calleeCandidatesRef, event.candidate.toJSON());
        }
      };

      roomListenerRef.current = onSnapshot(roomRef, async (roomSnapshot) => {
        if (!roomSnapshot.exists()) {
          return;
        }

        const roomData = roomSnapshot.data() as CallRoomSignal;

        if (roomData.status === "ended") {
          await teardownConnection(false);
        }
      });

      candidateListenerRef.current = onSnapshot(
        callerCandidatesRef,
        (candidateSnapshot) => {
          candidateSnapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const candidate = new RTCIceCandidate(change.doc.data());
              void peerConnection.addIceCandidate(candidate);
            }
          });
        },
      );

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer),
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await updateDoc(roomRef, {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
        status: "ongoing",
        answeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setCallStage("connected");
      setStatusMessage("Answer sent. Connecting the live audio call...");
    } catch (error) {
      setCallStage("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to answer the call.",
      );
    }
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    const nextMuted = !isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const canAnswer =
    roomSignal?.status === "ringing" &&
    roomSignal.callerEmail !== currentEmail &&
    roomSignal.calleeEmail === currentEmail;
  const isCaller =
    !!roomSignal &&
    roomSignal.callerEmail === currentEmail &&
    roomSignal.status !== "ended";
  const hasLiveCall =
    roomSignal?.status === "ongoing" || callStage === "connected";

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Live audio call
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {partnerName ?? partnerEmail}
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          Room {assignmentId.slice(0, 18)}...
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            You
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{currentEmail}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Role: {currentRole}
          </p>
          <audio ref={localAudioRef} autoPlay muted playsInline className="hidden" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Assigned partner
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {partnerName ?? partnerEmail}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {partnerEmail}
          </p>
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <p className="text-sm leading-6 text-slate-200">{statusMessage}</p>
        {roomSignal && (
          <div className="mt-3 grid gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-3">
            <span>Status: {roomSignal.status}</span>
            <span>Started: {formatTimestamp(roomSignal.startedAt)}</span>
            <span>
              {roomSignal.answeredAt
                ? `Answered: ${formatTimestamp(roomSignal.answeredAt)}`
                : "Waiting for answer"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!roomSignal || roomSignal.status === "ended" ? (
          <button
            type="button"
            onClick={() => void startCall()}
            disabled={callStage === "preparing" || callStage === "joining"}
            className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start call
          </button>
        ) : canAnswer ? (
          <button
            type="button"
            onClick={() => void answerCall()}
            disabled={callStage === "preparing" || callStage === "joining"}
            className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Answer call
          </button>
        ) : isCaller ? (
          <button
            type="button"
            disabled
            className="rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white opacity-80"
          >
            Waiting for answer
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white opacity-80"
          >
            Call already in progress
          </button>
        )}

        <button
          type="button"
          onClick={toggleMute}
          disabled={!hasLiveCall && !hasLocalAudio}
          className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMuted ? "Unmute mic" : "Mute mic"}
        </button>

        <button
          type="button"
          onClick={() => void teardownConnection(true)}
          disabled={!roomSignal || roomSignal.status === "ended"}
          className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-5 py-3 font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          End call
        </button>
      </div>
    </div>
  );
}
