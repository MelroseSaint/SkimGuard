import React, { useEffect, useState } from 'react';
import { getDetections, updateDetectionStatus } from '../services/db';
import { DetectionRecord, DetectionStatus } from '../types';
import { generateAuthorityReport } from '../services/reportGenerator';
import { TrustAuthority } from '../services/trustLayer';
import { FileDown, Search, AlertCircle, CheckCircle2, ChevronRight, ChevronDown, SlidersHorizontal, Lock, Share2, ShieldAlert, RefreshCw } from 'lucide-react';

const Review: React.FC = () => {
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDetections();
    // Real-time polling for new records
    const interval = setInterval(() => {
        loadDetections(false);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDetections = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getDetections();
      setDetections(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load detections", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleExport = (record: DetectionRecord) => {
    if (!TrustAuthority.authorizeExport(record)) {
        alert("Trust Authority: Action Denied. Only confirmed threats with validated chain of custody can be exported.");
        return;
    }
    generateAuthorityReport(record);
  };

  const handleShare = async (record: DetectionRecord) => {
    if (!TrustAuthority.authorizeExport(record)) {
        alert("Action Denied. Record must be confirmed first.");
        return;
    }

    const file = generateAuthorityReport(record);
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'SkimGuard Incident Report',
                text: `Verified Skimmer Detection Report: ${record.id}`
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    } else {
        alert("Sharing not supported on this device/browser.");
    }
  };

  const handleConfirm = async (record: DetectionRecord) => {
      // User manually confirms a pending suspicion
      if (confirm("Are you sure you want to promote this to a CONFIRMED THREAT? This action is irreversible.")) {
          try {
             // Validate transition via TrustLayer locally implies we check logic
             if (!TrustAuthority.validateStateTransition(DetectionStatus.CONFIRMED, record.status)) {
                 throw new Error("Invalid State Transition");
             }
             
             await updateDetectionStatus(record.id, DetectionStatus.CONFIRMED);
             await loadDetections(); // Refresh list immediately
          } catch (e) {
             alert("Failed to confirm incident.");
          }
      }
  };

  if (loading) return <div className="flex justify-center items-center h-full text-slate-500 font-mono text-sm">LOADING LOGS...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <div className="flex items-center space-x-2">
               <h2 className="text-xl font-bold text-white">Recent Scan Activity</h2>
               <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
               </span>
           </div>
           <p className="text-sm text-slate-400">Audit log of all manual and automated inspection events.</p>
        </div>
        <div className="flex space-x-2">
           <button className="flex items-center space-x-2 px-3 py-2 bg-surface border border-border rounded text-xs font-bold text-slate-300 hover:text-white transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
           </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xl">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-slate-900/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
           <div className="col-span-3">Timestamp / Device ID</div>
           <div className="col-span-3">Threat Type</div>
           <div className="col-span-3">Confidence Score</div>
           <div className="col-span-3 text-right">Action</div>
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-border bg-slate-900/50 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
           <span>Log Entries</span>
           <span className="text-[10px] font-mono font-normal">Updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        <div className="divide-y divide-border">
          {detections.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No records found in local vault.</p>
            </div>
          ) : (
            detections.map((record) => (
              <DetectionRow 
                  key={record.id} 
                  record={record} 
                  onExport={() => handleExport(record)} 
                  onConfirm={() => handleConfirm(record)}
                  onShare={() => handleShare(record)}
              />
            ))
          )}
        </div>
      </div>
      
      <div className="text-xs text-slate-500 flex justify-between items-center">
         <span>Showing {detections.length} events</span>
         <span className="flex items-center"><Lock className="w-3 h-3 mr-1" /> Encrypted Local Vault</span>
      </div>
    </div>
  );
};

