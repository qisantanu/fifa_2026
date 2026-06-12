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
          className="glass-card p-8 flex flex-col justify-center items-center text-center space-y-6"
        >
          <div className="w-24 h-24 border-4 border-cyber-magenta rounded-full flex items-center justify-center shadow-neon-magenta animate-pulse">
            <span className="text-4xl font-black text-white">
                {completedMatches.reduce((acc, m) => acc + (m['Team 1 Score'] || 0) + (m['Team 2 Score'] || 0), 0)}
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Total Quantum Goals</h3>
            <p className="text-gray-500 text-xs font-mono uppercase mt-2">Aggregate tournament data pulse</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
             <div className="bg-white/5 p-4 rounded border border-white/5">
                <div className="text-xl font-bold text-cyber-blue">{completedMatches.length}</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Matches Sync</div>
             </div>
             <div className="bg-white/5 p-4 rounded border border-white/5">
                <div className="text-xl font-bold text-cyber-magenta">{(completedMatches.reduce((acc, m) => acc + (m['Team 1 Score'] || 0) + (m['Team 2 Score'] || 0), 0) / (completedMatches.length || 1)).toFixed(2)}</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">Goals/Match</div>
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
