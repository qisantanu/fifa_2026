import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import type { Match } from '../utils/excelParser';

interface DashboardProps {
  matches: Match[];
}

const Dashboard: React.FC<DashboardProps> = ({ matches }) => {
  const recentMatches = matches.slice(0, 6);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black italic tracking-widest text-cyber-blue uppercase">Live Feed // Recent Matches</h2>
          <div className="h-px flex-1 bg-cyber-blue/20 ml-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentMatches.map((match, index) => (
            <motion.div
              key={match.MatchID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 border-l-4 border-l-cyber-blue hover:shadow-neon transition-all duration-500 group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono text-cyber-blue uppercase tracking-[0.2em]">Match ID: {match.MatchID} // {match.Stage}</span>
                <Calendar size={14} className="text-gray-500" />
              </div>
              
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-2 border border-white/5 group-hover:border-cyber-blue/50 transition-colors">
                    <span className="text-xl font-bold">{match['Team 1'].substring(0, 3)}</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">{match['Team 1']}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-black italic text-white flex gap-2">
                    <span>{match['Team 1 Score'] ?? '-'}</span>
                    <span className="text-cyber-blue">:</span>
                    <span>{match['Team 2 Score'] ?? '-'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 mt-1 uppercase">Final Score</span>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-2 border border-white/5 group-hover:border-cyber-blue/50 transition-colors">
                    <span className="text-xl font-bold">{match['Team 2'].substring(0, 3)}</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">{match['Team 2']}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                <MapPin size={10} className="text-cyber-blue" />
                <span>{match.Date} // VENUE TBD</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={120} />
            </div>
            <h3 className="text-xl font-bold italic text-cyber-magenta mb-4 uppercase tracking-tighter">Tournament Overview</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                The first ever 48-team FIFA World Cup. 12 groups, 104 matches, 3 host nations. 
                Quantum Stats is tracking every data point in real-time.
            </p>
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-center">
                    <div className="text-2xl font-black text-cyber-blue">48</div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Teams</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-center">
                    <div className="text-2xl font-black text-cyber-blue">12</div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Groups</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-center">
                    <div className="text-2xl font-black text-cyber-blue">104</div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Matches</div>
                </div>
            </div>
        </div>
        
        <div className="glass-card p-8 border-r-4 border-r-cyber-magenta">
            <h3 className="text-xl font-bold italic text-white mb-4 uppercase tracking-tighter">System Intelligence</h3>
            <div className="space-y-4">
                {[
                    { label: 'Data Source', value: 'Local Excel Protocol', status: 'Syncing' },
                    { label: 'Animation Engine', value: 'Framer Quantum', status: 'Active' },
                    { label: 'Visualization', value: 'Neon Vector Matrix', status: 'Stable' },
                ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                        <span className="text-[10px] font-mono text-gray-400 uppercase">{item.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{item.value}</span>
                            <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-pulse shadow-neon-magenta"></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
