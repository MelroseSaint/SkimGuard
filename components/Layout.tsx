import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShieldCheck, Activity, Search, Database, Settings, BookOpen, Menu, X, Bell, User, Shield, AlertTriangle, Lock, Globe, Unlock, Fingerprint, Router, Siren } from 'lucide-react';
import { MDMService } from '../services/mdm';
import { ComplianceStatus } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Security Lock State
  const [isLocked, setIsLocked] = useState(false);
  const lastActivity = useRef<number>(Date.now());
  const intervalRef = useRef<number>(0);

  // MDM State
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [isQuarantined, setIsQuarantined] = useState(false);

  const resetTimer = useCallback(() => {
     lastActivity.current = Date.now();
  }, []);

  // MDM Heartbeat Loop
  useEffect(() => {
    const runMDMCheck = async () => {
        const status = await MDMService.checkCompliance();
        setCompliance(status);
        if (!status.isCompliant) {
            setIsQuarantined(true);
        } else {
            setIsQuarantined(false);
        }
    };

    // Initial check
    runMDMCheck();

    // Loop
    const mdmInterval = setInterval(runMDMCheck, 5000); // Check every 5s

    return () => clearInterval(mdmInterval);
  }, []);

  // Idle Timer
  useEffect(() => {
    const handleActivity = () => resetTimer();
    
    // Event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    // Check for idle
    intervalRef.current = window.setInterval(() => {
        const inactiveTime = Date.now() - lastActivity.current;
        if (inactiveTime > IDLE_TIMEOUT && !isLocked) {
            setIsLocked(true);
        }
    }, 10000); // Check every 10s

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        document.removeEventListener('mousedown', handleClickOutside);
        clearInterval(intervalRef.current);
    };
  }, [isLocked, resetTimer]);

  const handleUnlock = () => {
      // In a real app, verify PIN/Biometric here
      setIsLocked(false);
      resetTimer();
  };

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden relative">
      
      {/* 1. CRITICAL MDM QUARANTINE SCREEN */}
      {isQuarantined && compliance && (
          <div className="absolute inset-0 z-[200] bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
             <div className="bg-background border-2 border-danger p-8 rounded-2xl shadow-[0_0_100px_rgba(239,68,68,0.5)] max-w-md w-full text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent animate-pulse"></div>
                
                <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-danger animate-pulse">
                    <Siren className="w-12 h-12 text-danger" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">DEVICE QUARANTINED</h2>
                <p className="text-danger font-mono text-sm mb-6 uppercase tracking-widest">
                   Corporate Policy Violation Detected
                </p>
                
                <div className="bg-black/50 rounded p-4 text-left border border-danger/30 mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Non-Compliance Reasons:</h3>
                    <ul className="space-y-2">
                        {compliance.violations.map((v, i) => (
                            <li key={i} className="flex items-center text-sm font-bold text-white">
                                <X className="w-4 h-4 text-danger mr-2" />
                                {v}
                            </li>
                        ))}
                    </ul>
                </div>
                
                <p className="text-xs text-slate-500 mb-0">
                   Access is revoked until compliance is restored. <br/>
                   Check device settings or contact IT Admin.
                </p>
             </div>
          </div>
      )}

      {/* 2. SECURITY LOCK SCREEN */}
      {isLocked && !isQuarantined && (
          <div className="absolute inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
             <div className="bg-surface border border-border p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Lock className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Session Locked</h2>
                <p className="text-slate-400 text-sm mb-8">
                   Security timeout triggered due to inactivity. <br/>
                   Your data is encrypted and secure.
                </p>
                <button 
                   onClick={handleUnlock}
                   className="w-full py-3 bg-primary hover:bg-primary/90 text-background font-bold rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                   <Unlock className="w-5 h-5 mr-2" />
                   RESUME SESSION
                </button>
             </div>
             <div className="mt-8 text-xs text-slate-600 font-mono flex items-center">
                 <ShieldCheck className="w-3 h-3 mr-1" /> Protected by SkimGuard SecureCore™
             </div>
          </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex w-64 flex-col bg-surface border-r border-border h-full shrink-0 z-20 ${isLocked || isQuarantined ? 'blur-sm' : ''}`}>
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
      <div className={`flex-1 flex flex-col min-w-0 bg-background relative ${isLocked || isQuarantined ? 'blur-sm pointer-events-none' : ''}`}>
        
        {/* Header (Mobile & Desktop) */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="md:hidden flex items-center">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 mr-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">SkimGuard</span>
          </div>

          <div className="hidden md:flex items-center text-sm text-slate-400">
            {isQuarantined ? (
                <span className="flex items-center text-danger font-bold animate-pulse">
                    <Siren className="w-4 h-4 mr-2" /> MDM POLICY VIOLATION
                </span>
            ) : (
                <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                    System Operational
                </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* MDM Status Pill */}
            <div className={`hidden md:flex items-center px-2 py-1 rounded border text-[10px] font-bold font-mono ${isQuarantined ? 'bg-danger/10 text-danger border-danger/30' : 'bg-primary/10 text-primary border-primary/30'}`}>
                <Router className="w-3 h-3 mr-1.5" />
                {isQuarantined ? 'MDM: BLOCKED' : 'MDM: CONNECTED'}
            </div>

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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto h-full">
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
          <nav className="md:hidden bg-surface border-t border-border flex justify-around items-center h-16 px-2 pb-safe z-40 fixed bottom-0 left-0 right-0">
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