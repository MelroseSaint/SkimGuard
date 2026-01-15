import React, { useState, useEffect } from 'react';
import { Save, Trash2, RefreshCw, Smartphone, Database, Battery, Radio, Lock, Shield, Server, Router, Power, Waves, AlertTriangle, Filter, Code } from 'lucide-react';
import { syncPendingRecords } from '../services/db';
import { MDMService } from '../services/mdm';
import { DeviceIdentity } from '../types';

const Settings: React.FC = () => {
  const [sensitivity, setSensitivity] = useState(75);
  const [rssiThreshold, setRssiThreshold] = useState(-60);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [haptic, setHaptic] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [signalFiltering, setSignalFiltering] = useState(true);
  const [smartFilter, setSmartFilter] = useState(true);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null);

  useEffect(() => {
    // Load config from local storage
    const savedSensitivity = localStorage.getItem('sg_sensitivity');
    const savedRssi = localStorage.getItem('sg_rssiThreshold');
    const savedLowPower = localStorage.getItem('sg_lowPower');
    const savedAutoLock = localStorage.getItem('sg_autoLock');
    const savedFiltering = localStorage.getItem('sg_signalFiltering');
    const savedSmartFilter = localStorage.getItem('sg_smartFilter');

    if (savedSensitivity) setSensitivity(parseInt(savedSensitivity));
    if (savedRssi) setRssiThreshold(parseInt(savedRssi));
    if (savedLowPower) setLowPowerMode(savedLowPower === 'true');
    if (savedAutoLock) setAutoLock(savedAutoLock === 'true');
    if (savedFiltering !== null) setSignalFiltering(savedFiltering === 'true');
    if (savedSmartFilter !== null) setSmartFilter(savedSmartFilter === 'true');
    
    // Load MDM Identity
    setIdentity(MDMService.getIdentity());
  }, []);

  const handleSave = () => {
    localStorage.setItem('sg_sensitivity', sensitivity.toString());
    localStorage.setItem('sg_rssiThreshold', rssiThreshold.toString());
    localStorage.setItem('sg_lowPower', lowPowerMode.toString());
    localStorage.setItem('sg_autoLock', autoLock.toString());
    localStorage.setItem('sg_signalFiltering', signalFiltering.toString());
    localStorage.setItem('sg_smartFilter', smartFilter.toString());
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

  const handleRemoteWipe = () => {
      if (confirm("WARNING: MDM REMOTE WIPE\n\nThis will simulate a corporate remote wipe command. All local databases and keys will be destroyed instantly. This is irreversible.\n\nProceed?")) {
          MDMService.remoteWipe();
      }
  };

  const toggleFiltering = (enabled: boolean) => {
    if (!enabled) {
        // Confirmation dialog explaining the risks of raw data
        if (confirm("⚠️ CAUTION: DISABLING SIGNAL FILTERING\n\nRaw signal data is extremely volatile due to RF interference and multipath effects.\n\nDisabling the noise filter will result in erratic graph movements and potential false-positive proximity alerts.\n\nAre you sure you want to proceed with RAW DATA mode?")) {
            setSignalFiltering(false);
        }
    } else {
        setSignalFiltering(true);
    }
  };

  const toggleSmartFilter = (enabled: boolean) => {
    if (!enabled) {
        if (confirm("⚠️ SECURITY WARNING: DISABLING SMART FILTER\n\nYou are about to disable the benign device suppression protocol.\n\nThis will flag ALL detected Bluetooth devices as potential threats, regardless of their signature (e.g. Headphones, Smartwatches).\n\nThis creates significant noise and high false-positive rates.\n\nProceed with UNFILTERED SCANNING?")) {
            setSmartFilter(false);
        }
    } else {
        setSmartFilter(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Configuration</h1>
            <p className="text-slate-400 text-sm">Manage sensor calibration and security protocols.</p>
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
          
          {/* MDM / Asset Management Panel (NEW) */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Server className="w-24 h-24 text-secondary" />
             </div>
             <h2 className="text-lg font-bold text-white mb-4 flex items-center relative z-10">
               <Router className="w-5 h-5 mr-2 text-secondary" />
               Device Management (MDM)
             </h2>
             
             {identity && (
                 <div className="space-y-3 relative z-10">
                    <div className="p-3 bg-slate-800/50 rounded border border-slate-700/50">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Asset Tag</div>
                        <div className="text-lg font-mono text-white font-bold">{identity.assetTag}</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded border border-slate-700/50">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Platform</div>
                        <div className="text-xs text-slate-300 font-mono truncate">{identity.platform}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{identity.userAgent}</div>
                    </div>
                    
                    <button 
                      onClick={handleRemoteWipe}
                      className="w-full mt-2 py-2 border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 rounded flex items-center justify-center text-xs font-bold transition-colors"
                    >
                        <Power className="w-3 h-3 mr-2" /> INITIATE REMOTE WIPE
                    </button>
                 </div>
             )}
          </div>

          {/* Security Panel */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Shield className="w-24 h-24 text-primary" />
             </div>
             <h2 className="text-lg font-bold text-white mb-4 flex items-center relative z-10">
               <Lock className="w-5 h-5 mr-2 text-primary" />
               Security & Privacy
             </h2>
             
             <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                   <div className="flex items-center space-x-3">
                      <Lock className={`w-4 h-4 ${autoLock ? 'text-primary' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-sm text-slate-200 block font-bold">Session Auto-Lock</span>
                        <span className="text-[10px] text-slate-400">Lock interface after 5 mins of inactivity.</span>
                      </div>
                   </div>
                   <Toggle checked={autoLock} onChange={setAutoLock} />
                </div>
                
                <div className="p-3 bg-slate-800/30 rounded border border-slate-700/50">
                    <h3 className="text-xs font-bold text-slate-300 mb-1">Database Encryption</h3>
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-xs text-primary font-mono">AES-256-GCM ACTIVE</span>
                    </div>
                </div>
             </div>
          </div>

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

                {/* Signal Filtering Toggle */}
                <div className={`p-3 rounded-lg border transition-all ${!signalFiltering ? 'bg-danger/10 border-danger/30' : 'bg-slate-800/50 border-slate-700'}`}>
                   <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center space-x-3">
                          <Waves className={`w-4 h-4 ${!signalFiltering ? 'text-danger' : 'text-slate-400'}`} />
                          <div>
                            <span className="text-sm text-slate-200 block font-bold">Signal Noise Filtering</span>
                            <span className="text-[10px] text-slate-400">Smooths erratic Bluetooth RSSI data.</span>
                          </div>
                       </div>
                       <Toggle checked={signalFiltering} onChange={toggleFiltering} />
                   </div>
                   {!signalFiltering && (
                       <div className="flex items-start mt-2 text-[10px] text-danger font-mono bg-black/40 p-2 rounded">
                           <AlertTriangle className="w-3 h-3 mr-1.5 shrink-0" />
                           WARNING: Raw data mode. Expect high volatility.
                       </div>
                   )}
                </div>

                {/* Bluetooth Smart Filter Toggle */}
                <div className={`p-3 rounded-lg border transition-all ${!smartFilter ? 'bg-accent/10 border-accent/30' : 'bg-slate-800/50 border-slate-700'}`}>
                   <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center space-x-3">
                          <Filter className={`w-4 h-4 ${!smartFilter ? 'text-accent' : 'text-slate-400'}`} />
                          <div>
                            <span className="text-sm text-slate-200 block font-bold">Bluetooth Smart Filter</span>
                            <span className="text-[10px] text-slate-400">Hides known benign devices (Headphones, etc).</span>
                          </div>
                       </div>
                       <Toggle checked={smartFilter} onChange={toggleSmartFilter} />
                   </div>
                   {!smartFilter && (
                       <div className="flex items-start mt-2 text-[10px] text-accent font-mono bg-black/40 p-2 rounded">
                           <AlertTriangle className="w-3 h-3 mr-1.5 shrink-0" />
                           CAUTION: Showing ALL devices. High false-positive risk.
                       </div>
                   )}
                   {smartFilter && (
                       <div className="mt-2 text-[10px] text-slate-500">
                           <span className="text-primary font-bold">Active</span>. Only flagged threats will trigger alerts.
                       </div>
                   )}
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
        
        {/* Developer Footer */}
        <div className="text-center pt-8 border-t border-border mt-8 space-y-2">
             <div className="flex items-center justify-center space-x-2 text-slate-500">
                <Code className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest">System Build v0.1.0</span>
             </div>
             <p className="text-xs text-slate-500">
                Engineered by <a href="https://darkstackstudiosinc.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">DarkStackStudios</a> / Obscura Code
             </p>
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