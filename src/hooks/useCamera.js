// useCamera.js
"use client";
import { useEffect, useRef, useState } from "react";

export default function useCamera() {
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera
  const initCamera = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        setCameraReady(true);
      };
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // Clean up camera resources
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraReady(false);
    }
  };

  return {
    videoRef,
    canvasRef,
    cameraReady,
    initCamera,
    stopCamera
  };
}