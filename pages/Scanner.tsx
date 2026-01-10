import React, { useRef, useState, useEffect } from 'react';
import { Camera, Save, TriangleAlert, Zap, ZapOff, Search, Bluetooth } from 'lucide-react';
import { calculateRisk } from '../services/gemini'; // Now serves as Risk Engine
import { saveDetection } from '../services/db';
import { DetectionRecord, DetectionStatus, InspectionChecklist } from '../types';
import { v4 as uuidv4 } from 'uuid';

const Scanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Hardware State
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  
  // Inspection State
  const [isInspecting, setIsInspecting] = useState(false);
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    looseParts: false,
    mismatchedColors: false,
    hiddenCamera: false,
    keypadObstruction: false,
    bluetoothSignal: false,
  });
  const [detectedDevices, setDetectedDevices] = useState<string[]>([]);
  const [bleError, setBleError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 } 
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check capabilities
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any; // Cast to any to access non-standard props like torch/zoom safely
      
      if ('torch' in capabilities) {
        setHasFlash(true);
      }
      if ('zoom' in capabilities) {
        setMaxZoom(capabilities.zoom?.max || 1);
      }

    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
    }
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newMode = !flashOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: newMode } as any]
      });
      setFlashOn(newMode);
    } catch (e) {
      console.error("Flash unavailable", e);
    }
  };

  const handleZoom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ zoom: newZoom } as any]
      });
    } catch (e) {
      console.error("Zoom unavailable", e);
    }
  };

  const scanBluetooth = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setBleError("Bluetooth not supported in this browser.");
      return;
    }
    try {
      // Skimmers often use HC-05, HC-06, or generic Serial profiles
      // We must use acceptAllDevices: true to see everything, but it requires optionalServices to access data
      // Note: This triggers a browser picker dialog.
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] // Serial Port Profile UUID
      });
      
      if (device) {
        const name = device.name || "Unknown Device";
        setDetectedDevices(prev => [...prev, name]);
        setChecklist(prev => ({ ...prev, bluetoothSignal: true }));
      }
    } catch (e) {
      // User cancelled or error
      console.log(e);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return "";
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return "";
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const saveReport = async () => {
    const riskAnalysis = calculateRisk(checklist, detectedDevices);
    const imageData = captureFrame();

    const record: DetectionRecord = {
      id: uuidv4(),
      timestamp: Date.now(),
      imageData,
      analysis: riskAnalysis,
      status: riskAnalysis.isSuspicious ? DetectionStatus.PENDING : DetectionStatus.CLEARED
    };

    await saveDetection(record);
    
    // Reset state
    setIsInspecting(false);
    setChecklist({
      looseParts: false,
      mismatchedColors: false,
      hiddenCamera: false,
      keypadObstruction: false,
      bluetoothSignal: false,
    });
    setDetectedDevices([]);
    setZoom(1);
    if (flashOn) toggleFlash();
  };

  if (!isInspecting) {
    return (
      <div className="relative h-full flex flex-col bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-60" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-t from-slate-900 via-transparent to-transparent">
          <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-cyan-400 mb-2 flex items-center">
              <Search className="w-6 h-6 mr-2" /> Start Inspection
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Begin a structured physical security protocol. You will use the camera and your hands to inspect the terminal.
            </p>
            <button 
              onClick={() => setIsInspecting(true)}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 active:scale-95 transition-all text-white font-bold rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/50"
            >
              <Camera className="w-5 h-5 mr-2" /> BEGIN SCAN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-slate-950">
      {/* Live Viewport */}
      <div className="relative h-3/5 bg-black overflow-hidden rounded-b-3xl shadow-2xl z-10">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover" 
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* HUD Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {hasFlash && (
            <button 
              onClick={toggleFlash}
              className={`p-3 rounded-full backdrop-blur-md transition-colors ${flashOn ? 'bg-yellow-500/80 text-white' : 'bg-black/40 text-white'}`}
            >
              {flashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Zoom Slider */}
        {maxZoom > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
            <input 
              type="range" 
              min="1" 
              max={Math.min(maxZoom, 5)} 
              step="0.1" 
              value={zoom} 
              onChange={handleZoom}
              className="w-full accent-cyan-500 h-1 appearance-none bg-white/20 rounded-lg cursor-pointer"
            />
          </div>
        )}
        
        {/* Bluetooth Overlay */}
        <div className="absolute top-4 left-4">
          <button 
            onClick={scanBluetooth}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${
              detectedDevices.length > 0 
              ? 'bg-red-500/80 border-red-400 text-white animate-pulse' 
              : 'bg-black/40 border-white/20 text-cyan-300'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span className="text-xs font-bold">
              {detectedDevices.length > 0 ? `${detectedDevices.length} DEV FOUND` : 'SCAN BLE'}
            </span>
          </button>
          {bleError && (
            <div className="mt-2 text-[10px] bg-red-900/80 text-red-200 px-2 py-1 rounded">
              {bleError}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Checklist */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Inspection Protocol</h3>
          <div className="bg-slate-900 px-2 py-1 rounded text-xs text-slate-500 font-mono">
            LIVE
          </div>
        </div>

        <div className="grid gap-3">
          <ChecklistItem 
            label="Loose or Wobbly Reader" 
            desc="Wiggle the card slot. It should not move."
            checked={checklist.looseParts} 
            onChange={(v) => setChecklist(p => ({...p, looseParts: v}))} 
          />
          <ChecklistItem 
            label="Mismatched Colors/Material" 
            desc="Does the plastic look different from the rest?"
            checked={checklist.mismatchedColors} 
            onChange={(v) => setChecklist(p => ({...p, mismatchedColors: v}))} 
          />
          <ChecklistItem 
            label="Keypad Obstruction" 
            desc="Is the keypad unusually thick or raised?"
            checked={checklist.keypadObstruction} 
            onChange={(v) => setChecklist(p => ({...p, keypadObstruction: v}))} 
          />
          <ChecklistItem 
            label="Hidden Cameras" 
            desc="Check above keypad or brochure racks."
            checked={checklist.hiddenCamera} 
            onChange={(v) => setChecklist(p => ({...p, hiddenCamera: v}))} 
          />
        </div>

        <div className="pt-4 pb-20">
          <button 
            onClick={saveReport}
            className="w-full py-3 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-lg flex items-center justify-center"
          >
            <Save className="w-5 h-5 mr-2" />
            FINISH REPORT
          </button>
        </div>
      </div>
    </div>
  );
};

const ChecklistItem: React.FC<{
  label: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, desc, checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center p-3 rounded-xl border transition-all duration-200 ${
      checked 
      ? 'bg-red-500/10 border-red-500/50' 
      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}
  >
    <div className={`w-6 h-6 rounded flex items-center justify-center border mr-4 ${
      checked ? 'bg-red-500 border-red-500 text-white' : 'border-slate-600'
    }`}>
      {checked && <TriangleAlert className="w-3.5 h-3.5" />}
    </div>
    <div className="text-left">
      <div className={`font-medium text-sm ${checked ? 'text-red-400' : 'text-slate-200'}`}>
        {label}
      </div>
      <div className="text-xs text-slate-500">{desc}</div>
    </div>
  </button>
);

export default Scanner;