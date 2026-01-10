import React, { useEffect, useState } from 'react';
import { getDetections, updateDetectionStatus } from '../services/db';
import { DetectionRecord, DetectionStatus } from '../types';
import { Check, X, FileDown, Search, MapPin, AlertTriangle } from 'lucide-react';

const Review: React.FC = () => {
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');

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

  const handleStatusUpdate = async (id: string, newStatus: DetectionStatus) => {
    try {
      await updateDetectionStatus(id, newStatus);
      await loadDetections(); // Reload UI
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const exportReport = () => {
    const confirmed = detections.filter(d => d.status === DetectionStatus.CONFIRMED);
    const reportData = confirmed.map(d => ({
      id: d.id,
      timestamp: new Date(d.timestamp).toISOString(),
      riskScore: d.analysis.riskScore,
      details: d.analysis.details,
      status: d.status
    }));

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skimguard_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDetections = detections.filter(d => {
    if (filter === 'ALL') return true;
    return d.status === filter;
  });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-100">Review Detections</h2>
        <button 
          onClick={exportReport}
          className="bg-slate-800 text-cyan-400 p-2 rounded-lg hover:bg-slate-700 flex items-center text-xs font-bold"
        >
          <FileDown className="w-4 h-4 mr-1" />
          EXPORT
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 bg-slate-900 p-1 rounded-lg w-full">
        {(['ALL', 'PENDING', 'CONFIRMED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
              filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4 pb-20">
        {filteredDetections.length === 0 ? (
          <div className="text-center text-slate-500 py-10 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No records found.</p>
          </div>
        ) : (
          filteredDetections.map((record) => (
            <div key={record.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
              <div className="relative h-48 bg-slate-950">
                <img 
                  src={record.imageData} 
                  alt="Detection capture" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-white">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
                
                {record.analysis.isSuspicious && (
                  <div className="absolute top-2 left-2 bg-red-500/90 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    RISK {record.analysis.riskScore}%
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="mb-3">
                  <h4 className="text-slate-200 font-medium text-sm mb-1">Analysis Details</h4>
                  <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                    {record.analysis.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>

                {record.status === DetectionStatus.PENDING ? (
                  <div className="flex space-x-2 mt-4">
                    <button 
                      onClick={() => handleStatusUpdate(record.id, DetectionStatus.REJECTED)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                    >
                      <X className="w-4 h-4 mr-2" /> False Alarm
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(record.id, DetectionStatus.CONFIRMED)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center shadow-lg shadow-cyan-900/20"
                    >
                      <Check className="w-4 h-4 mr-2" /> Confirm
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      record.status === DetectionStatus.CONFIRMED ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {record.status}
                    </span>
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