// useSocket.js
"use client";
import { useEffect, useRef, useState } from "react";

export default function useSocket() {
  const [emotion, setEmotion] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);

  // Setup socket connection
  const connectSocket = async () => {
    // Clean up any existing socket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      // Dynamic import to avoid SSR issues
      const io = (await import('socket.io-client')).default;
      const socket = io("http://localhost:5000", {
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("Socket connected");
        setConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      socket.on("emotion_result", (data) => {
        if (data && data.length > 0) {
          setEmotion(data[0].emotion);
        }
      });

      socketRef.current = socket;
    } catch (error) {
      console.error("Error connecting socket:", error);
    }
  };

  // Clean up function
  const disconnect = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Send a frame to the server
  const sendFrame = (videoElement, canvasElement) => {
    if (!socketRef.current || !videoElement || !canvasElement || !connected) {
      return;
    }

    try {
      const ctx = canvasElement.getContext("2d");
      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      const imageData = canvasElement.toDataURL("image/jpeg");
      socketRef.current.emit("video_frame", imageData);
    } catch (error) {
      console.error("Error sending frame:", error);
    }
  };

  // Start sending frames
  const startSendingFrames = (videoElement, canvasElement) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      sendFrame(videoElement, canvasElement);
    }, 1000);
  };

  return {
    emotion,
    connected,
    connectSocket,
    disconnect,
    startSendingFrames
  };
}