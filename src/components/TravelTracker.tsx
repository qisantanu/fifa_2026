import React from 'react';
import { CheckCircle2, Clock, Crosshair, Database, LocateFixed, MapPin, RotateCcw, Route } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseTravelData, type RoadLocation } from '../utils/travelParser';
import {
  addLocationSample,
  clearLocationHistory,
  getLocationHistory,
  type LocationSample,
} from '../utils/locationHistoryDb';

interface VisualPoint {
  x: number;
  y: number;
}

interface RouteProjection {
  x: number;
  y: number;
  distanceMeters: number;
  progressPercent: number;
  nearestIndex: number;
  segmentStartIndex: number;
  segmentProgress: number;
}

interface BreakInterval {
  start: number;
  end: number | null;
}

const TRACK_INTERVAL_MS = 30000;
const ROUTE_FILE_URL = `${import.meta.env.BASE_URL}data/travel_north_bengal.xlsx`;
const REACHED_CHECKPOINTS_KEY = 'north-bengal-reached-checkpoints';
const BREAK_INTERVALS_KEY = 'north-bengal-break-intervals';
const CHECKPOINT_REACHED_THRESHOLD_METERS = 1500;
const SVG_WIDTH = 980;
const POINTS_PER_ROW = 7;
const X_START = 92;
const X_STEP = 132;
const Y_START = 78;
const Y_STEP = 112;

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMeters = (a: Pick<RoadLocation | LocationSample, 'lat' | 'lng'>, b: Pick<RoadLocation | LocationSample, 'lat' | 'lng'>) => {
  const radius = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * radius * Math.asin(Math.sqrt(h));
};

const formatDuration = (minutes: number | null) => {
  if (minutes === null) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

const timingStatus = (actualMinutes: number | null, expectedMinutes: number | null) => {
  if (actualMinutes === null || expectedMinutes === null) {
    return {
      label: 'Pending',
      className: 'bg-slate-500/15 text-slate-300 border-slate-400/20',
      delta: null,
    };
  }

  const delta = actualMinutes - expectedMinutes;

  if (delta < -5) {
    return {
      label: 'Ahead',
      className: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/30',
      delta,
    };
  }

  if (delta > 5) {
    return {
      label: 'Delayed',
      className: 'bg-rose-400/15 text-rose-200 border-rose-300/30',
      delta,
    };
  }

  return {
    label: 'On time',
    className: 'bg-amber-300/15 text-amber-100 border-amber-200/30',
    delta,
  };
};

const formatDelta = (delta: number | null) => {
  if (delta === null) return '';
  const rounded = Math.round(Math.abs(delta));
  if (rounded === 0) return '0m';
  return `${delta > 0 ? '+' : '-'}${rounded}m`;
};

const formatClock = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const loadReachedCheckpointIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REACHED_CHECKPOINTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value) => Number.isFinite(value)) : [];
  } catch {
    return [];
  }
};

const saveReachedCheckpointIds = (ids: number[]) => {
  localStorage.setItem(REACHED_CHECKPOINTS_KEY, JSON.stringify(ids));
};

const normalizeReachedCheckpointIds = (ids: number[]) =>
  Array.from(new Set(ids)).sort((a, b) => a - b);

const loadBreakIntervals = (): BreakInterval[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(BREAK_INTERVALS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((interval) =>
      Number.isFinite(interval?.start) &&
      (interval.end === null || Number.isFinite(interval.end)) &&
      (interval.end === null || interval.end >= interval.start)
    );
  } catch {
    return [];
  }
};

const saveBreakIntervals = (intervals: BreakInterval[]) => {
  localStorage.setItem(BREAK_INTERVALS_KEY, JSON.stringify(intervals));
};

const breakOverlapMs = (breakIntervals: BreakInterval[], start: number, end: number) =>
  breakIntervals.reduce((total, interval) => {
    const breakEnd = interval.end ?? end;
    const overlapStart = Math.max(start, interval.start);
    const overlapEnd = Math.min(end, breakEnd);
    return overlapEnd > overlapStart ? total + (overlapEnd - overlapStart) : total;
  }, 0);

const elapsedMinutesExcludingBreaks = (
  start: number | undefined,
  end: number | undefined,
  breakIntervals: BreakInterval[]
) => {
  if (!start || !end || end <= start) return null;

  const elapsedMs = end - start - breakOverlapMs(breakIntervals, start, end);
  return Math.max(0, elapsedMs / 60000);
};

