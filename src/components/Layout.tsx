import React from 'react';
import { Trophy, LayoutDashboard, GitMerge, BarChart3 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'standings', label: 'Standings', icon: <Trophy size={20} /> },
    { id: 'bracket', label: 'Bracket', icon: <GitMerge size={20} /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-cyber-blue/30 glass-card flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyber-blue rounded-full shadow-neon flex items-center justify-center">
            <Trophy className="text-cyber-black" size={18} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-cyber-blue italic">
            FIFA 2026 <span className="text-white">QUANTUM STATS</span>
          </h1>
        </div>
        
        <nav className="flex gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-cyber-blue/20 text-cyber-blue shadow-[0_0_10px_rgba(0,242,255,0.3)]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-sm font-bold uppercase tracking-wider hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="p-4 text-center text-xs text-gray-500 font-mono tracking-widest uppercase">
        System Status: Operational // 2026 World Cup Protocol Active
      </footer>
    </div>
  );
};

export default Layout;
