import React, { useState, useEffect } from 'react';

function Town({ token, gold, elixir, onPlacementSuccess }) {
  const [gridMap, setGridMap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedBuilding, setSelectedBuilding] = useState('Cannon');
  const [coordX, setCoordX] = useState(0);
  const [coordY, setCoordY] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');

  function loadLayout() {
    setLoading(true);
    setError('');
    
    fetch('http://localhost:8080/town/layout', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) {
      if (res.ok === false) {
        throw new Error('Failed to load matrix coordinates');
      }
      return res.json();
    })
    .then(function(data) {

      setGridMap(data.grid || []);
      setLoading(false);
    })
    .catch(function(err) {
      setError(err.message);
      setLoading(false);
    });
  }

  useEffect(function() {
    loadLayout();
  }, [token]);

  function handlePlacementSubmit(e) {
    e.preventDefault();
    setStatusMsg('');

    fetch('http://localhost:8080/town/place', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        building_name: selectedBuilding,
        x: parseInt(coordX),
        y: parseInt(coordY)
      })
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) {
          throw new Error(text || 'Placement validation out-of-bounds');
        });
      }
      return res.json();
    })
    .then(function(data) {
      setStatusMsg('Asset constructed!');
      loadLayout();
      if (onPlacementSuccess) {
        onPlacementSuccess();
      }
    })
    .catch(function(err) {
      setStatusMsg('Error: ' + err.message);
    });
  }

  if (loading === true) {
    return <div style={{ padding: '24px', color: '#00b4d8' }}>Syncing grid map matrix array data sheets...</div>;
  }

  return (
    <div style={{ padding: '24px', color: '#e8e8f0' }}>
      <h2 style={{ fontSize: '20px', color: '#4ad66d', marginBottom: '16px' }}>TOWN MATRIX</h2>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a1c2e', padding: '12px', borderRadius: '6px', fontSize: '14px', flex: 1 }}>
          Gold: <strong style={{ color: '#ffb703' }}>{(gold || 0).toLocaleString()}</strong>
        </div>
        <div style={{ backgroundColor: '#1a1c2e', padding: '12px', borderRadius: '6px', fontSize: '14px', flex: 1 }}>
          Elixir: <strong style={{ color: '#a2d2ff' }}>{(elixir || 0).toLocaleString()}</strong>
        </div>
      </div>

      {statusMsg !== '' ? (
        <div style={{ backgroundColor: '#252740', border: '1px solid #3d3f6b', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {statusMsg}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
        {/*grid engine*/}
        <div style={{ 
          backgroundColor: '#112211', 
          padding: '10px', 
          borderRadius: '8px', 
          display: 'inline-block',
          alignSelf: 'center',
          border: '4px solid #3d3f6b'
        }}>
          {gridMap.map(function(row, rIdx) {
            return (
              <div key={rIdx} style={{ display: 'flex' }}>
                {row.map(function(cell, cIdx) {
                  var tileBg = '#224422';
                  var symbol = 'X';
                  if (cell === 'TownHall') { tileBg = '#1d3557'; symbol = 'T'; }
                  if (cell === 'Cannon') { tileBg = '#4a1525'; symbol = 'C'; }
                  if (cell === 'ArcherTower') { tileBg = '#5c3d2e'; symbol = 'T'; }
                  if (cell === 'AirDefense') { tileBg = '#2d1a4a'; symbol = 'D'; }

                  return (
                    <div 
                      key={cIdx}
                      onClick={function() { setCoordX(cIdx); setCoordY(rIdx); }}
                      title={'Tile coordinate: ' + cIdx + ', ' + rIdx}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: tileBg,
                        border: '1px solid #113311',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      {symbol}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/*build selector*/}
        <form onSubmit={handlePlacementSubmit} style={{ backgroundColor: '#252740', border: '1px solid #3d3f6b', borderRadius: '8px', padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#edf2f4' }}>BUILD NEW DEFENSE INFRASTRUCTURE</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '15px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#8888aa', marginBottom: '6px' }}>STRUCTURE TYPE</label>
              <select value={selectedBuilding} onChange={function(e) { setSelectedBuilding(e.target.value); }} style={{ width: '100%', padding: '8px', backgroundColor: '#1a1c2e', border: '1px solid #3d3f6b', color: '#edf2f4', borderRadius: '4px' }}>
                <option value="Cannon">Cannon</option>
                <option value="ArcherTower">Archer Tower</option>
                <option value="AirDefense">Air Defense</option>
              </select>
            </div>
            <div style={{ width: '80px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#8888aa', marginBottom: '6px' }}>GRID X</label>
              <input type="number" min="0" max="9" value={coordX} onChange={function(e) { setCoordX(e.target.value); }} style={{ width: '100%', padding: '8px', backgroundColor: '#1a1c2e', border: '1px solid #3d3f6b', color: '#edf2f4', borderRadius: '4px' }} />
            </div>
            <div style={{ width: '80px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#8888aa', marginBottom: '6px' }}>GRID Y</label>
              <input type="number" min="0" max="9" value={coordY} onChange={function(e) { setCoordY(e.target.value); }} style={{ width: '100%', padding: '8px', backgroundColor: '#1a1c2e', border: '1px solid #3d3f6b', color: '#edf2f4', borderRadius: '4px' }} />
            </div>
          </div>
          <button type="submit" style={{ marginTop: '16px', width: '100%', padding: '10px', backgroundColor: '#4ad66d', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            CONSTRUCT
          </button>
        </form>
      </div>
    </div>
  );
}

export default Town;