require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initRedis } = require('./utils/redisClient');
const { fetchNBAData } = require('./services/nbaService');
const { fetchNFLData } = require('./services/nflService');
const { fetchF1Data } = require('./services/f1Service');
const { fetchMLBData } = require('./services/mlbService');
const { fetchTourData } = require('./services/tourService');
const sportsRouter = require('./routes/sports');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/sports', sportsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    // Initialize Redis
    await initRedis();
    console.log('✓ Redis initialized');

    // Initial fetch for all sports
    console.log('Fetching initial data for all sports...');
    await Promise.all([
      fetchNBAData(),
      fetchNFLData(),
      fetchF1Data(),
      fetchMLBData(),
      fetchTourData()
    ]);

    // Schedule live score updates every 1 minute for all sports
    cron.schedule('*/1 * * * *', async () => {
      console.log('[CRON] Updating live scores for all sports...');
      await Promise.all([
        fetchNBAData(),
        fetchNFLData(),
        fetchF1Data(),
        fetchMLBData(),
        fetchTourData()
      ]);
    });

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Timezone: ${process.env.TZ || 'UTC'}`);
      console.log(`✓ Cron jobs scheduled for NBA, NFL, F1, MLB, Tour de France`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
