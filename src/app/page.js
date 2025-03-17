"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [emotion, setEmotion] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    // Connect to Flask backend
    console.log("🔄 Connecting to backend...");
    const newSocket = io("http://localhost:5000");

    newSocket.on("connect", () => {
      console.log("✅ Connected to backend!");
      setConnectionStatus("connected");
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from backend!");
      setConnectionStatus("disconnected");
    });

    newSocket.on("emotion_result", (data) => {
      console.log("📡 Emotion received:", data);

      if (data && data.emotion) {
        setEmotion(data.emotion);
      } else {
        console.warn("⚠️ Unexpected data format from backend:", data);
      }
    });

    newSocket.on("error", (error) => {
      console.error("❌ Backend error:", error);
      setConnectionStatus("error");
    });

    setSocket(newSocket);

    return () => {
      console.log("🔄 Closing socket connection...");
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Start video stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("📷 Requesting camera access...");
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            console.log("✅ Camera stream started!");
          }
        })
        .catch((error) => console.error("❌ Error accessing camera:", error));
    }
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !socket) {
      console.warn("⚠️ Skipping frame capture - Required elements not ready!");
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Draw video frame onto canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL("image/jpeg");

    // Send image to backend
    console.log("📤 Sending frame to backend...");
    socket.emit("send_frame", { frame: imageData });
  };

  useEffect(() => {
    // Send frames at intervals
    const interval = setInterval(() => {
      console.log("⏳ Capturing frame...");
      captureFrame();
    }, 1000); // Send 1 frame per second

    return () => {
      console.log("🛑 Stopping frame capture...");
      clearInterval(interval);
    };
  }, [socket]);

  // Helper function to get emotion color
  const getEmotionColor = () => {
    switch(emotion.toLowerCase()) {
      case "happy": return "#FFD700";
      case "sad": return "#4169E1";
      case "angry": return "#FF4500";
      case "surprise": return "#9932CC";
      case "fear": return "#800080";
      case "disgust": return "#006400";
      case "neutral": return "#20B2AA";
      default: return "#00BFFF";
    }
  };

  // Helper function to get emotion emoji
  const getEmotionEmoji = () => {
    switch(emotion.toLowerCase()) {
      case "happy": return "😊";
      case "sad": return "😢";
      case "angry": return "😠";
      case "surprise": return "😲";
      case "fear": return "😨";
      case "disgust": return "🤢";
      case "neutral": return "😐";
      default: return "⏳";
    }
  };

  // Helper function to get connection status color
  const getStatusColor = () => {
    switch(connectionStatus) {
      case "connected": return "#00FF00";
      case "disconnected": return "#FF0000";
      case "error": return "#FF0000";
      default: return "#FFFF00";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8">
      {/* Main container with glassmorphism effect */}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 text-center">
            EMOTION•SCAN
          </h1>
          <p className="text-center text-blue-300 mt-2">Facial Emotion Detection System</p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video feed with neomorphic container */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-2xl border border-gray-700 border-opacity-30 shadow-2xl p-4 h-full">
              <div className="relative">
                {/* Connection indicator */}
                <div className="absolute top-4 right-4 z-10 flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getStatusColor() }}></div>
                  <span className="text-xs uppercase tracking-wider">
                    {connectionStatus}
                  </span>
                </div>

                {/* Video element with enhanced styling */}
                <div className="relative rounded-xl overflow-hidden shadow-inner">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full rounded-xl"
                    style={{ 
                      filter: "contrast(1.05) brightness(1.05)",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)"
                    }}
                  />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 backdrop-filter backdrop-blur-md rounded-lg px-3 py-1">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                      <span className="text-xs">LIVE</span>
                    </div>
                  </div>

                  {/* Video overlay grid lines for futuristic effect */}
                  <div className="absolute inset-0 pointer-events-none" 
                    style={{
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
                      backgroundSize: "20px 20px"
                    }}>
                  </div>
                </div>
                
                <canvas ref={canvasRef} width="640" height="480" hidden />
              </div>
            </div>
          </div>

          {/* Emotion display panel */}
          <div className="h-full">
            <div className="bg-gray-800 bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-2xl border border-gray-700 border-opacity-30 shadow-2xl p-6 h-full relative overflow-hidden">
              <h2 className="text-xl font-medium text-gray-300 mb-6">Emotional Analysis</h2>
              
              {/* Emotion indicator */}
              <div className="flex flex-col items-center justify-center h-64 my-auto">
                <div className="relative mb-10">
                  <div className="absolute inset-0 rounded-full blur-xl opacity-50"
                    style={{ backgroundColor: getEmotionColor() }}>
                  </div>
                  <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-4 border-opacity-30"
                    style={{ 
                      backgroundColor: `${getEmotionColor()}20`,
                      borderColor: getEmotionColor(),
                      boxShadow: `0 0 30px ${getEmotionColor()}80`
                    }}>
                    <span className="text-5xl" role="img" aria-label="emotion">
                      {getEmotionEmoji()}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-bold uppercase tracking-wider" 
                    style={{ color: getEmotionColor() }}>
                    {emotion || "Analyzing..."}
                  </h3>
                  {/* <p className="text-blue-300 text-sm mt-2">Detection confidence: High</p> */}
                </div>
              </div>

              {/* Tech pattern background */}
              <div className="absolute inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0" 
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-blue-300 opacity-70">©️ Developed with ❤️ || 2024</p>
        </div>
      </div>
    </div>
  );
}