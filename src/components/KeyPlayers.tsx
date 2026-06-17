import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft } from 'lucide-react';
import type { Match, Team, KeyPlayer } from '../utils/excelParser';

interface KeyPlayersProps {
  matches: Match[];
  teams: Team[];
  keyPlayers: KeyPlayer[];
  onBack: () => void;
}

const KeyPlayers: React.FC<KeyPlayersProps> = ({ matches, teams, keyPlayers, onBack }) => {
  // Calculate goals for each player
  const playerGoals: { [name: string]: number } = {};

  const normalizeName = (name: string) => name.replace(/\s+/g, ' ').trim().toUpperCase();
  const isOwnGoal = (scorer: string) => /(?:\bOG\b|\(OG\))/i.test(scorer);
  const parseScorers = (scorers?: string) =>
    (scorers?.split(',') || [])
      .map(s => s.trim())
      .filter(s => s && !isOwnGoal(s));
  
  const completedMatches = matches.filter(m => 
    m['Team 1 Score'] !== null && m['Team 1 Score'] !== undefined &&
    m['Team 2 Score'] !== null && m['Team 2 Score'] !== undefined &&
    m.Winner && m.Winner !== 'TBD'
  );

  completedMatches.forEach(match => {
    const t1Scorers = parseScorers(match['Team 1 scorers']);
    const t2Scorers = parseScorers(match['Team 2 scorers']);
    
    [...t1Scorers, ...t2Scorers].forEach(scorer => {
      const normalizedScorer = normalizeName(scorer);
      playerGoals[normalizedScorer] = (playerGoals[normalizedScorer] || 0) + 1;
    });
  });

  const sortedPlayers = [...keyPlayers].sort((a, b) => {
    const goalsA = playerGoals[normalizeName(a['Player Name'])] || 0;
    const goalsB = playerGoals[normalizeName(b['Player Name'])] || 0;
    if (goalsB !== goalsA) {
      return goalsB - goalsA;
    }
    return normalizeName(a['Player Name']).localeCompare(normalizeName(b['Player Name']));
  });

  const getFlagCode = (countryName: string) => {
    return teams.find(t => t.TeamName === countryName)?.FlagCode?.toLowerCase() || '';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-cyber-blue hover:bg-cyber-blue/20 transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <h2 className="text-2xl font-black italic tracking-widest text-white uppercase flex items-center gap-4">
            <Trophy className="text-cyber-magenta" size={24} />
            Key Players // Global Matrix
          </h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-cyber-magenta/20 to-transparent ml-8 hidden md:block"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedPlayers.map((player, index) => {
          const normalizedPlayerName = normalizeName(player['Player Name']);
          const goals = playerGoals[normalizedPlayerName] || 0;
          const flagCode = getFlagCode(player['Country']);

          return (
            <motion.div
              key={player['Player Name']}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card group overflow-hidden border-b-4 border-b-cyber-magenta/30 hover:border-b-cyber-magenta transition-all duration-500"
            >
              <div className="aspect-[4/5] relative overflow-hidden bg-gray-900">
                <img 
                  src={player['Image']} 
                  alt={player['Player Name']}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-transparent to-transparent opacity-60"></div>
                
                {/* Goal Badge */}
                <div className="absolute top-4 right-4 bg-cyber-magenta text-white px-3 py-1 rounded-full text-xs font-black italic shadow-neon-magenta transform skew-x-12">
                   {goals} GOALS
                </div>
              </div>

              <div className="p-4 relative">
                <div className="flex items-center gap-3 mb-1">
                  {flagCode && (
                    <img 
                      src={`https://flagcdn.com/w40/${flagCode}.png`} 
                      alt={player['Country']}
                      className="w-4 h-3 object-cover rounded-sm border border-white/10"
                    />
                  )}
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{player['Country']}</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter group-hover:text-cyber-blue transition-colors">
                  {player['Player Name']}
                </h3>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="text-[8px] font-mono text-cyber-blue uppercase">Status: Elite Asset</div>
                  <div className="w-2 h-2 bg-cyber-blue rounded-full animate-ping"></div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default KeyPlayers;
