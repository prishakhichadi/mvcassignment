import React, { useState, useEffect } from 'react';
import { tokens, Card, PageHeading, Callout } from './ui';
import { IconTrophy } from './theme';

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
      .then(function (res) {
        if (res.ok === false) {
          throw new Error('Could not fetch leaderboard');
        }
        return res.json();
      })
      .then(function (data) {
        setRankings(data.leaderboard || []);
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(function () {
    loadRankings();
  }, [token]);

  return (
    <div>
      <PageHeading eyebrow="Standings" title="Leaderboard" subtitle="Top commanders ranked by trophies." />

      {loading === true ? (
        <p style={{ color: tokens.textDim, fontSize: '13px' }}>Loading…</p>
      ) : error !== '' ? (
        <Callout tone="rust">{error}</Callout>
      ) : (
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: tokens.panelSunken }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.textFaint, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Rank</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.textFaint, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Player</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.textFaint, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Trophies</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.textFaint, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Wins</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map(function (player, idx) {
                return (
                  <tr key={player.player_id || idx} style={{ borderTop: '1px solid ' + tokens.line }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: idx === 0 ? tokens.brass : tokens.text, textAlign: 'center' }}>
                      {idx < 3 ? <IconTrophy size={15} color={idx === 0 ? tokens.brass : idx === 1 ? tokens.textDim : '#9c6b3f'} /> : '#' + (idx + 1)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{player.username}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: tokens.brass, fontWeight: 700 }}>
                      {player.trophy_count || 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: tokens.textDim, fontSize: '13px' }}>
                      {player.wins_attack || 0}
                    </td>
                  </tr>
                );
              })}
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: tokens.textDim }}>
                    No players yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default Leaderboard;