const DetectionRow: React.FC<{ 
    record: DetectionRecord; 
    onExport: () => void; 
    onConfirm: () => void;
    onShare: () => void;
}> = ({ record, onExport, onConfirm, onShare }) => {
  const [expanded, setExpanded] = useState(false);
  const isHighRisk = record.analysis.isSuspicious;
  const isConfirmed = record.status === DetectionStatus.CONFIRMED;
  const isPending = record.status === DetectionStatus.PENDING;
  const score = record.analysis.riskScore;
  const date = new Date(record.timestamp);
  
  return (
    <>
      <div 
        className={`flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-slate-800/30 transition-colors group cursor-pointer ${expanded ? 'bg-slate-800/50' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Timestamp & ID */}
        <div className="flex justify-between items-center md:block md:col-span-3">
          <div>
              <div className="text-xs text-slate-400 font-mono mb-0.5">
                {date.toLocaleDateString()} <span className="hidden md:inline">| {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {record.deviceType || "TERM-8842-X"}
              </div>
          </div>
          {/* Mobile Only Status Badge - right aligned next to ID */}
          <div className="md:hidden">
              {isConfirmed ? (
                <AlertCircle className="w-5 h-5 text-danger" />
              ) : isPending ? (
                <ShieldAlert className="w-5 h-5 text-accent animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-slate-600" />
              )}
          </div>
        </div>

        {/* Threat Type */}
        <div className="md:col-span-3 mt-1 md:mt-0">
          {isConfirmed ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-danger/10 text-danger border border-danger/20">
              <span className="hidden md:inline"><AlertCircle className="w-3 h-3 mr-1.5" /></span>
              CONFIRMED THREAT
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-accent/10 text-accent border border-accent/20">
              <span className="hidden md:inline"><ShieldAlert className="w-3 h-3 mr-1.5" /></span>
              ACTION REQUIRED
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
               <span className="hidden md:inline"><CheckCircle2 className="w-3 h-3 mr-1.5" /></span>
              Verified Safe
            </span>
          )}
        </div>

        {/* Confidence Bar */}
        <div className="md:col-span-3 md:pr-4 mt-1 md:mt-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-mono font-bold ${isHighRisk ? 'text-danger' : 'text-primary'}`}>
              Risk: {score.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${isHighRisk ? 'bg-danger' : 'bg-primary'}`} 
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>

        {/* Action */}
        <div className="md:col-span-3 flex justify-end space-x-2 mt-2 md:mt-0 items-center">
          {isPending && (
              <button 
                onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                className="px-3 py-1 bg-danger hover:bg-danger/90 text-white text-xs font-bold rounded flex items-center shadow-lg shadow-danger/20"
              >
                Confirm
              </button>
          )}
          
          {isConfirmed && (
              <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onExport(); }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 hover:text-white"
                    title="Export Authority PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onShare(); }}
                    className="p-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-primary hover:text-white"
                    title="Share with Authority"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
              </>
          )}
          
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white opacity-50 hover:opacity-100"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
       <div className="bg-slate-900/50 border-b border-border p-4 md:p-6 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Left Column: Evidence & Location */}
             <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Location & Device Identity</h4>
                
                <div className="bg-background rounded border border-border p-3 mb-4 space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Device Type:</span>
                      <span className="text-white font-mono">{record.deviceType || "Unknown"}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Record ID:</span>
                      <span className="text-white font-mono text-xs">{record.id}</span>
                   </div>
                   <div className="border-t border-slate-700 my-2"></div>
                   {record.location ? (
                       <>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Latitude:</span>
                            <span className="text-white font-mono">{record.location.latitude.toFixed(6)}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Longitude:</span>
                            <span className="text-white font-mono">{record.location.longitude.toFixed(6)}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Accuracy:</span>
                            <span className="text-primary font-mono">±{record.location.accuracy?.toFixed(1) || 0}m</span>
                         </div>
                       </>
                   ) : (
                       <div className="text-sm text-danger flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" /> GPS Data Missing
                       </div>
                   )}
                </div>

                {record.imageData && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Visual Evidence</h4>
                        <div className="rounded-lg overflow-hidden border border-border relative bg-black">
                            <img src={record.imageData} className="w-full h-48 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 text-xs font-mono text-white truncate">
                                HASH: {record.id.split('-')[0]}...
                            </div>
                        </div>
                    </div>
                )}
             </div>

             {/* Right Column: Analysis Details */}
             <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Forensic Analysis</h4>
                
                <div className="space-y-2 mb-6">
                    {Object.entries(record.analysis.checklist).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded bg-background border border-border">
                            <span className="text-sm text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            {val ? (
                                <span className="text-xs font-bold text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20">DETECTED</span>
                            ) : (
                                <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">CLEARED</span>
                            )}
                        </div>
                    ))}
                </div>

                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Wireless Signature</h4>
                {record.analysis.detectedDevices && record.analysis.detectedDevices.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {record.analysis.detectedDevices.map((dev: any, i: number) => (
                            <div key={i} className="text-xs p-2 bg-background border border-border rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-white">{dev.name || "Unknown"}</div>
                                    <div className="font-mono text-slate-500">{dev.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold ${dev.threatType ? 'text-danger' : 'text-slate-400'}`}>{dev.rssi} dBm</div>
                                    {dev.threatType && <div className="text-[10px] text-danger font-bold">{dev.threatType}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-3 border border-dashed border-slate-700 rounded text-center text-xs text-slate-500">
                        No wireless signals captured during scan.
                    </div>
                )}
             </div>
          </div>
       </div>
      )}
    </>
  );
};

export default Review;