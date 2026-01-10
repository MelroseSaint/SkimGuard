import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { analyzeImage } from '../services/gemini';
import { saveDetection } from '../services/db';
import { AnalysisResult, DetectionRecord, DetectionStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const Scanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64, removing the data URL prefix for Gemini
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl;
  }, []);

  const handleScan = async () => {
    if (isScanning) return;
    
    const imageDataUrl = captureFrame();
    if (!imageDataUrl) return;

    // Visual flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    setIsScanning(true);
    setLastResult(null);

    try {
      // Remove prefix for API
      const base64Data = imageDataUrl.split(',')[1];
      const result = await analyzeImage(base64Data);
      
      setLastResult(result);

      // Save to local DB automatically
      const newRecord: DetectionRecord = {
        id: uuidv4(),
        timestamp: Date.now(),
        imageData: imageDataUrl, // Store full string for display
        analysis: result,
        status: DetectionStatus.PENDING
      };
      
      await saveDetection(newRecord);

    } catch (err) {
      console.error(err);
      setError("Analysis failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-black">
      {/* Camera View */}
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-red-400 p-6 text-center">
            {error}
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Flash Overlay */}
        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${flash ? 'opacity-50' : 'opacity-0'}`} />

        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20 m-4 rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl m-2"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl m-2"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl m-2"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl m-2"></div>
          
          {/* Scanning Line Animation */}
          {isScanning && (
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
          )}
        </div>
      </div>

      {/* Controls / Result Panel */}
      <div className="bg-slate-900 border-t border-slate-800 p-6 flex flex-col items-center min-h-[180px] justify-center z-10">
        
        {!lastResult && !isScanning && (
          <button 
            onClick={handleScan}
            disabled={!!error}
            className="relative group"
          >
            <div className="absolute inset-0 bg-cyan-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative h-20 w-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center group-active:scale-95 transition-transform">
              <div className="h-16 w-16 rounded-full bg-cyan-500 flex items-center justify-center text-slate-900">
                <Camera className="w-8 h-8" />
              </div>
            </div>
            <span className="block text-center text-xs text-slate-400 mt-2 font-medium">TAP TO SCAN</span>
          </button>
        )}

        {isScanning && (
          <div className="flex flex-col items-center animate-pulse">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-2" />
            <span className="text-cyan-400 font-mono">ANALYZING...</span>
          </div>
        )}

        {lastResult && !isScanning && (
          <div className="w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {lastResult.isSuspicious ? (
                  <div className="bg-red-500/20 p-2 rounded-full">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                ) : (
                  <div className="bg-green-500/20 p-2 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                )}
                <div>
                  <h3 className={`text-lg font-bold ${lastResult.isSuspicious ? 'text-red-400' : 'text-green-400'}`}>
                    {lastResult.isSuspicious ? 'RISK DETECTED' : 'SAFE'}
                  </h3>
                  <p className="text-xs text-slate-400">Score: {lastResult.riskScore}/100</p>
                </div>
              </div>
              <button 
                onClick={() => setLastResult(null)}
                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                {lastResult.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;