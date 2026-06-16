import React, { useState } from 'react';

function RaidCampaign({ userToken, onRefreshNeeded }) {
  const [battleStyle, setBattleStyle] = useState('AllOutAttack');
  const [battleLogs, setBattleLogs] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function executeRaidMatchmaking() {
    setStatus('');
    setBattleLogs(null);
    setLoading(true);

    fetch('http://localhost:8080/troop/attack', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        strategy: battleStyle
      })
    })
    .then(function (res) {
      if (res.ok === false) {
        return res.text().then(function (errorTxt) {
          throw new Error(errorTxt || 'Matchmaking failed');
        });
      }
      return res.json();
    })
    .then(function (data) {
      setBattleLogs(data);
      setLoading(false);
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    })
    .catch(function (err) {
      setStatus('Combat Failure: ' + err.message);
      setLoading(false);
    });
  }

  return (
    <div style={{
      width: '360px',
      backgroundColor: '#252740',
      border: '1px solid #3d3f6b',
      borderRadius: '8px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      margin: '0 auto'
    }}>
      <h3 style={{ color: '#e8e8f0', textAlign: 'center', margin: '0 0 4px 0', fontSize: '20px' }}>
        Campaign Sector
      </h3>
      <p style={{ color: '#8888aa', textAlign: 'center', fontSize: '13px', marginBottom: '28px' }}>
        Deploy your standing armies to strike structures
      </p>

      {status !== '' ? (
        <div style={{
          backgroundColor: '#3d1a1a',
          border: '1px solid #7a2020',
          color: '#ff8888',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          {status}
        </div>
      ) : null}

      <div style={{ marginBottom: '22px' }}>
        <label style={{ display: 'block', color: '#aaaacc', fontSize: '13px', marginBottom: '6px' }}>
          Tactical Infiltration Vector
        </label>
        <select 
          value={battleStyle} 
          onChange={function (e) { setBattleStyle(e.target.value); }}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#1a1c2e',
            border: '1px solid #3d3f6b',
            borderRadius: '4px',
            color: '#e8e8f0',
            fontSize: '14px'
          }}
        >
          <option value="AllOutAttack">Heavy Strike (Deploy All)</option>
          <option value="StealthRaid">Stealth Skirmish (Conserve)</option>
        </select>
      </div>

      <button
        onClick={executeRaidMatchmaking}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#444466' : '#5b4fcf',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.5px',
        }}
      >
        {loading === true ? 'Searching Map Sectors' : 'Launch Matchmaking'}
      </button>

      {battleLogs !== null ? (
        <div style={{
          marginTop: '24px',
          backgroundColor: '#1a1c2e',
          border: '1px solid #3d3f6b',
          borderRadius: '4px',
          padding: '16px'
        }}>
          <h4 style={{ color: '#ff8888', margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚔️ After-Action Report
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#e8e8f0' }}>
            <div>Target Target: <span style={{ color: '#e8e8f0', fontWeight: 'bold' }}>{battleLogs.target_player || 'Enemy Base'}</span></div>
            <div>Destruction Score: <span style={{ color: '#e8e8f0', fontWeight: 'bold' }}>{battleLogs.destruction_percentage || '0'}%</span></div>
            <div>Gold Looted: <span style={{ color: '#88ff88', fontWeight: 'bold' }}>+{battleLogs.gold_looted || '0'} 🪙</span></div>
            <div>Elixir Extracted: <span style={{ color: '#ff88ff', fontWeight: 'bold' }}>+{battleLogs.elixir_looted || '0'} 💧</span></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default RaidCampaign;