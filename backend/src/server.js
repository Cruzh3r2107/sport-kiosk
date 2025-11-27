require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initRedis } = require('./utils/redisClient');
const { fetchNBAData } = require('./services/nbaService');
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

    // Initial fetch
    console.log('Fetching initial NBA data...');
    await fetchNBAData();

    // Schedule live score updates every 1 minute
    cron.schedule('*/1 * * * *', async () => {
      console.log('[CRON] Updating NBA live scores...');
      await fetchNBAData();
    });

    // Additional schedule update every 15 minutes (redundant but ensures fresh data)
    cron.schedule('*/15 * * * *', async () => {
      console.log('[CRON] Refreshing NBA schedule data...');
      await fetchNBAData();
    });

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Timezone: ${process.env.TZ || 'UTC'}`);
      console.log(`✓ Cron jobs scheduled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
