import React, { useState, useEffect } from 'react';

function TownGrid({ userToken }) {
  const [mapMatrix, setMapMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [targetBuilding, setTargetBuilding] = useState('Cannon');
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [placementStatus, setPlacementStatus] = useState('');

  function fetchTownLayout() {
    setLoading(true);
    setErrorMsg('');
    
    fetch('http://localhost:8080/town/layout', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      }
    })
    .then(function(res) {
      if (res.ok === false) {
        throw new Error('HTTP status error: ' + res.status);
      }
      return res.json();
    })
    .then(function(parsed) {
        if (parsed.grid_matrix) {
            setMapMatrix(parsed.grid_matrix);
        }
        else if (Array.isArray(parsed)) {
            setMapMatrix(parsed);
        }
        else if (parsed.grid) {
            setMapMatrix(parsed.grid);
        }
        else {
            throw new Error('Unexpected backend response: ' + JSON.stringify(parsed));
        }
        setLoading(false);
    })
    .catch(function(err) {
      setErrorMsg(err.message);
      setLoading(false);
    });
  }

  useEffect(function() {
    fetchTownLayout();
  }, [userToken]);

  function executePlacement(e) {
    e.preventDefault();
    setPlacementStatus('');

    const finalX = parseInt(targetX);
    const finalY = parseInt(targetY);

    fetch('http://localhost:8080/town/place', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        building_name: targetBuilding,
        x: finalX,
        y: finalY
      })
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(errorTxt) {
          throw new Error(errorTxt || 'Server rejected coordinate placement');
        });
      }
      setPlacementStatus('Structure successfully deployed to town layout!');
      fetchTownLayout(); 
    })
    .catch(function(err) {
      setPlacementStatus('Error: ' + err.message);
    });
  }

  function handleCellClick(clickedX, clickedY) {
    setTargetX(clickedX);
    setTargetY(clickedY);
  }

  if (loading === true) {
    return <p style={{ color: '#8888aa', fontSize: '14px' }}>Syncing town grid telemetry...</p>;
  }
  
  if (errorMsg !== '') {
    return (
      <div style={{ backgroundColor: '#3d1a1a', border: '1px solid #7a2020', color: '#ff8888', padding: '10px', borderRadius: '4px', fontSize: '13px' }}>
        Town Map Error: {errorMsg}
      </div>
    );
  }

  return (
    <div style={{ color: '#e8e8f0' }}>
      
      <div style={{ 
        backgroundColor: '#252740', 
        padding: '24px', 
        borderRadius: '8px', 
        marginBottom: '24px', 
        border: '1px solid #3d3f6b',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        maxWidth: '700px'
      }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#e8e8f0', fontSize: '16px' }}>📐 TOWN BLUEPRINT DESIGNER</h4>
        
        <form onSubmit={executePlacement} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', color: '#aaaacc', fontSize: '12px', marginBottom: '6px' }}>Building Asset</label>
            <select 
              value={targetBuilding} 
              onChange={function(e) { setTargetBuilding(e.target.value); }} 
              style={{ padding: '10px 12px', backgroundColor: '#1a1c2e', color: '#e8e8f0', border: '1px solid #3d3f6b', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="Cannon">Cannon</option>
              <option value="TownHall">TownHall</option>
              <option value="Barracks">Barracks</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: '#aaaacc', fontSize: '12px', marginBottom: '6px' }}>Coordinate X</label>
            <input 
              type="number" min="0" max="9" value={targetX} 
              onChange={function(e) { setTargetX(e.target.value); }} 
              style={{ width: '65px', padding: '10px 12px', backgroundColor: '#1a1c2e', color: '#e8e8f0', border: '1px solid #3d3f6b', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#aaaacc', fontSize: '12px', marginBottom: '6px' }}>Coordinate Y</label>
            <input 
              type="number" min="0" max="9" value={targetY} 
              onChange={function(e) { setTargetY(e.target.value); }} 
              style={{ width: '65px', padding: '10px 12px', backgroundColor: '#1a1c2e', color: '#e8e8f0', border: '1px solid #3d3f6b', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <button type="submit" style={{ backgroundColor: '#5b4fcf', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            DEPLOY INTO TOWN
          </button>
        </form>
        
        {placementStatus !== '' ? (
          <div style={{ 
            marginTop: '16px', 
            padding: '10px', 
            borderRadius: '4px', 
            fontSize: '13px',
            backgroundColor: placementStatus.includes('⚠️') ? '#3d1a1a' : '#1a3d22',
            border: placementStatus.includes('⚠️') ? '1px solid #7a2020' : '1px solid #207a35',
            color: placementStatus.includes('⚠️') ? '#ff8888' : '#88ff88'
          }}>
            {placementStatus}
          </div>
        ) : null}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(10, 52px)', 
        gridTemplateRows: 'repeat(10, 52px)', 
        gap: '6px',
        backgroundColor: '#252740',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #3d3f6b',
        width: 'fit-content',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
      }}>
        {mapMatrix.map(function(rowArr, yIndex) {
          return rowArr.map(function(tileValue, xIndex) {
            
            let tileBg = '#2d3722'; 
            let borderStyle = '1px solid #475931';
            
            if (tileValue === 'Cannon') { 
              tileBg = '#5c1d2e'; 
              borderStyle = '1px solid #8c2e46'; 
            } else if (tileValue === 'TownHall') { 
              tileBg = '#1a3a5c'; 
              borderStyle = '1px solid #2a5c8f'; 
            } else if (tileValue === 'Barracks') { 
              tileBg = '#3d1a5c'; 
              borderStyle = '1px solid #622a8f'; 
            }

            return (
              <div 
                key={yIndex + '-' + xIndex} 
                title={'Town Tile: [X: ' + xIndex + ', Y: ' + yIndex + '] - ' + tileValue}
                onClick={function() { handleCellClick(xIndex, yIndex); }}
                style={{
                  backgroundColor: tileBg,
                  border: borderStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: '#e8e8f0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
              >
                {tileValue === 'EMPTY' ? xIndex + ',' + yIndex : tileValue.substring(0, 4)}
              </div>
            );
          });
        })}
      </div>

    </div>
  );
}

export default TownGrid;