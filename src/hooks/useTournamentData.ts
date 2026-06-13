import { useState, useEffect } from 'react';
import type { Match, Team } from '../utils/excelParser';
import { parseWorldCupData } from '../utils/excelParser';

export const useTournamentData = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await parseWorldCupData(`${import.meta.env.BASE_URL}data/world_cup_2026.xlsx`);
      setMatches(data.matches);
      setTeams(data.teams);
      setLoading(false);
    };

    loadData();
  }, []);

  return { matches, teams, loading };
};