const totalBreakMinutes = (breakIntervals: BreakInterval[], until: number = Date.now()) =>
  breakIntervals.reduce((total, interval) => {
    const end = interval.end ?? until;
    return end > interval.start ? total + (end - interval.start) / 60000 : total;
  }, 0);

const buildVisualPoints = (locations: RoadLocation[]): VisualPoint[] =>
  locations.map((_, index) => {
    const row = Math.floor(index / POINTS_PER_ROW);
    const column = index % POINTS_PER_ROW;
    const isReverse = row % 2 === 1;
    const visualColumn = isReverse ? POINTS_PER_ROW - 1 - column : column;

    return {
      x: X_START + visualColumn * X_STEP,
      y: Y_START + row * Y_STEP,
    };
  });

const buildPath = (points: VisualPoint[]) =>
  points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

const buildCumulativeDistances = (locations: RoadLocation[]) => {
  const cumulative = [0];

  for (let index = 1; index < locations.length; index += 1) {
    cumulative[index] = cumulative[index - 1] + distanceMeters(locations[index - 1], locations[index]);
  }

  return cumulative;
};

const projectOntoRoute = (
  sample: LocationSample,
  locations: RoadLocation[],
  visualPoints: VisualPoint[],
  cumulativeDistances: number[]
): RouteProjection | null => {
  if (locations.length < 2) return null;

  let best: RouteProjection | null = null;

  for (let index = 0; index < locations.length - 1; index += 1) {
    const start = locations[index];
    const end = locations[index + 1];
    const latScale = 111320;
    const lngScale = 111320 * Math.cos(toRadians((start.lat + end.lat) / 2));
    const ax = start.lng * lngScale;
    const ay = start.lat * latScale;
    const bx = end.lng * lngScale;
    const by = end.lat * latScale;
    const px = sample.lng * lngScale;
    const py = sample.lat * latScale;
    const dx = bx - ax;
    const dy = by - ay;
    const segmentLengthSquared = dx * dx + dy * dy;
    const t = segmentLengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / segmentLengthSquared));
    const projectedX = ax + dx * t;
    const projectedY = ay + dy * t;
    const distanceToSegment = Math.hypot(px - projectedX, py - projectedY);
    const segmentMeters = distanceMeters(start, end);
    const routeMeters = cumulativeDistances[index] + segmentMeters * t;
    const totalMeters = cumulativeDistances[cumulativeDistances.length - 1] || 1;
    const visualStart = visualPoints[index];
    const visualEnd = visualPoints[index + 1];
    const projection = {
      x: visualStart.x + (visualEnd.x - visualStart.x) * t,
      y: visualStart.y + (visualEnd.y - visualStart.y) * t,
      distanceMeters: distanceToSegment,
      progressPercent: Math.min(100, Math.max(0, (routeMeters / totalMeters) * 100)),
      nearestIndex: distanceMeters(sample, start) < distanceMeters(sample, end) ? index : index + 1,
      segmentStartIndex: index,
      segmentProgress: t,
    };

    if (!best || projection.distanceMeters < best.distanceMeters) {
      best = projection;
    }
  }

  return best;
};

const estimateEttAtProjection = (projection: RouteProjection | null, locations: RoadLocation[]) => {
  if (!projection || locations.length === 0) return null;

  const current = locations[projection.segmentStartIndex];
  const next = locations[projection.segmentStartIndex + 1];

  if (current?.ettMinutes !== null && current?.ettMinutes !== undefined && next?.ettMinutes !== null && next?.ettMinutes !== undefined) {
    return current.ettMinutes + (next.ettMinutes - current.ettMinutes) * projection.segmentProgress;
  }

  const validLocations = locations
    .map((location, index) => ({ location, index }))
    .filter(({ location }) => location.ettMinutes !== null);

  if (validLocations.length === 0) return null;

  const nearest = validLocations.reduce((best, candidate) => {
    const bestDistance = Math.abs(best.index - projection.nearestIndex);
    const candidateDistance = Math.abs(candidate.index - projection.nearestIndex);
    return candidateDistance < bestDistance ? candidate : best;
  });

  return nearest.location.ettMinutes;
};

