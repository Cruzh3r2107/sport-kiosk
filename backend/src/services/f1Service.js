const axios = require('axios');
const { client } = require('../utils/redisClient');

// ESPN API endpoint for F1
const F1_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard';
const CACHE_KEY_SCHEDULE = 'f1:schedule';
const CACHE_KEY_LIVE = 'f1:live';

async function fetchF1Data() {
  try {
    const response = await axios.get(F1_SCOREBOARD_URL);
    const events = response.data.events || [];

    const now = new Date();
    const liveEvents = [];
    const upcomingEvents = [];

    events.forEach(event => {
      const race = parseF1Event(event);

      if (race.status === 'in') {
        liveEvents.push(race);
      } else if (race.status === 'pre' && new Date(race.date) > now) {
        upcomingEvents.push(race);
      }
    });

    // Sort upcoming by date
    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Cache the data
    await client.set(CACHE_KEY_LIVE, JSON.stringify(liveEvents), {
      EX: 60 // 1 minute TTL for live races
    });

    await client.set(CACHE_KEY_SCHEDULE, JSON.stringify(upcomingEvents), {
      EX: 900 // 15 minutes TTL for schedule
    });

    console.log(`✓ F1: ${liveEvents.length} live, ${upcomingEvents.length} upcoming`);

    return { live: liveEvents, upcoming: upcomingEvents };
  } catch (error) {
    console.error('Error fetching F1 data:', error.message);
    return { live: [], upcoming: [] };
  }
}

function parseF1Event(event) {
  const competition = event.competitions?.[0];

  // F1 races don't have traditional teams, they have drivers and constructors
  // We'll structure this to work with the display component
  const eventName = event.name || 'Formula 1 Race';
  const circuit = competition?.venue?.fullName || 'Unknown Circuit';
  const location = competition?.venue?.address?.city
    ? `${competition.venue.address.city}, ${competition.venue.address.country || ''}`
    : '';

  // Extract broadcast channel information
  const broadcast = competition?.broadcasts?.[0];
  const channel = broadcast?.names?.[0] || 'TBD';

  return {
    id: event.id,
    sport: 'F1',
    date: event.date,
    status: competition?.status?.type?.state || 'pre',
    // For F1, we use a different structure since there are no "teams" in the traditional sense
    // We'll display race name and circuit information
    homeTeam: {
      name: circuit,
      abbreviation: circuit.substring(0, 3).toUpperCase(),
      logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png', // F1 logo
      score: ''
    },
    awayTeam: {
      name: eventName,
      abbreviation: 'F1',
      logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
      score: ''
    },
    clock: competition?.status?.displayClock || '',
    period: competition?.status?.period || 0,
    statusDetail: competition?.status?.type?.detail || eventName,
    channel: channel,
    // F1-specific information
    venue: {
      name: circuit,
      city: location
    },
    raceName: eventName
  };
}

async function getF1Data() {
  try {
    const liveData = await client.get(CACHE_KEY_LIVE);
    const scheduleData = await client.get(CACHE_KEY_SCHEDULE);

    return {
      live: liveData ? JSON.parse(liveData) : [],
      upcoming: scheduleData ? JSON.parse(scheduleData) : []
    };
  } catch (error) {
    console.error('Error getting F1 data from cache:', error.message);
    return { live: [], upcoming: [] };
  }
}

module.exports = { fetchF1Data, getF1Data };
