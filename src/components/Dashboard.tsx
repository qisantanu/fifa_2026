import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy, Clock } from 'lucide-react';
import { type Match, type Team, excelDateToJS } from '../utils/excelParser';

interface DashboardProps {
  matches: Match[];
  teams: Team[];
}

const Dashboard: React.FC<DashboardProps> = ({ matches, teams }) => {
  const now = new Date();
  // Set to beginning of today for fair comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Sort matches by ID descending and find completed ones (Winner is declared or is a Draw)
  const completedMatches = [...matches]
    .filter(m => m.Winner && m.Winner !== 'TBD' && m.Winner !== 'null')
    .sort((a, b) => b.MatchID - a.MatchID);

  // Find 3 upcoming matches: Winner is TBD AND Date >= Today
  const upcomingMatches = [...matches]
    .filter(m => (m.Winner === 'TBD' || !m.Winner) && excelDateToJS(m.Date) >= today)
    .sort((a, b) => excelDateToJS(a.Date).getTime() - excelDateToJS(b.Date).getTime())
    .slice(0, 3);

  // If we have completed matches, show latest 6. Otherwise show first 6 upcoming.
  const displayMatches = completedMatches.length > 0 
    ? completedMatches.slice(0, 6) 
    : matches.slice(0, 6);

  const getFlagCode = (teamName: string) => {
    return teams.find(t => t.TeamName === teamName)?.FlagCode?.toLowerCase() || '';
  };

  const formatDate = (date: string | number) => {
    const d = excelDateToJS(date);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-2xl font-black italic tracking-widest text-cyber-blue uppercase">Live Feed // Recent Matches</h2>
          <div className="h-px flex-1 bg-cyber-blue/20 ml-4 md:ml-6"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayMatches.map((match, index) => (
            <motion.div
              key={match.MatchID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 md:p-6 border-l-4 border-l-cyber-blue hover:shadow-neon transition-all duration-500 group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[8px] md:text-[10px] font-mono text-cyber-blue uppercase tracking-[0.1em] md:tracking-[0.2em]">Match ID: {match.MatchID} // {match.Stage}</span>
                <Calendar className="text-gray-500 w-3 h-3 md:w-3.5 md:h-3.5" />
              </div>
              
              <div className="flex items-center justify-between gap-2 md:gap-4 py-2 md:py-4">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-2 border border-white/5 group-hover:border-cyber-blue/50 transition-colors overflow-hidden">
                    {getFlagCode(match['Team 1']) ? (
                      <img 
                        src={`https://flagcdn.com/w80/${getFlagCode(match['Team 1'])}.png`}
                        alt={match['Team 1']}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">{match['Team 1'].substring(0, 3)}</span>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-center truncate w-full">{match['Team 1']}</span>
                  <div className="mt-2 text-[6px] md:text-[7px] font-mono text-gray-500 uppercase text-center leading-tight space-y-0.5 max-h-[40px] overflow-y-auto no-scrollbar">
                    {match['Team 1 scorers']?.split(',').map((s, i) => (
                      <div key={i} className="whitespace-nowrap">{s.trim()}</div>
                    )) || ''}
                  </div>
                </div>
                
                <div className="flex flex-col items-center shrink-0">
                  <div className="text-xl md:text-3xl font-black italic text-white flex gap-1 md:gap-2">
                    <span>{match['Team 1 Score'] ?? '-'}</span>
                    <span className="text-cyber-blue">:</span>
                    <span>{match['Team 2 Score'] ?? '-'}</span>
                  </div>
                  <span className="text-[8px] font-mono text-gray-500 mt-1 uppercase">Final Score</span>
                </div>

                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-2 border border-white/5 group-hover:border-cyber-blue/50 transition-colors overflow-hidden">
                    {getFlagCode(match['Team 2']) ? (
                      <img 
                        src={`https://flagcdn.com/w80/${getFlagCode(match['Team 2'])}.png`}
                        alt={match['Team 2']}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">{match['Team 2'].substring(0, 3)}</span>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-center truncate w-full">{match['Team 2']}</span>
                  <div className="mt-2 text-[6px] md:text-[7px] font-mono text-gray-500 uppercase text-center leading-tight space-y-0.5 max-h-[40px] overflow-y-auto no-scrollbar">
                    {match['Team 2 scorers']?.split(',').map((s, i) => (
                      <div key={i} className="whitespace-nowrap">{s.trim()}</div>
                    )) || ''}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[8px] md:text-[10px] font-mono text-gray-400">
                <MapPin className="text-cyber-blue w-2 h-2 md:w-2.5 md:h-2.5" />
                <span>{formatDate(match.Date)} // VENUE TBD</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {upcomingMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-2xl font-black italic tracking-widest text-cyber-magenta uppercase">Upcoming Protocols // 72H Window</h2>
            <div className="h-px flex-1 bg-cyber-magenta/20 ml-4 md:ml-6"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {upcomingMatches.map((match, index) => (
              <motion.div
                key={match.MatchID}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-4 md:p-6 border-b-4 border-b-cyber-magenta bg-cyber-magenta/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Clock className="text-cyber-magenta w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-4 md:gap-6 w-full">
                    <div className="flex flex-col items-center">
                        <img src={`https://flagcdn.com/w40/${getFlagCode(match['Team 1'])}.png`} className="w-6 h-4 md:w-8 md:h-5 object-cover rounded-sm mb-2" alt="" />
                        <span className="text-[8px] md:text-[10px] font-bold text-white uppercase">{match['Team 1']}</span>
                    </div>
                    <span className="text-cyber-magenta font-black italic text-xs md:text-base">VS</span>
                    <div className="flex flex-col items-center">
                        <img src={`https://flagcdn.com/w40/${getFlagCode(match['Team 2'])}.png`} className="w-6 h-4 md:w-8 md:h-5 object-cover rounded-sm mb-2" alt="" />
                        <span className="text-[8px] md:text-[10px] font-bold text-white uppercase">{match['Team 2']}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase tracking-widest">{formatDate(match.Date)}</div>
                    <div className="text-[6px] md:text-[8px] font-mono text-cyber-magenta uppercase mt-1">Status: Pre-Match Sync</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="glass-card p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-20 h-20 md:w-32 md:h-32" />
            </div>
            <h3 className="text-lg md:text-xl font-bold italic text-cyber-magenta mb-4 uppercase tracking-tighter">Tournament Overview</h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-6">
                The first ever 48-team FIFA World Cup. 12 groups, 104 matches, 3 host nations. 
                Quantum Stats is tracking every data point in real-time.
            </p>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/5 text-center">
                    <div className="text-xl md:text-2xl font-black text-cyber-blue">48</div>
                    <div className="text-[8px] md:text-[10px] font-mono text-gray-500 uppercase">Teams</div>
                </div>
                <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/5 text-center">
                    <div className="text-xl md:text-2xl font-black text-cyber-blue">12</div>
                    <div className="text-[8px] md:text-[10px] font-mono text-gray-500 uppercase">Groups</div>
                </div>
                <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/5 text-center">
                    <div className="text-xl md:text-2xl font-black text-cyber-blue">104</div>
                    <div className="text-[8px] md:text-[10px] font-mono text-gray-500 uppercase">Matches</div>
                </div>
            </div>
        </div>
        
        <div className="glass-card p-6 md:p-8 border-r-4 border-r-cyber-magenta">
            <h3 className="text-lg md:text-xl font-bold italic text-white mb-4 uppercase tracking-tighter">System Intelligence</h3>
            <div className="space-y-3 md:space-y-4">
                {[
                    { label: 'Data Source', value: 'Local Excel Protocol', status: 'Syncing' },
                    { label: 'Animation Engine', value: 'Framer Quantum', status: 'Active' },
                    { label: 'Visualization', value: 'Neon Vector Matrix', status: 'Stable' },
                ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 md:p-3 bg-white/5 rounded border border-white/5">
                        <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase">{item.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] md:text-xs font-bold text-white">{item.value}</span>
                            <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-cyber-magenta rounded-full animate-pulse shadow-neon-magenta"></span>
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
