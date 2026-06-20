import React, { useState, useEffect, useRef } from 'react';
import { colors, BuildingIcon, TroopIcon, TROOP_DEFS, IconGold, IconElixir, IconStar, IconCrosshair, IconSwords } from './theme';

const FIELD_W = 560;
const FIELD_H = 560;
const BATTLE_DURATION_MS = 6000; //5-7s window for attack to play out

function Battle({ token, onRaidComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [battleResult, setBattleResult] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [myTroops, setMyTroops] = useState([]);
  const [troopsLoading, setTroopsLoading] = useState(false);
  const [deployCounts, setDeployCounts] = useState({}); 
  const [buildings, setBuildings] = useState([]); 
  const [troops, setTroops] = useState([]); // [{id, kind, xPct, yPct, attacking}]
  const [timeLeftMs, setTimeLeftMs] = useState(BATTLE_DURATION_MS);
  const [liveDestructionPct, setLiveDestructionPct] = useState(0);
  const [impacts, setImpacts] = useState([]); // brief hit-flash markers [{id,xPct,yPct}]

  const timersRef = useRef([]);

  function clearTimers() {
    timersRef.current.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timersRef.current = [];
  }

  useEffect(function () {
    return function () { clearTimers(); };
  }, []);

  // ---- step 1: player clicks "find target" -> load their army, show deploy screen ----
  function handleFindTarget(e) {
    e.preventDefault();
    setError('');
    setBattleResult(null);
    clearTimers();
    setTroopsLoading(true);

    fetch('http://localhost:8080/troop/list', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function (res) {
      if (res.ok === false) throw new Error('Could not load your army');
      return res.json();
    })
    .then(function (data) {
      const list = normalizeTroopList(data);
      setMyTroops(list);
      const counts = {};
      list.forEach(function (t) { counts[t.name] = 0; });
      setDeployCounts(counts);
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
    setDeployCounts(function (prev) {
      const current = prev[name] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return Object.assign({}, prev, { [name]: next });
    });
  }

  const totalToDeploy = Object.values(deployCounts).reduce(function (a, b) { return a + b; }, 0);


  function handleDeploy() {
    if (totalToDeploy <= 0) {
      setError('Pick at least one troop to deploy.');
      return;
    }
    setLoading(true);
    setError('');

    const troopsPayload = Object.keys(deployCounts)
      .filter(function (name) { return deployCounts[name] > 0; })
      .map(function (name) { return { troop_name: name, quantity: deployCounts[name] }; });

    fetch('http://localhost:8080/troop/attack', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ troops: troopsPayload })
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

//animate
  function setupBattlefield(data) {
    const rawBuildings = (data.enemy_buildings || []);

    
    const placed = rawBuildings.map(function (b, idx) {
      const xPct = Math.min(0.94, Math.max(0.06, (b.x + 0.5) / 10));
      const yPct = Math.min(0.94, Math.max(0.06, (b.y + 0.5) / 10));
      const maxHp = b.max_hp || 1;
      return {
        id: b.x + '-' + b.y + '-' + idx,
        name: b.name,
        xPct: xPct,
        yPct: yPct,
        maxHp: maxHp,
        hp: maxHp, 
        finalHp: b.hp != null ? b.hp : 0,
        destroyed: false
      };
    });

    setBuildings(placed);
    setTimeLeftMs(BATTLE_DURATION_MS);
    setLiveDestructionPct(0);
    setImpacts([]);
    setPhase('fighting');

    const deployedNames = Object.keys(deployCounts).filter(function (n) { return deployCounts[n] > 0; });
    const spawnCount = Math.min(6, Math.max(3, deployedNames.length || 3));
    const initialTroops = [];
    for (let i = 0; i < spawnCount; i++) {
      const kind = deployedNames.length > 0 ? deployedNames[i % deployedNames.length] : TROOP_DEFS[i % TROOP_DEFS.length].key;
      initialTroops.push({
        id: 'troop-' + i,
        kind: kind,
        xPct: 0.15 + (i / spawnCount) * 0.7,
        yPct: 0.96,
        attacking: false
      });
    }
    setTroops(initialTroops);

    runFightSequence(placed, initialTroops);
  }

  function runFightSequence(placedBuildings, initialTroops) {

    const destroyTargets = placedBuildings.filter(function (b) { return b.finalHp <= 0; }).map(function (b) { return b.id; });
    const totalBuildings = placedBuildings.length || 1;

    const liveTroops = initialTroops.map(function (t) { return Object.assign({}, t); });

    let step = 0;
    const totalSteps = Math.max(destroyTargets.length, 1);
    const stepDuration = Math.max(600, Math.floor((BATTLE_DURATION_MS - 1200) / totalSteps));

    const startedAt = Date.now();
    const countdownInterval = setInterval(function () {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, BATTLE_DURATION_MS - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) clearInterval(countdownInterval);
    }, 100);
    timersRef.current.push(countdownInterval);

    function advanceStep() {
      if (step >= destroyTargets.length) {
        const finishTimer = setTimeout(function () { setPhase('done'); }, 600);
        timersRef.current.push(finishTimer);
        return;
      }

      const targetId = destroyTargets[step];
      const target = placedBuildings.find(function (b) { return b.id === targetId; });
      if (!target) {
        step += 1;
        advanceStep();
        return;
      }

      setTroops(function (prev) {
        return prev.map(function (t, i) {
          if (i < 3) {
            return Object.assign({}, t, {
              xPct: target.xPct + (Math.random() - 0.5) * 0.06,
              yPct: target.yPct + 0.05 + (Math.random() - 0.5) * 0.04,
              attacking: false
            });
          }
          return t;
        });
      });

      const arriveTimer = setTimeout(function () {
        setTroops(function (prev) {
          return prev.map(function (t, i) { return i < 3 ? Object.assign({}, t, { attacking: true }) : t; });
        });

        const impactId = 'impact-' + targetId + '-' + step;
        setImpacts(function (prev) { return prev.concat([{ id: impactId, xPct: target.xPct, yPct: target.yPct }]); });
        const clearImpact = setTimeout(function () {
          setImpacts(function (prev) { return prev.filter(function (im) { return im.id !== impactId; }); });
        }, 450);
        timersRef.current.push(clearImpact);

        let hpDrainTicks = 5;
        const drainInterval = setInterval(function () {
          hpDrainTicks -= 1;
          setBuildings(function (prev) {
            return prev.map(function (b) {
              if (b.id !== targetId) return b;
              const next = Math.max(0, b.hp - b.maxHp / 5);
              return Object.assign({}, b, { hp: next, destroyed: next <= 0 });
            });
          });
          if (hpDrainTicks <= 0) {
            clearInterval(drainInterval);
            const destroyedSoFar = step + 1;
            setLiveDestructionPct(Math.round((destroyedSoFar / totalBuildings) * 100));
          }
        }, 110);
        timersRef.current.push(drainInterval);

        step += 1;
        const nextStepTimer = setTimeout(advanceStep, stepDuration - 550);
        timersRef.current.push(nextStepTimer);
      }, 550);
      timersRef.current.push(arriveTimer);
    }

    const kickoff = setTimeout(advanceStep, 500);
    timersRef.current.push(kickoff);
  }

  function resetForNextRaid() {
    clearTimers();
    setBattleResult(null);
    setBuildings([]);
    setTroops([]);
    setImpacts([]);
    setDeployCounts({});
    setPhase('idle');
  }

  const showHud = phase === 'fighting' || phase === 'done';
  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div style={{ padding: '24px', color: colors.textMain }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Raid an enemy village</h2>
      <p style={{ color: colors.textDim, fontSize: '13px', marginBottom: '20px' }}>
        Find a target, choose your troops, then deploy.
      </p>

      {error !== '' ? (
        <div style={{
          backgroundColor: colors.dangerDim,
          border: '1px solid #7a2020',
          color: colors.danger,
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          {error}
        </div>
      ) : null}

      {phase === 'idle' ? (
        <div style={{
          backgroundColor: colors.bgCard,
          border: '1px solid ' + colors.border,
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <button
            onClick={handleFindTarget}
            disabled={troopsLoading === true}
            style={{
              backgroundColor: colors.purple,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: troopsLoading === true ? 'not-allowed' : 'pointer',
              opacity: troopsLoading === true ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <IconCrosshair size={18} color="#fff" />
            {troopsLoading === true ? 'Scouting for a target...' : 'Find target'}
          </button>
        </div>
      ) : null}

      {phase === 'deploy' ? (
        <div style={{
          backgroundColor: colors.bgCard,
          border: '1px solid ' + colors.border,
          borderRadius: '14px',
          padding: '20px',
          maxWidth: '440px'
        }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Plan your attack</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: colors.textDim }}>
            Choose which troops to send. Whatever you deploy will be spent on this raid.
          </p>

          {myTroops.length === 0 ? (
            <div style={{ backgroundColor: colors.bgDark, borderRadius: '8px', padding: '20px', textAlign: 'center', color: colors.textDim, fontSize: '13px' }}>
              You have no trained troops. Train some first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {myTroops.map(function (t) {
                const count = deployCounts[t.name] || 0;
                return (
                  <div key={t.name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: colors.bgDark, borderRadius: '8px', padding: '10px 12px',
                    border: '1px solid ' + colors.border
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <TroopIcon name={t.name} size={20} color={colors.purpleLight} />
                      <div>
                        <div style={{ fontSize: '13px' }}>{t.name}</div>
                        <div style={{ fontSize: '11px', color: colors.textDim }}>Owned: {t.quantity}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={function () { adjustDeploy(t.name, -1, t.quantity); }}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid ' + colors.border, backgroundColor: colors.bgCardRaised, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                      >-</button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', color: colors.purpleLight }}>{count}</span>
                      <button
                        onClick={function () { adjustDeploy(t.name, 1, t.quantity); }}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid ' + colors.border, backgroundColor: colors.bgCardRaised, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={resetForNextRaid}
              style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid ' + colors.border, color: colors.textDim, borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={loading === true || totalToDeploy === 0}
              style={{
                flex: 2,
                backgroundColor: (loading || totalToDeploy === 0) ? '#444466' : colors.purple,
                color: '#fff', border: 'none', borderRadius: '8px', padding: '12px',
                fontWeight: 'bold', cursor: (loading || totalToDeploy === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading === true ? 'Deploying...' : 'Deploy ' + totalToDeploy + ' troop' + (totalToDeploy === 1 ? '' : 's')}
            </button>
          </div>
        </div>
      ) : null}

      {(phase === 'fighting' || phase === 'done') ? (
        <div style={{ maxWidth: FIELD_W + 'px' }}>

          {showHud ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.bgCardRaised,
              border: '1px solid ' + colors.border,
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '10px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                <span style={{
                  display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: phase === 'fighting' ? colors.danger : colors.success
                }} />
                {phase === 'fighting' ? 'Battle in progress' : 'Battle ended'}
              </div>
              <div style={{ color: colors.textDim }}>
                {phase === 'fighting' ? secondsLeft + 's left' : 'Final result'}
              </div>
              <div style={{ fontWeight: 'bold', color: colors.gold }}>
                {phase === 'fighting' ? liveDestructionPct : (battleResult.result ? battleResult.result.destruction : 0)}% destroyed
              </div>
            </div>
          ) : null}

          <div style={{
            position: 'relative',
            width: FIELD_W + 'px',
            height: FIELD_H + 'px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 38%, ' + colors.grass + ' 0%, ' + colors.grassDark + ' 70%)',
            border: '2px solid ' + colors.border,
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35)'
          }}>
            <div style={{
              position: 'absolute', left: '12%', top: '12%', width: '76%', height: '76%',
              border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '50%'
            }} />

            {buildings.length === 0 ? (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '46%', textAlign: 'center',
                color: 'rgba(255,255,255,0.5)', fontSize: '13px'
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
                    left: (b.xPct * FIELD_W - 26) + 'px',
                    top: (b.yPct * FIELD_H - 26) + 'px',
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
                    borderRadius: '8px',
                    backgroundColor: b.destroyed ? '#3a2a1a' : colors.buildingFill,
                    border: '1px solid rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: b.destroyed ? 'none' : '0 2px 6px rgba(0,0,0,0.3)'
                  }}>
                    <BuildingIcon name={b.name} size={24} color={b.destroyed ? '#8a7a5e' : '#fff'} />
                  </div>
                  <div style={{
                    width: '40px', height: '5px', margin: '4px auto 0', borderRadius: '3px',
                    backgroundColor: colors.hpBg, overflow: 'hidden'
                  }}>
                    <div style={{
                      width: (hpPct * 100) + '%', height: '100%',
                      backgroundColor: hpPct > 0.4 ? colors.hpFill : colors.hpFillLow,
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
                  left: (im.xPct * FIELD_W - 16) + 'px',
                  top: (im.yPct * FIELD_H - 16) + 'px',
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
                    left: (t.xPct * FIELD_W - 11) + 'px',
                    top: (t.yPct * FIELD_H - 11) + 'px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'left 0.55s ease-in-out, top 0.55s ease-in-out',
                    transform: t.attacking ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: t.attacking ? '0 0 0 2px ' + colors.danger : 'none',
                    zIndex: 3
                  }}
                >
                  <TroopIcon name={t.kind} size={15} color="#fff" />
                </div>
              );
            })}
          </div>

          {phase === 'done' ? (
            <div style={{
              marginTop: '16px',
              backgroundColor: colors.bgCard,
              border: '1px solid ' + colors.border,
              borderRadius: '14px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 14px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {battleResult.result.outcome === 'win' ? (
                  <React.Fragment>
                    <IconSwords size={18} color={colors.success} /> Victory
                  </React.Fragment>
                ) : 'Attack failed'}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: colors.textDim, fontSize: '12px', margin: '0 0 4px 0' }}>Destruction</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: colors.gold }}>{battleResult.result.destruction}%</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: colors.textDim, fontSize: '12px', margin: '0 0 4px 0' }}>Stars</p>
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                    {[0, 1, 2].map(function (i) {
                      return <IconStar key={i} size={20} filled={i < battleResult.result.stars} />;
                    })}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: colors.bgDark, borderRadius: '8px', padding: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.gold }}>
                  <IconGold size={16} /> +{battleResult.loot.gold.toLocaleString()} gold looted
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.elixir }}>
                  <IconElixir size={16} /> +{battleResult.loot.elixir.toLocaleString()} elixir looted
                </span>
              </div>

              <button
                onClick={function () {
                  resetForNextRaid();
                  if (onRaidComplete) onRaidComplete();
                }}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  backgroundColor: colors.purple,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Attack again
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default Battle;