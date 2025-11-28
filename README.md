# Sports Kiosk Setup

Full-screen kiosk application displaying live sports scores and upcoming games for NBA, NFL, F1, MLB, and Tour de France on a Raspberry Pi 5.

## Features

- **Unified Sports View**: All sports displayed together on a single screen (no cycling)
- **Live Scores**: Real-time scores updated every minute across all sports
- **Upcoming Games**: Schedule updated every 15 minutes
- **Adaptive Layout**:
  - When live games exist: 60% shows ONE live game, 40% shows next 2 upcoming games
  - When no live games: Full screen shows next 5 upcoming games chronologically
- **Multi-Sport Auto-Scroll**: When multiple live games exist, rotates every 5 seconds
- **Dark Mode**: Easy-on-the-eyes design for always-on displays
- **Tablet Optimized**: Designed for 1024x768 resolution
- **Chicago Timezone**: All times displayed in America/Chicago

## Current Status

- ✅ **NBA**: Fully functional with live scores and schedules
- ✅ **NFL**: Fully functional with live scores and schedules
- ✅ **F1**: Fully functional with race schedules
- ✅ **MLB**: Fully functional (off-season currently)
- ⚠️ **Tour de France**: API functional (seasonal event, July only)

## Architecture

```
Frontend (React + Vite) ← Nginx (Port 3000)
    ↓
Backend (Node.js) ← Express API (Port 3001)
    ↓
Redis Cache ← In-memory (Port 6379)
```

**Data Flow:**
1. Backend fetches from ESPN API every 1 minute for all sports (NFL, NBA, F1, MLB, Tour de France)
2. Data cached in Redis with TTLs (60s for live, 900s for schedule)
3. Frontend polls /api/sports/all endpoint every 60 seconds
4. Display shows unified view of all sports sorted chronologically
5. Live games auto-scroll every 5 seconds (if multiple)

## Installation

### Prerequisites

This service is running on the Raspberry Pi 5. These instructions are for reference or reinstallation.

### Initial Setup

1. **Clone the repository** (already done):
```bash
cd ~/home-server
git clone https://github.com/Cruzh3r2107/sport-kiosk.git
```

2. **Create storage directory**:
```bash
mkdir -p /mnt/storage/sport-kiosk/redis
```

3. **Build and start containers**:
```bash
cd ~/home-server/sport-kiosk
docker compose up -d --build
```

4. **Verify services are running**:
```bash
docker ps | grep sports-kiosk
docker logs sports-kiosk-backend
```

You should see:
- `✓ Connected to Redis`
- `✓ Server running on port 3001`
- `✓ NBA: X live, Y upcoming`

## Access

### Local Network

- **Frontend (Kiosk)**: http://192.168.1.154:3000
- **Backend API**: http://192.168.1.154:3001
- **Health Check**: http://192.168.1.154:3001/health

### Remote Access (Tailscale VPN)

- **Frontend**: http://100.126.21.128:3000
- **Backend API**: http://100.126.21.128:3001

### Tablet/Mobile Setup

1. Connect device to Tailscale VPN
2. Open browser to `http://100.126.21.128:3000`
3. Enable full-screen/kiosk mode:
   - **Android**: Use "Kiosk Browser" or "Fully Kiosk Browser" from Play Store
   - **iOS**: Add to Home Screen, then open
   - **Chrome**: Press F11 for full-screen

## Docker Compose Configuration

**Location**: `~/home-server/sport-kiosk/docker-compose.yml`

**Key Settings:**

```yaml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - /mnt/storage/sport-kiosk/redis:/data  # Redis cache on SSD
    restart: unless-stopped

  backend:
    ports: ["3001:3001"]
    environment:
      - TZ=America/Chicago
      - REDIS_HOST=redis
    restart: unless-stopped

  frontend:
    ports: ["3000:80"]
    restart: unless-stopped
```

**Important:**
- Redis data stored on SSD at `/mnt/storage/sport-kiosk/redis`
- Timezone: `America/Chicago` (matches home server)
- Restart policy: `unless-stopped`

## API Endpoints

### Individual Sports
- `GET /api/sports/nba` - Get NBA live scores and schedule
- `GET /api/sports/nfl` - Get NFL live scores and schedule
- `GET /api/sports/f1` - Get F1 race information
- `GET /api/sports/mlb` - Get MLB live scores and schedule
- `GET /api/sports/tourdefrance` - Get Tour de France stage information

### Combined View
- `GET /api/sports/all` - Get all sports combined and sorted chronologically
  - Returns: `{ live: [...], upcoming: [...], counts: {...} }`
  - Live games from all sports
  - Upcoming games sorted by date/time
  - Count breakdown by sport

