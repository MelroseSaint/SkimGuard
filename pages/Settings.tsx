import React, { useState, useEffect } from 'react';
import { Save, Trash2, RefreshCw, Smartphone, Database, Battery, Radio } from 'lucide-react';
import { syncPendingRecords } from '../services/db';

const Settings: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [rssiThreshold, setRssiThreshold] = useState(-60);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [haptic, setHaptic] = useState(true);
  
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Load config from local storage
    const savedSensitivity = localStorage.getItem('sg_sensitivity');
    const savedRssi = localStorage.getItem('sg_rssiThreshold');
    const savedLowPower = localStorage.getItem('sg_lowPower');

    if (savedSensitivity) setSensitivity(parseInt(savedSensitivity));
    if (savedRssi) setRssiThreshold(parseInt(savedRssi));
    if (savedLowPower) setLowPowerMode(savedLowPower === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem('sg_sensitivity', sensitivity.toString());
    localStorage.setItem('sg_rssiThreshold', rssiThreshold.toString());
    localStorage.setItem('sg_lowPower', lowPowerMode.toString());
    alert("Configuration Saved Locally");
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
        const count = await syncPendingRecords();
        alert(`Sync Complete. Uploaded ${count} pending records.`);
    } catch (e) {
        alert("Sync Failed. Check connection.");
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Configuration</h1>
            <p className="text-slate-400 text-sm">Manage sensor calibration and power profiles.</p>
          </div>
          <button 
             onClick={handleSave}
             className="bg-primary hover:bg-primary/90 text-background font-bold text-sm px-4 py-2 rounded flex items-center shadow-lg shadow-primary/20"
          >
             <Save className="w-4 h-4 mr-2" />
             Save Config
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Sensor Calibration Panel */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-lg">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center">
               <Radio className="w-5 h-5 mr-2 text-slate-400" />
               Sensor Thresholds
             </h2>
             
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">Visual Detection Sensitivity</label>
                      <span className="text-xs font-mono text-primary">{sensitivity}%</span>
                   </div>
                   <input 
                     type="range" 
                     min="0" max="100" 
                     value={sensitivity} 
                     onChange={(e) => setSensitivity(parseInt(e.target.value))}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                   />
                   <p className="text-[10px] text-slate-500 mt-1">Adjusts overlay thickness estimation.</p>
                </div>

                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">RSSI Threat Alert</label>
                      <span className="text-xs font-mono text-danger">{rssiThreshold} dBm</span>
                   </div>
                   <input 
                     type="range" 
                     min="-90" max="-30" 
                     value={rssiThreshold} 
                     onChange={(e) => setRssiThreshold(parseInt(e.target.value))}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-danger"
                   />
                   <p className="text-[10px] text-slate-500 mt-1">Triggers "PROXIMITY ALERT" when signal is stronger than this value.</p>
                </div>
             </div>
          </div>

          {/* Power & Feedback */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-lg">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center">
               <Battery className="w-5 h-5 mr-2 text-slate-400" />
               Power & Feedback
             </h2>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                   <div className="flex items-center space-x-3">
                      <Battery className={`w-4 h-4 ${lowPowerMode ? 'text-accent' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-sm text-slate-200 block font-bold">Low Power Mode</span>
                        <span className="text-[10px] text-slate-400">Halts sensors when app is in background.</span>
                      </div>
                   </div>
                   <Toggle checked={lowPowerMode} onChange={setLowPowerMode} />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                   <div className="flex items-center space-x-3">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-200">Haptic Feedback</span>
                   </div>
                   <Toggle checked={haptic} onChange={setHaptic} />
                </div>
             </div>
          </div>
       </div>

       {/* Data Management */}
       <div className="bg-surface border border-border rounded-xl p-6 shadow-lg">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center">
               <Database className="w-5 h-5 mr-2 text-secondary" />
               Offline Data Management
             </h2>
             
             <div className="space-y-4">
                <div className="p-4 bg-slate-800/30 rounded border border-border flex justify-between items-center">
                   <div>
                       <h3 className="text-sm font-bold text-white mb-1">Sync Pending Records</h3>
                       <p className="text-xs text-slate-400">Push locally stored incidents to cloud.</p>
                   </div>
                   <button 
                     onClick={handleManualSync} 
                     disabled={isSyncing}
                     className="text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded flex items-center border border-slate-600"
                   >
                      <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> 
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                   </button>
                </div>
                
                <div className="p-4 bg-danger/5 rounded border border-danger/20 mt-4">
                   <h3 className="text-sm font-bold text-danger mb-1">Local Purge</h3>
                   <p className="text-xs text-danger/70 mb-3">Permanently delete all local logs. This cannot be undone.</p>
                   <button className="text-xs font-bold bg-danger hover:bg-danger/90 text-white px-3 py-1.5 rounded flex items-center">
                      <Trash2 className="w-3 h-3 mr-2" /> Clear All Data
                   </button>
                </div>
             </div>
        </div>
    </div>
  );
};

const Toggle: React.FC<{checked: boolean, onChange: (v: boolean) => void}> = ({checked, onChange}) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-slate-600'}`}
  >
     <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`}></div>
  </button>
);

export default Settings;