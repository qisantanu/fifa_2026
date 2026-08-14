# North Bengal Travel Tracker Guideline

## Current Purpose

This page is a browser-based road-trip tracker for `travel_north_bengal.xlsx`.
It reads ordered road-location data from the Excel file, renders the route as an
S-shaped road, tracks the user's approximate GPS location every 30 seconds, and
stores location history locally in IndexedDB so reloads do not lose trip data.

The current app entry point is `src/App.tsx`, which renders the travel tracker
directly through `src/components/TravelTracker.tsx`.

## Data Source

Primary file:

```text
public/data/travel_north_bengal.xlsx
```

The first workbook sheet is parsed by `src/utils/travelParser.ts`.

Expected columns:

```text
RailStation
Roadlocation
DistanceFromHome
ETT (Min)
ETS (KM)
Coordinates
```

`Coordinates` must be formatted as:

```text
latitude,longitude
```

Rows without a `Roadlocation` or valid coordinates are ignored. The workbook row
order is treated as the route order. The added `Home` row is expected to be the
first row and is displayed as the trip start.

The page loads route data on startup and also provides `Resync Data`. Resync
fetches the Excel file with a timestamp cache-buster so recent workbook changes
can appear without restarting the app.

## Implemented UI

The page has four main areas:

1. Header controls
   - Resync route data from `travel_north_bengal.xlsx`.
   - Start/Pause location tracking.
   - Clear locally saved GPS history.

2. S-shaped road route
   - Shows all valid road locations from the Excel file.
   - First point is labeled `Start` / `H`.
   - Last point is labeled `Finish` / `F`.
   - The latest GPS sample is projected onto the route and displayed as `You`.

3. Live position panel
   - Shows nearest approximate checkpoint.
   - Shows route progress percentage.
   - Shows approximate off-route distance.
   - Shows GPS tracking status and next sample countdown.
   - Shows live trip timing status.

4. Data tables
   - `Road Locations`: exact route data from the workbook.
   - `Phase 2 Timing Compare`: segment-level actual-vs-ETT comparison.

## Location Tracking

Tracking uses browser geolocation:

```ts
navigator.geolocation.getCurrentPosition(...)
```

Sampling interval:

```text
30 seconds
```

Each successful sample stores:

```text
timestamp
lat
lng
accuracy
```

Tracking only runs after the user presses `Start Tracking`. The browser must
grant location permission. On localhost or `127.0.0.1`, Chrome allows geolocation
for development.

## Local Persistence

Location history is stored in IndexedDB through:

```text
src/utils/locationHistoryDb.ts
```

Database:

```text
north-bengal-travel-tracker
```

Object store:

```text
location-history
```

The history survives page reloads. The `Clear History` button deletes all saved
samples from IndexedDB.

Reached checkpoint marks and break intervals are stored in `localStorage`.
Checkpoint marks survive reloads. Break intervals survive reloads and are used
to subtract break time from actual trip timing.

## Route Projection Logic

The route is visually rendered as an S-shaped SVG, not a real map. GPS positions
are still compared against the real latitude/longitude route segments.

Projection process:

1. For the latest GPS sample, evaluate every segment between adjacent road
   locations.
2. Find the nearest segment using approximate lat/lng-to-meter scaling.
3. Project the GPS sample onto that segment.
4. Convert that segment position to the equivalent point on the SVG route.
5. Calculate:
   - nearest checkpoint
   - off-route distance
   - route progress percentage
   - segment progress

This gives a useful trip-progress display without needing a map provider.

### How Current GPS Position Is Plotted

For every pair of consecutive road locations, such as `A -> B`, the app checks
where the latest GPS point is closest to that segment.

It calculates a segment progress value:

```text
t = 0   means at A
t = 0.5 means halfway between A and B
t = 1   means at B
```

The app chooses the route segment with the smallest distance from the GPS point.
Then it places the `You` marker on the S-shaped SVG using the same `t` value
between the visual positions of `A` and `B`.

So if the GPS point is nearer to `B`, the marker appears closer to `B` on the
visual route.

### How Route Progress Is Calculated

Route progress uses real coordinate distance between workbook checkpoints, not
the drawn SVG distance.

The app calculates:

```text
routeMeters = distance before current segment + current segment distance * t
progressPercent = routeMeters / totalRouteMeters * 100
```

This is approximate because the route distance is based on straight-line
distance between saved checkpoints, not exact road distance.

## Timing Status Logic

Timing status currently uses a 5-minute tolerance.

Status rules:

```text
Ahead    = actual time is more than 5 minutes faster than expected
Delayed  = actual time is more than 5 minutes slower than expected
On time  = actual time is within +/- 5 minutes of expected
Pending  = not enough data or no expected ETT
```

Break intervals are excluded from actual timing. If the user presses
`Start Break`, trip timing pauses for status calculations until `Resume Trip` is
pressed. GPS samples may continue during the break, but the break duration is
subtracted from both live trip elapsed time and segment actual time.