### System
- `GET /api/sports/status` - Check service status
- `GET /health` - Backend health check

**Example Response** (`/api/sports/nba`):
```json
{
  "live": [
    {
      "homeTeam": "Lakers",
      "awayTeam": "Warriors",
      "homeScore": 98,
      "awayScore": 95,
      "status": "Q4 2:30",
      "homeLogo": "...",
      "awayLogo": "..."
    }
  ],
  "upcoming": [
    {
      "homeTeam": "Bulls",
      "awayTeam": "Heat",
      "date": "Nov 27, 2025",
      "time": "7:00 PM",
      "status": "pre",
      "homeLogo": "...",
      "awayLogo": "..."
    }
  ]
}
```

## Service Management

### Start/Stop

```bash
# Start services
cd ~/home-server/sport-kiosk
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# Restart individual service
docker restart sports-kiosk-backend
docker restart sports-kiosk-frontend
docker restart sports-kiosk-redis
```

### View Logs

```bash
# Backend logs (shows API fetches and cron jobs)
docker logs sports-kiosk-backend
docker logs -f sports-kiosk-backend  # Follow in real-time

# Frontend logs
docker logs sports-kiosk-frontend

# Redis logs
docker logs sports-kiosk-redis

# All logs
docker compose logs -f
```

### Monitor Resources

```bash
# Monitor all containers
docker stats

# Monitor specific container
docker stats sports-kiosk-backend
```

## Updates

### Update to Latest Version

```bash
cd ~/home-server/sport-kiosk

# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build

# Verify
docker logs sports-kiosk-backend
```

### Update ESPN API Data

Data updates automatically via cron jobs:
- **Live scores**: Every 1 minute
- **Schedules**: Every 15 minutes

To manually trigger an update, restart the backend:
```bash
docker restart sports-kiosk-backend
```

## Storage

All persistent data is stored on the **1TB SSD** at `/mnt/storage/sport-kiosk/`:

```
/mnt/storage/sport-kiosk/
└── redis/              # Redis cache data (TTL: 1-15 minutes)
```

**Check storage usage:**
```bash
du -sh /mnt/storage/sport-kiosk/*
```

Redis cache is ephemeral with short TTLs, so data loss is not critical.

## Configuration

### Display Timing

Located in `frontend/src/App.jsx`:
- **Sport cycling**: 30 seconds per sport
- **Frontend polling**: Every 60 seconds
- **Live game scrolling**: 5 seconds per game (when multiple live)

### Backend Polling

Located in `backend/src/server.js`:
- **Cron schedule**: `*/1 * * * *` (every 1 minute)

### Cache TTLs

Located in `backend/src/services/nbaService.js`:
- **Live scores**: 60 seconds
- **Schedule data**: 900 seconds (15 minutes)

### Timezone

Configured via `TZ` environment variable in `docker-compose.yml`:
```yaml
environment:
  - TZ=America/Chicago
```

## Troubleshooting

### No Data Showing

**Symptoms**: Frontend displays "Coming Soon" or blank screen

**Solutions**:
1. Check backend is fetching data:
   ```bash
   docker logs sports-kiosk-backend | grep NBA
   # Should see: ✓ NBA: X live, Y upcoming
   ```

2. Check ESPN API accessibility:
   ```bash
   curl https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
   ```

3. Check Redis connection:
   ```bash
   docker logs sports-kiosk-backend | grep Redis
   # Should see: ✓ Connected to Redis
   ```

4. Restart backend:
   ```bash
   docker restart sports-kiosk-backend
   ```

### Backend Not Starting

**Symptoms**: Container exits immediately or logs show errors

**Solutions**:
1. Check Redis is running:
   ```bash
   docker ps | grep redis
   ```

2. View detailed logs:
   ```bash
   docker logs sports-kiosk-backend
   ```

3. Ensure storage directory exists:
   ```bash
   ls -la /mnt/storage/sport-kiosk/redis
   ```

4. Check port conflicts:
   ```bash
   netstat -tuln | grep -E '3000|3001|6379'
   ```

### Frontend Not Loading

**Symptoms**: Blank page or 404 errors

**Solutions**:
1. Check frontend logs:
   ```bash
   docker logs sports-kiosk-frontend
   ```

2. Verify frontend is running:
   ```bash
   curl -I http://localhost:3000
   # Should return: HTTP/1.1 200 OK
   ```

3. Check nginx configuration:
   ```bash
   docker exec sports-kiosk-frontend cat /etc/nginx/conf.d/default.conf
   ```

