import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Match } from '../utils/excelParser';

interface StatsProps {
  matches: Match[];
}

const Stats: React.FC<StatsProps> = ({ matches }) => {
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

  // Parse scorers
  const scorerCounts: { [name: string]: number } = {};
  completedMatches.forEach(match => {
    const t1Scorers = match['Team 1 scorers']?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const t2Scorers = match['Team 2 scorers']?.split(',').map(s => s.trim()).filter(Boolean) || [];
    
    [...t1Scorers, ...t2Scorers].forEach(scorer => {
      scorerCounts[scorer] = (scorerCounts[scorer] || 0) + 1;
    });
  });

  const topScorers = Object.entries(scorerCounts)
    .map(([name, goals]) => ({ name, goals }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  return (
    <div className="space-y-12">
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
                      <span className="text-white font-bold tracking-tight group-hover:text-cyber-blue transition-colors uppercase">
                        {scorer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 bg-white/5 overflow-hidden rounded-full">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(scorer.goals / topScorers[0].goals) * 100}%` }}
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
