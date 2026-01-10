import React, { useEffect, useState } from 'react';
import { getDetections, updateDetectionStatus } from '../services/db';
import { DetectionRecord, DetectionStatus } from '../types';
import { Check, X, FileDown, Search, TriangleAlert, ShieldCheck, Bluetooth } from 'lucide-react';

const Review: React.FC = () => {
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetections();
  }, []);

  const loadDetections = async () => {
    setLoading(true);
    try {
      const data = await getDetections();
      setDetections(data);
    } catch (err) {
      console.error("Failed to load detections", err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = detections.map(d => ({
      id: d.id,
      timestamp: new Date(d.timestamp).toISOString(),
      riskScore: d.analysis.riskScore,
      checklist: d.analysis.checklist,
      bluetoothDevices: d.analysis.detectedDevices,
      status: d.status
    }));

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skimguard_log_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-100">Inspection Log</h2>
        <button 
          onClick={exportReport}
          className="bg-slate-800 text-cyan-400 p-2 rounded-lg hover:bg-slate-700 flex items-center text-xs font-bold"
        >
          <FileDown className="w-4 h-4 mr-1" />
          EXPORT
        </button>
      </div>

      <div className="space-y-4 pb-20">
        {detections.length === 0 ? (
          <div className="text-center text-slate-500 py-10 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No inspections recorded.</p>
          </div>
        ) : (
          detections.map((record) => (
            <div key={record.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
              <div className="relative h-48 bg-slate-950">
                <img 
                  src={record.imageData} 
                  alt="Inspection capture" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-white">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
                
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold flex items-center ${
                  record.analysis.isSuspicious ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'
                }`}>
                  {record.analysis.isSuspicious ? (
                    <><TriangleAlert className="w-3 h-3 mr-1" /> RISK {record.analysis.riskScore}%</>
                  ) : (
                    <><ShieldCheck className="w-3 h-3 mr-1" /> CLEARED</>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-3">
                  <h4 className="text-slate-200 font-medium text-sm mb-2">Findings</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(record.analysis.checklist).map(([key, val]) => (
                      val && (
                        <div key={key} className="text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded border border-red-900/30 flex items-center">
                          <TriangleAlert className="w-3 h-3 mr-1.5 flex-shrink-0" />
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      )
                    ))}
                    {!record.analysis.isSuspicious && (
                       <span className="text-xs text-green-400">No physical anomalies reported.</span>
                    )}
                  </div>
                </div>

                {record.analysis.detectedDevices && record.analysis.detectedDevices.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400 flex items-center mb-1">
                      <Bluetooth className="w-3 h-3 mr-1" /> Signals Detected
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {record.analysis.detectedDevices.map((dev, i) => (
                        <span key={i} className="text-[10px] bg-cyan-900/30 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-900/50">
                          {dev}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Review;