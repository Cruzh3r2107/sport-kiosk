const express = require('express');
const { getNBAData } = require('../services/nbaService');

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

router.get('/status', async (req, res) => {
  res.json({
    status: 'ok',
    sports: ['NBA'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
