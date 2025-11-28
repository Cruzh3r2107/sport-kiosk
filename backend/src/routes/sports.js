const express = require('express');
const { getNBAData } = require('../services/nbaService');
const { getNFLData } = require('../services/nflService');
const { getF1Data } = require('../services/f1Service');
const { getMLBData } = require('../services/mlbService');
const { getTourData } = require('../services/tourService');

const router = express.Router();

router.get('/nba', async (req, res) => {
  try {
    const data = await getNBAData();
    res.json({
      sport: 'NBA',
      ...data
    });
  } catch (error) {
    console.error('Error in /nba route:', error);
    res.status(500).json({ error: 'Failed to fetch NBA data' });
  }
});

router.get('/nfl', async (req, res) => {
  try {
    const data = await getNFLData();
    res.json({
      sport: 'NFL',
      ...data
    });
  } catch (error) {
    console.error('Error in /nfl route:', error);
    res.status(500).json({ error: 'Failed to fetch NFL data' });
  }
});

router.get('/f1', async (req, res) => {
  try {
    const data = await getF1Data();
    res.json({
      sport: 'F1',
      ...data
    });
  } catch (error) {
    console.error('Error in /f1 route:', error);
    res.status(500).json({ error: 'Failed to fetch F1 data' });
  }
});

router.get('/mlb', async (req, res) => {
  try {
    const data = await getMLBData();
    res.json({
      sport: 'MLB',
      ...data
    });
  } catch (error) {
    console.error('Error in /mlb route:', error);
    res.status(500).json({ error: 'Failed to fetch MLB data' });
  }
});

router.get('/tour', async (req, res) => {
  try {
    const data = await getTourData();
    res.json({
      sport: 'TOUR',
      ...data
    });
  } catch (error) {
    console.error('Error in /tour route:', error);
    res.status(500).json({ error: 'Failed to fetch Tour de France data' });
  }
});

router.get('/tourdefrance', async (req, res) => {
  try {
    const data = await getTourData();
    res.json({
      sport: 'TOUR',
      ...data
    });
  } catch (error) {
    console.error('Error in /tourdefrance route:', error);
    res.status(500).json({ error: 'Failed to fetch Tour de France data' });
  }
});

router.get('/all', async (req, res) => {
  try {
    // Fetch data from all sports
    const [nbaData, nflData, f1Data, mlbData, tourData] = await Promise.all([
      getNBAData(),
      getNFLData(),
      getF1Data(),
      getMLBData(),
      getTourData()
    ]);

    // Combine live games from all sports
    const allLiveGames = [
      ...(nbaData.live || []),
      ...(nflData.live || []),
      ...(f1Data.live || []),
      ...(mlbData.live || []),
      ...(tourData.live || [])
    ];

    // Combine upcoming games from all sports
    const allUpcomingGames = [
      ...(nbaData.upcoming || []),
      ...(nflData.upcoming || []),
      ...(f1Data.upcoming || []),
      ...(mlbData.upcoming || []),
      ...(tourData.upcoming || [])
    ];

    // Sort all upcoming games chronologically
    allUpcomingGames.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      live: allLiveGames,
      upcoming: allUpcomingGames,
      counts: {
        nba: { live: nbaData.live?.length || 0, upcoming: nbaData.upcoming?.length || 0 },
        nfl: { live: nflData.live?.length || 0, upcoming: nflData.upcoming?.length || 0 },
        f1: { live: f1Data.live?.length || 0, upcoming: f1Data.upcoming?.length || 0 },
        mlb: { live: mlbData.live?.length || 0, upcoming: mlbData.upcoming?.length || 0 },
        tour: { live: tourData.live?.length || 0, upcoming: tourData.upcoming?.length || 0 }
      }
    });
  } catch (error) {
    console.error('Error in /all route:', error);
    res.status(500).json({ error: 'Failed to fetch combined sports data' });
  }
});

router.get('/status', async (req, res) => {
  res.json({
    status: 'ok',
    sports: ['NBA', 'NFL', 'F1', 'MLB', 'TOUR'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
