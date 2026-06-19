import React, { useState, useEffect } from 'react';
import { colors } from './theme';

function Leaderboard({ token }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadRankings() {
    setLoading(true);
    setError('');

    fetch('http://localhost:8080/leaderboard', {
      method: 'GET'
    })
    .then(function(res) {
      if (res.ok === false) {
        throw new Error('Could not fetch leaderboard');
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
    <div style={{ padding: '24px', color: colors.textMain }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Leaderboard</h2>
      <p style={{ color: colors.textDim, fontSize: '13px', marginBottom: '20px' }}>
        Top commanders ranked by trophies.
      </p>

      {loading === true ? (
        <p style={{ color: colors.textDim, fontSize: '13px' }}>Loading...</p>
      ) : error !== '' ? (
        <div style={{ backgroundColor: '#3d1a1a', border: '1px solid #7a2020', color: colors.danger, padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
          {error}
        </div>
      ) : (
        <div style={{ backgroundColor: colors.bgCard, border: '1px solid ' + colors.border, borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.bgDark }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: colors.textDim, fontSize: '12px' }}>Rank</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: colors.textDim, fontSize: '12px' }}>Player</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: colors.textDim, fontSize: '12px' }}>Trophies</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: colors.textDim, fontSize: '12px' }}>Wins</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map(function(player, idx) {
                return (
                  <tr key={player.player_id || idx} style={{ borderTop: '1px solid ' + colors.border }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: idx === 0 ? colors.gold : colors.textMain }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{player.username}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: colors.gold, fontWeight: 'bold' }}>
                      🏆 {player.trophy_count || 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: colors.textDim, fontSize: '13px' }}>
                      {player.wins_attack || 0}
                    </td>
                  </tr>
                );
              })}
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: colors.textDim }}>
                    No players yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;