import React, { useState } from 'react';

function TrainTroop({ token, elixir, onTrainingComplete }) {
  const [troopName, setTroopName] = useState('Barbarian');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const troopCosts = {
    'Barbarian': 25,
    'Archer': 50,
    'Goblin': 40,
    'Giant': 250,
    'Wall Breaker': 350
  };

  function handleTrain(e) {
    e.preventDefault();
    setMessage('');
    setError('');
    
    var count = parseInt(qty);
    if (isNaN(count) === true || count <= 0) {
      setError('Please provide a valid troop headcount value.');
      return;
    }

    setLoading(true);

    fetch('http://localhost:8080/troop/train', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        troop_name: troopName,
        quantity: count
      })
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) {
          throw new Error(text || 'Transaction rejected');
        });
      }
      return res.json();
    })
    .then(function(data) {
      setLoading(false);
      setMessage('Force built successfully!');
      if (onTrainingComplete) {
        onTrainingComplete();
      }
    })
    .catch(function(err) {
      setLoading(false);
      setError(err.message);
    });
  }

  return (
    <div style={{ padding: '24px', color: '#e8e8f0' }}>
      <h2 style={{ fontSize: '20px', color: '#a2d2ff', marginBottom: '16px' }}>TROOP TRAINING</h2>
      
      <div style={{ backgroundColor: '#1a1c2e', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
        Current Elixir Reserve: <strong style={{ color: '#a2d2ff' }}>{(elixir || 0).toLocaleString()}</strong>
      </div>

      {message !== '' ? (
        <div style={{ backgroundColor: '#1f3a24', border: '1px solid #4ad66d', color: '#4ad66d', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {message}
        </div>
      ) : null}

      {error !== '' ? (
        <div style={{ backgroundColor: '#3a1f25', border: '1px solid #ff4d6d', color: '#ff4d6d', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      ) : null}

      <form onSubmit={handleTrain} style={{ backgroundColor: '#252740', border: '1px solid #3d3f6b', borderRadius: '8px', padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#8888aa', marginBottom: '8px' }}>SELECT FORCE</label>
          <select 
            value={troopName}
            onChange={function(e) { setTroopName(e.target.value); }}
            style={{ width: '100%', padding: '10px', backgroundColor: '#1a1c2e', border: '1px solid #3d3f6b', borderRadius: '6px', color: '#edf2f4' }}
          >
            <option value="Barbarian">Barbarian (25 Elixir)</option>
            <option value="Archer">Archer (50 Elixir)</option>
            <option value="Goblin">Goblin (40 Elixir)</option>
            <option value="Giant">Giant (250 Elixir)</option>
            <option value="Wall Breaker">Wall Breaker (350 Elixir)</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#8888aa', marginBottom: '8px' }}>QUANTITY</label>
          <input 
            type="number"
            value={qty}
            min="1"
            onChange={function(e) { setQty(e.target.value); }}
            style={{ width: '100%', padding: '10px', backgroundColor: '#1a1c2e', border: '1px solid #3d3f6b', borderRadius: '6px', color: '#edf2f4' }}
          />
        </div>

        <div style={{ fontSize: '13px', color: '#8888aa', marginBottom: '16px' }}>
          Total Cost: <span style={{ color: '#a2d2ff', fontWeight: 'bold' }}>{(troopCosts[troopName] * (parseInt(qty) || 0)).toLocaleString()} Elixir</span>
        </div>

        <button
          type="submit"
          disabled={loading === true}
          style={{
            width: '100%',
            backgroundColor: '#00b4d8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '12px',
            fontWeight: 'bold',
            cursor: loading === true ? 'not-allowed' : 'pointer',
            opacity: loading === true ? 0.6 : 1
          }}
        >
          {loading === true ? 'RECRUITING' : 'TRAIN FORCE'}
        </button>
      </form>
    </div>
  );
}

export default TrainTroop;