"use client";

import { useState, useRef, useCallback } from "react";

export interface WebRTCState {
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  error: string | null;
}

export function useWebRTC() {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isAudioEnabled: true,
    isVideoEnabled: false, // Audio-only for now
    localStream: null,
    remoteStream: null,
    error: null,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const initializePeerConnection = useCallback(() => {
    try {
      // Create peer connection with STUN servers for NAT traversal
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      peerConnectionRef.current = pc;

      // Handle remote stream
      pc.ontrack = (event) => {
        setState((prev) => ({
          ...prev,
          remoteStream: event.streams[0],
        }));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real implementation, send candidate to signaling server
          console.log("ICE candidate:", event.candidate);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        setState((prev) => ({
          ...prev,
          isConnected: pc.connectionState === "connected",
        }));
      };

      return pc;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create peer connection";
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  const getUserMedia = useCallback(async (audioOnly = true) => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: audioOnly ? false : { width: 640, height: 480 },
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
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  const startCall = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Get microphone access
      const stream = await getUserMedia(true);
      if (!stream) return false;

      // Initialize peer connection
      const pc = initializePeerConnection();
      if (!pc) return false;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create offer (in a real app, this would be sent via signaling)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // For now, just mark as connected (in real implementation, wait for answer)
      setState((prev) => ({ ...prev, isConnected: true }));

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start call";
      setState((prev) => ({ ...prev, error: message }));
      return false;
    }
  }, [getUserMedia, initializePeerConnection]);

  const endCall = useCallback(() => {
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

      setState((prev) => ({
        ...prev,
        isConnected: false,
        localStream: null,
        remoteStream: null,
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

  return {
    ...state,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    getUserMedia,
  };
}
