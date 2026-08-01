import React, { useState, useEffect } from 'react';
import { tokens, Card, Button, Field, Select, TextInput, PageHeading, Callout } from './ui';
import { BuildingIcon, colors } from './theme';

// Import grass asset
import grassTileImg from '../assets/grass.jpeg';

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
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP status error: ' + res.status);
        return res.json();
      })
      .then(function (parsed) {
        if (parsed.grid_matrix) setMapMatrix(parsed.grid_matrix);
        else if (Array.isArray(parsed)) setMapMatrix(parsed);
        else if (parsed.grid) setMapMatrix(parsed.grid);
        else throw new Error('Unexpected backend response');
        setLoading(false);
      })
      .catch(function (err) {
        setErrorMsg(err.message);
        setLoading(false);
      });
  }

  useEffect(function () {
    fetchTownLayout();
  }, [userToken]);

  function executePlacement(e) {
    e.preventDefault();
    setPlacementStatus('');

    fetch('http://localhost:8080/town/place', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        building_name: targetBuilding,
        x: parseInt(targetX),
        y: parseInt(targetY)
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (txt) { throw new Error(txt || 'Placement failed'); });
        }
        setPlacementStatus('Structure successfully deployed!');
        fetchTownLayout();
      })
      .catch(function (err) {
        setPlacementStatus('Error: ' + err.message);
      });
  }

  function handleCellClick(clickedX, clickedY) {
    setTargetX(clickedX);
    setTargetY(clickedY);
  }

  if (loading) return <p style={{ color: colors.textDim, fontSize: '13px' }}>Syncing town grid…</p>;
  if (errorMsg) return <Callout tone="rust">Town map error: {errorMsg}</Callout>;

  const isError = placementStatus.toLowerCase().startsWith('error');

  return (
    <div>
      <PageHeading eyebrow="Village" title="Town Blueprint Designer" />

      <Card style={{ marginBottom: '24px', maxWidth: '700px' }}>
        <form onSubmit={executePlacement} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Building">
            <Select value={targetBuilding} onChange={(e) => setTargetBuilding(e.target.value)}>
              <option value="Cannon">Cannon</option>
              <option value="TownHall">TownHall</option>
              <option value="Barracks">Barracks</option>
            </Select>
          </Field>

          <Field label="Coordinate X">
            <TextInput
              type="number" min="0" max="9" value={targetX}
              onChange={(e) => setTargetX(e.target.value)}
              style={{ width: '65px' }}
            />
          </Field>

          <Field label="Coordinate Y">
            <TextInput
              type="number" min="0" max="9" value={targetY}
              onChange={(e) => setTargetY(e.target.value)}
              style={{ width: '65px' }}
            />
          </Field>

          <Button type="submit" variant="primary" style={{ marginBottom: '16px' }}>
            Deploy into town
          </Button>
        </form>

        {placementStatus && (
          <Callout tone={isError ? 'rust' : 'moss'}>{placementStatus}</Callout>
        )}
      </Card>

      {/* GRASS BOARD WRAPPER */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 52px)',
          gridTemplateRows: 'repeat(10, 52px)',
          gap: '6px',
          backgroundImage: `url(${grassTileImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid #3c5427',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          width: 'fit-content',
          boxSizing: 'border-box'
        }}>
          {mapMatrix.map((rowArr, yIndex) =>
            rowArr.map((tileValue, xIndex) => {
              const isEmpty = !tileValue || tileValue === 'EMPTY' || tileValue === 'empty' || tileValue === 0;

              // Transparent tile defaults over grass image
              let tileBg = 'rgba(0, 0, 0, 0.15)';
              let borderStyle = '1px solid rgba(255, 255, 255, 0.15)';

              if (!isEmpty) {
                const norm = String(tileValue).toLowerCase();
                if (norm.includes('cannon')) {
                  tileBg = 'rgba(92, 29, 46, 0.9)';
                  borderStyle = '1px solid #8c2e46';
                } else if (norm.includes('townhall') || norm.includes('town hall')) {
                  tileBg = 'rgba(26, 58, 92, 0.9)';
                  borderStyle = '1px solid #2a5c8f';
                } else if (norm.includes('barracks')) {
                  tileBg = 'rgba(45, 66, 38, 0.9)';
                  borderStyle = '1px solid #3c5932';
                } else {
                  tileBg = 'rgba(125, 106, 74, 0.9)';
                  borderStyle = '1px solid rgba(0,0,0,0.35)';
                }
              }

              // Selected placement coordinate border
              if (parseInt(targetX) === xIndex && parseInt(targetY) === yIndex) {
                borderStyle = '2px solid #5cd97a';
              }

              return (
                <div
                  key={`${yIndex}-${xIndex}`}
                  title={`Tile [${xIndex}, ${yIndex}] — ${tileValue}`}
                  onClick={() => handleCellClick(xIndex, yIndex)}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '4px',
                    backgroundColor: tileBg,
                    border: borderStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {!isEmpty && <BuildingIcon name={tileValue} size={22} color="#fff" />}
                </div>
              );
            })
          )}
        </div>

        {/* LEGEND */}
        <div style={{ fontSize: '11px', color: colors.textDim, marginTop: '12px', display: 'flex', gap: '16px' }}>
          <div>
            <span style={{ display: 'inline-block', width: '9px', height: '9px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', marginRight: '5px' }} />
            Empty plot
          </div>
          <div>
            <span style={{ display: 'inline-block', width: '9px', height: '9px', backgroundColor: 'rgba(125, 106, 74, 0.9)', borderRadius: '2px', marginRight: '5px' }} />
            Building
          </div>
          <div>
            <span style={{ display: 'inline-block', width: '9px', height: '9px', backgroundColor: 'transparent', border: '1px solid #5cd97a', borderRadius: '2px', marginRight: '5px' }} />
            Target
          </div>
        </div>
      </div>
    </div>
  );
}

export default TownGrid;