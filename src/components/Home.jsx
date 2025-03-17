'use client'
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

export default function Home() {
  const [emotion, setEmotion] = useState("Detecting...");
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // ✅ Prevent multiple WebSocket connections
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:5000", {
        transports: ["websocket"],
      });

      socketRef.current.on("emotion_result", (data) => {
        setEmotion(data.emotion);
      });

      // ✅ Cleanup WebSocket on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };
    startCamera();
  }, []);

  // ✅ Send Frames to Backend
  useEffect(() => {
    const sendFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const frameData = canvas.toDataURL("image/jpeg"); // Convert to Base64
      if (socketRef.current) {
        socketRef.current.emit("send_frame", { frame: frameData });
      }
    };

    // ✅ Send frames every 100ms
    const interval = setInterval(sendFrame, 100);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <div>
      <h1>Emotion Detection</h1>
      <video ref={videoRef} autoPlay playsInline></video>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <h2>Emotion: {emotion}</h2>
    </div>
  );
}
