import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldAlert, Activity, Map, ArrowUpRight, Signal, Database, Server, Wifi, Clock, WifiOff, Cloud, Target } from 'lucide-react';
import { getStats, getDetections } from '../services/db';
import { Stats, DetectionRecord } from '../types';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalScans: 0, highRisk: 0, confirmed: 0, pendingSync: 0 });
  const [recentDetections, setRecentDetections] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Mock data for the chart to match the aesthetic
  const trendData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: 20 + Math.random() * 30 + (i > 12 ? i * 2 : 0) // Upward trend
  }));

  useEffect(() => {
    loadData();
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
    }
  }, []);

  const loadData = async () => {
    try {
      const statData = await getStats();
      const detectionData = await getDetections();
      setStats(statData);
      setRecentDetections(detectionData.slice(0, 5)); // Get last 5
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full text-slate-500 font-mono text-sm">INITIALIZING SYSTEM...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
             <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20 uppercase">Live Monitoring</span>
             {isOnline ? (
                 <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 uppercase flex items-center">
                    <Cloud className="w-3 h-3 mr-1 text-primary" /> Connected
                 </span>
             ) : (
                 <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 uppercase flex items-center">
                    <WifiOff className="w-3 h-3 mr-1 text-danger" /> Offline Mode
                 </span>
             )}
             
             <span className="text-slate-500 text-xs font-mono uppercase">Sys-Uptime: 99.9%</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Command Dashboard</h1>
          <p className="text-slate-400 text-sm">Real-time telemetry and hardware status.</p>
        </div>
        
        <div className="flex space-x-3">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Local Storage</span>
                <span className="text-xs text-white font-mono">142MB / 500MB</span>
             </div>
             <Link to="/settings" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm px-4 py-2 rounded transition-all flex items-center">
                {stats.pendingSync > 0 ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse"></span>
                        {stats.pendingSync} Pending
                    </>
                ) : (
                    "Sync Data"
                )}
             </Link>
             <Link to="/scan" className="bg-primary hover:bg-primary/90 text-background font-bold text-sm px-4 py-2 rounded shadow-lg shadow-primary/20 flex items-center transition-all">
                <Activity className="w-4 h-4 mr-2" />
                New Scan
             </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Scans (24H)" 
          value={stats.totalScans.toLocaleString()} 
          subValue="+5.2%" 
          subLabel="Vs previous 24h"
          icon={<Activity className="w-8 h-8 text-secondary/20" />}
          borderColor="border-secondary/30"
        />
        <StatCard 
          label="Threats Identified" 
          value={stats.highRisk.toString()} 
          subValue="+2 New" 
          subLabel="Critical attention required"
          valueColor="text-danger"
          subValueColor="text-danger bg-danger/10"
          icon={<ShieldAlert className="w-8 h-8 text-danger/20" />}
          borderColor="border-danger/30"
          highlight
        />
        <StatCard 
          label="Pending Sync" 
          value={stats.pendingSync.toString()} 
          valueColor={stats.pendingSync > 0 ? "text-accent" : "text-slate-400"}
          subValue={isOnline ? "Ready" : "Offline"} 
          subLabel="Records waiting for cloud"
          icon={<Cloud className="w-8 h-8 text-accent/20" />}
          borderColor="border-accent/30"
        />
        <StatCard 
          label="Last Known Threat" 
          value={recentDetections.length > 0 && recentDetections[0].analysis.riskScore > 50 ? "HIGH" : "LOW"} 
          valueColor={recentDetections.length > 0 && recentDetections[0].analysis.riskScore > 50 ? "text-danger" : "text-primary"}
          subValue="Stable" 
          subLabel="Proximity Radar"
          icon={<Target className="w-8 h-8 text-primary/20" />}
          borderColor="border-primary/30"
          progressBar
        />
      </div>

      {/* Row 2: Charts & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">Detection Trends</h3>
              <p className="text-xs text-slate-400">Volume of scan events over time</p>
            </div>
            <div className="flex space-x-2">
              {['1H', '24H', '7D'].map(t => (
                <button key={t} className={`px-2 py-1 text-[10px] font-bold rounded ${t === '24H' ? 'bg-primary text-background' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }} itemStyle={{ color: '#10B981' }} />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status Panel */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xl">
          <h3 className="text-base font-semibold text-white mb-1">System Status</h3>
          <p className="text-xs text-slate-400 mb-4">Hardware and service health</p>

          <div className="space-y-4">
             <StatusItem 
                icon={isOnline ? <Wifi className="w-4 h-4 text-primary" /> : <WifiOff className="w-4 h-4 text-danger" />} 
                label="Network Connection" 
                status={isOnline ? "Online" : "Offline"} 
                sub={isOnline ? "Latency: 24ms" : "Local Mode Active"} 
             />
             <StatusItem icon={<Database className="w-4 h-4 text-primary" />} label="Local Vault" status="Active" sub="Encrypted (AES-256)" />
             <StatusItem icon={<Signal className="w-4 h-4 text-secondary" />} label="Bluetooth Module" status="Standby" sub="Ready to scan" />
             <StatusItem icon={<Map className="w-4 h-4 text-primary" />} label="Geolocation" status="Locked" sub="Precision: High" />
             <StatusItem icon={<Server className="w-4 h-4 text-slate-400" />} label="Remote Sync" status="Idle" sub="Last sync: 10m ago" />
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
             <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Battery Level</span>
                <span className="text-xs font-bold text-primary">84%</span>
             </div>
             <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-primary h-full w-[84%]"></div>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-4">
           <div>
             <h3 className="text-base font-semibold text-white">Recent Activity</h3>
             <p className="text-xs text-slate-400">Latest events captured by field agents</p>
           </div>
           <Link to="/review" className="text-xs font-bold text-primary hover:text-primary/80 flex items-center">
             View All <ArrowUpRight className="w-3 h-3 ml-1" />
           </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
             <thead className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-border">
                <tr>
                   <th className="pb-3 pl-2">Time</th>
                   <th className="pb-3">Device ID</th>
                   <th className="pb-3">Risk Score</th>
                   <th className="pb-3">Findings</th>
                   <th className="pb-3 text-right pr-2">Status</th>
                </tr>
             </thead>
             <tbody className="text-sm divide-y divide-border">
                {recentDetections.map(d => (
                   <tr key={d.id} className="group hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pl-2 text-slate-400 font-mono text-xs">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-2 opacity-50" />
                          {new Date(d.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-white">{d.deviceType || "TERM-GENERIC"}</td>
                      <td className="py-3">
                         <div className="flex items-center">
                           <div className={`w-16 h-1.5 rounded-full mr-2 ${d.analysis.riskScore > 50 ? 'bg-danger/20' : 'bg-primary/20'}`}>
                              <div className={`h-full rounded-full ${d.analysis.riskScore > 50 ? 'bg-danger' : 'bg-primary'}`} style={{width: `${d.analysis.riskScore}%`}}></div>
                           </div>
                           <span className={`text-xs font-mono font-bold ${d.analysis.riskScore > 50 ? 'text-danger' : 'text-primary'}`}>{d.analysis.riskScore}%</span>
                         </div>
                      </td>
                      <td className="py-3 text-xs text-slate-400">
                         {d.analysis.checklist.bluetoothSignal ? 'BLE Detected' : d.analysis.checklist.looseParts ? 'Physical Damage' : 'Nominal'}
                      </td>
                      <td className="py-3 text-right pr-2">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.analysis.isSuspicious 
                              ? 'bg-danger/10 text-danger border border-danger/20' 
                              : 'bg-primary/10 text-primary border border-primary/20'
                         }`}>
                            {d.analysis.isSuspicious ? 'Threat' : 'Safe'}
                         </span>
                      </td>
                   </tr>
                ))}
                {recentDetections.length === 0 && (
                   <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs italic">
                         No recent activity recorded.
                      </td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

const StatCard: React.FC<any> = ({ label, value, subValue, subLabel, valueColor = "text-white", subValueColor = "text-primary bg-primary/10", icon, borderColor = "border-border", highlight, progressBar }) => (
  <div className={`bg-surface border ${borderColor} rounded-xl p-5 relative overflow-hidden group transition-all hover:border-opacity-50`}>
    {highlight && <div className="absolute inset-0 bg-danger/5 pointer-events-none"></div>}
    
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline mt-2 space-x-2">
          <h2 className={`text-4xl font-bold tracking-tight ${valueColor}`}>{value}</h2>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${subValueColor}`}>{subValue}</span>
        </div>
      </div>
      <div className="opacity-50 group-hover:opacity-100 transition-opacity">
        {icon}
      </div>
    </div>
    
    <p className="text-xs text-slate-500">{subLabel}</p>
    
    {progressBar && (
      <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-4 overflow-hidden">
        <div className="bg-primary h-full w-[85%] rounded-full"></div>
      </div>
    )}
  </div>
);

const StatusItem: React.FC<{icon: React.ReactNode, label: string, status: string, sub: string}> = ({icon, label, status, sub}) => (
   <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
         <div className="p-1.5 bg-slate-800 rounded border border-slate-700">{icon}</div>
         <div>
            <div className="text-sm font-bold text-slate-200">{label}</div>
            <div className="text-[10px] text-slate-500">{sub}</div>
         </div>
      </div>
      <div className="text-right">
         <div className="text-xs font-mono text-primary font-bold">{status}</div>
      </div>
   </div>
);

export default Dashboard;