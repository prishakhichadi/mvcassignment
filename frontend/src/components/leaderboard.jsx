import React, { useState, useEffect } from 'react';

function Leaderboard({ token }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadRankings() {
    setLoading(true);
    setError('');

    fetch('http://localhost:8080/leaderboard', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) {
      if (res.ok === false) {
        throw new Error('Could not fetch competitive standings');
      }
      return res.json();
    })
    .then(function(data) {
      setRankings(data.leaderboard || []);
      setLoading(false);
    })
    .catch(function(err) {
      setError(err.message);
      setLoading(false);
    });
  }

  useEffect(function() {
    loadRankings();
  }, [token]);

  return (
    <div style={{ padding: '24px', color: '#e8e8f0' }}>
      <h2 style={{ fontSize: '20px', color: '#ffb703', marginBottom: '16px' }}>LEADERBOARD</h2>
      <p style={{ color: '#8888aa', fontSize: '14px', marginBottom: '24px' }}>
        Commanders ranked by trophy count.
      </p>

      {loading === true ? (
        <p style={{ color: '#00b4d8' }}>Loading leaderboard arrays...</p>
      ) : error !== '' ? (
        <p style={{ color: '#ff4d6d' }}>Error: {error}</p>
      ) : (
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          backgroundColor: '#252740', 
          border: '1px solid #3d3f6b',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1c2e', borderBottom: '2px solid #3d3f6b' }}>
              <th style={{ padding: '12px', textAlign: 'center', color: '#8888aa' }}>RANK</th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#8888aa' }}>COMMANDER</th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#8888aa' }}>TROPHIES</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map(function(player, idx) {
              return (
                <tr key={player.id || idx} style={{ borderBottom: '1px solid #3d3f6b' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: idx === 0 ? 'white' : '#edf2f4' }}>
                    #{idx + 1}
                  </td>
                  <td style={{ padding: '12px' }}>{player.username}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#ffb703', fontWeight: 'bold' }}>
                    {player.trophy_count || 0}
                  </td>
                </tr>
              );
            })}
            {rankings.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#8888aa' }}>
                  No player records stand in the database logs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;