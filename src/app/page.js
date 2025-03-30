"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [faceEmotion, setFaceEmotion] = useState(null);
  const [speechEmotions, setSpeechEmotions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  
  useEffect(() => {
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
      console.log("📡 Facial Emotion received:", data);
      if (data?.type === "speech"){
        setSpeechEmotions(data.result);
      }
      if (data && data.faces && data.faces.length > 0) {
        const faceData = data.faces[0];
        setFaceEmotion({
          emotion: faceData.emotion,
          confidence: faceData.confidence
        });
      }
    });

    newSocket.on("speech_emotion_result", (data) => {
      console.log("🎤 Speech Emotion received:", data);
      if (Array.isArray(data)) {
        setSpeechEmotions(data);
      } else if (data && data.emotion) {
        // For backwards compatibility
        setSpeechEmotions([{label: data.emotion, score: 0.8}]);
      }
    });

    setSocket(newSocket);
    return () => {
      console.log("🔄 Closing socket connection...");
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("📷 Requesting camera access...");
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("✅ Camera stream started!");
        }
      }).catch((error) => console.error("❌ Error accessing camera:", error));
    }
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !socket) return;
    console.log("📸 Capturing frame...");
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");
    console.log("📡 Sending frame to backend...");
    socket.emit("send_frame", { frame: imageData });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      captureFrame();
    }, 1000);
    return () => clearInterval(interval);
  }, [socket]);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("🎤 Audio recording not supported.");
      return;
    }
    console.log("🎤 Starting audio recording...");
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      console.log("🎤 Audio chunk received...");
      audioChunks.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      console.log("🎤 Stopping audio recording...");
      setIsRecording(false);
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result.split(",")[1];
        console.log("📡 Sending audio to backend...");
        socket.emit("send_audio", { audio: base64Audio });
      };
    };

    mediaRecorderRef.current.start();
    setTimeout(() => {
      console.log("🎤 Auto-stopping audio recording after 5s...");
      mediaRecorderRef.current.stop();
    }, 5000);
  };

  // Helper function to get emoji for emotion
  const getEmoji = (emotion) => {
    const emotionMap = {
      "happy": "😊",
      "sad": "😢",
      "angry": "😠",
      "surprised": "😲",
      "fearful": "😨",
      "disgust": "🤢",
      "neutral": "😐",
      "calm": "😌",
      "Happy": "😊",
      "Sad": "😢",
      "Angry": "😠",
      "Surprised": "😲",
      "Fear": "😨",
      "Disgust": "🤢",
      "Neutral": "😐",
      "Calm": "😌"
    };
    
    return emotionMap[emotion] || "❓";
  };

  // Circular progress component
  const CircularProgress = ({ value, emotion, size = 120 }) => {
    const radius = size * 0.4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - value);
    
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#334155"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex items-center justify-center flex-col">
          <span className="text-4xl">{getEmoji(emotion)}</span>
        </div>
      </div>
    );
  };

  // Linear progress component
  const LinearProgress = ({ label, value, color }) => {
    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{label} {getEmoji(label)}</span>
          <span className="text-sm font-medium">{Math.round(value * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className="h-2.5 rounded-full" 
            style={{ width: `${value * 100}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-transparent bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text">
          EMOTION•SCAN
        </h1>
        <p className="text-center text-blue-300 mt-2">Facial & Speech Emotion Detection</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <div className="relative bg-gray-800 p-4 rounded-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
              <canvas ref={canvasRef} width="640" height="480" hidden />
              
              {/* Status indicator */}
              <div className={`absolute top-6 right-6 flex items-center px-3 py-1 rounded-full text-xs ${
                connectionStatus === "connected" ? "bg-green-500/20 text-green-300" : 
                connectionStatus === "connecting" ? "bg-yellow-500/20 text-yellow-300" : 
                "bg-red-500/20 text-red-300"
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === "connected" ? "bg-green-400" : 
                  connectionStatus === "connecting" ? "bg-yellow-400" : 
                  "bg-red-400"
                }`}></div>
                {connectionStatus}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-300 mb-6">Emotional Analysis</h2>
              
              {/* Facial Emotion Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-blue-400 mb-4">Facial Expression</h3>
                
                <div className="flex flex-col items-center">
                  {faceEmotion ? (
                    <>
                      <CircularProgress 
                        value={faceEmotion.confidence} 
                        emotion={faceEmotion.emotion} 
                      />
                      <div className="mt-3 text-center">
                        <p className="text-xl font-bold">{faceEmotion.emotion}</p>
                        <p className="text-sm text-gray-400">Confidence: {Math.round(faceEmotion.confidence * 100)}%</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Analyzing facial expression...</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Speech Emotion Section */}
              <div>
                <h3 className="text-lg font-medium text-red-400 mb-4">Speech Emotion</h3>
                
                {speechEmotions && speechEmotions.length > 0 ? (
                  <div>
                    {speechEmotions.map((item, index) => (
                      <LinearProgress 
                        key={index} 
                        label={item.label || item.emotion} 
                        value={item.score || item.confidence} 
                        color={index === 0 ? "#ef4444" : index === 1 ? "#f97316" : index === 2 ? "#f59e0b" : "#10b981"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400">Record your voice to analyze speech emotion</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <button
            className={`px-6 py-3 rounded-full text-white font-bold transition-all ${
              isRecording 
                ? "bg-red-500 animate-pulse" 
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            }`}
            onClick={startRecording}
            disabled={isRecording}
          >
            {isRecording ? (
              <span className="flex items-center">
                <span className="inline-block w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                Recording...
              </span>
            ) : (
              <span className="flex items-center">
                <span className="mr-2">🎤</span>
                Record Audio
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}