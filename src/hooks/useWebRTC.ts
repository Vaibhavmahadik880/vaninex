"use client";

import { useState, useRef } from "react";

interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

const config: WebRTCConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useWebRTC = () => {
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Initialize local audio stream
  const initializeLocalStream = async (audioOnly: boolean = true) => {
    try {
      setError(null);
      const constraints = audioOnly
        ? { audio: true }
        : { audio: true, video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to access microphone";
      setError(errorMsg);
      console.error("Media access error:", err);
      throw err;
    }
  };

  // Initialize peer connection
  const initializePeerConnection = (stream: MediaStream) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: config.iceServers });

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log("Remote track received:", event.track.kind);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
        setRemoteStream(event.streams[0]);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate:", event.candidate);
          // Send candidate to signaling server
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          setError("Connection lost");
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      setPeerConnection(pc);
      return pc;
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to initialize peer connection";
      setError(errorMsg);
      console.error("Peer connection error:", err);
      throw err;
    }
  };

  // Create offer
  const createOffer = async (pc: RTCPeerConnection) => {
    try {
      setError(null);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create offer";
      setError(errorMsg);
      console.error("Create offer error:", err);
      throw err;
    }
  };

  // Create answer
  const createAnswer = async (
    pc: RTCPeerConnection,
    offer: RTCSessionDescriptionInit,
  ) => {
    try {
      setError(null);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create answer";
      setError(errorMsg);
      console.error("Create answer error:", err);
      throw err;
    }
  };

  // Add answer to remote description
  const setRemoteAnswer = async (
    pc: RTCPeerConnection,
    answer: RTCSessionDescriptionInit,
  ) => {
    try {
      setError(null);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to set remote answer";
      setError(errorMsg);
      console.error("Set remote answer error:", err);
      throw err;
    }
  };

  // Add ICE candidate
  const addIceCandidate = async (
    pc: RTCPeerConnection,
    candidate: RTCIceCandidateInit,
  ) => {
    try {
      setError(null);
      if (candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("Add ICE candidate error:", err);
    }
  };

  // Stop all tracks and cleanup
  const cleanup = () => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
      setLocalStream(null);
      setRemoteStream(null);
      setPeerConnection(null);
      setError(null);
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  // Mute/unmute audio
  const toggleAudio = (enabled: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  };

  // Toggle video
  const toggleVideo = (enabled: boolean) => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  };

  return {
    peerConnection,
    localStream,
    remoteStream,
    error,
    localAudioRef,
    remoteAudioRef,
    initializeLocalStream,
    initializePeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    cleanup,
    toggleAudio,
    toggleVideo,
  };
};
