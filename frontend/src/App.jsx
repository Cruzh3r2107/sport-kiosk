import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import NBADisplay from './components/NBADisplay';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SPORTS_ORDER = ['NBA', 'NFL', 'F1', 'CRICKET', 'MLB', 'TOUR'];
const CYCLE_INTERVAL = 30000; // 30 seconds

function App() {
  const [currentSportIndex, setCurrentSportIndex] = useState(0);
  const [nbaData, setNbaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentSport = SPORTS_ORDER[currentSportIndex];

  // Fetch NBA data
  useEffect(() => {
    async function fetchNBA() {
      try {
        const response = await axios.get(`${API_URL}/api/sports/nba`);
        setNbaData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching NBA data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchNBA();
    // Fetch every 60 seconds to get live updates
    const interval = setInterval(fetchNBA, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cycle through sports
  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setCurrentSportIndex((prev) => (prev + 1) % SPORTS_ORDER.length);
    }, CYCLE_INTERVAL);
    return () => clearInterval(cycleTimer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="kiosk-container">
        <div className="loading">Loading Sports Data...</div>
      </div>
    );
  }

  return (
    <div className="kiosk-container">
      <div className="header">
        <div className="sport-title">{currentSport}</div>
        <div className="time-display">{formatTime(currentTime)}</div>
      </div>

      <div className="content">
        {currentSport === 'NBA' && <NBADisplay data={nbaData} />}
        {currentSport !== 'NBA' && (
          <div className="no-games">
            {currentSport} - Coming Soon
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default App;
