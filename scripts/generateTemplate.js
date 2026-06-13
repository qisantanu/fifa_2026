import * as XLSX from 'xlsx';
import * as fs from 'fs';

const workbook = XLSX.utils.book_new();

const matchesData = [
  { MatchID: 1, Date: '2026-06-11', 'Team 1': 'USA', 'Team 2': 'TBD', 'Team 1 Score': null, 'Team 2 Score': null, 'Team 1 scorers': null, 'Team 2 scorers': null, Stage: 'Group', Winner: null, Group: 'A' },
  { MatchID: 2, Date: '2026-06-11', 'Team 1': 'Mexico', 'Team 2': 'TBD', 'Team 1 Score': null, 'Team 2 Score': null, 'Team 1 scorers': null, 'Team 2 scorers': null, Stage: 'Group', Winner: null, Group: 'A' },
  { MatchID: 3, Date: '2026-06-12', 'Team 1': 'Canada', 'Team 2': 'TBD', 'Team 1 Score': null, 'Team 2 Score': null, 'Team 1 scorers': null, 'Team 2 scorers': null, Stage: 'Group', Winner: null, Group: 'B' },
];

const teamsData = [
  { TeamName: 'USA', Group: 'A', FlagCode: 'US' },
  { TeamName: 'Mexico', Group: 'A', FlagCode: 'MX' },
  { TeamName: 'Canada', Group: 'B', FlagCode: 'CA' },
];

const matchesSheet = XLSX.utils.json_to_sheet(matchesData);
const teamsSheet = XLSX.utils.json_to_sheet(teamsData);

XLSX.utils.book_append_sheet(workbook, matchesSheet, 'Matches');
XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Teams');

const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync('public/data/world_cup_2026.xlsx', buffer);

console.log('Template Excel file created at public/data/world_cup_2026.xlsx');
