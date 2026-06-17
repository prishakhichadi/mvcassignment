import React, { useState, useEffect } from 'react';

function BattleReplay({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadReplayLogs() {
    setLoading(true);
    setError('');

    fetch('http://localhost:8080/battle/replay', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) {
        if (!res.ok) {
            throw new Error('Failed to load battle replays');
        }

        return res.text().then(function(text) {
            return text ? JSON.parse(text) : { battles: [] };
        });
    })
    .then(function(data) {
      setLogs(data.battles || []);
      setLoading(false);
    })
    .catch(function(err) {
      setError(err.message);
      setLoading(false);
    });
  }

  useEffect(function() {
    loadReplayLogs();
  }, [token]);

  return (
    <div style={{ padding: '24px', color: '#e8e8f0' }}>
      <h2 style={{ fontSize: '20px', color: '#00b4d8', marginBottom: '16px' }}>BATTLE REPLAY HISTORIC LOGS</h2>
      <p style={{ color: '#8888aa', fontSize: '14px', marginBottom: '24px' }}>
        Review past battles.
      </p>

      {loading === true ? (
        <p style={{ color: '#00b4d8' }}>Synchronizing combat analytics...</p>
      ) : error !== '' ? (
        <p style={{ color: '#ff4d6d' }}>Error: {error}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map(function(item, idx) {
            return (
              <div key={item.id || idx} style={{
                backgroundColor: '#252740',
                border: '1px solid #3d3f6b',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: item.outcome === 'victory' || item.outcome === 'win' ? '#4ad66d' : '#ff4d6d' }}>
                    {item.outcome === 'victory' || item.outcome === 'win' ? '⚔️ VICTORY' : 'DEFEAT'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#8888aa' }}>
                    {item.start_time ? new Date(item.start_time).toLocaleString() : 'Past Match'}
                  </span>
                </div>
                
                <div style={{ fontSize: '14px', color: '#edf2f4' }}>
                  Rival Base ID: <span style={{ fontFamily: 'monospace', color: '#00b4d8' }}>{item.defender_id || item.enemy_id}</span>
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', margin: '4px 0' }}>
                  <div>Destruction: <strong style={{ color: '#ffb703' }}>{item.destr_pct || item.destruction_percentage || 0}%</strong></div>
                  <div>Stars: <strong style={{ color: '#ffb703' }}>{'⭐'.repeat(item.stars) || '0'}</strong></div>
                </div>

                <div style={{ 
                  backgroundColor: '#1a1c2e', 
                  borderRadius: '4px', 
                  padding: '8px', 
                  fontSize: '12px',
                  color: '#8888aa',
                  borderLeft: '3px solid #3d3f6b'
                }}>
                  Resources Recovered — Gold: <span style={{ color: '#ffd700' }}>{item.gold_looted || 0}</span> | Elixir: <span style={{ color: '#a2d2ff' }}>{item.elixir_looted || 0}</span>
                </div>
              </div>
            );
          })}
          
          {logs.length === 0 ? (
            <div style={{ 
              backgroundColor: '#252740', 
              border: '1px solid #3d3f6b', 
              borderRadius: '8px', 
              padding: '32px', 
              textAlign: 'center',
              color: '#8888aa' 
            }}>
              No battle records found for your account.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default BattleReplay;