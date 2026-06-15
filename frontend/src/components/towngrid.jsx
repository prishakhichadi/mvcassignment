import React, { useState, useEffect } from 'react';

// Swapped naming over to TownGrid to match our Go DB controller mapping
function TownGrid({ userToken }) {
  const [mapMatrix, setMapMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [targetBuilding, setTargetBuilding] = useState('Cannon');
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [placementStatus, setPlacementStatus] = useState('');

  const fetchTownLayout = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const res = await fetch('http://localhost:8080/town/layout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP status error: ${res.status}`);
      }

      const parsed = await res.json();
      if (parsed.grid_matrix) {
        setMapMatrix(parsed.grid_matrix);
      } else {
        throw new Error('Invalid payload structure from backend');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTownLayout();
  }, [userToken]);

  const executePlacement = async (e) => {
    e.preventDefault();
    setPlacementStatus('');

    try {
      const res = await fetch('http://localhost:8080/town/place', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          building_name: targetBuilding,
          x: parseInt(targetX),
          y: parseInt(targetY)
        })
      });

      if (!res.ok) {
        const errorTxt = await res.text();
        throw new Error(errorTxt || 'Server rejected coordinate placement');
      }

      setPlacementStatus('💥 Structure deployed down to town layout!');
      fetchTownLayout(); // Pull updated database state
    } catch (err) {
      setPlacementStatus(`⚠️ Error: ${err.message}`);
    }
  };

  if (loading) return <p style={{ color: '#00b4d8' }}>Syncing town grid telemetry...</p>;
  if (errorMsg) return <p style={{ color: '#ef233c' }}>⚠️ Town Map Error: {errorMsg}</p>;

  return (
    <div style={{ padding: '15px', color: '#edf2f4' }}>
      
      <div style={{ backgroundColor: '#1d1e2c', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #4a4e69' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#00b4d8' }}>🏗️ TOWN BLUEPRINT DESIGNER</h4>
        <form onSubmit={executePlacement} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <label>Building: 
            <select value={targetBuilding} onChange={(e) => setTargetBuilding(e.target.value)} style={{ marginLeft: '5px', padding: '5px', backgroundColor: '#2b2d42', color: '#fff', border: '1px solid #4a4e69' }}>
              <option value="Cannon">Cannon</option>
              <option value="TownHall">TownHall</option>
              <option value="Barracks">Barracks</option>
            </select>
          </label>

          <label>X (0-9): 
            <input type="number" min="0" max="9" value={targetX} onChange={(e) => setTargetX(e.target.value)} style={{ width: '45px', marginLeft: '5px', padding: '5px', backgroundColor: '#2b2d42', color: '#fff', border: '1px solid #4a4e69' }} />
          </label>

          <label>Y (0-9): 
            <input type="number" min="0" max="9" value={targetY} onChange={(e) => setTargetY(e.target.value)} style={{ width: '45px', marginLeft: '5px', padding: '5px', backgroundColor: '#2b2d42', color: '#fff', border: '1px solid #4a4e69' }} />
          </label>

          <button type="submit" style={{ backgroundColor: '#7209b7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            DEPLOY INTO TOWN
          </button>
        </form>
        {placementStatus && <p style={{ margin: '10px 0 0 0', fontSize: '13px', fontWeight: 'bold' }}>{placementStatus}</p>}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(10, 50px)', 
        gridTemplateRows: 'repeat(10, 50px)', 
        gap: '4px',
        backgroundColor: '#1d1e2c',
        padding: '10px',
        borderRadius: '6px',
        width: 'fit-content'
      }}>
        {mapMatrix.map((rowArr, yIndex) => 
          rowArr.map((tileValue, xIndex) => {
            let tileBg = '#4d6e2a'; // Empty field fallback
            let borderStyle = '1px solid #3d5a1a';
            
            if (tileValue === 'Cannon') { tileBg = '#8b263e'; borderStyle = '1px solid #ff4d6d'; }
            if (tileValue === 'TownHall') { tileBg = '#22577a'; borderStyle = '1px solid #38a3a5'; }
            if (tileValue === 'Barracks') { tileBg = '#5a189a'; borderStyle = '1px solid #e0aaff'; }

            return (
              <div 
                key={`${yIndex}-${xIndex}`}
                title={`Town Tile: [X: ${xIndex}, Y: ${yIndex}] - ${tileValue}`}
                style={{
                  backgroundColor: tileBg,
                  border: borderStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: '#fff',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setTargetX(xIndex);
                  setTargetY(yIndex);
                }}
              >
                {tileValue === 'EMPTY' ? `${xIndex},${yIndex}` : tileValue}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

export default TownGrid;