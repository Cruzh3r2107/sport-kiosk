import { useState, useEffect } from 'react';

function UnifiedSportsDisplay({ data }) {
  const [currentLiveIndex, setCurrentLiveIndex] = useState(0);

  const hasLiveGames = data?.live && data.live.length > 0;
  const hasUpcomingGames = data?.upcoming && data.upcoming.length > 0;

  // Auto-scroll through live games if multiple
  useEffect(() => {
    if (!hasLiveGames || data.live.length <= 1) return;

    const scrollTimer = setInterval(() => {
      setCurrentLiveIndex((prev) => (prev + 1) % data.live.length);
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

  const formatGameTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSportLogo = (sport) => {
    const logos = {
      'NBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
      'NFL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
      'MLB': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
      'F1': 'https://a.espncdn.com/i/teamlogos/leagues/500/f1.png',
      'TOUR': 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png'
    };
    return logos[sport] || '';
  };

  const getStatusText = (game) => {
    if (game.sport === 'NBA') {
      const quarter = game.period === 1 ? '1st' : game.period === 2 ? '2nd' : game.period === 3 ? '3rd' : `${game.period}th`;
      return `${quarter} ${game.clock}`;
    } else if (game.sport === 'NFL') {
      const quarter = game.period === 1 ? '1st' : game.period === 2 ? '2nd' : game.period === 3 ? '3rd' : `${game.period}th`;
      return `${quarter} ${game.clock}`;
    } else if (game.sport === 'MLB') {
      return game.inningState || game.statusDetail;
    } else if (game.sport === 'F1') {
      return game.statusDetail || 'Live';
    } else if (game.sport === 'TOUR') {
      return game.statusDetail || 'Live';
    }
    return game.statusDetail || '';
  };

  if (!data) {
    return <div className="no-games">Loading sports data...</div>;
  }

  // When NO live games: Show next 5 upcoming games
  if (!hasLiveGames) {
    return (
      <div className="content full-screen">
        <div className="upcoming-section" style={{ width: '100%' }}>
          <h2 className="section-header">Upcoming Games</h2>
          {hasUpcomingGames ? (
            data.upcoming.slice(0, 5).map((game) => (
              <div key={`${game.sport}-${game.id}`} className="game-card">
                <div className="game-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <img src={getSportLogo(game.sport)} alt={game.sport} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                  <span style={{ color: '#ff6b35', fontWeight: '600', fontSize: '22px' }}>{game.sport}</span>
                  <span style={{ color: '#ffd700', fontSize: '28px', marginLeft: 'auto' }}>{formatGameDate(game.date)}</span>
                </div>
                <div className="teams">
                  <div className="team">
                    <div className="team-info">
                      <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="team-logo" />
                      <span className="team-name">{game.awayTeam.name}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#666', fontSize: '24px', fontWeight: '700', margin: '12px 0' }}>vs</div>
                  <div className="team">
                    <div className="team-info">
                      <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="team-logo" />
                      <span className="team-name">{game.homeTeam.name}</span>
                    </div>
                  </div>
                </div>
                {game.venue && game.venue.name && (
                  <div style={{ marginTop: '12px', color: '#888', fontSize: '14px', textAlign: 'center' }}>
                    {game.venue.name}{game.venue.city && ` - ${game.venue.city}`}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-games">No upcoming games</div>
          )}
        </div>
      </div>
    );
  }

  // When there ARE live games: 60/40 split
  const currentLiveGame = data.live[currentLiveIndex];

  return (
    <div className="content split" style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Left 60%: ONE live game */}
      <div className="live-section">
        <h2 className="section-header">
          Live Now
          {data.live.length > 1 && (
            <span style={{ fontSize: '16px', fontWeight: 'normal', marginLeft: '10px', color: '#888' }}>
              ({currentLiveIndex + 1} of {data.live.length})
            </span>
          )}
        </h2>
        <div className="game-card live-game">
          <div className="game-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src={getSportLogo(currentLiveGame.sport)} alt={currentLiveGame.sport} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <span style={{ color: '#ff6b35', fontWeight: '700', fontSize: '28px' }}>{currentLiveGame.sport}</span>
          </div>
          <div className="game-status">
            <span className="live-indicator">LIVE</span>
            <span>{getStatusText(currentLiveGame)}</span>
          </div>
          <div className="teams">
            <div className="team">
              <div className="team-info">
                <img src={currentLiveGame.awayTeam.logo} alt={currentLiveGame.awayTeam.name} className="team-logo" style={{ width: '70px', height: '70px' }} />
                <span className="team-name" style={{ fontSize: '32px' }}>{currentLiveGame.awayTeam.name}</span>
              </div>
              <span className="team-score" style={{ fontSize: '56px' }}>{currentLiveGame.awayTeam.score}</span>
            </div>
            <div className="team">
              <div className="team-info">
                <img src={currentLiveGame.homeTeam.logo} alt={currentLiveGame.homeTeam.name} className="team-logo" style={{ width: '70px', height: '70px' }} />
                <span className="team-name" style={{ fontSize: '32px' }}>{currentLiveGame.homeTeam.name}</span>
              </div>
              <span className="team-score" style={{ fontSize: '56px' }}>{currentLiveGame.homeTeam.score}</span>
            </div>
          </div>
          {currentLiveGame.venue && currentLiveGame.venue.name && (
            <div style={{ marginTop: '20px', color: '#aaa', fontSize: '16px', textAlign: 'center' }}>
              {currentLiveGame.venue.name}{currentLiveGame.venue.city && ` - ${currentLiveGame.venue.city}`}
            </div>
          )}
        </div>
      </div>

      {/* Right 40%: Next 2 upcoming games */}
      <div className="upcoming-section">
        <h2 className="section-header">Up Next</h2>
        {hasUpcomingGames ? (
          data.upcoming.slice(0, 2).map((game) => (
            <div key={`${game.sport}-${game.id}`} className="game-card" style={{ marginBottom: '16px' }}>
              <div className="game-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <img src={getSportLogo(game.sport)} alt={game.sport} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                <span style={{ color: '#ff6b35', fontWeight: '600', fontSize: '20px' }}>{game.sport}</span>
              </div>
              <div style={{ color: '#ffd700', fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>{formatGameTime(game.date)}</div>
              <div className="teams">
                <div className="team">
                  <div className="team-info">
                    <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="team-logo" style={{ width: '50px', height: '50px' }} />
                    <span className="team-name" style={{ fontSize: '18px' }}>{game.awayTeam.abbreviation}</span>
                  </div>
                </div>
                <div className="team">
                  <div className="team-info">
                    <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="team-logo" style={{ width: '50px', height: '50px' }} />
                    <span className="team-name" style={{ fontSize: '18px' }}>{game.homeTeam.abbreviation}</span>
                  </div>
                </div>
              </div>
              {game.venue && game.venue.city && (
                <div style={{ marginTop: '8px', color: '#777', fontSize: '12px', textAlign: 'center' }}>
                  {game.venue.city}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-games" style={{ fontSize: '16px', padding: '20px' }}>
            No upcoming games
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedSportsDisplay;
