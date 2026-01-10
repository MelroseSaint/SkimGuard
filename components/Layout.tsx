import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShieldCheck, Activity, Search, Database, Settings, BookOpen, Menu, X, Bell, User, Shield, AlertTriangle, Lock, Globe } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-surface border-r border-border h-full shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 mr-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">SkimGuard</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Main Module</div>
          <NavItem to="/" icon={<Activity className="w-4 h-4" />} label="Command Dashboard" />
          <NavItem to="/scan" icon={<Search className="w-4 h-4" />} label="Live Monitor" />
          <NavItem to="/review" icon={<Database className="w-4 h-4" />} label="Incident Vault" />
          
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-8 mb-2 px-2">Resources</div>
          <NavItem to="/guide" icon={<BookOpen className="w-4 h-4" />} label="Inspection Protocol" />
          <NavItem to="/settings" icon={<Settings className="w-4 h-4" />} label="System Config" />
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-slate-800/50 rounded-lg p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Field Agent</p>
              <p className="text-[10px] text-slate-400">ID: #8842-Alpha</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        
        {/* Header (Mobile & Desktop) */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10">
          <div className="md:hidden flex items-center">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 mr-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">SkimGuard</span>
          </div>

          <div className="hidden md:flex items-center text-sm text-slate-400">
            <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            System Operational
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Center */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 transition-colors relative ${showNotifications ? 'text-white bg-slate-800 rounded-full' : 'text-slate-400 hover:text-white'}`}
              >
                <Bell className="w-5 h-5" />
                {/* Status Indicator Dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-surface"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-border bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Modes</h3>
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/20">ONLINE</span>
                  </div>
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                    
                    {/* Mode A */}
                    <div className="p-3 border-b border-border hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1.5 bg-primary/10 rounded-full border border-primary/20">
                           <Shield className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Mode A: Local Detection</p>
                          <p className="text-xs text-slate-400 mt-1">Continuous, offline-first operation. No public exposure of raw telemetry.</p>
                          <span className="text-[10px] text-primary font-mono mt-2 block">STATUS: ACTIVE</span>
                        </div>
                      </div>
                    </div>

                    {/* Mode B */}
                    <div className="p-3 border-b border-border hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1.5 bg-accent/10 rounded-full border border-accent/20">
                           <AlertTriangle className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Mode B: User Confirmation</p>
                          <p className="text-xs text-slate-400 mt-1">Irreversible user action required to validate threat signatures.</p>
                          <span className="text-[10px] text-accent font-mono mt-2 block">STATUS: READY</span>
                        </div>
                      </div>
                    </div>

                     {/* Mode C */}
                     <div className="p-3 border-b border-border hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1.5 bg-slate-700/50 rounded-full border border-slate-600">
                           <Globe className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Mode C: Disclosure</p>
                          <p className="text-xs text-slate-400 mt-1">Sanitized, read-only outputs governed by Trust Authority Layer.</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-2 block">STANDBY</span>
                        </div>
                      </div>
                    </div>

                    {/* Core Boundary */}
                    <div className="p-3 hover:bg-slate-800/50 transition-colors bg-slate-900/20">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 p-1.5 bg-slate-700/50 rounded-full border border-slate-600">
                           <Lock className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">Core Boundary: Local</p>
                          <p className="text-xs text-slate-400 mt-1">Detection signals confined to device. No external transmission permitted.</p>
                          <span className="text-[10px] text-primary font-mono mt-2 block">SECURE</span>
                        </div>
                      </div>
                    </div>

                  </div>
                  <div className="p-2 bg-slate-900/50 border-t border-border text-center">
                    <Link to="/review" onClick={() => setShowNotifications(false)} className="text-xs text-primary hover:text-primary/80 font-bold">View System Logs</Link>
                  </div>
                </div>
              )}
            </div>

            <button className="md:hidden p-2 text-slate-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
           <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl md:hidden flex flex-col pt-20 px-6 space-y-4 animate-in fade-in slide-in-from-top-10 duration-200">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation</div>
             <NavLink onClick={() => setMobileMenuOpen(false)} to="/" className={({isActive}) => `p-3 rounded-lg flex items-center space-x-3 ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-300 border border-slate-800'}`}>
                <Activity className="w-5 h-5" /> <span>Dashboard</span>
             </NavLink>
             <NavLink onClick={() => setMobileMenuOpen(false)} to="/scan" className={({isActive}) => `p-3 rounded-lg flex items-center space-x-3 ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-300 border border-slate-800'}`}>
                <Search className="w-5 h-5" /> <span>Live Monitor</span>
             </NavLink>
             <NavLink onClick={() => setMobileMenuOpen(false)} to="/review" className={({isActive}) => `p-3 rounded-lg flex items-center space-x-3 ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-300 border border-slate-800'}`}>
                <Database className="w-5 h-5" /> <span>Incident Vault</span>
             </NavLink>
             <NavLink onClick={() => setMobileMenuOpen(false)} to="/guide" className={({isActive}) => `p-3 rounded-lg flex items-center space-x-3 ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-300 border border-slate-800'}`}>
                <BookOpen className="w-5 h-5" /> <span>Protocol Guide</span>
             </NavLink>
             <NavLink onClick={() => setMobileMenuOpen(false)} to="/settings" className={({isActive}) => `p-3 rounded-lg flex items-center space-x-3 ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-300 border border-slate-800'}`}>
                <Settings className="w-5 h-5" /> <span>System Config</span>
             </NavLink>
             
             <button onClick={() => setMobileMenuOpen(false)} className="mt-8 py-3 bg-slate-800 rounded-lg text-slate-400 font-bold flex justify-center">
               Close Menu
             </button>
           </div>
        )}

        {/* Mobile Bottom Tab Bar (Visible only on mobile, hides when menu open) */}
        {!mobileMenuOpen && (
          <nav className="md:hidden bg-surface border-t border-border flex justify-around items-center h-16 px-2 pb-safe z-40">
            <NavLink to="/" className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-slate-500'}`}>
              <Activity className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </NavLink>
            <NavLink to="/scan" className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-slate-500'}`}>
              <Search className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Scan</span>
            </NavLink>
            <NavLink to="/review" className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-slate-500'}`}>
              <Database className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Logs</span>
            </NavLink>
             <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary' : 'text-slate-500'}`}>
              <Settings className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Config</span>
            </NavLink>
          </nav>
        )}
      </div>
    </div>
  );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group ${
        isActive 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-4 h-4 transition-colors` })}
        <span>{label}</span>
        {/* Hover glow effect line */}
        <div className={`ml-auto w-1 h-1 rounded-full bg-primary opacity-0 transition-opacity ${isActive ? 'opacity-100' : 'group-hover:opacity-50'}`}></div>
      </>
    )}
  </NavLink>
);

export default Layout;