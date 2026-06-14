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
      const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrVA61c8op2d1vDrpjYNL-0Q_Y_SyzhBJ5-j0L4BMR3z5IfNW5tdlIJU54sbtyCg/pub?output=xlsx';
      const LOCAL_FILE_URL = `${import.meta.env.BASE_URL}data/world_cup_2026.xlsx`;

      try {
        console.log('📡 Syncing with Quantum Data Cloud...');
        const data = await parseWorldCupData(GOOGLE_SHEET_URL);

        if (data.matches.length > 0) {
          console.log('✅ Live Sync Successful');
          setMatches(data.matches);
          setTeams(data.teams);
        } else {
          throw new Error('Empty data from Google Sheets');
        }
      } catch (error) {
        console.warn('⚠️ Live Sync Failed. Engaging Local Backup Protocol.', error);
        const data = await parseWorldCupData(LOCAL_FILE_URL);
        setMatches(data.matches);
        setTeams(data.teams);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { matches, teams, loading };
};
