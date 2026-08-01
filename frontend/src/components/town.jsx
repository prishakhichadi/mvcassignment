import React, { useState, useEffect } from 'react';
import { tokens, Card, Button, Badge, PageHeading, Callout } from './ui';
import { BuildingIcon, BUILDING_DEFS, level1Cost, IconGold } from './theme';

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

  function loadLayout() {
    setLoading(true);
    setError('');

    fetch('http://localhost:8080/town/layout', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (res) {
        if (res.ok === false) throw new Error('Failed to load town layout');
        return res.json();
      })
      .then(function (data) {
        setGridMap(data.grid || []);
        setTownLevel(data.town_level || 1);
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message);
        setLoading(false);
      });
  }

  function loadTownHallInfo() {
    fetch('http://localhost:8080/town/hall', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { if (data) setThInfo(data); })
      .catch(function () { });
  }

  useEffect(function () {
    loadLayout();
    loadTownHallInfo();
  }, [token]);

  function placeBuilding(buildingName, x, y) {
    setHint('');
    setHintIsError(false);

    const def = BUILDING_DEFS.find(function (d) { return d.key === buildingName; });
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
      .then(function (res) {
        if (res.ok === false) {
          return res.text().then(function (text) { throw new Error(text || 'Construction denied.'); });
        }
        return res.json();
      })
      .then(function () {
        setHint('Structure deployed successfully.');
        setSelectedBuilding(null);
        loadLayout();
        loadTownHallInfo();
        if (onPlacementSuccess) onPlacementSuccess();
      })
      .catch(function (err) {
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
      .then(function (res) {
        if (res.ok === false) {
          return res.text().then(function (text) { throw new Error(text || 'Upgrade denied.'); });
        }
        return res.json();
      })
      .then(function (data) {
        setThUpgrading(false);
        setTownLevel(data.town_level);
        setHint('Town Hall upgraded to level ' + data.town_level + '.');
        setHintIsError(false);
        loadTownHallInfo();
        if (onPlacementSuccess) onPlacementSuccess();
      })
      .catch(function (err) {
        setThUpgrading(false);
        setHint(err.message);
        setHintIsError(true);
      });
  }

  return (
    <div>
      <PageHeading eyebrow="Village" title="Town Grid" subtitle="Deploy defenses and grow your town." />

      {error !== '' ? <Callout tone="rust">{error}</Callout> : null}

      <Card padding={16} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '10px', color: tokens.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Town Hall</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: tokens.brass, fontFamily: tokens.fontDisplay }}>Level {townLevel}</div>
          </div>

          {thInfo && thInfo.next_level ? (
            <Button
              variant="primary"
              onClick={handleUpgradeTownHall}
              disabled={thUpgrading === true}
              title={'Requires ' + thInfo.next_min_buildings + '+ buildings placed'}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '9px 14px' }}
            >
              <span>Upgrade to Lv {thInfo.next_level}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500, fontSize: '11px' }}>
                <IconGold size={11} /> {thInfo.next_gold_cost.toLocaleString()}
                {' · '}{thInfo.buildings_placed}/{thInfo.next_min_buildings} buildings
              </span>
            </Button>
          ) : null}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* --- grid --- */}
        <div style={{
          backgroundColor: tokens.panelSunken,
          borderRadius: tokens.radiusLg,
          border: '1px solid ' + tokens.line,
          boxShadow: tokens.shadowInset,
          padding: '12px',
        }}>
          {loading === true ? (
            <div style={{ width: '440px', height: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.brass, fontSize: '13px', fontWeight: 700 }}>
              Loading map…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {gridMap.map(function (row, y) {
                return (
                  <div key={y} style={{ display: 'flex', gap: '4px' }}>
                    {row.map(function (cell, x) {
                      const filled = cell && cell !== 'empty' && cell !== '';
                      return (
                        <div
                          key={x}
                          onClick={function () {
                            if (selectedBuilding) {
                              placeBuilding(selectedBuilding, x, y);
                            } else if (filled) {
                              setHint('Inspecting: ' + (cell.name || cell));
                              setHintIsError(false);
                            }
                          }}
                          style={{
                            width: '40px', height: '40px',
                            backgroundColor: filled ? '#3a4a2a' : 'transparent',
                            border: '1px solid ' + (selectedBuilding ? tokens.brass : '#33401f'),
                            borderRadius: tokens.radiusSm, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'border-color 0.15s ease',
                          }}
                        >
                          {filled ? (
                            <BuildingIcon name={typeof cell === 'string' ? cell : cell.name} size={24} color={tokens.brass} />
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

        {/* --- build menu --- */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <Card>
            <h4 style={{ marginBottom: '14px' }}>Construct</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {BUILDING_DEFS.map(function (def) {
                const isSelected = selectedBuilding === def.key;
                const locked = townLevel < def.townLevelRequired;
                const cost = level1Cost(def);
                return (
                  <button
                    key={def.key}
                    disabled={locked}
                    onClick={function () {
                      if (locked) return;
                      if (isSelected) {
                        setSelectedBuilding(null);
                        setHint('');
                      } else {
                        setSelectedBuilding(def.key);
                        setHint('Tap any empty tile to build.');
                        setHintIsError(false);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                      backgroundColor: isSelected ? tokens.panelRaised : tokens.panelSunken,
                      border: '1px solid ' + (isSelected ? tokens.brass : tokens.line),
                      color: locked ? tokens.textFaint : tokens.text,
                      borderRadius: tokens.radiusMd, cursor: locked ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontFamily: tokens.fontBody, textAlign: 'left',
                      opacity: locked ? 0.55 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BuildingIcon name={def.key} size={20} color={locked ? tokens.textFaint : tokens.brass} />
                      <span style={{ fontSize: '13px' }}>{def.label}</span>
                    </div>
                    {locked ? (
                      <span style={{ fontSize: '11px', color: tokens.rust }}>
                        Requires TH {def.townLevelRequired}
                      </span>
                    ) : (
                      <Badge tone="brass" style={{ padding: '3px 9px', fontSize: '11px' }}>
                        <IconGold size={12} /> {cost.toLocaleString()}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {hint !== '' && (
              <div style={{
                marginTop: '14px', padding: '10px 12px', fontSize: '12px', borderRadius: tokens.radiusMd,
                color: hintIsError ? tokens.rust : tokens.brass,
                backgroundColor: tokens.panelSunken, borderLeft: '3px solid ' + (hintIsError ? tokens.rust : tokens.brass),
                lineHeight: '1.4',
              }}>
                {hint}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}

export default Town;
