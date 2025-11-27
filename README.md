# Sports Kiosk

A full-screen kiosk application that displays live sports scores and upcoming games for NBA, NFL, F1, Cricket, MLB, and Tour de France.

## Features

- **Live Scores**: Real-time scores updated every minute
- **Upcoming Games**: Schedule updated every 15 minutes
- **60/40 Split Layout**: When games are live, 60% shows live scores, 40% shows upcoming games
- **Auto-Cycling**: Rotates through sports every 30 seconds
- **Dark Mode**: Easy-on-the-eyes design for always-on displays
- **Tablet Optimized**: Designed for 1024x768 resolution
- **Chicago Timezone**: All times displayed in America/Chicago timezone

## Current Implementation

✅ **NBA** - Fully functional with live scores and schedules
⏳ **NFL** - Coming soon
⏳ **F1** - Coming soon
⏳ **Cricket** - Coming soon
⏳ **MLB** - Coming soon
⏳ **Tour de France** - Coming soon

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Cache**: Redis
- **Deployment**: Docker Compose
- **Data Source**: ESPN API (free)

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Raspberry Pi 5 (16GB) or any Ubuntu server

### Installation

1. Navigate to the project directory:
```bash
cd sports-kiosk
```

2. Build and start all containers:
```bash
docker-compose up -d --build
```

3. Access the app:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

### Development Mode

For development with hot-reload:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Configuration

Edit `docker-compose.yml` to configure:

- **Timezone**: Change `TZ=America/Chicago` to your timezone
- **Ports**: Modify port mappings if needed
- **Update Intervals**: Edit cron schedules in `backend/src/server.js`

## API Endpoints

- `GET /api/sports/nba` - Get NBA live scores and schedule
- `GET /api/sports/status` - Check service status
- `GET /health` - Health check

## Architecture

```
┌─────────────────────┐
│  React Frontend     │ ← Nginx (Port 3000)
│  (1024x768 Kiosk)   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Node.js Backend    │ ← Express API (Port 3001)
│  - ESPN API calls   │
│  - Cron jobs        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Redis Cache        │ ← In-memory cache (Port 6379)
│  - Live: 1min TTL   │
│  - Schedule: 15min  │
└─────────────────────┘
```

## File Structure

```
sports-kiosk/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js           # Main server with cron jobs
│       ├── routes/
│       │   └── sports.js       # API routes
│       ├── services/
│       │   └── nbaService.js   # NBA data fetching
│       └── utils/
│           └── redisClient.js  # Redis connection
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx              # Main app with sport cycling
        ├── App.css              # Dark mode styles
        └── components/
            └── NBADisplay.jsx   # NBA 60/40 layout
```

## Kiosk Setup (Tablet)

1. Install the app on your Raspberry Pi
2. On your tablet, open a browser to `http://<raspberry-pi-ip>:3000`
3. Enable full-screen/kiosk mode:
   - **Android**: Use Kiosk Browser or Fully Kiosk Browser
   - **iOS**: Add to Home Screen, then open
   - **Chrome**: Press F11 for full-screen

## Adding New Sports

To add a new sport (e.g., NFL):

1. Create service: `backend/src/services/nflService.js`
2. Add route in `backend/src/routes/sports.js`
3. Add cron job in `backend/src/server.js`
4. Create component: `frontend/src/components/NFLDisplay.jsx`
5. Update `App.jsx` to include the new sport

## Troubleshooting

**No data showing:**
- Check backend logs: `docker logs sports-kiosk-backend`
- Verify ESPN API is accessible: `curl https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- Check Redis connection: `docker logs sports-kiosk-redis`

**Frontend not loading:**
- Check frontend logs: `docker logs sports-kiosk-frontend`
- Verify API URL in browser console
- Check nginx logs inside container

**Time zone incorrect:**
- Update `TZ` environment variable in `docker-compose.yml`
- Rebuild containers: `docker-compose up -d --build`

## License

MIT

## Contributing

Feel free to submit issues and pull requests for new sports integrations!
