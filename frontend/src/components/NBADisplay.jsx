import { useState, useEffect } from 'react';

function NBADisplay({ data }) {
  const [scrollIndex, setScrollIndex] = useState(0);

  const hasLiveGames = data?.live && data.live.length > 0;
  const hasUpcomingGames = data?.upcoming && data.upcoming.length > 0;

  // Auto-scroll live games if multiple
  useEffect(() => {
    if (!hasLiveGames || data.live.length <= 1) return;

    const scrollTimer = setInterval(() => {
      setScrollIndex((prev) => (prev + 1) % data.live.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(scrollTimer);
  }, [hasLiveGames, data?.live?.length]);

  const formatGameDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!data) {
    return <div className="no-games">No NBA data available</div>;
  }

  // Full screen for upcoming games only
  if (!hasLiveGames) {
    return (
      <div className="content full-screen">
        <div className="upcoming-section" style={{ width: '100%' }}>
          <h2 className="section-header">Upcoming Games</h2>
          {hasUpcomingGames ? (
            data.upcoming.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-date">{formatGameDate(game.date)}</div>
                <div className="teams">
                  <div className="team">
                    <div className="team-info">
                      <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="team-logo" />
                      <span className="team-name">{game.awayTeam.name}</span>
                    </div>
                    <span style={{ color: '#666', fontSize: '18px' }}>@</span>
                  </div>
                  <div className="team">
                    <div className="team-info">
                      <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="team-logo" />
                      <span className="team-name">{game.homeTeam.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-games">No upcoming games today</div>
          )}
        </div>
      </div>
    );
  }

  // 60/40 split when there are live games
  return (
    <div className="content split" style={{ display: 'flex' }}>
      <div className="live-section">
        <h2 className="section-header">Live Now</h2>
        {data.live.map((game, index) => (
          <div
            key={game.id}
            className="game-card live-game"
            style={{
              display: data.live.length > 3 && index !== scrollIndex ? 'none' : 'block'
            }}
          >
            <div className="game-status">
              <span className="live-indicator">● LIVE</span>
              <span>{game.statusDetail}</span>
            </div>
            <div className="teams">
              <div className="team">
                <div className="team-info">
                  <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="team-logo" />
                  <span className="team-name">{game.awayTeam.name}</span>
                </div>
                <span className="team-score">{game.awayTeam.score}</span>
              </div>
              <div className="team">
                <div className="team-info">
                  <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="team-logo" />
                  <span className="team-name">{game.homeTeam.name}</span>
                </div>
                <span className="team-score">{game.homeTeam.score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="upcoming-section" style={{ width: '40%' }}>
        <h2 className="section-header">Next Games</h2>
        {hasUpcomingGames ? (
          data.upcoming.slice(0, 5).map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-date">{formatGameDate(game.date)}</div>
              <div className="teams">
                <div className="team">
                  <div className="team-info">
                    <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="team-logo" />
                    <span className="team-name" style={{ fontSize: '18px' }}>{game.awayTeam.abbreviation}</span>
                  </div>
                </div>
                <div className="team">
                  <div className="team-info">
                    <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="team-logo" />
                    <span className="team-name" style={{ fontSize: '18px' }}>{game.homeTeam.abbreviation}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-games" style={{ fontSize: '16px', padding: '20px' }}>
            No more games today
          </div>
        )}
      </div>
    </div>
  );
}

export default NBADisplay;
