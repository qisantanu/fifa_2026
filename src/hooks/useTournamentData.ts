import { useState, useEffect, useRef } from 'react';
import type { Match, Team } from '../utils/excelParser';
import { parseWorldCupData } from '../utils/excelParser';

interface TournamentData {
  matches: Match[];
  teams: Team[];
}

const dataHasChanged = (oldData: TournamentData, newData: TournamentData): boolean => {
  // Deep comparison of data
  return (
    JSON.stringify(oldData.matches) !== JSON.stringify(newData.matches) ||
    JSON.stringify(oldData.teams) !== JSON.stringify(newData.teams)
  );
};

export const useTournamentData = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const dataRef = useRef<TournamentData>({ matches: [], teams: [] });

  const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrVA61c8op2d1vDrpjYNL-0Q_Y_SyzhBJ5-j0L4BMR3z5IfNW5tdlIJU54sbtyCg/pub?output=xlsx';
  const LOCAL_FILE_URL = `${import.meta.env.BASE_URL}data/world_cup_2026.xlsx`;
  const POLL_INTERVAL = 60000; // Poll every 60 seconds

  const fetchAndUpdateData = async (isInitial: boolean = false) => {
    if (!isInitial) {
      setIsSyncing(true);
    }

    try {
      if (!isInitial) {
        console.log('📡 Checking for updates...');
      }
      const data = await parseWorldCupData(GOOGLE_SHEET_URL);

      if (data.matches.length > 0) {
        if (dataHasChanged(dataRef.current, data)) {
          console.log('🔄 Updates detected! Refreshing data...');
          setMatches(data.matches);
          setTeams(data.teams);
          dataRef.current = data;
        } else if (!isInitial) {
          console.log('✅ No changes detected');
        }
        if (isInitial) {
          console.log('✅ Live Sync Successful');
        }
      } else {
        throw new Error('Empty data from Google Sheets');
      }
    } catch (error) {
      console.warn(isInitial ? '⚠️ Live Sync Failed. Engaging Local Backup Protocol.' : '⚠️ Failed to sync from Google Sheets. Using local data.', error);
      try {
        const data = await parseWorldCupData(LOCAL_FILE_URL);
        if (data.matches.length > 0) {
          // Only update if it's different from current data
          if (isInitial || dataHasChanged(dataRef.current, data)) {
            setMatches(data.matches);
            setTeams(data.teams);
            dataRef.current = data;
          }
        }
      } catch (localError) {
        console.error('❌ Failed to load local backup file:', localError);
        // Don't clear data - keep what we have
      }
    } finally {
      setLastSyncTime(new Date());
      if (!isInitial) {
        setIsSyncing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initial load
    fetchAndUpdateData(true);

    // Set up polling for updates
    const pollInterval = setInterval(() => {
      fetchAndUpdateData(false);
    }, POLL_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, []);

  return { matches, teams, loading, isSyncing, lastSyncTime };
};
