import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Match, Team } from '../utils/excelParser';

interface StatsProps {
  matches: Match[];
  teams: Team[];
}

const AnalyticalInsights: React.FC<{ matches: Match[], teams: Team[] }> = ({ matches, teams }) => {
  const completedMatches = matches.filter(m => 
    typeof m['Team 1 Score'] === 'number' && 
    typeof m['Team 2 Score'] === 'number' &&
    m.Winner && m.Winner !== 'TBD'
  );
  
  const teamStats = teams.map(team => {
    const teamMatches = completedMatches.filter(m => m['Team 1'] === team.TeamName || m['Team 2'] === team.TeamName);
    
    const allScorers: string[] = [];
    let teamTotalGoals = 0;
    let goalsConceded = 0;
    let cleanSheets = 0;
    let yellowCards = 0;
    let redCards = 0;
    
    teamMatches.forEach(m => {
      const isTeam1 = m['Team 1'] === team.TeamName;
      const scorersStr = isTeam1 ? m['Team 1 scorers'] : m['Team 2 scorers'];
      const teamScore = isTeam1 ? m['Team 1 Score'] : m['Team 2 Score'];
      const opponentScore = isTeam1 ? m['Team 2 Score'] : m['Team 1 Score'];
      const yCards = (isTeam1 ? m['Team 1 Yellow'] : m['Team 2 Yellow']) || 0;
      const rCards = (isTeam1 ? m['Team 1 Red'] : m['Team 2 Red']) || 0;
      
      teamTotalGoals += (teamScore || 0);
      goalsConceded += (opponentScore || 0);
      yellowCards += yCards;
      redCards += rCards;
      if (opponentScore === 0) cleanSheets++;

      if (scorersStr) {
        allScorers.push(...scorersStr.split(',').map(s => s.trim()).filter(Boolean));
      }
    });

    const uniqueScorers = new Set(allScorers).size;
    const scorerCounts: { [name: string]: number } = {};
    allScorers.forEach(s => scorerCounts[s] = (scorerCounts[s] || 0) + 1);
    
    const topScorerGoals = Math.max(...Object.values(scorerCounts), 0);
    const dependency = teamTotalGoals > 0 ? (topScorerGoals / teamTotalGoals) * 100 : 0;
    const fairPlayPoints = (yellowCards * 1) + (redCards * 3);

    return {
      name: team.TeamName,
      flagCode: team.FlagCode.toLowerCase(),
      uniqueScorers,
      dependency,
      totalGoals: teamTotalGoals,
      goalsConceded,
      cleanSheets,
      topScorerGoals,
      yellowCards,
      redCards,
      fairPlayPoints
    };
  }).filter(t => t.totalGoals > 0 || t.goalsConceded > 0 || t.yellowCards > 0 || t.redCards > 0);

  const offensiveStats = [...teamStats].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 5);
  const defensiveStats = [...teamStats].sort((a, b) => a.goalsConceded - b.goalsConceded || b.cleanSheets - a.cleanSheets).slice(0, 5);
  const fairPlayStats = [...teamStats].sort((a, b) => a.fairPlayPoints - b.fairPlayPoints).slice(0, 5);
  const disciplineStats = [...teamStats].sort((a, b) => b.fairPlayPoints - a.fairPlayPoints).slice(0, 5);
  const balanceStats = [...teamStats].sort((a, b) => a.dependency - b.dependency).slice(0, 5);
  const noGoalsTeams = teams.filter(t => !teamStats.find(ts => ts.name === t.TeamName)?.totalGoals && completedMatches.some(m => m['Team 1'] === t.TeamName || m['Team 2'] === t.TeamName));

  return (
    <div className="space-y-8 mt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Offensive Power */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 border-t-2 border-t-orange-500/50">
          <h3 className="text-sm font-black italic text-orange-500 uppercase mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
            Offensive Power // Distribution
          </h3>
          <div className="space-y-4">
            {offensiveStats.map((team) => (
              <div key={team.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-4 h-3 object-cover rounded-sm grayscale group-hover:grayscale-0 transition-all" alt="" />
                  <span className="text-[10px] font-bold text-gray-300 uppercase">{team.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-[100px] ml-4">
                  <div className="h-0.5 flex-1 bg-orange-500/10 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(team.totalGoals / (offensiveStats[0]?.totalGoals || 1)) * 100}%` }} className="h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  </div>
                  <span className="text-orange-500 font-mono text-[10px] w-4 text-right">{team.totalGoals}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Defensive Security */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 border-t-2 border-t-cyber-blue">
          <h3 className="text-sm font-black italic text-cyber-blue uppercase mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-cyber-blue rounded-full animate-ping"></span>
            Defensive Security // Wall Index
          </h3>
          <div className="space-y-4">
            {defensiveStats.map((team) => (
              <div key={team.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-4 h-3 object-cover rounded-sm" alt="" />
                  <span className="text-[10px] font-bold text-white uppercase">{team.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-cyber-blue italic">{team.goalsConceded}</span>
                        <span className="text-[7px] font-mono text-gray-500 uppercase">Conceded</span>
                    </div>
                    <div className="w-px h-6 bg-white/5"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-white italic">{team.cleanSheets}</span>
                        <span className="text-[7px] font-mono text-gray-500 uppercase">CS</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tactical Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8 border-t-2 border-t-cyber-magenta">
          <h3 className="text-sm font-black italic text-cyber-magenta uppercase mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-cyber-magenta rounded-full animate-ping"></span>
            Tactical Balance // Scorer Spread
          </h3>
          <div className="space-y-4">
            {balanceStats.map((team) => (
              <div key={team.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-4 h-3 object-cover rounded-sm" alt="" />
                  <span className="text-[10px] font-bold text-white uppercase">{team.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-cyber-magenta italic">{team.dependency.toFixed(0)}%</span>
                    <span className="text-[7px] font-mono text-gray-500 uppercase">Reliance</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-cyber-magenta/20 flex items-center justify-center relative">
                     <svg className="w-full h-full -rotate-90">
                        <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                        <motion.circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="1.5" strokeDasharray="88" initial={{ strokeDashoffset: 88 }} animate={{ strokeDashoffset: 88 - (88 * team.dependency) / 100 }} className="text-cyber-magenta" />
                     </svg>
                     <span className="absolute text-[8px] font-black text-white">{team.uniqueScorers}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Fair Play Index */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8 border-l-4 border-l-green-500/50">
          <h3 className="text-sm font-black italic text-green-500 uppercase mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
            Fair Play // Index
          </h3>
          <div className="space-y-4">
            {fairPlayStats.map((team, i) => (
              <div key={team.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-gray-500">{i + 1}</span>
                  <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-4 h-3 object-cover rounded-sm" alt="" />
                  <span className="text-xs font-bold text-white uppercase">{team.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-yellow-500">{team.yellowCards}</span>
                        <div className="w-2 h-3 bg-yellow-500 rounded-sm"></div>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-red-500">{team.redCards}</span>
                        <div className="w-2 h-3 bg-red-500 rounded-sm"></div>
                    </div>
                  </div>
                  <div className="text-right min-w-[30px]">
                    <span className="text-lg font-black text-green-500 italic">{team.fairPlayPoints}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Discipline Alert */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-8 border-l-4 border-l-red-500/50">
          <h3 className="text-sm font-black italic text-red-500 uppercase mb-6 flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
            Discipline // Alert
          </h3>
          <div className="space-y-4">
            {disciplineStats.slice(0, 5).map((team) => (
              <div key={team.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <img src={`https://flagcdn.com/w40/${team.flagCode}.png`} className="w-4 h-3 object-cover rounded-sm grayscale group-hover:grayscale-0 transition-all" alt="" />
                  <span className="text-xs font-bold text-white uppercase">{team.name}</span>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-[150px] ml-4">
                  <div className="h-1 flex-1 bg-red-500/10 overflow-hidden rounded-full">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(team.fairPlayPoints / (disciplineStats[0]?.fairPlayPoints || 1)) * 100}%` }} className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  </div>
                  <span className="text-red-500 font-mono font-black italic w-6 text-right">{team.fairPlayPoints}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quantum Alerts Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 flex flex-wrap items-center gap-8 bg-gradient-to-r from-red-500/5 to-transparent border-l-2 border-l-red-500/50">
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono text-red-400 uppercase tracking-widest animate-pulse">Critical Alert //</span>
            <span className="text-[10px] font-black text-white uppercase">Teams Yet To Score:</span>
        </div>
        <div className="flex gap-4">
            {noGoalsTeams.length > 0 ? noGoalsTeams.map(t => (
                <div key={t.TeamName} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded">
                    <img src={`https://flagcdn.com/w20/${t.FlagCode.toLowerCase()}.png`} className="w-3 h-2" alt="" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{t.TeamName}</span>
                </div>
            )) : <span className="text-[9px] font-mono text-gray-600 uppercase italic">All Units Active // Zero Scoring Vacuums Detected</span>}
        </div>
      </motion.div>
    </div>
  );
};

const Stats: React.FC<StatsProps> = ({ matches, teams }) => {
  const completedMatches = matches.filter(m => 
    typeof m['Team 1 Score'] === 'number' && 
    typeof m['Team 2 Score'] === 'number' &&
    m.Winner && m.Winner !== 'TBD'
  );
  
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
    <div className="space-y-8 md:space-y-12 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4 md:p-8 h-[350px] md:h-[400px] flex flex-col"
        >
          <h3 className="text-sm md:text-lg font-black italic text-cyber-blue uppercase mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
            <span className="w-2 h-2 bg-cyber-blue rounded-full animate-ping"></span>
            Goal Intensity // By Stage
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalsByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#ffffff20' }} />
                <YAxis stroke="#94a3b8" fontSize={10} tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#ffffff20' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #00f2ff', borderRadius: '8px', fontSize: '10px' }}
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
          className="glass-card p-4 md:p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm md:text-lg font-black italic text-cyber-magenta uppercase mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
              <span className="w-2 h-2 bg-cyber-magenta rounded-full"></span>
              Golden Boot // Leaderboard
            </h3>
            <div className="space-y-3 md:space-y-4">
              {topScorers.length > 0 ? (
                topScorers.map((scorer, i) => (
                  <div key={scorer.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="text-[10px] font-mono text-gray-500">0{i + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-xs md:text-white font-bold tracking-tight group-hover:text-cyber-blue transition-colors uppercase">
                          {scorer.name}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-3 h-2 overflow-hidden rounded-sm border border-white/10 flex-shrink-0">
                            {scorer.flagCode && (
                              <img 
                                src={`https://flagcdn.com/w40/${scorer.flagCode}.png`} 
                                alt={scorer.team}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span className="text-[7px] md:text-[8px] font-mono text-gray-500 uppercase">{scorer.team}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:block h-1 w-16 md:w-24 bg-white/5 overflow-hidden rounded-full">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(scorer.goals / (topScorers[0]?.goals || 1)) * 100}%` }}
                          className="h-full bg-cyber-magenta"
                        />
                      </div>
                      <span className="text-cyber-magenta font-black italic text-sm md:text-base w-6 md:w-8 text-right">{scorer.goals}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-[10px] font-mono py-8 text-center uppercase tracking-widest">
                  Awaiting Data Streams...
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-mono text-gray-500 uppercase">Total Quantum Goals</span>
              <span className="text-xl md:text-2xl font-black text-white italic">
                {completedMatches.reduce((acc, m) => acc + (m['Team 1 Score'] || 0) + (m['Team 2 Score'] || 0), 0)}
              </span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[8px] md:text-[10px] font-mono text-gray-500 uppercase">Goals/Match</span>
              <span className="text-xl md:text-2xl font-black text-cyber-blue italic">
                {(completedMatches.reduce((acc, m) => acc + (m['Team 1 Score'] || 0) + (m['Team 2 Score'] || 0), 0) / (completedMatches.length || 1)).toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
      
      <AnalyticalInsights matches={matches} teams={teams} />

      <div className="glass-card p-4 md:p-6 bg-gradient-to-r from-cyber-blue/10 to-transparent">
        <h4 className="text-[10px] md:text-xs font-mono text-cyber-blue uppercase tracking-widest mb-4">Network Status</h4>
        <div className="flex flex-wrap gap-4 md:gap-8">
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase">Excel Stream: Online</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase">Visual Core: Optimized</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-cyber-blue rounded-full animate-ping"></div>
                <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase">A.I. Analysis: Active</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
