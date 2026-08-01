import React, { useState, useEffect, useRef } from 'react';
import { tokens, Card, Button, Badge, PageHeading, Callout, tileColorFor } from './ui';
import { BuildingIcon, TroopIcon, TROOP_DEFS, IconGold, IconElixir, IconStar, IconCrosshair, IconSwords } from './theme';

const CELL = 52;
const GAP = 6;
const PAD = 16;
const BORDER = 1;
const GRID_SIZE = 10;
const FIELD_SIZE = GRID_SIZE * CELL + (GRID_SIZE - 1) * GAP + PAD * 2 + BORDER * 2;
function cellCenter(coord) { return PAD + coord * (CELL + GAP) + CELL / 2; }

const BATTLE_DURATION_MS = 6000;

function Battle({ token, onRaidComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [battleResult, setBattleResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [myTroops, setMyTroops] = useState([]);
  const [troopsLoading, setTroopsLoading] = useState(false);
  const [deployCounts, setDeployCounts] = useState({});
  const [buildings, setBuildings] = useState([]);
  const [troops, setTroops] = useState([]);
  const [timeLeftMs, setTimeLeftMs] = useState(BATTLE_DURATION_MS);
  const [liveDestructionPct, setLiveDestructionPct] = useState(0);
  const [impacts, setImpacts] = useState([]);

  const [opponents, setOpponents] = useState([]);
  const [opponentsLoading, setOpponentsLoading] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [scoutBuildings, setScoutBuildings] = useState([]);
  const [deployPositions, setDeployPositions] = useState({});
  const [activePlacementTroop, setActivePlacementTroop] = useState('');

  const timersRef = useRef([]);

  function clearTimers() {
    timersRef.current.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timersRef.current = [];
  }

  useEffect(function () {
    return function () { clearTimers(); };
  }, []);

  function handleFindTarget(e) {
    e.preventDefault();
    setError('');
    setBattleResult(null);
    clearTimers();
    setOpponentsLoading(true);

    fetch('http://localhost:8080/troop/opponents', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (res) {
        if (res.ok === false) throw new Error('Could not load enemy list');
        return res.json();
      })
      .then(function (data) {
        const list = Array.isArray(data.opponents) ? data.opponents : [];
        setOpponents(list);
        setOpponentsLoading(false);
        setPhase('select-enemy');
      })
      .catch(function (err) {
        setOpponentsLoading(false);
        setError(err.message);
      });
  }

  function handlePickEnemy(enemy) {
    setError('');
    setSelectedEnemy(enemy);
    setTroopsLoading(true);
    setDeployPositions({});
    setActivePlacementTroop('');

    const troopsReq = fetch('http://localhost:8080/troop/list', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (res) {
      if (res.ok === false) throw new Error('Could not load your army');
      return res.json();
    });

    const scoutReq = fetch('http://localhost:8080/troop/scout?enemy_id=' + encodeURIComponent(enemy.player_id), {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (res) {
      if (res.ok === false) throw new Error('Could not scout that village');
      return res.json();
    });

    Promise.all([troopsReq, scoutReq])
      .then(function (results) {
        const troopData = results[0];
        const scoutData = results[1];

        const list = normalizeTroopList(troopData);
        setMyTroops(list);
        const counts = {};
        list.forEach(function (t) { counts[t.name] = 0; });
        setDeployCounts(counts);
        setDeployPositions({});
        setActivePlacementTroop(list.length > 0 ? list[0].name : '');

        setScoutBuildings(Array.isArray(scoutData.buildings) ? scoutData.buildings : []);

        setTroopsLoading(false);
        setPhase('deploy');
      })
      .catch(function (err) {
        setTroopsLoading(false);
        setError(err.message);
      });
  }

  function normalizeTroopList(data) {
    let list = [];
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.troops)) list = data.troops;
    else if (data && Array.isArray(data.army)) list = data.army;
    else if (data && Array.isArray(data.units)) list = data.units;
    return list
      .map(function (t) {
        const name = t.name || t.troop_name || t.type || '';
        const quantity = t.quantity != null ? t.quantity : (t.count != null ? t.count : 0);
        return { name: name, quantity: Number(quantity) || 0 };
      })
      .filter(function (t) { return t.name !== '' && t.quantity > 0; });
  }

  function adjustDeploy(name, delta, maxQty) {
    const current = deployCounts[name] || 0;
    const next = Math.max(0, Math.min(maxQty, current + delta));

    setDeployCounts(function (prev) {
      return Object.assign({}, prev, { [name]: next });
    });

    setDeployPositions(function (prevPositions) {
      if (next > 0 && !prevPositions[name]) {
        return Object.assign({}, prevPositions, { [name]: { x: 5, y: 5 } });
      }
      if (next === 0 && prevPositions[name]) {
        const copy = Object.assign({}, prevPositions);
        delete copy[name];
        return copy;
      }
      return prevPositions;
    });
  }

  function handlePlacementGridClick(x, y) {
    if (activePlacementTroop === '') return;
    setDeployPositions(function (prev) {
      return Object.assign({}, prev, { [activePlacementTroop]: { x: x, y: y } });
    });
  }

  const totalToDeploy = Object.values(deployCounts).reduce(function (a, b) { return a + b; }, 0);

  function handleDeploy() {
    if (totalToDeploy <= 0) {
      setError('Pick at least one troop to deploy.');
      return;
    }
    if (!selectedEnemy) {
      setError('Choose an enemy to raid first.');
      return;
    }
    setLoading(true);
    setError('');

    const troopsPayload = Object.keys(deployCounts)
      .filter(function (name) { return deployCounts[name] > 0; })
      .map(function (name) {
        const pos = deployPositions[name] || { x: 5, y: 5 };
        return { troop_name: name, quantity: deployCounts[name], x: pos.x, y: pos.y };
      });

    fetch('http://localhost:8080/troop/attack', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enemy_id: selectedEnemy.player_id, troops: troopsPayload })
    })
      .then(function (res) {
        if (res.ok === false) {
          return res.text().then(function (text) { throw new Error(text || 'Battle failed'); });
        }
        return res.json();
      })
      .then(function (data) {
        setLoading(false);
        setBattleResult(data);
        setupBattlefield(data);
      })
      .catch(function (err) {
        setLoading(false);
        setError(err.message);
      });
  }

  function setupBattlefield(data) {
    const rawBuildings = (data.enemy_buildings || []);

    const placed = rawBuildings.map(function (b, idx) {
      const maxHp = b.max_hp || 1;
      return {
        id: b.id || (b.x + '-' + b.y + '-' + idx),
        name: b.name,
        pxX: cellCenter(b.x),
        pxY: cellCenter(b.y),
        maxHp: maxHp,
        hp: maxHp,
        destroyed: false
      };
    });

    setBuildings(placed);
    setTimeLeftMs(BATTLE_DURATION_MS);
    setLiveDestructionPct(0);
    setImpacts([]);
    setPhase('fighting');

    const deployedGroups = Array.isArray(data.deployed_troops) ? data.deployed_troops : [];
    const initialTroops = [];
    let idCounter = 0;

    if (deployedGroups.length > 0) {
      deployedGroups.forEach(function (d) {
        const gx = d.x != null ? d.x : 5;
        const gy = d.y != null ? d.y : 9;

        if (initialTroops.length < 8) {
          initialTroops.push({
            id: 'troop-' + idCounter,
            kind: d.troop_name,
            pxX: cellCenter(gx),
            pxY: cellCenter(gy),
            attacking: false
          });
          idCounter += 1;
        }
      });
    } else {
      const deployedNames = Object.keys(deployCounts).filter(function (n) { return deployCounts[n] > 0; });
      const spawnCount = Math.min(6, Math.max(3, deployedNames.length || 3));
      for (let i = 0; i < spawnCount; i++) {
        const kind = deployedNames.length > 0 ? deployedNames[i % deployedNames.length] : TROOP_DEFS[i % TROOP_DEFS.length].key;
        initialTroops.push({
          id: 'troop-' + i,
          kind: kind,
          pxX: cellCenter(1 + (i / spawnCount) * 8),
          pxY: cellCenter(9),
          attacking: false
        });
      }
    }
    setTroops(initialTroops);

    const log = Array.isArray(data.battle_log) ? data.battle_log : [];
    if (log.length > 0) {
      runBattleLogReplay(placed, log);
    } else {
      const finishTimer = setTimeout(function () { setPhase('done'); }, 900);
      timersRef.current.push(finishTimer);
    }
  }

  function runBattleLogReplay(placedBuildings, log) {
    const liveById = {};
    placedBuildings.forEach(function (b) { liveById[b.id] = { hp: b.hp, maxHp: b.maxHp, pxX: b.pxX, pxY: b.pxY }; });

    const totalMaxHp = placedBuildings.reduce(function (sum, b) { return sum + b.maxHp; }, 0) || 1;

    const byTick = {};
    let maxTick = 1;
    log.forEach(function (ev) {
      if (!byTick[ev.tick]) byTick[ev.tick] = [];
      byTick[ev.tick].push(ev);
      if (ev.tick > maxTick) maxTick = ev.tick;
    });

    const startedAt = Date.now();
    const countdownInterval = setInterval(function () {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, BATTLE_DURATION_MS - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) clearInterval(countdownInterval);
    }, 100);
    timersRef.current.push(countdownInterval);

    const stepMs = Math.max(45, Math.floor((BATTLE_DURATION_MS - 600) / maxTick));
    let tick = 1;

    function advanceTick() {
      if (tick > maxTick) {
        const finishTimer = setTimeout(function () { setPhase('done'); }, 500);
        timersRef.current.push(finishTimer);
        return;
      }

      const events = byTick[tick] || [];
      if (events.length > 0) {
        setTroops(function (prev) {
          return prev.map(function (t, i) {
            if (i >= 3) return t;
            const ev = events[i % events.length];
            const b = liveById[ev.building_id];
            if (!b) return t;
            return Object.assign({}, t, {
              pxX: b.pxX + (Math.random() - 0.5) * 30,
              pxY: b.pxY + 24 + (Math.random() - 0.5) * 20,
              attacking: true
            });
          });
        });

        const impactIds = [];
        setBuildings(function (prev) {
          return prev.map(function (b) {
            const hit = events.filter(function (e) { return e.building_id === b.id; }).pop();
            if (!hit) return b;
            liveById[b.id].hp = hit.building_hp_after;
            impactIds.push('impact-' + b.id + '-' + tick);
            return Object.assign({}, b, { hp: hit.building_hp_after, destroyed: hit.building_destroyed });
          });
        });

        if (impactIds.length > 0) {
          setImpacts(function (prev) {
            return prev.concat(impactIds.map(function (id, i) {
              const ev = events[i] || events[0];
              const b = liveById[ev.building_id];
              return { id: id, pxX: b ? b.pxX : 0, pxY: b ? b.pxY : 0 };
            }));
          });
          const clearImpacts = setTimeout(function () {
            setImpacts(function (prev) { return prev.filter(function (im) { return impactIds.indexOf(im.id) === -1; }); });
          }, 400);
          timersRef.current.push(clearImpacts);
        }

        let damageSoFar = 0;
        Object.keys(liveById).forEach(function (id) { damageSoFar += (liveById[id].maxHp - liveById[id].hp); });
        setLiveDestructionPct(Math.round((damageSoFar / totalMaxHp) * 100));
      }

      tick += 1;
      const nextTimer = setTimeout(advanceTick, stepMs);
      timersRef.current.push(nextTimer);
    }

    const kickoff = setTimeout(advanceTick, 400);
    timersRef.current.push(kickoff);
  }

  function resetForNextRaid() {
    clearTimers();
    setBattleResult(null);
    setBuildings([]);
    setTroops([]);
    setImpacts([]);
    setDeployCounts({});
    setSelectedEnemy(null);
    setScoutBuildings([]);
    setDeployPositions({});
    setActivePlacementTroop('');
    setPhase('idle');
  }

  const showHud = phase === 'fighting' || phase === 'done';
  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <PageHeading eyebrow="War room" title="Raid an enemy village" />

      {error !== '' ? <Callout tone="rust">{error}</Callout> : null}

      {phase === 'idle' ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <Button
            variant="primary"
            onClick={handleFindTarget}
            disabled={opponentsLoading === true}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', fontSize: '14px' }}
          >
            <IconCrosshair size={17} color="#fbf3e2" />
            {opponentsLoading === true ? 'Scouting for targets…' : 'Find target'}
          </Button>
        </Card>
      ) : null}

      {phase === 'select-enemy' ? (
        <Card style={{ width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ marginBottom: '4px' }}>Choose your enemy</h3>
          <p style={{ color: tokens.textDim, fontSize: '12px', marginBottom: '16px' }}>
            Pick which village to raid.
          </p>

          {opponents.length === 0 ? (
            <div style={{ backgroundColor: tokens.panelSunken, borderRadius: tokens.radiusMd, padding: '20px', textAlign: 'center', color: tokens.textDim, fontSize: '13px' }}>
              No other villages to raid right now.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '10px',
              marginBottom: '16px'
            }}>
              {opponents.map(function (o) {
                return (
                  <button
                    key={o.player_id}
                    onClick={function () { handlePickEnemy(o); }}
                    disabled={troopsLoading === true}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: tokens.panelSunken, borderRadius: tokens.radiusMd, padding: '10px 12px',
                      border: '1px solid ' + tokens.line, cursor: troopsLoading === true ? 'not-allowed' : 'pointer',
                      textAlign: 'left', fontFamily: tokens.fontBody
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: tokens.text }}>{o.username}</div>
                      <div style={{ fontSize: '11px', color: tokens.textDim }}>
                        Town level {o.town_level} &middot; {o.buildings_count} building{o.buildings_count === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.brass, fontSize: '13px', fontWeight: 700 }}>
                      <IconStar size={13} filled={true} /> {o.trophy_count}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Button variant="secondary" fullWidth onClick={resetForNextRaid}>
            Cancel
          </Button>
        </Card>
      ) : null}

      {phase === 'deploy' ? (
        <Card style={{ width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>
              Plan your attack on {selectedEnemy ? selectedEnemy.username : 'this village'}
            </h3>
            <p style={{ color: tokens.textDim, fontSize: '12px', marginBottom: '16px' }}>
              Choose how many of each troop to send.
            </p>

            {myTroops.length === 0 ? (
              <div style={{ backgroundColor: tokens.panelSunken, borderRadius: tokens.radiusMd, padding: '20px', textAlign: 'center', color: tokens.textDim, fontSize: '13px' }}>
                You have no trained troops. Train some first.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {myTroops.map(function (t) {
                  const count = deployCounts[t.name] || 0;
                  const pos = deployPositions[t.name];
                  const isActive = activePlacementTroop === t.name;
                  return (
                    <div
                      key={t.name}
                      onClick={function () { setActivePlacementTroop(t.name); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: isActive ? tokens.panelRaised : tokens.panelSunken, borderRadius: tokens.radiusMd, padding: '10px 12px',
                        border: '1px solid ' + (isActive ? tokens.brass : tokens.line), cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TroopIcon name={t.name} size={19} color={tokens.brass} />
                        <div>
                          <div style={{ fontSize: '13px' }}>{t.name}</div>
                          <div style={{ fontSize: '11px', color: tokens.textDim }}>
                            Owned: {t.quantity}
                            {count > 0 && pos ? ' \u00b7 drop at (' + pos.x + ', ' + pos.y + ')' : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={function (e) { e.stopPropagation(); }}>
                        <button
                          onClick={function () { adjustDeploy(t.name, -1, t.quantity); }}
                          style={{ width: '26px', height: '26px', borderRadius: tokens.radiusSm, border: '1px solid ' + tokens.line, backgroundColor: tokens.panelRaised, color: tokens.text, cursor: 'pointer', fontWeight: 700 }}
                        >-</button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, color: tokens.brass }}>{count}</span>
                        <button
                          onClick={function () { adjustDeploy(t.name, 1, t.quantity); }}
                          style={{ width: '26px', height: '26px', borderRadius: tokens.radiusSm, border: '1px solid ' + tokens.line, backgroundColor: tokens.panelRaised, color: tokens.text, cursor: 'pointer', fontWeight: 700 }}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={resetForNextRaid}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ flex: 2 }}
                onClick={handleDeploy}
                disabled={loading === true || totalToDeploy === 0}
              >
                {loading === true ? 'Deploying…' : 'Deploy ' + totalToDeploy + ' troop' + (totalToDeploy === 1 ? '' : 's')}
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: tokens.textDim, marginBottom: '10px' }}>
              {activePlacementTroop ? 'Tap a tile to drop ' + activePlacementTroop : 'Pick a troop above to place it'}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(' + GRID_SIZE + ', 52px)',
              gridTemplateRows: 'repeat(' + GRID_SIZE + ', 52px)',
              gap: '6px',
              backgroundColor: tokens.panelSunken,
              padding: '16px',
              borderRadius: tokens.radiusLg,
              border: '1px solid ' + tokens.line,
              boxShadow: tokens.shadowInset,
              width: 'fit-content'
            }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map(function (_, idx) {
                const gx = idx % GRID_SIZE;
                const gy = Math.floor(idx / GRID_SIZE);
                const building = scoutBuildings.find(function (b) { return b.x === gx && b.y === gy; });
                const troopsHere = Object.keys(deployPositions).filter(function (name) {
                  const p = deployPositions[name];
                  return p && p.x === gx && p.y === gy && (deployCounts[name] || 0) > 0;
                });

                let colorKey = 'empty';
                if (building) colorKey = building.name;
                if (troopsHere.length > 0) colorKey = 'troop';
                const c = tileColorFor(colorKey);

                return (
                  <div
                    key={gx + '-' + gy}
                    title={building ? building.name : gx + ',' + gy}
                    onClick={function () { handlePlacementGridClick(gx, gy); }}
                    style={{
                      width: '52px', height: '52px', borderRadius: tokens.radiusSm,
                      backgroundColor: (building || troopsHere.length > 0) ? c.bg : tokens.panelSunken,
                      border: '1px solid ' + ((building || troopsHere.length > 0) ? c.border : tokens.lineSoft),
                      cursor: activePlacementTroop ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {building ? <BuildingIcon name={building.name} size={20} color={tokens.text} /> : null}
                    {troopsHere.length > 0 ? <TroopIcon name={troopsHere[0]} size={17} color={tokens.text} /> : null}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '10px', color: tokens.textDim, marginTop: '10px', display: 'flex', gap: '16px' }}>
              <div><span style={{ display: 'inline-block', width: '9px', height: '9px', backgroundColor: tokens.panelSunken, border: '1px solid ' + tokens.lineSoft, borderRadius: '2px', marginRight: '5px' }} />Empty tile</div>
              <div><span style={{ display: 'inline-block', width: '9px', height: '9px', backgroundColor: '#7d6a4a', borderRadius: '2px', marginRight: '5px' }} />Scouted building</div>
              <div><span style={{ display: 'inline-block', width: '9px', height: '9px', backgroundColor: tokens.clay, borderRadius: '2px', marginRight: '5px' }} />Troop drop point</div>
            </div>
          </div>
        </Card>
      ) : null}

      {(phase === 'fighting' || phase === 'done') ? (
        <div style={{ maxWidth: FIELD_SIZE + 'px' }}>

          {showHud ? (
            <Card padding={0} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              marginBottom: '10px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <span style={{
                  display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: phase === 'fighting' ? tokens.rust : tokens.moss
                }} />
                {phase === 'fighting' ? 'Battle in progress' : 'Battle ended'}
              </div>
              <div style={{ color: tokens.textDim }}>
                {phase === 'fighting' ? secondsLeft + 's left' : 'Final result'}
              </div>
              <div style={{ fontWeight: 700, color: tokens.brass }}>
                {phase === 'fighting' ? liveDestructionPct : (battleResult.result ? battleResult.result.destruction : 0)}% destroyed
              </div>
            </Card>
          ) : null}

          <div style={{
            position: 'relative',
            width: FIELD_SIZE + 'px',
            height: FIELD_SIZE + 'px',
            borderRadius: tokens.radiusLg,
            backgroundColor: tokens.panel,
            border: '1px solid ' + tokens.line,
            boxShadow: tokens.shadowPanel,
            boxSizing: 'border-box'
          }}>
            <div style={{
              position: 'absolute',
              left: PAD + 'px', top: PAD + 'px', right: PAD + 'px', bottom: PAD + 'px',
              display: 'grid',
              gridTemplateColumns: 'repeat(' + GRID_SIZE + ', ' + CELL + 'px)',
              gridTemplateRows: 'repeat(' + GRID_SIZE + ', ' + CELL + 'px)',
              gap: GAP + 'px'
            }}>
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map(function (_, idx) {
                return (
                  <div key={idx} style={{
                    backgroundColor: tokens.panelSunken,
                    border: '1px solid ' + tokens.lineSoft,
                    borderRadius: tokens.radiusSm
                  }} />
                );
              })}
            </div>

            {buildings.length === 0 ? (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '46%', textAlign: 'center',
                color: tokens.textFaint, fontSize: '13px'
              }}>
                Undefended village — nothing to destroy
              </div>
            ) : null}

            {buildings.map(function (b) {
              const hpPct = b.maxHp > 0 ? Math.max(0, b.hp / b.maxHp) : 0;
              return (
                <div
                  key={b.id}
                  style={{
                    position: 'absolute',
                    left: (b.pxX - 26) + 'px',
                    top: (b.pxY - 26) + 'px',
                    width: '52px',
                    textAlign: 'center',
                    transition: 'opacity 0.4s, transform 0.4s',
                    opacity: b.destroyed ? 0.35 : 1,
                    transform: b.destroyed ? 'scale(0.82)' : 'scale(1)',
                    zIndex: 2
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', margin: '0 auto',
                    borderRadius: tokens.radiusMd,
                    backgroundColor: b.destroyed ? '#3a2a1a' : '#7d6a4a',
                    border: '1px solid rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: b.destroyed ? 'none' : '0 2px 6px rgba(0,0,0,0.3)'
                  }}>
                    <BuildingIcon name={b.name} size={24} color={b.destroyed ? '#8a7a5e' : '#fff'} />
                  </div>
                  <div style={{
                    width: '40px', height: '5px', margin: '4px auto 0', borderRadius: '3px',
                    backgroundColor: '#2a1414', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: (hpPct * 100) + '%', height: '100%',
                      backgroundColor: hpPct > 0.4 ? tokens.moss : tokens.rust,
                      transition: 'width 0.25s linear'
                    }} />
                  </div>
                </div>
              );
            })}

            {impacts.map(function (im) {
              return (
                <div key={im.id} style={{
                  position: 'absolute',
                  left: (im.pxX - 16) + 'px',
                  top: (im.pxY - 16) + 'px',
                  width: '32px',
                  height: '32px',
                  zIndex: 4,
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,210,120,0.95) 0%, rgba(255,140,60,0.5) 45%, transparent 75%)'
                  }} />
                </div>
              );
            })}

            {troops.map(function (t) {
              return (
                <div
                  key={t.id}
                  style={{
                    position: 'absolute',
                    left: (t.pxX - 11) + 'px',
                    top: (t.pxY - 11) + 'px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'left 0.55s ease-in-out, top 0.55s ease-in-out',
                    transform: t.attacking ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: t.attacking ? '0 0 0 2px ' + tokens.rust : 'none',
                    zIndex: 3
                  }}
                >
                  <TroopIcon name={t.kind} size={15} color="#fff" />
                </div>
              );
            })}
          </div>

          {phase === 'done' ? (
            <Card style={{ marginTop: '16px' }}>
              <h3 style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                {battleResult.result.outcome === 'win' ? (
                  <React.Fragment>
                    <IconSwords size={17} color={tokens.moss} /> Victory
                  </React.Fragment>
                ) : 'Attack failed'}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: tokens.textDim, fontSize: '12px', marginBottom: '4px' }}>Destruction</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: tokens.brass }}>{battleResult.result.destruction}%</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: tokens.textDim, fontSize: '12px', marginBottom: '4px' }}>Stars</p>
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                    {[0, 1, 2].map(function (i) {
                      return <IconStar key={i} size={19} filled={i < battleResult.result.stars} />;
                    })}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: tokens.panelSunken, borderRadius: tokens.radiusMd, padding: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.brass }}>
                  <IconGold size={15} /> +{battleResult.loot.gold.toLocaleString()} gold looted
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.berry }}>
                  <IconElixir size={15} /> +{battleResult.loot.elixir.toLocaleString()} elixir looted
                </span>
              </div>

              <Button
                variant="primary"
                fullWidth
                style={{ marginTop: '16px' }}
                onClick={function () {
                  resetForNextRaid();
                  if (onRaidComplete) onRaidComplete();
                }}
              >
                Attack again
              </Button>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default Battle;
