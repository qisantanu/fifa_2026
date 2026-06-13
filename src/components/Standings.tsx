import React from 'react';
import { motion } from 'framer-motion';
import type { Match, Team } from '../utils/excelParser';

interface StandingsProps {
  matches: Match[];
  teams: Team[];
}

interface TeamStats {
  name: string;
  flagCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

const Standings: React.FC<StandingsProps> = ({ matches, teams }) => {
  const groups = Array.from(new Set(teams.map(t => t.Group))).sort();

  const calculateStandings = (groupName: string): TeamStats[] => {
    const groupTeams = teams.filter(t => t.Group === groupName);
    const groupMatches = matches.filter(m => m.Group === groupName);

    const stats: Record<string, TeamStats> = {};
    groupTeams.forEach(t => {
      stats[t.TeamName] = { 
        name: t.TeamName, 
        flagCode: t.FlagCode,
        played: 0, 
        won: 0, 
        drawn: 0, 
        lost: 0, 
        gf: 0, 
        ga: 0, 
        gd: 0, 
        pts: 0 
      };
    });

    groupMatches.forEach(m => {
      if (m['Team 1 Score'] === null || m['Team 2 Score'] === null) return;

      const home = stats[m['Team 1']];
      const away = stats[m['Team 2']];

      if (!home || !away) return;

      home.played++;
      away.played++;
      home.gf += m['Team 1 Score'];
      home.ga += m['Team 2 Score'];
      away.gf += m['Team 2 Score'];
      away.ga += m['Team 1 Score'];

      if (m['Team 1 Score'] > m['Team 2 Score']) {
        home.won++;
        home.pts += 3;
        away.lost++;
      } else if (m['Team 2 Score'] > m['Team 1 Score']) {
        away.won++;
        away.pts += 3;
        home.lost++;
      } else {
        home.drawn++;
        away.drawn++;
        home.pts += 1;
        away.pts += 1;
      }
    });

    return Object.values(stats)
      .map(s => ({ ...s, gd: s.gf - s.ga }))
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
      {groups.map((group, gIndex) => (
        <motion.div
          key={group}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: gIndex * 0.05 }}
          className="glass-card overflow-hidden"
        >
          <div className="bg-cyber-blue/10 px-4 md:px-6 py-2 md:py-3 border-b border-cyber-blue/20 flex justify-between items-center">
            <h3 className="text-sm md:text-lg font-black italic text-cyber-blue uppercase tracking-widest">Group {group}</h3>
            <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase">Phase: Group Stage</span>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs md:text-sm min-w-[400px] sm:min-w-0">
              <thead className="text-[8px] md:text-[10px] font-mono text-gray-500 uppercase border-b border-white/5">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4">Team</th>
                  <th className="px-1 md:px-2 py-3 md:py-4 text-center">P</th>
                  <th className="px-1 md:px-2 py-3 md:py-4 text-center">W</th>
                  <th className="px-1 md:px-2 py-3 md:py-4 text-center">D</th>
                  <th className="px-1 md:px-2 py-3 md:py-4 text-center">L</th>
                  <th className="px-1 md:px-2 py-3 md:py-4 text-center">GD</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right text-cyber-blue">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {calculateStandings(group).map((team, tIndex) => (
                  <tr key={team.name} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-gray-600 font-mono text-[10px] md:text-xs">{tIndex + 1}</span>
                        <div className="w-5 h-3 md:w-6 md:h-4 overflow-hidden rounded-sm border border-white/10 shadow-sm flex-shrink-0">
                          <img 
                            src={`https://flagcdn.com/w40/${team.flagCode.toLowerCase()}.png`} 
                            alt={team.name}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                        <span className="font-bold uppercase tracking-tight group-hover:text-cyber-blue transition-colors truncate max-w-[80px] sm:max-w-none">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-1 md:px-2 py-3 md:py-4 text-center font-mono text-gray-400">{team.played}</td>
                    <td className="px-1 md:px-2 py-3 md:py-4 text-center font-mono text-gray-400">{team.won}</td>
                    <td className="px-1 md:px-2 py-3 md:py-4 text-center font-mono text-gray-400">{team.drawn}</td>
                    <td className="px-1 md:px-2 py-3 md:py-4 text-center font-mono text-gray-400">{team.lost}</td>
                    <td className="px-1 md:px-2 py-3 md:py-4 text-center font-mono text-gray-400">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-black text-cyber-blue text-sm md:text-base">{team.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Standings;
