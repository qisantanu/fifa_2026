import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Match, Team } from '../utils/excelParser';

interface StatsProps {
  matches: Match[];
  teams: Team[];
}

const AnalyticalInsights: React.FC<{ matches: Match[], teams: Team[] }> = ({ matches, teams }) => {
  const completedMatches = matches.filter(m => m['Team 1 Score'] !== null && m['Team 2 Score'] !== null);
  
  const teamStats = teams.map(team => {
    const teamMatches = completedMatches.filter(m => m['Team 1'] === team.TeamName || m['Team 2'] === team.TeamName);
    
    const allScorers: string[] = [];
    let teamTotalGoals = 0;
    
    teamMatches.forEach(m => {
      const isTeam1 = m['Team 1'] === team.TeamName;
      const scorersStr = isTeam1 ? m['Team 1 scorers'] : m['Team 2 scorers'];
      const score = isTeam1 ? m['Team 1 Score'] : m['Team 2 Score'];
      
      teamTotalGoals += (score || 0);
      if (scorersStr) {
        allScorers.push(...scorersStr.split(',').map(s => s.trim()).filter(Boolean));
      }
    });

    const uniqueScorers = new Set(allScorers).size;
    
    const scorerCounts: { [name: string]: number } = {};
    allScorers.forEach(s => scorerCounts[s] = (scorerCounts[s] || 0) + 1);
    
    const topScorerGoals = Math.max(...Object.values(scorerCounts), 0);
    const dependency = teamTotalGoals > 0 ? (topScorerGoals / teamTotalGoals) * 100 : 0;

    return {
      name: team.TeamName,
      flagCode: team.FlagCode.toLowerCase(),
      uniqueScorers,
      dependency,
      totalGoals: teamTotalGoals,
      topScorerGoals
    };
  }).filter(t => t.totalGoals > 0);

  const diversityStats = [...teamStats].sort((a, b) => b.uniqueScorers - a.uniqueScorers).slice(0, 6);
  const offensiveStats = [...teamStats].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 6);
  const dependencyStats = [...teamStats].sort((a, b) => b.dependency - a.dependency).slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h3 className="text-lg font-black italic text-cyber-blue uppercase mb-8 flex items-center gap-4">
          <span className="w-2 h-2 bg-cyber-blue rounded-full animate-ping"></span>
          Scorer Diversity // Unique Threats
        </h3>
        <div className="space-y-4">
          {diversityStats.map((team) => (
            <div key={team.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-4 h-3 object-cover rounded-sm" alt="" />
                <span className="text-xs font-bold text-white uppercase">{team.name}</span>
              </div>
              <div className="flex items-center gap-4 flex-1 max-w-[120px] ml-4">
                <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(team.uniqueScorers / 10) * 100}%` }}
                    className="h-full bg-cyber-blue shadow-neon"
                  />
                </div>
                <span className="text-cyber-blue font-mono text-[10px] w-4">{team.uniqueScorers}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h3 className="text-lg font-black italic text-white uppercase mb-8 flex items-center gap-4">
          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          Offensive Power // Goal Distribution
        </h3>
        <div className="space-y-4">
          {offensiveStats.map((team) => (
            <div key={team.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-4 h-3 object-cover rounded-sm" alt="" />
                <span className="text-xs font-bold text-white uppercase">{team.name}</span>
              </div>
              <div className="flex items-center gap-4 flex-1 max-w-[120px] ml-4">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(team.totalGoals / (offensiveStats[0]?.totalGoals || 1)) * 100}%` }}
                    className="h-full bg-white shadow-[0_0_8px_#fff]"
                  />
                </div>
                <span className="text-white font-mono text-[10px] w-4">{team.totalGoals}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <h3 className="text-lg font-black italic text-cyber-magenta uppercase mb-8 flex items-center gap-4">
          <span className="w-2 h-2 bg-cyber-magenta rounded-full animate-ping"></span>
          Dependency Index // Star Reliance
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {dependencyStats.map((team) => (
            <div key={team.name} className="p-4 bg-white/5 rounded border border-white/5 relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-2">
                <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-3 h-2 object-cover rounded-sm" alt="" />
                <span className="text-[10px] font-black text-white uppercase truncate">{team.name}</span>
              </div>
              <div className="text-2xl font-black text-cyber-magenta italic">{team.dependency.toFixed(0)}%</div>
              <div className="text-[8px] font-mono text-gray-500 uppercase mt-1">Dependence Level</div>
              <div className={`absolute bottom-0 left-0 h-0.5 bg-cyber-magenta transition-all duration-1000`} style={{ width: `${team.dependency}%` }}></div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const Stats: React.FC<StatsProps> = ({ matches, teams }) => {
  const completedMatches = matches.filter(m => m['Team 1 Score'] !== null && m['Team 2 Score'] !== null);
  
  const goalsByStage = completedMatches.reduce((acc: any, match) => {
    const totalGoals = (match['Team 1 Score'] || 0) + (match['Team 2 Score'] || 0);
    const existing = acc.find((a: any) => a.stage === match.Stage);
    if (existing) {
      existing.goals += totalGoals;
    } else {
      acc.push({ stage: match.Stage, goals: totalGoals });
    }
    return acc;
  }, []);

  // Parse scorers and associate with teams
  const scorerData: { [name: string]: { goals: number, team: string, flagCode: string } } = {};
  
  const getTeamInfo = (teamName: string) => {
    const team = teams.find(t => t.TeamName === teamName);
    return {
      name: teamName,
      flagCode: team?.FlagCode?.toLowerCase() || ''
    };
  };

  completedMatches.forEach(match => {
    const t1Info = getTeamInfo(match['Team 1']);
    const t2Info = getTeamInfo(match['Team 2']);
    
    const t1Scorers = match['Team 1 scorers']?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const t2Scorers = match['Team 2 scorers']?.split(',').map(s => s.trim()).filter(Boolean) || [];
    
    t1Scorers.forEach(scorer => {
      if (!scorerData[scorer]) {
        scorerData[scorer] = { goals: 0, team: t1Info.name, flagCode: t1Info.flagCode };
      }
      scorerData[scorer].goals++;
    });

    t2Scorers.forEach(scorer => {
      if (!scorerData[scorer]) {
        scorerData[scorer] = { goals: 0, team: t2Info.name, flagCode: t2Info.flagCode };
      }
      scorerData[scorer].goals++;
    });
  });

  const topScorers = Object.entries(scorerData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  return (
    <div className="space-y-12 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 h-[400px] flex flex-col"
        >
          <h3 className="text-lg font-black italic text-cyber-blue uppercase mb-8 flex items-center gap-4">
            <span className="w-2 h-2 bg-cyber-blue rounded-full animate-ping"></span>
            Goal Intensity // By Stage
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#ffffff20' }} />
                <YAxis stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#ffffff20' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #00f2ff', borderRadius: '8px' }}
                  itemStyle={{ color: '#00f2ff', fontWeight: 'bold' }}
                />
                <Bar dataKey="goals">
                  {goalsByStage.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00f2ff' : '#ff00c8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-black italic text-cyber-magenta uppercase mb-8 flex items-center gap-4">
              <span className="w-2 h-2 bg-cyber-magenta rounded-full"></span>
              Golden Boot // Leaderboard
            </h3>
            <div className="space-y-4">
              {topScorers.length > 0 ? (
                topScorers.map((scorer, i) => (
                  <div key={scorer.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-gray-500">0{i + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-white font-bold tracking-tight group-hover:text-cyber-blue transition-colors uppercase">
                          {scorer.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-3 h-2 overflow-hidden rounded-sm border border-white/10 flex-shrink-0">
                            {scorer.flagCode && (
                              <img 
                                src={`https://flagcdn.com/w40/${scorer.flagCode}.png`} 
                                alt={scorer.team}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span className="text-[8px] font-mono text-gray-500 uppercase">{scorer.team}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 bg-white/5 overflow-hidden rounded-full">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(scorer.goals / (topScorers[0]?.goals || 1)) * 100}%` }}
                          className="h-full bg-cyber-magenta"
                        />
                      </div>
                      <span className="text-cyber-magenta font-black italic w-8 text-right">{scorer.goals}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-xs font-mono py-8 text-center uppercase tracking-widest">
                  Awaiting Data Streams...
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Total Quantum Goals</span>
              <span className="text-2xl font-black text-white italic">
                {completedMatches.reduce((acc, m) => acc + (m['Team 1 Score'] || 0) + (m['Team 2 Score'] || 0), 0)}
              </span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Goals/Match</span>
              <span className="text-2xl font-black text-cyber-blue italic">
                {(completedMatches.reduce((acc, m) => acc + (m['Team 1 Score'] || 0) + (m['Team 2 Score'] || 0), 0) / (completedMatches.length || 1)).toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
      
      <AnalyticalInsights matches={matches} teams={teams} />

      <div className="glass-card p-6 bg-gradient-to-r from-cyber-blue/10 to-transparent">
        <h4 className="text-xs font-mono text-cyber-blue uppercase tracking-widest mb-4">Network Status</h4>
        <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[10px] font-mono text-gray-400 uppercase">Excel Stream: Online</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[10px] font-mono text-gray-400 uppercase">Visual Core: Optimized</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-cyber-blue rounded-full animate-ping"></div>
                <span className="text-[10px] font-mono text-gray-400 uppercase">A.I. Analysis: Active</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
