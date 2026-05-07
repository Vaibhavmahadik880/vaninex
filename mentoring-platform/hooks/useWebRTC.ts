"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  DocumentSnapshot,
  DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface WebRTCState {
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
  remoteUserJoined: boolean;
  isInCall: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "failed";
}

export function useWebRTC(
  roomId: string,
  userId: string,
  isInitiator: boolean = false,
) {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isAudioEnabled: true,
    isVideoEnabled: true,
    localStream: null,
    remoteStream: null,
    error: null,
    remoteUserJoined: false,
    isInCall: false,
    connectionStatus: "disconnected",
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Signaling refs
  const roomRef = useRef<DocumentReference | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  useEffect(() => {
    if (roomId) {
      roomRef.current = doc(collection(db, "webrtc_rooms"), roomId);
    }
  }, [roomId]);

  const initializePeerConnection = useCallback(() => {
    try {
      // Create peer connection with STUN servers for NAT traversal
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          // Add TURN servers for production
          {
            urls: "turn:turn.anyfirewall.com:443?transport=tcp",
            credential: "webrtc",
            username: "webrtc",
          },
        ],
      });

      peerConnectionRef.current = pc;

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        setState((prev) => ({
          ...prev,
          remoteStream: remoteStream,
        }));
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && roomRef.current) {
          console.log("Sending ICE candidate");
          // Send ICE candidate to signaling server
          const candidateData = {
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
            userId: userId,
            timestamp: Date.now(),
          };

          await setDoc(
            doc(
              collection(roomRef.current, "candidates"),
              `${userId}_${Date.now()}`,
            ),
            candidateData,
          );
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        const status =
          pc.connectionState === "connected"
            ? "connected"
            : pc.connectionState === "connecting"
              ? "connecting"
              : pc.connectionState === "failed"
                ? "failed"
                : "disconnected";

        setState((prev) => ({
          ...prev,
          isConnected: pc.connectionState === "connected",
          isInCall: pc.connectionState === "connected",
          connectionStatus: status,
        }));
      };

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      return pc;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create peer connection";
      setState((prev) => ({
        ...prev,
        error: message,
        connectionStatus: "failed",
      }));
      return null;
    }
  }, [userId]);

  const getUserMedia = useCallback(async (audioOnly = false) => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: audioOnly
          ? false
          : {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      setState((prev) => ({
        ...prev,
        localStream: stream,
        isAudioEnabled: true,
        isVideoEnabled: !audioOnly,
      }));

      return stream;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to access media devices";
      setState((prev) => ({
        ...prev,
        error: message,
        connectionStatus: "failed",
      }));
      return null;
    }
  }, []);

  const setupSignaling = useCallback(async () => {
    try {
      if (!roomRef.current) {
        throw new Error("No room reference available for signaling");
      }

      // Listen for signaling messages
      unsubscribeRef.current = onSnapshot(
        roomRef.current,
        async (doc: DocumentSnapshot) => {
          const data = doc.data();
          if (!data) return;

          const pc = peerConnectionRef.current;
          if (!pc) return;

          // Handle offer
          if (data.offer && !isInitiator && !pc.localDescription) {
            console.log("Received offer, creating answer");
            setState((prev) => ({
              ...prev,
              remoteUserJoined: true,
              connectionStatus: "connecting",
            }));

            await pc.setRemoteDescription(
              new RTCSessionDescription(data.offer),
            );

            if (pendingCandidatesRef.current.length > 0) {
              await Promise.all(
                pendingCandidatesRef.current.map((candidate) =>
                  pc.addIceCandidate(new RTCIceCandidate(candidate)),
                ),
              );
              pendingCandidatesRef.current = [];
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer back
            if (roomRef.current) {
              await updateDoc(roomRef.current, {
                answer: {
                  type: answer.type,
                  sdp: answer.sdp,
                },
                answerUserId: userId,
              });
            }
          }

          // Handle answer
          if (data.answer && isInitiator && !pc.remoteDescription) {
            console.log("Received answer");
            setState((prev) => ({ ...prev, remoteUserJoined: true }));

            await pc.setRemoteDescription(
              new RTCSessionDescription(data.answer),
            );

            if (pendingCandidatesRef.current.length > 0) {
              await Promise.all(
                pendingCandidatesRef.current.map((candidate) =>
                  pc.addIceCandidate(new RTCIceCandidate(candidate)),
                ),
              );
              pendingCandidatesRef.current = [];
            }
          }
        },
      );

      // Listen for ICE candidates
      const candidatesUnsubscribe = onSnapshot(
        collection(roomRef.current, "candidates"),
        (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const candidateData = change.doc.data();
              if (candidateData.userId !== userId) {
                console.log("Received ICE candidate from remote peer");
                const pc = peerConnectionRef.current;
                if (pc) {
                  const candidate = {
                    candidate: candidateData.candidate,
                    sdpMLineIndex: candidateData.sdpMLineIndex,
                    sdpMid: candidateData.sdpMid,
                  };

                  if (pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                  } else {
                    pendingCandidatesRef.current.push(candidate);
                  }
                }
              }
            }
          });
        },
      );

      // Combine unsubscribers
      const originalUnsubscribe = unsubscribeRef.current;
      unsubscribeRef.current = () => {
        originalUnsubscribe?.();
        candidatesUnsubscribe();
      };
    } catch (error) {
      console.error("Signaling setup error:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to setup signaling",
        connectionStatus: "failed",
      }));
    }
  }, [userId, isInitiator]);

  const startCall = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        error: null,
        connectionStatus: "connecting",
      }));

      // Get media access
      const stream = await getUserMedia(false); // Enable video
      if (!stream) return false;

      // Initialize peer connection
      const pc = initializePeerConnection();
      if (!pc) return false;

      // Setup signaling
      await setupSignaling();

      if (!roomRef.current) {
        throw new Error("Cannot start call without a room reference");
      }

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      if (isInitiator) {
        console.log("Creating offer as initiator");
        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer to signaling server
        await setDoc(
          roomRef.current,
          {
            offer: {
              type: offer.type,
              sdp: offer.sdp,
            },
            initiatorId: userId,
            createdAt: Date.now(),
          },
          { merge: true },
        );
      }

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start call";
      setState((prev) => ({
        ...prev,
        error: message,
        connectionStatus: "failed",
      }));
      return false;
    }
  }, [
    getUserMedia,
    initializePeerConnection,
    setupSignaling,
    isInitiator,
    userId,
  ]);

  const endCall = useCallback(async () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Clean up signaling
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Clean up room data
      try {
        if (roomRef.current) {
          await deleteDoc(roomRef.current);
        }
      } catch {
        // Room might not exist, ignore
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isInCall: false,
        localStream: null,
        remoteStream: null,
        remoteUserJoined: false,
        connectionStatus: "disconnected",
        error: null,
      }));

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to end call";
      setState((prev) => ({ ...prev, error: message }));
      return false;
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setState((prev) => ({
          ...prev,
          isAudioEnabled: audioTrack.enabled,
        }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setState((prev) => ({
          ...prev,
          isVideoEnabled: videoTrack.enabled,
        }));
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    ...state,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    getUserMedia,
  };
}
