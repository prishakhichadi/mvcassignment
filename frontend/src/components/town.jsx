import React, { useState, useEffect } from 'react';
import { colors, BuildingIcon, BUILDING_DEFS, IconGold, IconElixir } from './theme';

function Town({ token, gold, elixir, onPlacementSuccess }) {
  const [gridMap, setGridMap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [hint, setHint] = useState('');
  const [hintIsError, setHintIsError] = useState(false);

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
        throw new Error('Failed to load town layout');
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

  function placeBuilding(buildingName, x, y) {
    setHint('');
    setHintIsError(false);

    // NOTE: buildingName here is always one of BUILDING_DEFS[].key (from
    // theme.js), which is the single source of truth for the exact string
    // the backend expects. Previously this sent 'ArcherTower' / 'AirDefense'
    // (no space) which the API rejected as "building type not found" while
    // 'Cannon' worked. If placement still fails after this fix, the
    // backend's expected key differs from what's in BUILDING_DEFS — check
    // the API's building-type list and update theme.js accordingly, not
    // here, so every consumer of the name stays in sync.
    fetch('http://localhost:8080/town/place', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        building_name: buildingName,
        x: x,
        y: y
      })
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) {
          throw new Error(text || 'Could not place building there');
        });
      }
      return res.json();
    })
    .then(function(data) {
      setHint(buildingName + ' placed at (' + x + ', ' + y + ')');
      setHintIsError(false);
      loadLayout();
      if (onPlacementSuccess) {
        onPlacementSuccess();
      }
    })
    .catch(function(err) {
      setHint(err.message);
      setHintIsError(true);
    });
  }

  function handleTileClick(x, y, currentValue) {
    if (!selectedBuilding) {
      if (!currentValue) {
        setHint('Pick a building from the right side first');
        setHintIsError(false);
      }
      return;
    }
    if (currentValue) {
      setHint('That tile is occupied, pick an empty one');
      setHintIsError(true);
      return;
    }
    placeBuilding(selectedBuilding, x, y);
    setSelectedBuilding(null);
  }

  if (loading === true) {
    return <div style={{ padding: '24px', color: colors.textDim }}>Loading your town...</div>;
  }

  if (error !== '') {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ backgroundColor: colors.dangerDim, border: '1px solid #7a2020', color: colors.danger, padding: '12px', borderRadius: '6px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', color: colors.textMain }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Your town</h2>
      <p style={{ color: colors.textDim, fontSize: '13px', marginBottom: '20px' }}>
        Pick a building, then tap an empty tile to place it.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: colors.bgCard, borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid ' + colors.border }}>
          <IconGold size={18} />
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: colors.gold }}>{(gold || 0).toLocaleString()}</span>
        </div>
        <div style={{ backgroundColor: colors.bgCard, borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid ' + colors.border }}>
          <IconElixir size={18} />
          <span style={{ fontWeight: 'bold', fontSize: '15px', color: colors.elixir }}>{(elixir || 0).toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* the actual grid, made to look like grass */}
        <div style={{
          background: colors.grass,
          borderRadius: '16px',
          padding: '14px',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 38px)', gridTemplateRows: 'repeat(10, 38px)', gap: '3px' }}>
            {gridMap.map(function(row, y) {
              return row.map(function(cell, x) {
                const isPathTile = (x + y) % 7 === 0;
                let tileBg = cell ? colors.buildingFill : (isPathTile ? colors.grassPath : colors.grass);

                return (
                  <div
                    key={y + '-' + x}
                    onClick={function() { handleTileClick(x, y, cell); }}
                    title={cell ? cell : 'empty (' + x + ', ' + y + ')'}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '6px',
                      backgroundColor: tileBg,
                      border: '1px solid rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {cell ? <BuildingIcon name={cell} size={20} color="#fff" /> : null}
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* side dock for picking buildings */}
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '14px', padding: '16px', border: '1px solid ' + colors.border }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: colors.textDim, fontWeight: 'bold' }}>Place a building</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {BUILDING_DEFS.map(function(def) {
                const isSelected = selectedBuilding === def.key;
                return (
                  <button
                    key={def.key}
                    onClick={function() { setSelectedBuilding(def.key); setHint('Tap an empty tile to place ' + def.label); setHintIsError(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: colors.bgDark,
                      border: '1px solid ' + (isSelected ? colors.purpleLight : colors.border),
                      borderRadius: '10px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      color: colors.textMain,
                      fontSize: '13px',
                      textAlign: 'left'
                    }}
                  >
                    <BuildingIcon name={def.key} size={22} color={colors.purpleLight} />
                    <span style={{ flex: 1 }}>{def.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: colors.gold }}>
                      <IconGold size={13} />
                      {def.cost.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {hint !== '' ? (
            <div style={{ fontSize: '12px', color: hintIsError ? colors.danger : colors.purpleLight, fontWeight: 'bold', padding: '4px 4px' }}>
              {hint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Town;