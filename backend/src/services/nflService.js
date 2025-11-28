const axios = require('axios');
const { client } = require('../utils/redisClient');

// ESPN API endpoint for NFL scoreboard
const NFL_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const CACHE_KEY_SCHEDULE = 'nfl:schedule';
const CACHE_KEY_LIVE = 'nfl:live';

async function fetchNFLData() {
  try {
    const response = await axios.get(NFL_SCOREBOARD_URL);
    const games = response.data.events || [];

    const now = new Date();
    const liveGames = [];
    const upcomingGames = [];

    games.forEach(event => {
      const game = parseNFLGame(event);

      if (game.status === 'in') {
        liveGames.push(game);
      } else if (game.status === 'pre' && new Date(game.date) > now) {
        upcomingGames.push(game);
      }
    });

    // Sort upcoming by date
    upcomingGames.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Cache the data with appropriate TTLs
    await client.set(CACHE_KEY_LIVE, JSON.stringify(liveGames), {
      EX: 60 // 1 minute TTL for live scores
    });

    await client.set(CACHE_KEY_SCHEDULE, JSON.stringify(upcomingGames), {
      EX: 900 // 15 minutes TTL for schedule
    });

    console.log(`✓ NFL: ${liveGames.length} live, ${upcomingGames.length} upcoming`);

    return { live: liveGames, upcoming: upcomingGames };
  } catch (error) {
    console.error('Error fetching NFL data:', error.message);
    return { live: [], upcoming: [] };
  }
}

function parseNFLGame(event) {
  const competition = event.competitions[0];
  const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

  // Extract broadcast channel information
  const broadcast = competition.broadcasts?.[0];
  const channel = broadcast?.names?.[0] || 'TBD';

  return {
    id: event.id,
    sport: 'NFL',
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
    statusDetail: competition.status.type.detail,
    channel: channel,
    // NFL-specific: Include venue information
    venue: competition.venue ? {
      name: competition.venue.fullName || '',
      city: competition.venue.address?.city || ''
    } : null
  };
}

async function getNFLData() {
  try {
    const liveData = await client.get(CACHE_KEY_LIVE);
    const scheduleData = await client.get(CACHE_KEY_SCHEDULE);

    return {
      live: liveData ? JSON.parse(liveData) : [],
      upcoming: scheduleData ? JSON.parse(scheduleData) : []
    };
  } catch (error) {
    console.error('Error getting NFL data from cache:', error.message);
    return { live: [], upcoming: [] };
  }
}

module.exports = { fetchNFLData, getNFLData };
