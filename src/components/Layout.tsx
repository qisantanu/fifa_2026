import React from 'react';
import { Trophy, LayoutDashboard, GitMerge, BarChart3, Wifi } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSyncing?: boolean;
  lastSyncTime?: Date | null;
  nextSyncInSeconds?: number;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  isSyncing = false,
  lastSyncTime = null,
  nextSyncInSeconds = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'standings', label: 'Standings', icon: <Trophy size={20} /> },
    { id: 'bracket', label: 'Bracket', icon: <GitMerge size={20} /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 size={20} /> },
  ];

  const formatSyncTime = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return 'just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-20 md:h-16 border-b border-cyber-blue/30 glass-card flex flex-col md:flex-row items-center justify-between px-4 md:px-8 sticky top-0 z-50 py-2 md:py-0">
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-0">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-cyber-blue rounded-full shadow-neon flex items-center justify-center">
            <Trophy className="text-cyber-black w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
          </div>
          <h1 className="text-sm md:text-xl font-black tracking-tighter text-cyber-blue italic">
            <span className="hidden sm:inline">FIFA 2026</span> <span className="text-white">QUANTUM STATS</span>
          </h1>
        </div>
        
        <nav className="flex gap-2 sm:gap-6 w-full md:w-auto justify-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-full transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-cyber-blue/20 text-cyber-blue shadow-[0_0_10px_rgba(0,242,255,0.3)]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="md:hidden">
                {item.icon}
              </span>
              <span className="hidden md:inline">
                {item.icon}
              </span>
              <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-[11px] md:text-xs text-gray-400 mt-2 md:mt-0">
          <Wifi size={14} className={isSyncing ? 'text-cyber-blue animate-pulse' : 'text-gray-500'} />
          <span className={isSyncing ? 'text-cyber-blue' : 'text-gray-400'}>
            {isSyncing
              ? 'Syncing...'
              : `Next sync in ${nextSyncInSeconds}s`}
          </span>
          {!isSyncing && lastSyncTime && (
            <span className="hidden lg:inline text-gray-600">
              Last: {formatSyncTime(lastSyncTime)}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="p-6 text-center space-y-2 border-t border-white/5">
        <div className="text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase">
          System Status: Operational // 2026 World Cup Protocol Active
        </div>
        <div className="text-xs text-cyber-blue font-black italic tracking-wider">
          DEVELOPED BY <span className="text-white">SANTANUB</span> // © 2026
        </div>
      </footer>
    </div>
  );
};

export default Layout;