## Live Trip Status

The live trip status compares:

```text
actual elapsed time = first saved GPS sample -> latest saved GPS sample
expected time       = ETT at the latest projected route position
```

If the projected position is between two checkpoints and both checkpoints have
valid `ETT (Min)`, the expected time is interpolated between those two ETT
values.

If one side has missing ETT, the logic searches for the nearest valid ETT
checkpoint before and after the projected route position, then interpolates by
route distance between those valid ETT points. If only one valid side exists, it
uses that known ETT.

The route header also shows ETT coverage, for example:

```text
ETT 40/40
```

This means all 40 loaded road locations have valid `ETT (Min)` values.

This is useful during the trip because it does not require reaching two exact
checkpoints before showing status.

## Phase 2 Segment Timing

The `Phase 2 Timing Compare` table compares actual segment time with ETT
difference for consecutive road locations.

It only includes rows where both source and destination have valid `ETT (Min)`.

Actual segment time is inferred from history:

1. Find the first GPS sample within 1.5 km of a checkpoint.
2. Treat that as the checkpoint reached time.
3. Compare time between consecutive reached checkpoints.

If either checkpoint has not been reached according to the 1.5 km rule, that
segment shows `Pending`.

Manual checkpoint controls are available in the `Road Locations` table:

```text
Mark reached = marks that checkpoint and all previous checkpoints
Undo         = unmarks that checkpoint and all later checkpoints
```

Automatic checkpoint marking also runs from GPS projection. If the current
position is between `C -> D`, the app considers earlier checkpoints like `A`,
`B`, and `C` reached. If the GPS point is within 1.5 km of a checkpoint, that
checkpoint is also marked as reached.

## Current Assumptions

- Excel row order is the route order.
- `Home` is the first row and trip start.
- The last valid row is the trip finish.
- GPS samples are reliable enough for approximate route projection.
- A 1.5 km checkpoint detection threshold is acceptable for segment timing.
- A 5-minute timing tolerance is acceptable for Ahead/On time/Delayed.
- The S-shaped route is a route-progress visualization, not a geographic map.

## Known Limitations

- The S route does not show true geography or road curvature.
- Browser geolocation may be inaccurate, especially on desktop.
- Segment timing can remain `Pending` even with many samples if samples never
  fall within 1.5 km of both segment endpoints.
- If tracking starts after leaving Home, actual elapsed time starts from the
  first stored GPS sample, not the real trip start.
- IndexedDB history is browser/device specific and is not synced elsewhere.
- ETT gaps reduce segment comparison rows, but live trip status can still
  estimate expected time by interpolating between nearby valid ETT points.

## Chrome Testing With Fake GPS

1. Open the app in Chrome.
2. Open DevTools.
3. Press `Ctrl + Shift + P`.
4. Search for `Sensors`.
5. Select `Show Sensors`.
6. In `Location`, choose `Other...`.
7. Enter latitude and longitude from the Excel file.
8. Press `Start Tracking` in the app.
9. Change coordinates every 30 seconds to simulate movement.

Useful test points:

```text
Home:        22.6095887, 88.4261919
Dumdum:      22.6212,    88.4093
Madhyamgram: 22.6980,    88.4552
Barasat:     22.7238,    88.4815
Barojaguli:  22.9567,    88.5448
```

## Recommended Future Improvements

1. Add a configurable checkpoint threshold
   - Options such as 500 m, 1 km, 1.5 km, 2 km.
   - This helps tune behavior for GPS accuracy.

2. Store checkpoint reached events separately
   - Current segment timing infers checkpoint arrival on every render.
   - A dedicated store would make timing more stable and auditable.

3. Add manual checkpoint controls
   - `Mark reached` for a checkpoint.
   - Useful when GPS is inaccurate or Chrome testing is manual.

4. Add trip sessions
   - Save separate trips instead of one global history list.
   - Useful for comparing multiple journeys.

5. Improve ETT validation
   - Warn if ETT decreases between route rows.
   - Highlight rows where ETT is missing or unexpectedly flat.
   - Show an import summary for ETT coverage and data quality.

6. Add map mode later
   - A real map would be useful for geographic accuracy.
   - The current S route is better for overview and scanning.

7. Add import validation
   - Warn if rows have missing coordinates, invalid ETT, or non-increasing
     distances.

8. Add export
   - Export GPS history and timing comparison as CSV/JSON.

## Decision Notes

The S-shaped route is currently a good default because the data is route-ordered
and has many checkpoints. A pure table would be easier for exact values, but it
would not communicate route progress or current approximate position as clearly.

The current page therefore uses both:

```text
S-shaped route for progress and position
Tables for exact road/ETT data
```

This balance should remain unless the route needs true geographic navigation, in
which case a map provider should be introduced.
