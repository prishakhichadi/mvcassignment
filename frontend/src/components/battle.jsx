import React, { useState } from 'react';

function Battle({ token, onRaidComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [battleResult, setBattleResult] = useState(null);

  function handleLaunchRaid(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBattleResult(null);

    fetch('http://localhost:8080/troop/attack', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) {
          throw new Error(text || 'Battle failed');
        });
      }
      return res.json();
    })
    .then(function(data) {
      setLoading(false);
      setBattleResult(data);

      if (onRaidComplete) {
        onRaidComplete();
      }
    })
    .catch(function(err) {
      setLoading(false);
      setError(err.message);
    });
  }

  return (
    <div style={{ padding: '24px', color: '#e8e8f0' }}>
      <h2 style={{ fontSize: '20px', color: '#ff4d6d', marginBottom: '16px' }}>BEGIN BATTLE</h2>
      <p style={{ color: '#8888aa', fontSize: '14px', marginBottom: '24px' }}>
        Attack a rival settlement with trained forces.
      </p>

      {error !== '' ? (
        <div style={{ 
          backgroundColor: '#3a1f25', 
          border: '1px solid #ff4d6d', 
          color: '#ff4d6d', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      ) : null}

      <div style={{ 
        backgroundColor: '#252740', 
        border: '1px solid #3d3f6b', 
        borderRadius: '8px', 
        padding: '32px', 
        textAlign: 'center' 
      }}>
        <button 
          onClick={handleLaunchRaid}
          disabled={loading === true}
          style={{
            backgroundColor: '#ff4d6d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '16px 32px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading === true ? 'not-allowed' : 'pointer',
            opacity: loading === true ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(255, 77, 109, 0.3)'
          }}
        >
          {loading === true ? 'SIMULATING COMBAT' : 'FIND TARGET AND ATTACK'}
        </button>
      </div>

      {battleResult !== null ? (
        <div style={{ 
          marginTop: '24px', 
          backgroundColor: '#252740', 
          border: '1px solid #3d3f6b', 
          borderRadius: '8px', 
          padding: '24px' 
        }}>
          <h3 style={{ color: '#00b4d8', fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>
            BATTLE SUMMARY
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#8888aa', fontSize: '13px' }}>OPPONENT ID</p>
              <p style={{ fontSize: '15px', fontWeight: 'bold' }}>{battleResult.enemy_id || 'Unknown rival'}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#8888aa', fontSize: '13px' }}>DESTRUCTION</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffb703' }}>
                {battleResult.result ? battleResult.result.destruction : 0}%
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#8888aa', fontSize: '13px' }}>STARS EARNED</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffb703' }}>
                {'⭐'.repeat(battleResult.result ? battleResult.result.stars : 0) || 'No Stars'}
              </p>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#1a1c2e', 
            borderRadius: '6px', 
            padding: '16px', 
            border: '1px solid #3d3f6b' 
          }}>
            <h4 style={{ color: '#edf2f4', fontSize: '14px', marginBottom: '8px' }}>LOOT ACQUIRED:</h4>
            <p style={{ color: '#ffd700', margin: '4px 0' }}>• Gold Stolen: +{(battleResult.loot ? battleResult.loot.gold : 0).toLocaleString()}</p>
            <p style={{ color: '#a2d2ff', margin: '4px 0' }}>• Elixir Looted: +{(battleResult.loot ? battleResult.loot.elixir : 0).toLocaleString()}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Battle;