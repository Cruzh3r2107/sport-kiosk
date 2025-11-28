const axios = require('axios');
const { client } = require('../utils/redisClient');

// ESPN API endpoint for cycling (Tour de France)
// Note: Tour de France is a seasonal event (typically July). ESPN may have limited data outside the race period.
const CYCLING_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/cycling/tour-de-france/scoreboard';
const CACHE_KEY_SCHEDULE = 'tour:schedule';
const CACHE_KEY_LIVE = 'tour:live';

async function fetchTourData() {
  try {
    const response = await axios.get(CYCLING_SCOREBOARD_URL);
    const events = response.data.events || [];

    const now = new Date();
    const liveEvents = [];
    const upcomingEvents = [];

    events.forEach(event => {
      const stage = parseTourEvent(event);

      if (stage.status === 'in') {
        liveEvents.push(stage);
      } else if (stage.status === 'pre' && new Date(stage.date) > now) {
        upcomingEvents.push(stage);
      }
    });

    // Sort upcoming by date
    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Cache the data
    await client.set(CACHE_KEY_LIVE, JSON.stringify(liveEvents), {
      EX: 60 // 1 minute TTL for live stages
    });

    await client.set(CACHE_KEY_SCHEDULE, JSON.stringify(upcomingEvents), {
      EX: 900 // 15 minutes TTL for schedule
    });

    console.log(`✓ Tour de France: ${liveEvents.length} live, ${upcomingEvents.length} upcoming`);

    return { live: liveEvents, upcoming: upcomingEvents };
  } catch (error) {
    console.error('Error fetching Tour de France data:', error.message);
    // Tour de France is seasonal - this is expected to fail outside July
    return { live: [], upcoming: [] };
  }
}

function parseTourEvent(event) {
  const competition = event.competitions?.[0];

  // Tour de France has stages, not traditional team vs team games
  // We'll structure this to display stage information
  const stageName = event.name || 'Tour de France Stage';
  const stageType = competition?.type?.text || 'Stage';
  const location = competition?.venue?.address?.city
    ? `${competition.venue.address.city}, ${competition.venue.address.country || 'France'}`
    : 'France';

  // Get leader information if available (yellow jersey holder)
  const competitors = competition?.competitors || [];
  const leader = competitors[0] || null;
  const secondPlace = competitors[1] || null;

  return {
    id: event.id,
    sport: 'TOUR',
    date: event.date,
    status: competition?.status?.type?.state || 'pre',
    // For Tour de France, we adapt the team structure to show stage info
    homeTeam: {
      name: leader ? leader.athlete?.displayName || 'Leader' : stageName,
      abbreviation: leader ? leader.athlete?.abbreviation || 'LDR' : 'TDF',
      logo: 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png', // France flag or TDF logo
      score: leader ? leader.statistics?.find(s => s.name === 'time')?.displayValue || '' : ''
    },
    awayTeam: {
      name: secondPlace ? secondPlace.athlete?.displayName || stageType : stageType,
      abbreviation: secondPlace ? secondPlace.athlete?.abbreviation || '2ND' : 'STG',
      logo: 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png',
      score: secondPlace ? secondPlace.statistics?.find(s => s.name === 'time')?.displayValue || '' : ''
    },
    clock: competition?.status?.displayClock || '',
    period: competition?.status?.period || 0,
    statusDetail: competition?.status?.type?.detail || stageName,
    // Tour-specific information
    venue: {
      name: location,
      city: location
    },
    stageName: stageName,
    stageType: stageType
  };
}

async function getTourData() {
  try {
    const liveData = await client.get(CACHE_KEY_LIVE);
    const scheduleData = await client.get(CACHE_KEY_SCHEDULE);

    return {
      live: liveData ? JSON.parse(liveData) : [],
      upcoming: scheduleData ? JSON.parse(scheduleData) : []
    };
  } catch (error) {
    console.error('Error getting Tour de France data from cache:', error.message);
    return { live: [], upcoming: [] };
  }
}

module.exports = { fetchTourData, getTourData };
