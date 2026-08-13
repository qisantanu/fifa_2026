import * as XLSX from 'xlsx';

export interface RoadLocation {
  id: number;
  railStation: string;
  roadLocation: string;
  distanceFromHome: number | null;
  ettMinutes: number | null;
  etsKm: number | null;
  lat: number;
  lng: number;
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseCoordinates = (value: unknown): { lat: number; lng: number } | null => {
  if (typeof value !== 'string') return null;

  const [latText, lngText] = value.split(',').map((part) => part.trim());
  const lat = Number(latText);
  const lng = Number(lngText);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

export const parseTravelData = async (filePath: string): Promise<RoadLocation[]> => {
  const response = await fetch(filePath);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  return rows
    .map((row, index) => {
      const coordinates = parseCoordinates(row.Coordinates);
      const roadLocation = row.Roadlocation?.toString().trim();

      if (!coordinates || !roadLocation) return null;

      return {
        id: index + 1,
        railStation: row.RailStation?.toString().trim() || '',
        roadLocation,
        distanceFromHome: toNumber(row.DistanceFromHome),
        ettMinutes: toNumber(row['ETT (Min)']),
        etsKm: toNumber(row['ETS (KM)']),
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    })
    .filter((row): row is RoadLocation => row !== null);
};
