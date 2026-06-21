import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft } from 'lucide-react';
import type { Match, Team, KeyPlayer } from '../utils/excelParser';

const useCentered = (rootMargin = '-30% 0px -30% 0px') => {
  const [isCentered, setIsCentered] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCentered(entry.isIntersecting);
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [rootMargin]);

  return [ref, isCentered] as const;
};

interface PlayerCardProps {
  player: KeyPlayer;
  goals: number;
  flagCode: string;
  index: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, goals, flagCode, index }) => {
  const [ref, isCentered] = useCentered();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card group overflow-hidden border-b-2 sm:border-b-4 border-b-cyber-magenta/30 hover:border-b-cyber-magenta transition-all duration-500"
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-gray-900">
        <img
          src={player['Image']}
          alt={player['Player Name']}
          loading="lazy"
          className={`w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ${
            isCentered ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-black via-transparent to-transparent opacity-60"></div>

        <div className="absolute top-1 right-1 sm:top-4 sm:right-4 bg-cyber-magenta text-white px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-xs font-black italic shadow-neon-magenta transform skew-x-12">
          {goals} GOALS
        </div>
      </div>

      <div className="p-2 sm:p-4 relative">
        <div className="flex items-center gap-1 sm:gap-3 mb-0.5 sm:mb-1">
          {flagCode && (
            <img
              src={`https://flagcdn.com/w40/${flagCode}.png`}
              alt={player['Country']}
              className="w-3 h-2 sm:w-4 sm:h-3 object-cover rounded-sm border border-white/10"
            />
          )}
          <span className="text-[7px] sm:text-[10px] font-mono text-gray-500 uppercase tracking-wider sm:tracking-widest">{player['Country']}</span>
        </div>
        <h3 className="text-[10px] sm:text-lg font-black text-white uppercase italic tracking-tighter leading-tight group-hover:text-cyber-blue transition-colors">
          {player['Player Name']}
        </h3>

        <div className="mt-2 pt-2 sm:mt-4 sm:pt-4 border-t border-white/5 hidden sm:flex justify-between items-center">
          <div className="text-[8px] font-mono text-cyber-blue uppercase">Status: Elite Asset</div>
          <div className="w-2 h-2 bg-cyber-blue rounded-full animate-ping"></div>
        </div>
      </div>
    </motion.div>
  );
};

interface KeyPlayersProps {
  matches: Match[];
  teams: Team[];
  keyPlayers: KeyPlayer[];
  onBack: () => void;
}

const KeyPlayers: React.FC<KeyPlayersProps> = ({ matches, teams, keyPlayers, onBack }) => {
  const [sortBy, setSortBy] = useState<'alphabetical' | 'goals'>('alphabetical');
  
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

  const playersByCountry = keyPlayers.reduce((acc: Record<string, KeyPlayer[]>, player) => {
    const country = player['Country'] || 'Unknown';
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(player);
    return acc;
  }, {});

  const getCountryGoals = (players: KeyPlayer[]) => {
    return players.reduce((sum, player) => {
      const name = normalizeName(player['Player Name']);
      return sum + (playerGoals[name] || 0);
    }, 0);
  };

  const countryEntries = Object.entries(playersByCountry)
    .filter(([, players]) => players.length > 0)
    .sort((a, b) => {
      if (sortBy === 'goals') {
        const goalsA = getCountryGoals(a[1]);
        const goalsB = getCountryGoals(b[1]);
        if (goalsB !== goalsA) {
          return goalsB - goalsA;
        }
      }
      return a[0].localeCompare(b[0]);
    });

  const getFlagCode = (countryName: string) => {
    return teams.find(t => t.TeamName === countryName)?.FlagCode?.toLowerCase() || '';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-cyber-blue hover:bg-cyber-blue/20 transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <h2 className="text-xl md:text-2xl font-black italic tracking-widest text-white uppercase flex items-center gap-4">
            <Trophy className="text-cyber-magenta" size={24} />
            Key Players // Global Matrix
          </h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-cyber-magenta/20 to-transparent mx-8 hidden xl:block"></div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 self-start md:self-auto">
          <span className="text-[10px] font-mono text-gray-500 uppercase pl-3 pr-1 select-none">Sort:</span>
          <button
            onClick={() => setSortBy('alphabetical')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
              sortBy === 'alphabetical'
                ? 'bg-cyber-magenta text-white shadow-neon-magenta'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Country (A-Z)
          </button>
          <button
            onClick={() => setSortBy('goals')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
              sortBy === 'goals'
                ? 'bg-cyber-magenta text-white shadow-neon-magenta'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Total Goals
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {countryEntries.map(([country, players]) => {
          const totalGoals = getCountryGoals(players);
          return (
            <div key={country} className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white">
                    {country}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em]">
                      {players.length} Player{players.length !== 1 ? 's' : ''}
                    </p>
                    <span className="text-gray-600 text-xs">•</span>
                    <p className="text-[10px] font-mono text-cyber-magenta font-black uppercase tracking-[0.2em] shadow-neon-magenta/20">
                      {totalGoals} Goal{totalGoals !== 1 ? 's' : ''} Total
                    </p>
                  </div>
                </div>
              {getFlagCode(country) && (
                <img
                  src={`https://flagcdn.com/w40/${getFlagCode(country)}.png`}
                  alt={country}
                  className="w-10 h-7 object-cover rounded-sm border border-white/10"
                />
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 md:gap-6">
              {players
                .sort((a, b) => {
                  const goalsA = playerGoals[normalizeName(a['Player Name'])] || 0;
                  const goalsB = playerGoals[normalizeName(b['Player Name'])] || 0;
                  if (goalsB !== goalsA) {
                    return goalsB - goalsA;
                  }
                  return normalizeName(a['Player Name']).localeCompare(normalizeName(b['Player Name']));
                })
                .map((player, index) => {
                  const normalizedPlayerName = normalizeName(player['Player Name']);
                  const goals = playerGoals[normalizedPlayerName] || 0;
                  const flagCode = getFlagCode(player['Country']);

                  return (
                    <PlayerCard
                      key={`${country}-${player['Player Name']}`}
                      player={player}
                      goals={goals}
                      flagCode={flagCode}
                      index={index}
                    />
                  );
                })}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

export default KeyPlayers;
