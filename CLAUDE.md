# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-screen sports kiosk application displaying live scores and upcoming games across multiple sports (NBA, NFL, F1, Cricket, MLB, Tour de France). The system follows a three-tier architecture:

**Frontend (React + Vite)**: Single-page kiosk UI that auto-cycles through sports every 30 seconds. Optimized for 1024x768 tablet displays in dark mode.

**Backend (Node.js + Express)**: API server that fetches data from external APIs (primarily ESPN) and serves it to the frontend. Uses node-cron for scheduled updates.

**Cache Layer (Redis)**: Two-tier caching strategy:
- Live scores: 1-minute TTL (frequent updates)
- Schedule data: 15-minute TTL (less frequent updates)

## Key Design Patterns

### Data Flow
1. Backend cron jobs fetch data from ESPN API every 1 minute (for live games) and 15 minutes (for schedules)
2. Data is parsed and separated into `live` (status='in') and `upcoming` (status='pre') arrays
3. Both arrays are cached in Redis with different TTLs
4. Frontend polls backend API every 60 seconds to get cached data
5. Frontend auto-cycles through sports every 30 seconds, displaying current sport data

### Display Logic (60/40 Split)
- **No live games**: Full screen shows upcoming games
- **Has live games**: 60% of screen shows live scores, 40% shows next games
- **Multiple live games**: Auto-scrolls through them every 5 seconds

### Sport Service Pattern
Each sport follows the same service pattern (see `backend/src/services/nbaService.js`):
- `fetch[Sport]Data()`: Fetches from external API, parses, categorizes as live/upcoming, caches in Redis
- `get[Sport]Data()`: Retrieves cached data from Redis
- Normalized game object structure with team info, logos, scores, status

### Frontend Component Pattern
Each sport has a display component (see `frontend/src/components/NBADisplay.jsx`) that:
- Handles both full-screen (no live games) and 60/40 split layout
- Auto-scrolls through multiple live games
- Formats dates/times in Chicago timezone
- Shows team logos, scores, and game status

## Development Commands

### Docker (Production)
```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker logs sports-kiosk-backend
docker logs sports-kiosk-frontend
docker logs sports-kiosk-redis

# Stop containers
docker-compose down
```

### Backend Development
```bash
cd backend
npm install
npm run dev  # Starts with nodemon for hot-reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Vite dev server on port 5173
npm run build  # Production build
```

## Adding a New Sport

To add a new sport (e.g., NFL):

1. **Create service**: `backend/src/services/nflService.js`
   - Implement `fetchNFLData()` and `getNFLData()` following NBA pattern
   - Use Redis keys like `nfl:live` and `nfl:schedule`
   - Parse API response into normalized game object

2. **Add API route**: In `backend/src/routes/sports.js`
   - Add `GET /nfl` endpoint
   - Import and call `getNFLData()`

3. **Add cron job**: In `backend/src/server.js`
   - Import `fetchNFLData()`
   - Add cron schedule (every 1 minute)
   - Call initial fetch in `startServer()`

4. **Create component**: `frontend/src/components/NFLDisplay.jsx`
   - Follow NBA pattern for 60/40 layout
   - Handle live vs upcoming game display logic

5. **Update App.jsx**:
   - Add state for NFL data
   - Add useEffect to fetch NFL data every 60s
   - Add conditional rendering for `currentSport === 'NFL'`

6. **Update config.json**:
   - Set `NFL.enabled: true`

## Sport Order and Cycling

Sport display order is hardcoded in `frontend/src/App.jsx`:
```javascript
const SPORTS_ORDER = ['NBA', 'NFL', 'F1', 'CRICKET', 'MLB', 'TOUR'];
```

The app cycles through ALL sports in order, showing "Coming Soon" for unimplemented ones. To skip unimplemented sports, filter `SPORTS_ORDER` based on `config.json`.

## Configuration

- **Display timing**: `frontend/src/App.jsx` - `CYCLE_INTERVAL` (30s), fetch interval (60s)
- **Cache TTLs**: Each sport service defines `EX` values (60s for live, 900s for schedule)
- **Cron schedules**: `backend/src/server.js` - Currently `*/1 * * * *` (every minute)
- **Timezone**: Set via `TZ` environment variable in `docker-compose.yml` (America/Chicago)
- **Sport config**: `config.json` (currently not used in code, placeholder for future)

## External APIs

**NBA**: ESPN API - `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- Free, no API key required
- Returns game status: 'pre' (scheduled), 'in' (live), 'post' (finished)
- Provides team names, logos, scores, clock, period

Other sports will need similar API discovery. ESPN provides similar endpoints for other sports.

## Deployment Notes

- Runs on Raspberry Pi 5 (16GB) with Docker
- Frontend served via Nginx on port 3000
- Backend on port 3001
- Redis on port 6379
- All times displayed in America/Chicago timezone
- Designed for tablet in kiosk mode (1024x768 resolution)
