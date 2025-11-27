const axios = require('axios');
const { client } = require('../utils/redisClient');

const NBA_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const CACHE_KEY_SCHEDULE = 'nba:schedule';
const CACHE_KEY_LIVE = 'nba:live';

async function fetchNBAData() {
  try {
    const response = await axios.get(NBA_SCOREBOARD_URL);
    const games = response.data.events || [];

    const now = new Date();
    const liveGames = [];
    const upcomingGames = [];

    games.forEach(event => {
      const game = parseNBAGame(event);

      if (game.status === 'in') {
        liveGames.push(game);
      } else if (game.status === 'pre' && new Date(game.date) > now) {
        upcomingGames.push(game);
      }
    });

    // Sort upcoming by date
    upcomingGames.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Cache the data
    await client.set(CACHE_KEY_LIVE, JSON.stringify(liveGames), {
      EX: 60 // 1 minute TTL for live scores
    });

    await client.set(CACHE_KEY_SCHEDULE, JSON.stringify(upcomingGames), {
      EX: 900 // 15 minutes TTL for schedule
    });

    console.log(`✓ NBA: ${liveGames.length} live, ${upcomingGames.length} upcoming`);

    return { live: liveGames, upcoming: upcomingGames };
  } catch (error) {
    console.error('Error fetching NBA data:', error.message);
    return { live: [], upcoming: [] };
  }
}

function parseNBAGame(event) {
  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  return {
    id: event.id,
    sport: 'NBA',
    date: event.date,
    status: competition.status.type.state, // 'pre', 'in', 'post'
    homeTeam: {
      name: homeTeam.team.displayName,
      abbreviation: homeTeam.team.abbreviation,
      logo: homeTeam.team.logo,
      score: homeTeam.score || '0'
    },
    awayTeam: {
      name: awayTeam.team.displayName,
      abbreviation: awayTeam.team.abbreviation,
      logo: awayTeam.team.logo,
      score: awayTeam.score || '0'
    },
    clock: competition.status.displayClock || '',
    period: competition.status.period || 0,
    statusDetail: competition.status.type.detail
  };
}

async function getNBAData() {
  try {
    const liveData = await client.get(CACHE_KEY_LIVE);
    const scheduleData = await client.get(CACHE_KEY_SCHEDULE);

    return {
      live: liveData ? JSON.parse(liveData) : [],
      upcoming: scheduleData ? JSON.parse(scheduleData) : []
    };
  } catch (error) {
    console.error('Error getting NBA data from cache:', error.message);
    return { live: [], upcoming: [] };
  }
}

module.exports = { fetchNBAData, getNBAData };
