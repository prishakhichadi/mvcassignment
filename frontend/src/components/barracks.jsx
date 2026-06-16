import React, { useState } from 'react';

function Barracks({ userToken, onRefreshNeeded }) {
  const [troopType, setTroopType] = useState('Barbarian');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function handleTrain(e) {
    e.preventDefault();
    setStatus('');
    setLoading(true);

    fetch('http://localhost:8080/troop/train', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        troop_type: troopType,
        quantity: parseInt(quantity)
      })
    })
    .then(function (res) {
      if (res.ok === false) {
        return res.text().then(function (errorTxt) {
          throw new Error(errorTxt || 'Training deployment rejected');
        });
      }
      return res.text();
    })
    .then(function (data) {
      setStatus('Forces successfully mobilized into your army ranks');
      setLoading(false);
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    })
    .catch(function (err) {
      setStatus('Error: ' + err.message);
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
        Barracks Hub
      </h3>
      <p style={{ color: '#8888aa', textAlign: 'center', fontSize: '13px', marginBottom: '28px' }}>
        Recruit reinforcements using your reserves
      </p>

      {status !== '' ? (
        <div style={{
          backgroundColor: status.includes('⚠️') ? '#3d1a1a' : '#1a3d22',
          border: status.includes('⚠️') ? '1px solid #7a2020' : '1px solid #207a35',
          color: status.includes('⚠️') ? '#ff8888' : '#88ff88',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          {status}
        </div>
      ) : null}

      <form onSubmit={handleTrain}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: '#aaaacc', fontSize: '13px', marginBottom: '6px' }}>
            Select Troop Unit Class
          </label>
          <select 
            value={troopType} 
            onChange={function (e) { setTroopType(e.target.value); }}
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
            <option value="Barbarian">Barbarian (25 Elixir)</option>
            <option value="Archer">Archer (40 Elixir)</option>
          </select>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', color: '#aaaacc', fontSize: '13px', marginBottom: '6px' }}>
            Recruitment Batch Size
          </label>
          <input 
            type="number" 
            min="1" 
            max="100" 
            value={quantity} 
            onChange={function (e) { setQuantity(e.target.value); }}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#1a1c2e',
              border: '1px solid #3d3f6b',
              borderRadius: '4px',
              color: '#e8e8f0',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
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
            letterSpacing: '0.5px'
          }}
        >
          {loading === true ? 'Commencing Training' : 'Mobilize squad'}
        </button>
      </form>
    </div>
  );
}

export default Barracks;