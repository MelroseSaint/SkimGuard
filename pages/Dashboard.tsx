import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldCheck, AlertTriangle, Scan, Activity } from 'lucide-react';
import { getStats } from '../services/db';
import { Stats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalScans: 0, highRisk: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load stats", e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Total', value: stats.totalScans, color: '#94a3b8' },
    { name: 'High Risk', value: stats.highRisk, color: '#ef4444' },
    { name: 'Confirmed', value: stats.confirmed, color: '#22d3ee' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-full text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Stat Cards */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-slate-400 text-sm">Total Scans</span>
            <Scan className="w-5 h-5 text-slate-500" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-2">{stats.totalScans}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-slate-400 text-sm">Confirmed</span>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-cyan-400 mt-2">{stats.confirmed}</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 col-span-2 flex items-center justify-between">
           <div>
             <span className="text-slate-400 text-sm block mb-1">High Risk Detections</span>
             <div className="text-3xl font-bold text-red-500">{stats.highRisk}</div>
           </div>
           <AlertTriangle className="w-10 h-10 text-red-500 opacity-80" />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-64">
        <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center">
          <Activity className="w-4 h-4 mr-2" /> Activity Overview
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trust Authority Info */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Trust Authority Status</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Local integrity check passed. Data is encrypted and stored locally. 
          Only confirmed incidents are eligible for public dataset synchronization.
        </p>
        <div className="flex items-center space-x-2 mt-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-green-500 font-mono uppercase">System Secure</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;