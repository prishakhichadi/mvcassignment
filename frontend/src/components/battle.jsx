import React, { useState, useEffect, useRef } from 'react';
import { colors, BuildingIcon, TroopIcon, TROOP_DEFS, IconGold, IconElixir, IconStar, IconCrosshair, IconSwords } from './theme';

const FIELD_W = 560;
const FIELD_H = 560;
const BATTLE_DURATION_MS = 9000; // how long the whole attack plays out

function Battle({ token, onRaidComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [battleResult, setBattleResult] = useState(null);

  // live battlefield state
  const [phase, setPhase] = useState('idle'); // idle | fighting | done
  const [buildings, setBuildings] = useState([]); // [{id, name, x, y, maxHp, hp, destroyed}]
  const [troops, setTroops] = useState([]); // [{id, kind, x, y, targetId, attacking}]
  const [timeLeftMs, setTimeLeftMs] = useState(BATTLE_DURATION_MS);
  const [liveDestructionPct, setLiveDestructionPct] = useState(0);
  const [impacts, setImpacts] = useState([]); // brief hit-flash markers [{id,x,y}]

  const timersRef = useRef([]);

  function clearTimers() {
    timersRef.current.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timersRef.current = [];
  }

  useEffect(function () {
    return function () { clearTimers(); };
  }, []);

  function handleLaunchRaid(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBattleResult(null);
    setPhase('idle');
    clearTimers();

    fetch('http://localhost:8080/troop/attack', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) {
          throw new Error(text || 'Battle failed');
        });
      }
      return res.json();
    })
    .then(function(data) {
      setLoading(false);
      setBattleResult(data);
      setupBattlefield(data);
    })
    .catch(function(err) {
      setLoading(false);
      setError(err.message);
    });
  }

  function setupBattlefield(data) {
    const rawBuildings = (data.enemy_buildings || []);
    const destructionPct = data.result ? (data.result.destruction || 0) : 0;


    const placed = rawBuildings.map(function (b, idx) {
      const hp = 150 + (idx % 5) * 60;

      const angle = (idx / Math.max(rawBuildings.length, 1)) * Math.PI * 2;
      const radius = 0.22 + ((idx * 37) % 100) / 100 * 0.28;
      const cx = 0.5 + Math.cos(angle) * radius;
      const cy = 0.5 + Math.sin(angle) * radius * 0.85;
      return {
        id: b.x + '-' + b.y + '-' + idx,
        name: b.name,
        xPct: Math.min(0.92, Math.max(0.08, cx)),
        yPct: Math.min(0.92, Math.max(0.08, cy)),
        maxHp: hp,
        hp: hp,
        destroyed: false
      };
    });

    const numToDestroy = Math.round((destructionPct / 100) * placed.length);
    //pick which buildings will end up destroyed by the time the battle ends
    const shuffled = placed.slice().sort(function () { return Math.random() - 0.5; });
    const destroyTargets = shuffled.slice(0, numToDestroy).map(function (b) { return b.id; });

    setBuildings(placed);
    setTimeLeftMs(BATTLE_DURATION_MS);
    setLiveDestructionPct(0);
    setImpacts([]);
    setPhase('fighting');

    //spawn troops
    const spawnCount = Math.min(6, Math.max(3, placed.length));
    const troopTypes = TROOP_DEFS.map(function (d) { return d.key; });
    const initialTroops = [];
    for (let i = 0; i < spawnCount; i++) {
      initialTroops.push({
        id: 'troop-' + i,
        kind: troopTypes[i % troopTypes.length],
        xPct: 0.15 + (i / spawnCount) * 0.7,
        yPct: 0.96,
        targetIdx: null,
        attacking: false
      });
    }
    setTroops(initialTroops);

    runFightSequence(placed, destroyTargets, initialTroops);
  }

  function runFightSequence(placedBuildings, destroyTargetIds, initialTroops) {
    const totalBuildings = placedBuildings.length || 1;
    const destroySet = destroyTargetIds.slice();

    
    const liveBuildings = placedBuildings.map(function (b) { return Object.assign({}, b); });
    const liveTroops = initialTroops.map(function (t) { return Object.assign({}, t); });

    let step = 0;
    const totalSteps = Math.max(destroySet.length, 1);
    const stepDuration = Math.max(700, Math.floor((BATTLE_DURATION_MS - 1200) / totalSteps));

    //countdown timer ticking every 100ms
    const startedAt = Date.now();
    const countdownInterval = setInterval(function () {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, BATTLE_DURATION_MS - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) clearInterval(countdownInterval);
    }, 100);
    timersRef.current.push(countdownInterval);

    function advanceStep() {
      if (step >= destroySet.length) {
        // wrap up
        const finishTimer = setTimeout(function () {
          setPhase('done');
        }, 600);
        timersRef.current.push(finishTimer);
        return;
      }

      const targetId = destroySet[step];
      const targetIdx = liveBuildings.findIndex(function (b) { return b.id === targetId; });
      const target = liveBuildings[targetIdx];
      if (!target) {
        step += 1;
        advanceStep();
        return;
      }

      //move troops toward this building
      const movers = liveTroops.filter(function (_, i) { return i % totalSteps === step % liveTroops.length || true; }).slice(0, 3);

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

      //after they arrive, mark attacking + drain hp + show impact flashes
      const arriveTimer = setTimeout(function () {
        setTroops(function (prev) {
          return prev.map(function (t, i) { return i < 3 ? Object.assign({}, t, { attacking: true }) : t; });
        });

        const impactId = 'impact-' + targetId + '-' + step;
        setImpacts(function (prev) {
          return prev.concat([{ id: impactId, xPct: target.xPct, yPct: target.yPct }]);
        });
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
            const destroyedCountSoFar = step + 1;
            setLiveDestructionPct(Math.round((destroyedCountSoFar / totalBuildings) * 100 * (totalSteps / totalBuildings >= 1 ? 1 : (destroySet.length / totalBuildings) / (destroyedCountSoFar / totalBuildings))));

            setLiveDestructionPct(Math.round(((step + 1) / totalSteps) * (battleResultDestruction())));
          }
        }, 110);
        timersRef.current.push(drainInterval);

        step += 1;
        const nextStepTimer = setTimeout(advanceStep, stepDuration - 550);
        timersRef.current.push(nextStepTimer);
      }, 550);
      timersRef.current.push(arriveTimer);
    }

    function battleResultDestruction() {
      return battleResult && battleResult.result ? battleResult.result.destruction : 0;
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
    setPhase('idle');
  }

  const showHud = phase === 'fighting' || phase === 'done';
  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div style={{ padding: '24px', color: colors.textMain }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Attack an enemy town</h2>
      <p style={{ color: colors.textDim, fontSize: '13px', marginBottom: '20px' }}>
        Send your troops to attack a random opponent and loot their resources.
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

      {!battleResult ? (
        <div style={{
          backgroundColor: colors.bgCard,
          border: '1px solid ' + colors.border,
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <button
            onClick={handleLaunchRaid}
            disabled={loading === true}
            style={{
              backgroundColor: colors.purple,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: loading === true ? 'not-allowed' : 'pointer',
              opacity: loading === true ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <IconCrosshair size={18} color="#fff" />
            {loading === true ? 'Searching for a target...' : 'Find target & attack'}
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: FIELD_W + 'px' }}>

          {/* HUD */}
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

          {/* battlefield */}
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
            {/* subtle path ring just for visual texture */}
            <div style={{
              position: 'absolute', left: '12%', top: '12%', width: '76%', height: '76%',
              border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '50%'
            }} />

            {/* buildings */}
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

            {/* impact flashes */}
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
                    background: 'radial-gradient(circle, rgba(255,210,120,0.95) 0%, rgba(255,140,60,0.5) 45%, transparent 75%)',
                    animation: 'none'
                  }} />
                </div>
              );
            })}

            {/* troops */}
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

          {/* battle summary, shown after the sequence finishes */}
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
                    {[0, 1, 2, 3, 4].map(function (i) {
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
      )}
    </div>
  );
}

export default Battle;