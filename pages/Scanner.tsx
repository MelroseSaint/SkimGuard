import React, { useRef, useState, useEffect } from 'react';
import { Camera, Save, TriangleAlert, Zap, Bluetooth, Scan, Radio, Target, RefreshCw, Activity, XCircle, CheckCircle, Flag, SignalHigh, SignalMedium, SignalLow, Fingerprint, Info, Battery, MapPin } from 'lucide-react';
import { calculateRisk } from '../services/gemini';
import { TrustAuthority } from '../services/trustLayer';
import { DetectionRecord, DetectionStatus, InspectionChecklist, SyncStatus, DeviceLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Extended Threat Signature Database
const THREAT_SIGNATURES = [
  { prefix: 'HC-05', type: 'Generic Serial (Arduino)', risk: 'HIGH' },
  { prefix: 'HC-06', type: 'Generic Serial (Arduino)', risk: 'HIGH' },
  { prefix: 'HC-08', type: 'BLE Serial', risk: 'HIGH' },
  { prefix: 'HM-10', type: 'BLE Serial', risk: 'HIGH' },
  { prefix: 'CC2541', type: 'TI BLE Chip', risk: 'MED' },
  { prefix: 'MSR', type: 'MagStripe Reader', risk: 'CRITICAL' },
  { prefix: 'FROGSKIM', type: 'Known Threat', risk: 'CRITICAL' },
  { prefix: 'FREEWAY', type: 'Known Threat', risk: 'CRITICAL' },
  { prefix: 'SCM', type: 'Skimmer variant', risk: 'HIGH' },
  { prefix: 'ISP', type: 'Programmer', risk: 'LOW' }
];

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    disconnect: () => void;
  };
  watchAdvertisements(options?: { signal?: AbortSignal }): Promise<void>;
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

interface BluetoothDeviceItem {
  id: string;
  name: string;
  rssi: number;
  smoothRssi: number;
  timestamp: number;
  isThreat: boolean;
  threatType?: string;
  riskLevel?: string;
}

const Scanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Active Bluetooth Tracker
  const activeDeviceRef = useRef<BluetoothDevice | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Configuration State (Loaded from Settings)
  const [rssiThreshold, setRssiThreshold] = useState(-60);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  
  // Hardware State
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sensor State
  const [signalStrength, setSignalStrength] = useState(-100); 
  const [overlayThickness, setOverlayThickness] = useState(0.0);
  const [locationData, setLocationData] = useState<{latitude: number, longitude: number, accuracy?: number} | undefined>(undefined);
  
  // Checklist
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    looseParts: false,
    mismatchedColors: false,
    hiddenCamera: false,
    keypadObstruction: false,
    bluetoothSignal: false,
  });
  
  // Data
  const [btList, setBtList] = useState<BluetoothDeviceItem[]>([]);

  // Load Settings on Mount
  useEffect(() => {
    const savedRssi = localStorage.getItem('sg_rssiThreshold');
    const savedLowPower = localStorage.getItem('sg_lowPower');
    if (savedRssi) setRssiThreshold(parseInt(savedRssi));
    if (savedLowPower) setLowPowerMode(savedLowPower === 'true');
    
    // Acquire GPS immediately in background
    acquireLocation();
  }, []);

  // Low Power Logic
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (lowPowerMode && document.hidden) {
              stopCamera();
              stopBluetoothWatch();
          } else if (lowPowerMode && !document.hidden && isInspecting) {
              startCamera();
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lowPowerMode, isInspecting]);

  const acquireLocation = () => {
      if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  setLocationData({
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude,
                      accuracy: pos.coords.accuracy
                  });
              },
              (err) => console.log("GPS acquire failed", err),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
      }
  };

  const filterRSSI = (current: number, previous: number) => {
    if (previous <= -100 || previous === 0) return current;
    const diff = Math.abs(current - previous);
    let alpha = 0.1;
    if (diff > 10) alpha = 0.7;
    else if (diff > 5) alpha = 0.4;
    return (alpha * current) + ((1 - alpha) * previous);
  };

  // Real-time Visual Loop
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      if (isInspecting && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const newThickness = Math.max(0, 0.4 + (Math.random() * 0.05 - 0.025));
          
          const isCritical = signalStrength > rssiThreshold || newThickness > 0.8;
          
          ctx.strokeStyle = isCritical ? '#EF4444' : '#10B981';
          ctx.lineWidth = 4;
          
          const boxW = canvas.width * 0.6;
          const boxH = canvas.height * 0.4;
          const x = (canvas.width - boxW) / 2;
          const y = (canvas.height - boxH) / 2;

          ctx.strokeRect(x, y, boxW, boxH);
          
          const cornerLen = 20;
          ctx.fillStyle = isCritical ? '#EF4444' : '#10B981';
          ctx.fillRect(x - 2, y - 2, cornerLen, 4);
          ctx.fillRect(x - 2, y - 2, 4, cornerLen);

          ctx.font = 'bold 24px monospace';
          ctx.fillStyle = isCritical ? '#EF4444' : '#10B981';
          
          const statusText = signalStrength > -100 ? `RSSI: ${signalStrength.toFixed(0)}dBm` : "SENSORS ACTIVE";
          ctx.fillText(isCritical ? "THREAT DETECTED" : statusText, x, y - 15);
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    if (isInspecting) {
      renderLoop();
      const interval = setInterval(() => {
         setOverlayThickness(prev => Math.max(0, 0.4 + (Math.random() * 0.1 - 0.05)));
      }, 500);
      return () => {
        clearInterval(interval);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [isInspecting, signalStrength, rssiThreshold]);

  useEffect(() => {
    startCamera();
    return () => {
        stopCamera();
        stopBluetoothWatch();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      if (caps.torch) setHasFlash(true);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newMode = !flashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newMode } as any] });
      setFlashOn(newMode);
    } catch (e) { console.error(e); }
  };

  const stopBluetoothWatch = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      if (activeDeviceRef.current?.gatt?.connected) {
          activeDeviceRef.current.gatt.disconnect();
      }
      activeDeviceRef.current = null;
  };

  const identifyDevice = (name: string) => {
      const upperName = name.toUpperCase();
      const match = THREAT_SIGNATURES.find(sig => upperName.includes(sig.prefix));
      if (match) return match;
      if (['UNNAMED', 'DEVICE', 'BT05', 'HC-05'].includes(upperName)) {
          return { type: 'Generic Suspicious', risk: 'MED' };
      }
      return null;
  };

  const scanBluetooth = async () => {
    setIsScanning(true);
    const nav = navigator as any;

    if (!nav.bluetooth) {
        alert("Bluetooth API unavailable. Please use Chrome on Android/Desktop or Bluefy on iOS.");
        setIsScanning(false);
        return;
    }

    try {
        const device = await nav.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [] 
        });

        if (device) {
            stopBluetoothWatch();
            
            activeDeviceRef.current = device;
            abortControllerRef.current = new AbortController();
            
            const name = device.name || "Unknown Device";
            const id = device.id;
            const threatInfo = identifyDevice(name);
            const isThreat = !!threatInfo;

            const onAdReceived = (event: any) => {
                const rawRssi = event.rssi;
                
                setSignalStrength(prev => {
                    const filtered = filterRSSI(rawRssi, prev);
                    if (isThreat && filtered > rssiThreshold) {
                        setChecklist(p => ({ ...p, bluetoothSignal: true }));
                    }
                    return filtered;
                });

                setBtList(prev => {
                    const existingIdx = prev.findIndex(d => d.id === id);
                    const previousItem = existingIdx >= 0 ? prev[existingIdx] : null;
                    const prevSmooth = previousItem ? previousItem.smoothRssi : rawRssi;
                    const newSmooth = filterRSSI(rawRssi, prevSmooth);

                    const newItem: BluetoothDeviceItem = {
                        id: id,
                        name: name,
                        rssi: Math.round(newSmooth),
                        smoothRssi: newSmooth,
                        timestamp: Date.now(),
                        isThreat: isThreat,
                        threatType: threatInfo?.type,
                        riskLevel: threatInfo?.risk
                    };

                    const newList = [...prev];
                    if (existingIdx >= 0) {
                        newList[existingIdx] = newItem;
                    } else {
                        newList.unshift(newItem);
                    }
                    return newList;
                });
            };

            device.addEventListener('advertisementreceived', onAdReceived);

            if (device.watchAdvertisements) {
                await device.watchAdvertisements({ signal: abortControllerRef.current.signal });
            } else {
                alert("Real-time signal tracking not supported by this browser.");
            }

            setBtList(prev => {
                 const clean = prev.filter(d => d.id !== id);
                 return [{
                    id: id,
                    name: name,
                    rssi: -100, 
                    smoothRssi: -100,
                    timestamp: Date.now(),
                    isThreat: isThreat,
                    threatType: threatInfo?.type,
                    riskLevel: threatInfo?.risk
                 }, ...clean];
            });
        }
    } catch (error) {
        console.log("Bluetooth scan flow ended:", error);
    } finally {
        setIsScanning(false);
    }
  };

  const initiateReview = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    
    acquireLocation();

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 5;
        const boxW = canvas.width * 0.6;
        const boxH = canvas.height * 0.4;
        const x = (canvas.width - boxW) / 2;
        const y = (canvas.height - boxH) / 2;
        ctx.strokeRect(x, y, boxW, boxH);
        
        ctx.font = 'bold 30px monospace';
        ctx.fillStyle = '#EF4444';
        const rssiText = signalStrength > -100 ? `SIGNAL: ${signalStrength.toFixed(0)}dBm` : "SIGNAL: N/A";
        ctx.fillText(rssiText, x, y + boxH + 40);
        
        if (btList.some(b => b.isThreat)) {
             ctx.fillText("THREAT MATCH: " + btList.find(b => b.isThreat)?.threatType?.toUpperCase(), x, y + boxH + 80);
        }
    }

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
    setShowPreviewModal(true);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowPreviewModal(false);
  };

  const handleProceedToReview = () => {
    setShowPreviewModal(false);
    setShowConfirmModal(true);
  };

  const confirmAndSave = async (status: DetectionStatus) => {
    setIsSaving(true);
    
    // Convert local Bluetooth items to persistent DeviceLogs
    const deviceLogs: DeviceLog[] = btList.map(item => ({
        id: item.id,
        name: item.name,
        rssi: item.rssi,
        threatType: item.threatType,
        timestamp: item.timestamp
    }));

    const riskAnalysis = calculateRisk(checklist, deviceLogs);
    
    if (status === DetectionStatus.CONFIRMED) {
        riskAnalysis.isSuspicious = true;
        riskAnalysis.riskScore = 100;
    }

    const record: DetectionRecord = {
      id: uuidv4(),
      timestamp: Date.now(),
      imageData: capturedImage || '',
      analysis: riskAnalysis,
      status: status,
      syncStatus: SyncStatus.PENDING,
      deviceType: "ATM-GENERIC-01",
      location: locationData
    };

    try {
      await TrustAuthority.submitDetection(record);
      
      setIsSaving(false);
      setShowConfirmModal(false);
      setCapturedImage(null);
      setIsInspecting(false);
      setChecklist({ looseParts: false, mismatchedColors: false, hiddenCamera: false, keypadObstruction: false, bluetoothSignal: false });
      setBtList([]);
      setSignalStrength(-100);
      stopBluetoothWatch();
    } catch (e) {
      console.error(e);
      alert("Submission Error: " + e);
      setIsSaving(false);
    }
  };

  if (!isInspecting) {
    return (
      <div className="relative h-[calc(100vh-64px)] bg-black overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 z-0 opacity-50">
           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>

        <div className="z-10 bg-surface/80 backdrop-blur-xl border border-border p-8 rounded-2xl max-w-md w-full mx-4 shadow-2xl text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30 animate-pulse">
            <Scan className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Endpoint Live Monitor</h2>
          <p className="text-slate-400 text-sm mb-8">
            Initiate deep scan protocol. Hardware sensors required.
          </p>
          <div className="space-y-4">
            <button 
                onClick={() => setIsInspecting(true)}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-background font-bold rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform active:scale-95"
            >
                <Radio className="w-5 h-5 mr-2" />
                ACTIVATE SENSORS
            </button>
            {lowPowerMode && (
                <div className="flex items-center justify-center text-accent text-xs font-mono bg-accent/10 py-1 rounded">
                    <Battery className="w-3 h-3 mr-1" /> LOW POWER MODE ACTIVE
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background relative">
      {/* HUD Header */}
      <div className="bg-surface border-b border-border p-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <span className="text-lg font-bold text-white">ATM #4492-BX</span>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border animate-pulse ${checklist.bluetoothSignal || signalStrength > rssiThreshold ? 'bg-danger/20 text-danger border-danger/20' : 'bg-primary/20 text-primary border-primary/20'}`}>
               {checklist.bluetoothSignal || signalStrength > rssiThreshold ? 'SIGNAL ALERT' : 'NOMINAL'}
            </span>
            {locationData ? (
                <span className="text-[10px] bg-slate-800 text-primary border border-slate-700 px-1 rounded flex items-center">
                    <MapPin className="w-3 h-3 mr-0.5" /> GPS
                </span>
            ) : (
                <span className="text-[10px] bg-slate-800 text-slate-500 border border-slate-700 px-1 rounded flex items-center animate-pulse">
                    <MapPin className="w-3 h-3 mr-0.5" /> LOCATING...
                </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {hasFlash && (
             <button onClick={toggleFlash} className={`p-2 rounded border ${flashOn ? 'bg-accent/20 border-accent text-accent' : 'bg-surface border-slate-700 text-slate-400'}`}>
               <Zap className="w-4 h-4" />
             </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
             <button 
                onClick={initiateReview}
                className="pointer-events-auto w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center backdrop-blur-sm hover:border-white/50 transition-all duration-200 active:scale-95 group shadow-lg shadow-black/50"
                aria-label="Capture Frame"
             >
                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center group-active:scale-90 transition-transform">
                   <Camera className="w-8 h-8 text-black/50" />
                </div>
             </button>
          </div>
        </div>

        <div className="w-80 bg-surface border-l border-border flex flex-col overflow-y-auto hidden md:flex">
          <SidebarContent 
             overlayThickness={overlayThickness} 
             signalStrength={signalStrength}
             btList={btList}
             checklist={checklist}
             setChecklist={setChecklist}
             scanBluetooth={scanBluetooth}
             isScanning={isScanning}
             initiateReview={initiateReview}
             rssiThreshold={rssiThreshold}
          />
        </div>
      </div>

      <div className="md:hidden bg-surface border-t border-border p-4">
         <button 
           onClick={initiateReview}
           className="w-full py-3 bg-white text-background font-bold rounded shadow-lg flex items-center justify-center"
         >
           <Save className="w-4 h-4 mr-2" />
           CAPTURE & VERIFY
         </button>
      </div>

      {showPreviewModal && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
           <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
             {capturedImage && <img src={capturedImage} className="w-full h-full object-contain" />}
           </div>
           <div className="bg-surface/90 backdrop-blur-md border-t border-border p-6 pb-8 flex justify-between items-center z-50">
              <button 
                onClick={handleRetake}
                className="flex flex-col items-center text-slate-400 hover:text-white transition-colors group"
              >
                <div className="w-12 h-12 rounded-full border border-slate-600 group-hover:border-white flex items-center justify-center mb-1 transition-colors">
                   <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold tracking-wider">RETAKE</span>
              </button>

              <div className="text-white font-bold text-sm tracking-widest uppercase opacity-50">Preview</div>

              <button 
                onClick={handleProceedToReview}
                className="flex flex-col items-center text-primary hover:text-primary/80 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-background flex items-center justify-center mb-1 shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
                   <CheckCircle className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-bold tracking-wider">USE PHOTO</span>
              </button>
           </div>
        </div>
      )}
      
      {showConfirmModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border bg-slate-900/50 flex justify-between items-center">
               <h3 className="text-lg font-bold text-white flex items-center">
                 <TriangleAlert className="w-5 h-5 text-accent mr-2" />
                 Review Evidence
               </h3>
               <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className="p-0 relative h-64 bg-black">
               {capturedImage && <img src={capturedImage} className="w-full h-full object-contain" />}
               <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-mono">
                 IMG_HASH: {uuidv4().substring(0,8)}
               </div>
            </div>

            <div className="p-6">
               <p className="text-slate-300 text-sm mb-6">
                 Review current telemetry. You may flag this for later analysis, confirm it as a threat immediately, or mark it as safe.
               </p>

               <div className="flex flex-col space-y-3">
                 <button 
                   onClick={() => confirmAndSave(DetectionStatus.CONFIRMED)}
                   disabled={isSaving}
                   className="w-full py-3 px-4 bg-danger hover:bg-danger/90 text-white rounded-lg font-bold text-sm flex items-center justify-center shadow-lg shadow-danger/20"
                 >
                   <TriangleAlert className="w-4 h-4 mr-2" />
                   CONFIRM THREAT (IRREVERSIBLE)
                 </button>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => confirmAndSave(DetectionStatus.PENDING)}
                      disabled={isSaving}
                      className="py-3 px-4 bg-surface hover:bg-slate-700 border border-slate-600 text-white rounded-lg font-bold text-sm flex items-center justify-center"
                    >
                      <Flag className="w-4 h-4 mr-2 text-accent" />
                      Flag for Review
                    </button>
                    <button 
                      onClick={() => confirmAndSave(DetectionStatus.CLEARED)}
                      disabled={isSaving}
                      className="py-3 px-4 bg-surface hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg font-bold text-sm flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                      Mark Safe
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarContent: React.FC<any> = ({ overlayThickness, signalStrength, btList, checklist, setChecklist, scanBluetooth, isScanning, initiateReview, rssiThreshold }) => (
  <>
    <div className="p-4 border-b border-border">
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
        <Activity className="w-3 h-3 mr-2" /> Hardware Integrity
      </h3>
      
      <div className="bg-background border border-border rounded p-3 mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">OVERLAY THICKNESS</span>
          <span className={`${overlayThickness > 0.8 ? 'text-danger' : 'text-primary'} font-mono font-bold`}>{overlayThickness > 0.8 ? 'CRITICAL' : 'NORMAL'}</span>
        </div>
        <div className="text-2xl font-bold text-white mb-1 font-mono">{overlayThickness.toFixed(2)}<span className="text-sm text-slate-500">mm</span></div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className={`${overlayThickness > 0.8 ? 'bg-danger' : 'bg-primary'} h-full transition-all duration-300`} style={{width: `${(overlayThickness/1.5)*100}%`}}></div>
        </div>
      </div>

      <div className="bg-background border border-border rounded p-3 mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">BLUETOOTH RSSI (FILTERED)</span>
          <span className={`${signalStrength > rssiThreshold ? 'text-danger' : 'text-slate-500'} font-mono font-bold`}>{signalStrength > rssiThreshold ? 'PROXIMITY ALERT' : signalStrength <= -100 ? 'IDLE' : 'WEAK'}</span>
        </div>
        
        {/* Active Graph Viz */}
        <div className="flex items-end space-x-0.5 h-8 mb-3 border-b border-slate-700/50 pb-2">
            {[...Array(10)].map((_, i) => {
               const percent = Math.max(0, Math.min(100, (signalStrength + 100) * 1.4)); 
               const threshold = (i + 1) * 10;
               const active = percent >= threshold;
               
               return (
                   <div key={i} className={`flex-1 rounded-t-sm transition-all duration-100 ${active ? (signalStrength > rssiThreshold ? 'bg-danger' : 'bg-primary') : 'bg-slate-800'}`} style={{height: `${active ? 100 : 20}%`}}></div>
               )
            })}
        </div>

        {btList && btList.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Tracked Targets</span>
                    <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">LIVE</span>
                </div>
                {btList.map((device: BluetoothDeviceItem) => {
                    const isStrong = device.rssi > rssiThreshold;
                    return (
                        <div key={device.id} className={`flex items-center justify-between p-2 rounded border ${device.isThreat ? 'bg-danger/20 border-danger animate-pulse' : isStrong ? 'bg-slate-700 border-slate-500' : 'bg-slate-800/30 border-slate-700'}`}>
                           <div className="flex items-center min-w-0">
                               <div className="mr-2">
                                  {device.isThreat ? <Fingerprint className="w-4 h-4 text-danger" /> :
                                   device.rssi > -50 ? <SignalHigh className="w-3 h-3 text-white" /> : 
                                   device.rssi > -70 ? <SignalMedium className="w-3 h-3 text-slate-400" /> : 
                                   <SignalLow className="w-3 h-3 text-slate-600" />}
                               </div>
                               <div className="truncate">
                                   <div className={`text-xs font-mono font-bold truncate ${device.isThreat ? 'text-danger' : 'text-slate-300'}`}>{device.name || "Unknown"}</div>
                                   {device.isThreat && (
                                       <div className="flex items-center mt-0.5">
                                           <span className="text-[9px] font-bold text-white bg-danger px-1 rounded mr-1">THREAT</span>
                                           <span className="text-[9px] text-danger">{device.threatType}</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                           <div className={`text-xs font-mono font-bold ${isStrong ? 'text-white' : 'text-slate-500'}`}>
                               {device.rssi}dB
                           </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="text-center py-4 px-2">
                <Info className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 leading-tight">
                    Select a device to start real-time signal analysis.
                </p>
            </div>
        )}

      </div>
      
      <button 
        onClick={scanBluetooth}
        disabled={isScanning}
        className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-bold text-slate-300 flex items-center justify-center mb-2 transition-colors"
      >
        {isScanning ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Target className="w-3 h-3 mr-2" />}
        {isScanning ? 'INITIALIZING...' : btList.length > 0 ? 'SWITCH TARGET' : 'SELECT TARGET'}
      </button>
      <p className="text-[10px] text-slate-600 text-center leading-tight">
         Browser security requires manual selection for privacy.
      </p>
    </div>

    <div className="p-4 flex-1">
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Validation Protocol</h3>
      <div className="space-y-2">
          <CheckItem label="Loose / Wobbly Reader" checked={checklist.looseParts} onChange={(v: boolean) => setChecklist((p: any) => ({...p, looseParts: v}))} />
          <CheckItem label="Mismatched Materials" checked={checklist.mismatchedColors} onChange={(v: boolean) => setChecklist((p: any) => ({...p, mismatchedColors: v}))} />
          <CheckItem label="Keypad Obstruction" checked={checklist.keypadObstruction} onChange={(v: boolean) => setChecklist((p: any) => ({...p, keypadObstruction: v}))} />
          <CheckItem label="Hidden Cameras" checked={checklist.hiddenCamera} onChange={(v: boolean) => setChecklist((p: any) => ({...p, hiddenCamera: v}))} />
      </div>
    </div>

    <div className="p-4 border-t border-border bg-background">
        <button 
          onClick={initiateReview}
          className="w-full py-3 bg-white text-background hover:bg-slate-200 font-bold rounded shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <Save className="w-4 h-4 mr-2" />
          ANALYZE & VERIFY
        </button>
    </div>
  </>
);

const CheckItem: React.FC<{ label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center justify-between p-2.5 rounded border text-left transition-all ${checked ? 'bg-danger/10 border-danger/50 text-danger' : 'bg-background border-border text-slate-400 hover:border-slate-600'}`}
  >
    <span className="text-xs font-bold">{label}</span>
    <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-danger border-danger' : 'border-slate-600'}`}>
       {checked && <TriangleAlert className="w-2.5 h-2.5 text-white" />}
    </div>
  </button>
);

export default Scanner;