4. Rebuild frontend:
   ```bash
   cd ~/home-server/sport-kiosk
   docker compose up -d --build frontend
   ```

### High CPU Usage

**Symptoms**: Backend using >100% CPU constantly

**Causes**: Excessive API polling or cron job issues

**Solutions**:
1. Check cron job frequency:
   ```bash
   docker logs sports-kiosk-backend | grep CRON
   ```

2. Verify cron is running every 1 minute (not more frequently)

3. Restart backend to clear any issues:
   ```bash
   docker restart sports-kiosk-backend
   ```

### Redis Connection Issues

**Symptoms**: Logs show Redis connection errors

**Solutions**:
1. Check Redis is running:
   ```bash
   docker ps | grep redis
   docker logs sports-kiosk-redis
   ```

2. Restart Redis:
   ```bash
   docker restart sports-kiosk-redis
   ```

3. Restart backend after Redis is up:
   ```bash
   docker restart sports-kiosk-backend
   ```

### Timezone Incorrect

**Symptoms**: Game times showing wrong timezone

**Solutions**:
1. Verify TZ environment variable:
   ```bash
   docker exec sports-kiosk-backend env | grep TZ
   # Should show: TZ=America/Chicago
   ```

2. Update `docker-compose.yml` if needed and rebuild:
   ```bash
   docker compose up -d --build
   ```

## Performance

### Normal Resource Usage

- **Backend**: 5-10% CPU, 50-100MB RAM
- **Frontend**: 1-3% CPU, 20-40MB RAM
- **Redis**: 1-2% CPU, 10-20MB RAM

### Expected Behavior

- Backend logs show cron updates every 1 minute
- Frontend serves static files efficiently via Nginx
- Redis cache keeps data in memory with automatic TTL expiration

### Optimization Tips

1. **Reduce polling frequency** if resources are tight:
   - Edit `backend/src/server.js` cron schedule to `*/5 * * * *` (every 5 minutes)

2. **Reduce frontend refresh rate**:
   - Edit `frontend/src/App.jsx` fetch interval to 120000ms (2 minutes)

3. **Monitor with docker stats**:
   ```bash
   docker stats --no-stream sports-kiosk-backend sports-kiosk-frontend sports-kiosk-redis
   ```

## Development

### Local Development (without Docker)

**Backend**:
```bash
cd ~/home-server/sport-kiosk/backend
npm install
npm run dev  # Starts with nodemon on port 3001
```

**Frontend**:
```bash
cd ~/home-server/sport-kiosk/frontend
npm install
npm run dev  # Vite dev server on port 5173
```

### Adding New Sports

To add a new sport (e.g., NFL):

1. Create service: `backend/src/services/nflService.js`
2. Add route in `backend/src/routes/sports.js`
3. Add cron job in `backend/src/server.js`
4. Create component: `frontend/src/components/NFLDisplay.jsx`
5. Update `frontend/src/App.jsx`

See `CLAUDE.md` for detailed instructions.

## Maintenance

### Regular Tasks

**Weekly**:
- Check disk space: `df -h /mnt/storage`
- Monitor logs for errors: `docker logs sports-kiosk-backend | grep -i error`

**Monthly**:
- Update to latest version: `git pull && docker compose up -d --build`
- Review resource usage: `docker stats --no-stream`

### Backup

Redis cache is ephemeral (1-15 minute TTLs). No backup needed.

Application code is version-controlled in Git:
```bash
cd ~/home-server/sport-kiosk
git status
git log
```

## Technical Details

### External APIs

- **NBA**: ESPN API - `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- Free, no API key required
- Returns JSON with game status: 'pre' (scheduled), 'in' (live), 'post' (finished)

### Cache Strategy

**Two-tier caching**:
1. **Live scores** (`nba:live`): 60-second TTL for real-time updates
2. **Schedule** (`nba:schedule`): 15-minute TTL for upcoming games

**Redis keys**:
- `nba:live` - Array of in-progress games
- `nba:schedule` - Array of upcoming games

### Network Ports

- **3000**: Frontend (Nginx serving React app)
- **3001**: Backend (Express API)
- **6379**: Redis (cache)

All ports are accessible on both local network (192.168.1.154) and Tailscale VPN (100.126.21.128).

## Related Documentation

- **Main Home Server**: `~/home-server/README.md`
- **Hardware Setup**: `~/home-server/hardware/README.md`
- **Tailscale VPN**: `~/home-server/tailscale/README.md`
- **Developer Guide**: `~/home-server/sport-kiosk/CLAUDE.md`

## License

MIT

## Contributing

Feel free to submit issues and pull requests for new sports integrations at https://github.com/Cruzh3r2107/sport-kiosk
