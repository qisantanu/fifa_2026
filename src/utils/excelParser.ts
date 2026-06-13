import * as XLSX from 'xlsx';

export interface Match {
  MatchID: number;
  Date: string;
  'Team 1': string;
  'Team 2': string;
  'Team 1 Score': number | null;
  'Team 2 Score': number | null;
  'Team 1 scorers'?: string;
  'Team 2 scorers'?: string;
  Stage: string;
  Winner: string | null;
  Group: string | null;
}

export interface Team {
  TeamName: string;
  Group: string;
  FlagCode: string;
}

export const parseWorldCupData = async (filePath: string) => {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const matchesSheet = workbook.Sheets['Matches'];
    const teamsSheet = workbook.Sheets['Teams'];

    const matches = XLSX.utils.sheet_to_json<Match>(matchesSheet);
    const teams = XLSX.utils.sheet_to_json<Team>(teamsSheet);

    return { matches, teams };
  } catch (error) {
    console.error('Error parsing Excel data:', error);
    return { matches: [], teams: [] };
  }
};
