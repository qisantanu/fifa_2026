import * as XLSX from 'xlsx';

export interface Match {
  MatchID: number;
  Date: string | number;
  'Team 1': string;
  'Team 2': string;
  'Team 1 Score': number | null;
  'Team 2 Score': number | null;
  'Team 1 Shootout'?: number | null;
  'Team 2 Shootout'?: number | null;
  'Team 1 scorers'?: string;
  'Team 2 scorers'?: string;
  Stage: string;
  Winner: string | null;
  Group: string | null;
  'Team 1 Yellow'?: number;
  'Team 2 Yellow'?: number;
  'Team 1 Red'?: number;
  'Team 2 Red'?: number;
  InterestingFact?: string;
  InterstingFact?: string;
}

export const excelDateToJS = (serial: number | string): Date => {
  if (typeof serial === 'string') return new Date(serial);
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
};

export interface Team {
  TeamName: string;
  Group: string;
  FlagCode: string;
}

export interface KeyPlayer {
  'Player Name': string;
  'Country': string;
  'Image': string;
}

export interface WorldCupData {
  matches: Match[];
  teams: Team[];
  keyPlayers: KeyPlayer[];
}

const parseScore = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const text = value.toString().trim();
  const match = text.match(/^(\d+)(?:\s*\(\d+\))?$/);
  return match ? Number.parseInt(match[1], 10) : null;
};

const parseShootout = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return null;

  const text = value.toString().trim();
  const match = text.match(/^\d+\s*\((\d+)\)$/);
  return match ? Number.parseInt(match[1], 10) : null;
};

export const parseWorldCupData = async (filePath: string): Promise<WorldCupData> => {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const matchesSheet = workbook.Sheets['Matches'];
    const teamsSheet = workbook.Sheets['Teams'];
    const playersSheet = workbook.Sheets['Key Players'];

    const rawMatches = XLSX.utils.sheet_to_json<any>(matchesSheet);
    const matches = rawMatches.map((row: any) => ({
      ...row,
      'Team 1 Score': parseScore(row['Team 1 Score']),
      'Team 2 Score': parseScore(row['Team 2 Score']),
      'Team 1 Shootout': parseShootout(row['Team 1 Score']),
      'Team 2 Shootout': parseShootout(row['Team 2 Score']),
    })) as Match[];
    const teams = XLSX.utils.sheet_to_json<Team>(teamsSheet);
    const keyPlayers = playersSheet ? XLSX.utils.sheet_to_json<KeyPlayer>(playersSheet) : [];

    return { matches, teams, keyPlayers };
  } catch (error) {
    console.error('Error parsing Excel data:', error);
    return { matches: [], teams: [], keyPlayers: [] };
  }
};
