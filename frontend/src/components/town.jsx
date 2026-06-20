import React, { useState, useEffect } from 'react';
import { colors, BuildingIcon, BUILDING_DEFS, level1Cost, IconGold } from './theme';

function Town({ token, gold, elixir, onPlacementSuccess }) {
  const [gridMap, setGridMap] = useState([]);
  const [townLevel, setTownLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [hint, setHint] = useState('');
  const [hintIsError, setHintIsError] = useState(false);
  const [thInfo, setThInfo] = useState(null); 
  const [thUpgrading, setThUpgrading] = useState(false);

  const grassFieldStyles = {
    grassBg: '#1e2d1a',
    grassBorder: '#293d24',
    placedBg: '#344e2c',
  };

  function loadLayout() {
    setLoading(true);
    setError('');

    fetch('http://localhost:8080/town/layout', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(res) {
      if (res.ok === false) throw new Error('Failed to load town layout');
      return res.json();
    })
    .then(function(data) {
      setGridMap(data.grid || []);
      setTownLevel(data.town_level || 1);
      setLoading(false);
    })
    .catch(function(err) {
      setError(err.message);
      setLoading(false);
    });
  }

  function loadTownHallInfo() {
    fetch('http://localhost:8080/town/hall', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(res) { return res.ok ? res.json() : null; })
    .then(function(data) { if (data) setThInfo(data); })
    .catch(function() {});
  }

  useEffect(function() {
    loadLayout();
    loadTownHallInfo();
  }, [token]);

  function placeBuilding(buildingName, x, y) {
    setHint('');
    setHintIsError(false);

    const def = BUILDING_DEFS.find(function(d) { return d.key === buildingName; });
    const cost = def ? level1Cost(def) : 0;
    if (def && gold < cost) {
      setHint('Not enough gold: needs ' + cost.toLocaleString() + '.');
      setHintIsError(true);
      return;
    }

    fetch('http://localhost:8080/town/place', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ building_name: buildingName, x: x, y: y })
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) { throw new Error(text || 'Construction denied.'); });
      }
      return res.json();
    })
    .then(function() {
      setHint('Structure deployed successfully!');
      setSelectedBuilding(null);
      loadLayout();
      loadTownHallInfo();
      if (onPlacementSuccess) onPlacementSuccess();
    })
    .catch(function(err) {
      setHint(err.message);
      setHintIsError(true);
    });
  }

  function handleUpgradeTownHall() {
    setThUpgrading(true);
    fetch('http://localhost:8080/town/hall/upgrade', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) { throw new Error(text || 'Upgrade denied.'); });
      }
      return res.json();
    })
    .then(function(data) {
      setThUpgrading(false);
      setTownLevel(data.town_level);
      setHint('Town Hall upgraded to level ' + data.town_level + '!');
      setHintIsError(false);
      loadTownHallInfo();
      if (onPlacementSuccess) onPlacementSuccess();
    })
    .catch(function(err) {
      setThUpgrading(false);
      setHint(err.message);
      setHintIsError(true);
    });
  }

  return (
    <div style={{ color: colors.textMain, display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'monospace' }}>

      <div style={{ backgroundColor: colors.bgCard, borderRadius: '10px', padding: '16px', border: '1px solid ' + colors.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'monospace', letterSpacing: '1px' }}>TOWN GRID</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textDim, fontFamily: 'monospace' }}>
            Deploy defenses and build your town.
          </p>
        </div>

        {}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          backgroundColor: colors.bgDark, border: '1px solid ' + colors.border,
          borderRadius: '10px', padding: '10px 16px'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: colors.textDim, letterSpacing: '0.5px' }}>TOWN HALL</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.purpleLight }}>Level {townLevel}</div>
          </div>
          {thInfo && thInfo.next_level ? (
            <button
              onClick={handleUpgradeTownHall}
              disabled={thUpgrading === true}
              title={'Requires ' + thInfo.next_min_buildings + '+ buildings placed'}
              style={{
                backgroundColor: thUpgrading ? '#444466' : colors.purple,
                color: '#fff', border: 'none', borderRadius: '8px',
                padding: '10px 14px', fontWeight: 'bold', fontSize: '12px',
                cursor: thUpgrading ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
              }}
            >
              <span>Upgrade to Lv {thInfo.next_level}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'normal', fontSize: '11px' }}>
                <IconGold size={11} /> {thInfo.next_gold_cost.toLocaleString()}
                {' · '}{thInfo.buildings_placed}/{thInfo.next_min_buildings} buildings
              </span>
            </button>
          ) : (
            <div style={{ fontSize: '11px', color: colors.textDim }}></div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        <div style={{ backgroundColor: grassFieldStyles.grassBg, borderRadius: '10px', border: '2px solid ' + colors.border, padding: '12px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)' }}>
          {loading === true ? (
            <div style={{ width: '440px', height: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', color: colors.gold }}>
              LOADING MAP
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {gridMap.map(function(row, y) {
                return (
                  <div key={y} style={{ display: 'flex', gap: '4px' }}>
                    {row.map(function(cell, x) {
                      const filled = cell && cell !== 'empty' && cell !== '';
                      return (
                        <div
                          key={x}
                          onClick={function() {
                            if (selectedBuilding) {
                              placeBuilding(selectedBuilding, x, y);
                            } else if (filled) {
                              setHint('Inspecting: ' + (cell.name || cell));
                              setHintIsError(false);
                            }
                          }}
                          style={{
                            width: '40px', height: '40px',
                            backgroundColor: filled ? grassFieldStyles.placedBg : 'transparent',
                            border: '1px solid ' + (selectedBuilding ? colors.purple : grassFieldStyles.grassBorder),
                            borderRadius: '4px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {filled ? (
                            <BuildingIcon name={typeof cell === 'string' ? cell : cell.name} size={24} color={colors.gold} />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: '10px', padding: '16px', border: '1px solid ' + colors.border }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: colors.textDim, fontFamily: 'monospace', letterSpacing: '0.5px' }}>CONSTRUCT</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {BUILDING_DEFS.map(function(def) {
                const isSelected = selectedBuilding === def.key;
                const locked = townLevel < def.townLevelRequired;
                const cost = level1Cost(def);
                return (
                  <button
                    key={def.key}
                    disabled={locked}
                    onClick={function() {
                      if (locked) return;
                      if (isSelected) {
                        setSelectedBuilding(null);
                        setHint('');
                      } else {
                        setSelectedBuilding(def.key);
                        setHint('Tap any empty grass tile to build.');
                        setHintIsError(false);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                      backgroundColor: isSelected ? colors.bgCardRaised : colors.bgDark,
                      border: '1px solid ' + (isSelected ? colors.purpleLight : colors.border),
                      color: locked ? colors.textDim : '#fff',
                      borderRadius: '10px', cursor: locked ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'left',
                      opacity: locked ? 0.55 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BuildingIcon name={def.key} size={22} color={locked ? colors.textDim : colors.purpleLight} />
                      <span style={{ fontSize: '13px' }}>{def.label}</span>
                    </div>
                    {locked ? (
                      <span style={{ fontSize: '11px', color: colors.danger }}>
                        Requires TH {def.townLevelRequired}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: colors.gold }}>
                        <IconGold size={13} />
                        {cost.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {hint !== '' && (
              <div style={{
                marginTop: '14px', padding: '10px', fontSize: '12px', borderRadius: '6px',
                color: hintIsError ? colors.danger : colors.purpleLight,
                backgroundColor: colors.bgDark, borderLeft: '3px solid',
                fontFamily: 'monospace', lineHeight: '1.4'
              }}>
                {hint}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Town;