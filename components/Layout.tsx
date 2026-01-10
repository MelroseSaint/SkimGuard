import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Camera, LayoutDashboard, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-cyan-400">
          <ShieldAlert className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">SkimGuard</h1>
        </div>
        <div className="text-xs text-slate-500 font-mono">v1.0.0 Alpha</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center p-2 z-20 pb-safe">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-cyan-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/scan" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-cyan-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Scan</span>
        </NavLink>
        
        <NavLink 
          to="/review" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-cyan-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Review</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;