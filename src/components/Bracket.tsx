import React from 'react';
import { motion } from 'framer-motion';
import type { Match, Team } from '../utils/excelParser';

interface BracketProps {
  matches: Match[];
  teams: Team[];
}

const Bracket: React.FC<BracketProps> = ({ matches, teams }) => {
  const knockoutStages = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];
  
  const getMatchesForStage = (stage: string) => {
    return matches.filter(m => m.Stage === stage);
  };

  return (
    <div className="flex flex-col items-center py-6 md:py-10 space-y-12 md:space-y-20 w-full overflow-hidden">
      <div className="md:hidden text-[10px] font-mono text-cyber-blue animate-pulse mb-2 uppercase tracking-widest">
        ↔ Swipe to Explore Bracket ↔
      </div>
      
      <div className="w-full overflow-x-auto custom-scrollbar pb-8">
        <div className="flex gap-10 md:gap-16 min-w-max px-6 md:px-10">
          {knockoutStages.map((stage, stageIndex) => (
            <div key={stage} className="flex flex-col items-center space-y-6 md:space-y-8">
              <div className="text-cyber-blue font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs italic mb-2 md:mb-4">
                {stage}
              </div>
              
              <div className={`flex flex-col justify-around h-full space-y-8 md:space-y-12`}>
                {getMatchesForStage(stage).length > 0 ? (
                  getMatchesForStage(stage).map((match, mIndex) => (
                    <motion.div
                      key={match.MatchID}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (stageIndex * 0.2) + (mIndex * 0.05) }}
                      className="w-48 md:w-56 glass-card p-2 md:p-3 border-l-2 border-l-cyber-magenta hover:shadow-neon-magenta transition-all duration-300 relative group"
                    >
                      <div className="flex flex-col gap-1 md:gap-2">
                        <div className={`flex justify-between items-center px-2 py-1 rounded ${match.Winner === match['Team 1'] ? 'bg-cyber-magenta/20 text-cyber-magenta' : 'text-gray-400'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {(() => {
                              const code = teams.find(t => t.TeamName === match['Team 1'])?.FlagCode?.toLowerCase();
                              return code ? (
                                <img src={`https://flagcdn.com/w20/${code}.png`} alt={match['Team 1']} className="w-5 h-3 object-cover rounded-sm shrink-0" />
                              ) : (
                                <span className="inline-block w-5 h-5 bg-gray-800 text-xs font-bold flex items-center justify-center rounded">{match['Team 1'].substring(0,2)}</span>
                              );
                            })()}
                            <span className="text-[10px] md:text-xs font-bold uppercase truncate">{match['Team 1']}</span>
                          </div>
                          <span className="font-mono font-bold text-[10px] md:text-sm">{match['Team 1 Score'] ?? '-'}</span>
                        </div>
                        <div className="h-px bg-white/5 mx-2"></div>
                        <div className={`flex justify-between items-center px-2 py-1 rounded ${match.Winner === match['Team 2'] ? 'bg-cyber-magenta/20 text-cyber-magenta' : 'text-gray-400'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {(() => {
                              const code = teams.find(t => t.TeamName === match['Team 2'])?.FlagCode?.toLowerCase();
                              return code ? (
                                <img src={`https://flagcdn.com/w20/${code}.png`} alt={match['Team 2']} className="w-5 h-3 object-cover rounded-sm shrink-0" />
                              ) : (
                                <span className="inline-block w-5 h-5 bg-gray-800 text-xs font-bold flex items-center justify-center rounded">{match['Team 2'].substring(0,2)}</span>
                              );
                            })()}
                            <span className="text-[10px] md:text-xs font-bold uppercase truncate">{match['Team 2']}</span>
                          </div>
                          <span className="font-mono font-bold text-[10px] md:text-sm">{match['Team 2 Score'] ?? '-'}</span>
                        </div>
                      </div>
                      
                      {/* Visual Connector for next stage */}
                      {stageIndex < knockoutStages.length - 1 && (
                          <div className="absolute top-1/2 -right-10 md:-right-16 w-10 md:w-16 h-px bg-cyber-magenta/30 group-hover:bg-cyber-magenta transition-colors"></div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="w-48 md:w-56 h-16 md:h-20 border border-white/5 rounded-lg flex items-center justify-center text-[8px] md:text-[10px] font-mono text-gray-700 uppercase italic">
                    Data Pending...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="glass-card p-4 md:p-6 border-t-4 border-t-cyber-blue max-w-2xl text-center mx-4 md:mx-0">
        <h4 className="text-xs md:text-sm font-black italic text-cyber-blue uppercase mb-2">Bracket Protocol</h4>
        <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed uppercase tracking-tight">
          The knockout stage progresses from the Round of 32 through to the Grand Final. 
          Winners of each node propagate to the next quantum state.
        </p>
      </div>
    </div>
  );
};

export default Bracket;
