import React, { useState, useEffect } from 'react';
import { tokens, Card, Badge, PageHeading, Callout } from './ui';
import { IconSwords, IconStar, IconGold, IconElixir } from './theme';

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
      .then(function (res) {
        if (!res.ok) {
          throw new Error('Failed to load battle replays');
        }

        return res.text().then(function (text) {
          return text ? JSON.parse(text) : { battles: [] };
        });
      })
      .then(function (data) {
        setLogs(data.battles || []);
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(function () {
    loadReplayLogs();
  }, [token]);

  return (
    <div>
      <PageHeading eyebrow="Archive" title="Battle Replays" subtitle="Review the outcome of your past raids." />

      {loading === true ? (
        <p style={{ color: tokens.textDim, fontSize: '13px' }}>Loading battle history…</p>
      ) : error !== '' ? (
        <Callout tone="rust">{error}</Callout>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map(function (item, idx) {
            const won = item.outcome === 'victory' || item.outcome === 'win';
            return (
              <Card key={item.id || idx} padding={16}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 700, color: won ? tokens.moss : tokens.rust }}>
                    <IconSwords size={14} color={won ? tokens.moss : tokens.rust} />
                    {won ? 'Victory' : 'Defeat'}
                  </span>
                  <span style={{ fontSize: '12px', color: tokens.textFaint }}>
                    {item.start_time ? new Date(item.start_time).toLocaleString() : 'Past match'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: tokens.textDim, marginBottom: '10px' }}>
                  Rival base: <span className="mono" style={{ color: tokens.text }}>{item.defender_id || item.enemy_id}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <Badge tone="brass" style={{ fontSize: '12px' }}>{item.destr_pct || item.destruction_percentage || 0}% destroyed</Badge>
                  <Badge tone="brass" style={{ fontSize: '12px' }}>
                    {Array.from({ length: 3 }).map(function (_, i) {
                      return <IconStar key={i} size={13} filled={i < (item.stars || 0)} />;
                    })}
                  </Badge>
                </div>

                <div style={{
                  backgroundColor: tokens.panelSunken,
                  borderRadius: tokens.radiusMd,
                  padding: '10px 12px',
                  fontSize: '12px',
                  color: tokens.textDim,
                  borderLeft: '3px solid ' + tokens.line,
                  display: 'flex', gap: '18px',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.brass }}>
                    <IconGold size={13} /> +{item.gold_looted || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.berry }}>
                    <IconElixir size={13} /> +{item.elixir_looted || 0}
                  </span>
                </div>
              </Card>
            );
          })}

          {logs.length === 0 ? (
            <Card style={{ textAlign: 'center', color: tokens.textDim }}>
              No battle records found for your account.
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default BattleReplay;