const estimateSegmentTiming = (
  history: LocationSample[],
  locations: RoadLocation[],
  breakIntervals: BreakInterval[]
) => {
  if (history.length < 2) return [];

  const firstSeenByLocation = new Map<number, number>();

  history.forEach((sample) => {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    locations.forEach((location, index) => {
      const distance = distanceMeters(sample, location);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestDistance <= 1500 && !firstSeenByLocation.has(nearestIndex)) {
      firstSeenByLocation.set(nearestIndex, sample.timestamp);
    }
  });

  return locations
    .slice(1)
    .map((location, index) => {
      const previous = locations[index];
      const start = firstSeenByLocation.get(index);
      const end = firstSeenByLocation.get(index + 1);
      const actualMinutes = elapsedMinutesExcludingBreaks(start, end, breakIntervals);
      const expectedMinutes =
        previous.ettMinutes !== null && location.ettMinutes !== null
          ? location.ettMinutes - previous.ettMinutes
          : null;

      return {
        from: previous.roadLocation,
        to: location.roadLocation,
        expectedMinutes,
        actualMinutes,
      };
    })
    .filter((row) => row.expectedMinutes !== null);
};

const TravelTracker: React.FC = () => {
  const [locations, setLocations] = React.useState<RoadLocation[]>([]);
  const [history, setHistory] = React.useState<LocationSample[]>([]);
  const [isTracking, setIsTracking] = React.useState(false);
  const [status, setStatus] = React.useState('Location tracking is off');
  const [secondsUntilTrack, setSecondsUntilTrack] = React.useState(TRACK_INTERVAL_MS / 1000);
  const [reachedCheckpointIds, setReachedCheckpointIds] = React.useState<number[]>([]);
  const [breakIntervals, setBreakIntervals] = React.useState<BreakInterval[]>([]);

  React.useEffect(() => {
    parseTravelData(ROUTE_FILE_URL)
      .then(setLocations)
      .catch(() => setStatus('Could not load travel_north_bengal.xlsx'));

    getLocationHistory()
      .then(setHistory)
      .catch(() => setStatus('Could not load saved location history'));

    setReachedCheckpointIds(loadReachedCheckpointIds());
    setBreakIntervals(loadBreakIntervals());
  }, []);

  const captureLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not available in this browser');
      setIsTracking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const sample = {
          timestamp: Date.now(),
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        await addLocationSample(sample);
        setHistory((current) => [...current, sample]);
        setStatus(`Last tracked at ${formatClock(sample.timestamp)}`);
        setSecondsUntilTrack(TRACK_INTERVAL_MS / 1000);
      },
      (error) => {
        setStatus(error.message || 'Location permission was denied');
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }, []);

  React.useEffect(() => {
    if (!isTracking) return undefined;

    captureLocation();
    const tracker = window.setInterval(captureLocation, TRACK_INTERVAL_MS);
    const countdown = window.setInterval(() => {
      setSecondsUntilTrack((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(tracker);
      window.clearInterval(countdown);
    };
  }, [captureLocation, isTracking]);

  const visualPoints = React.useMemo(() => buildVisualPoints(locations), [locations]);
  const routePath = React.useMemo(() => buildPath(visualPoints), [visualPoints]);
  const cumulativeDistances = React.useMemo(() => buildCumulativeDistances(locations), [locations]);
  const latestSample = history[history.length - 1] || null;
  const projection = React.useMemo(
    () => latestSample ? projectOntoRoute(latestSample, locations, visualPoints, cumulativeDistances) : null,
    [cumulativeDistances, latestSample, locations, visualPoints]
  );
  const nearestLocation = projection ? locations[projection.nearestIndex] : null;
  const nearestCheckpointDistance =
    latestSample && nearestLocation ? distanceMeters(latestSample, nearestLocation) : null;
  const startLocation = locations[0] || null;
  const destinationLocation = locations[locations.length - 1] || null;
  const isOnBreak = breakIntervals.some((interval) => interval.end === null);
  const tripElapsedMinutes = elapsedMinutesExcludingBreaks(
    history[0]?.timestamp,
    history[history.length - 1]?.timestamp,
    breakIntervals
  );
  const breakMinutes = totalBreakMinutes(breakIntervals);
  const currentExpectedMinutes = React.useMemo(
    () => estimateEttAtProjection(projection, locations),
    [locations, projection]
  );
  const currentTimingStatus = timingStatus(tripElapsedMinutes, currentExpectedMinutes);
  const timingRows = React.useMemo(
    () => estimateSegmentTiming(history, locations, breakIntervals),
    [breakIntervals, history, locations]
  );
  const svgHeight = Y_START * 2 + Math.max(0, Math.ceil(locations.length / POINTS_PER_ROW) - 1) * Y_STEP;
  const reachedCheckpointSet = React.useMemo(() => new Set(reachedCheckpointIds), [reachedCheckpointIds]);

  React.useEffect(() => {
    if (!projection || locations.length === 0) return;

    const reachedThroughIndex =
      nearestCheckpointDistance !== null &&
      nearestCheckpointDistance <= CHECKPOINT_REACHED_THRESHOLD_METERS
        ? Math.max(projection.segmentStartIndex, projection.nearestIndex)
        : projection.segmentStartIndex;
    const autoReachedIds = locations.slice(0, reachedThroughIndex + 1).map((location) => location.id);

    setReachedCheckpointIds((current) => {
      const next = normalizeReachedCheckpointIds([...current, ...autoReachedIds]);
      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current;
      }

      saveReachedCheckpointIds(next);
      return next;
    });
  }, [locations, nearestCheckpointDistance, projection]);

  const handleClearHistory = async () => {
    await clearLocationHistory();
    setHistory([]);
    setBreakIntervals([]);
    saveBreakIntervals([]);
    setStatus('Location history cleared');
  };

  const toggleBreak = () => {
    const now = Date.now();

    setBreakIntervals((current) => {
      const openIndex = current.findIndex((interval) => interval.end === null);
      const next =
        openIndex >= 0
          ? current.map((interval, index) => index === openIndex ? { ...interval, end: now } : interval)
          : [...current, { start: now, end: null }];

      saveBreakIntervals(next);
      return next;
    });

    setStatus(isOnBreak ? 'Break ended; trip timing resumed' : 'Break started; time will be excluded');
  };

  const markReachedThrough = (index: number) => {
    const ids = locations.slice(0, index + 1).map((location) => location.id);
    const next = normalizeReachedCheckpointIds([...reachedCheckpointIds, ...ids]);
    setReachedCheckpointIds(next);
    saveReachedCheckpointIds(next);
  };

  const undoReachedFrom = (index: number) => {
    const idsToRemove = new Set(locations.slice(index).map((location) => location.id));
    const next = reachedCheckpointIds.filter((id) => !idsToRemove.has(id));
    setReachedCheckpointIds(next);
    saveReachedCheckpointIds(next);
  };

  const clearReachedCheckpoints = () => {
    setReachedCheckpointIds([]);
    saveReachedCheckpointIds([]);
    setStatus('Checkpoint marks cleared');
  };

  return (
    <div className="min-h-screen bg-[#071013] text-white">
      <header className="border-b border-white/10 bg-[#071013]/95 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-emerald-300 font-mono">North Bengal Road Tracker</div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight mt-1">Route Progress</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTracking((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
                isTracking
                  ? 'bg-amber-300 text-[#071013] hover:bg-amber-200'
                  : 'bg-emerald-300 text-[#071013] hover:bg-emerald-200'
              }`}
            >
              <LocateFixed size={16} />
              {isTracking ? 'Pause Tracking' : 'Start Tracking'}
            </button>
            <button
              type="button"
              onClick={toggleBreak}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
                isOnBreak
                  ? 'bg-sky-300 text-[#071013] hover:bg-sky-200'
                  : 'border border-white/15 text-white hover:bg-white/10'
              }`}
            >
              <Clock size={16} />
              {isOnBreak ? 'Resume Trip' : 'Start Break'}
            </button>
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
            >
              <RotateCcw size={16} />
              Clear History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="rounded-lg border border-white/10 bg-[#0d1b1e] overflow-hidden">
            <div className="p-4 md:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wide">Road Sequence</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Starts at {startLocation?.roadLocation || 'Home'} and follows the workbook order toward {destinationLocation?.roadLocation || 'destination'}.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <Route size={16} />
                {locations.length} road locations
              </div>
            </div>

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
                className="min-w-[920px] w-full h-auto block bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"
                role="img"
                aria-label="S shaped North Bengal route"
              >
                <path d={routePath} fill="none" stroke="#1f3a3f" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                <path d={routePath} fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                {visualPoints.map((point, index) => {
                  const location = locations[index];
                  const isNearest = nearestLocation?.id === location.id;
                  const isStart = index === 0;
                  const isDestination = index === locations.length - 1;
                  const isReached = reachedCheckpointSet.has(location.id);
                  const markerFill = isNearest ? '#fbbf24' : isReached ? '#10b981' : isDestination ? '#fb7185' : '#071013';
                  const markerStroke = isNearest ? '#fef3c7' : isReached || isStart ? '#d1fae5' : isDestination ? '#ffe4e6' : '#34d399';

                  return (
                    <g key={location.id}>
                      <circle cx={point.x} cy={point.y} r={isNearest ? 14 : isStart || isDestination ? 12 : 9} fill={markerFill} stroke={markerStroke} strokeWidth="3" />
                      <text x={point.x} y={point.y + 4} textAnchor="middle" className="fill-white text-[10px] font-bold">
                        {isStart ? 'H' : isDestination ? 'F' : index + 1}
                      </text>
                      <text x={point.x} y={point.y + 28} textAnchor="middle" className="fill-slate-300 text-[11px] font-semibold">
                        {location.roadLocation.length > 16 ? `${location.roadLocation.slice(0, 15)}.` : location.roadLocation}
                      </text>
                      {(isStart || isDestination) && (
                        <text x={point.x} y={point.y - 20} textAnchor="middle" className="fill-emerald-100 text-[10px] font-black uppercase">
                          {isStart ? 'Start' : 'Finish'}
                        </text>
                      )}
                    </g>
                  );
                })}
                {projection && (
                  <motion.g
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <circle cx={projection.x} cy={projection.y} r="22" fill="rgba(56,189,248,0.18)" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx={projection.x} cy={projection.y} r="7" fill="#38bdf8" />
                    <text x={projection.x} y={projection.y - 30} textAnchor="middle" className="fill-sky-200 text-[13px] font-bold">
                      You
                    </text>
                  </motion.g>
                )}
              </svg>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-[#0d1b1e] p-5">
              <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs uppercase tracking-[0.18em]">
                <Crosshair size={16} />
                Live Position
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm text-slate-400">Approx checkpoint</div>
                  <div className="text-xl font-black">{nearestLocation?.roadLocation || 'Waiting for GPS'}</div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-sky-300" style={{ width: `${projection?.progressPercent || 0}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-white/5 p-3">
                    <div className="text-slate-400">Route progress</div>
                    <div className="font-black">{Math.round(projection?.progressPercent || 0)}%</div>
                  </div>
                  <div className="rounded-md bg-white/5 p-3">
                    <div className="text-slate-400">Off route</div>
                    <div className="font-black">{projection ? `${Math.round(projection.distanceMeters)}m` : '-'}</div>
                  </div>
                </div>
                <div className="rounded-md bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-slate-400">Checkpoints reached</div>
                      <div className="font-black">{reachedCheckpointIds.length} / {locations.length}</div>
                    </div>
                    <button
                      type="button"
                      onClick={clearReachedCheckpoints}
                      className="rounded border border-white/15 px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                {startLocation && destinationLocation && (
                  <div className="rounded-md bg-white/5 p-3 text-sm">
                    <div className="text-slate-400">Trip route</div>
                    <div className="font-bold">
                      {startLocation.roadLocation} to {destinationLocation.roadLocation}
                    </div>
                  </div>
                )}
                <div className="rounded-md bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-slate-400">Live trip status</div>
                      <div className="font-mono text-xs text-slate-300">
                        Actual {formatDuration(tripElapsedMinutes)} / ETT {formatDuration(currentExpectedMinutes)}
                      </div>
                      <div className="font-mono text-xs text-sky-200">
                        Break excluded {formatDuration(breakMinutes)}
                      </div>
                    </div>
                    <span className={`inline-flex min-w-24 items-center justify-center rounded border px-2.5 py-1 text-xs font-black uppercase ${currentTimingStatus.className}`}>
                      {isOnBreak ? 'On Break' : currentTimingStatus.label}
                      {currentTimingStatus.delta !== null && (
                        <span className="ml-1 font-mono normal-case opacity-80">
                          {formatDelta(currentTimingStatus.delta)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {isOnBreak && (
                  <div className="rounded-md border border-sky-300/25 bg-sky-300/10 p-3 text-sm text-sky-100">
                    Break mode is active. GPS samples can continue, but break time is excluded from actual trip timing.
                  </div>
                )}
                <div className="text-xs text-slate-400">{status}</div>
                {isTracking && (
                  <div className="text-xs font-mono text-amber-200">
                    Next GPS sample in {secondsUntilTrack}s
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0d1b1e] p-5">
              <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs uppercase tracking-[0.18em]">
                <Database size={16} />
                Stored History
              </div>
              <div className="mt-4 text-3xl font-black">{history.length}</div>
              <div className="text-sm text-slate-400">GPS samples saved in IndexedDB</div>
              <div className="mt-4 max-h-44 overflow-y-auto space-y-2 pr-1">
                {history.slice(-6).reverse().map((sample) => (
                  <div key={`${sample.timestamp}-${sample.lat}`} className="rounded-md bg-white/5 px-3 py-2 text-xs font-mono text-slate-300">
                    {formatClock(sample.timestamp)} · {sample.lat.toFixed(5)}, {sample.lng.toFixed(5)}
                  </div>
                ))}
                {history.length === 0 && <div className="text-sm text-slate-500">No samples stored yet.</div>}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-lg border border-white/10 bg-[#0d1b1e] overflow-hidden">
            <div className="p-4 md:p-5 border-b border-white/10 flex items-center gap-2">
              <MapPin className="text-emerald-300" size={18} />
              <h2 className="font-black uppercase tracking-wide">Road Locations</h2>
            </div>
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#102226] text-slate-300">
                  <tr>
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Roadlocation</th>
                    <th className="text-left p-3">RailStation</th>
                    <th className="text-right p-3">Distance</th>
                    <th className="text-right p-3">ETT</th>
                    <th className="text-right p-3">Checkpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location, index) => {
                    const isReached = reachedCheckpointSet.has(location.id);

                    return (
                      <tr key={location.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3 font-semibold">{location.roadLocation}</td>
                        <td className="p-3 text-slate-400">{location.railStation || '-'}</td>
                        <td className="p-3 text-right font-mono">{location.distanceFromHome === null ? '-' : `${location.distanceFromHome} km`}</td>
                        <td className="p-3 text-right font-mono">{formatDuration(location.ettMinutes)}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isReached && <CheckCircle2 size={16} className="text-emerald-300" />}
                            <button
                              type="button"
                              onClick={() => isReached ? undoReachedFrom(index) : markReachedThrough(index)}
                              className={`rounded border px-2.5 py-1 text-xs font-bold ${
                                isReached
                                  ? 'border-amber-200/30 text-amber-100 hover:bg-amber-300/10'
                                  : 'border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/10'
                              }`}
                            >
                              {isReached ? 'Undo' : 'Mark reached'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0d1b1e] overflow-hidden">
            <div className="p-4 md:p-5 border-b border-white/10 flex items-center gap-2">
              <Clock className="text-amber-300" size={18} />
              <h2 className="font-black uppercase tracking-wide">Phase 2 Timing Compare</h2>
            </div>
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#102226] text-slate-300">
                  <tr>
                    <th className="text-left p-3">Segment</th>
                    <th className="text-right p-3">ETT</th>
                    <th className="text-right p-3">Actual</th>
                    <th className="text-right p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timingRows.map((row) => {
                    const status = timingStatus(row.actualMinutes, row.expectedMinutes);

                    return (
                      <tr key={`${row.from}-${row.to}`} className="border-t border-white/5 hover:bg-white/5">
                        <td className="p-3">
                          <div className="font-semibold">{row.from}</div>
                          <div className="text-slate-500">to {row.to}</div>
                        </td>
                        <td className="p-3 text-right font-mono">{formatDuration(row.expectedMinutes)}</td>
                        <td className="p-3 text-right font-mono">{formatDuration(row.actualMinutes)}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-flex min-w-24 items-center justify-center rounded border px-2.5 py-1 text-xs font-black uppercase ${status.className}`}>
                            {status.label}
                            {status.delta !== null && (
                              <span className="ml-1 font-mono normal-case opacity-80">
                                {formatDelta(status.delta)}
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TravelTracker;
