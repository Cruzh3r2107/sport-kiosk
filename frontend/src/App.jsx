import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import UnifiedSportsDisplay from './components/UnifiedSportsDisplay';

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [allSportsData, setAllSportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch all sports data
  useEffect(() => {
    async function fetchAllSports() {
      try {
        const response = await axios.get(`${API_URL}/api/sports/all`);
        setAllSportsData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching sports data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchAllSports();
    // Fetch every 60 seconds to get live updates
    const interval = setInterval(fetchAllSports, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
        <div className="sport-title">Sports Kiosk</div>
        <div className="time-display">{formatTime(currentTime)}</div>
      </div>

      <UnifiedSportsDisplay data={allSportsData} />

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default App;
