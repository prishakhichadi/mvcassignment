import React, { useState, useEffect } from 'react';
import { tokens, Callout } from './ui';
import { IconGold, IconElixir, IconHouse, IconSwords, IconScroll, IconTrophy } from './theme';
import Town from './town';
import TrainTroop from './train_troop';
import Battle from './battle';
import BattleReplay from './battle_replay';
import Leaderboard from './leaderboard';

const NAV_ITEMS = [
  { key: 'town', label: 'Town Grid', icon: IconHouse },
  { key: 'barracks', label: 'Train Troops', icon: IconSwords },
  { key: 'battle', label: 'Battles', icon: IconSwords },
  { key: 'replays', label: 'Battle Replays', icon: IconScroll },
  { key: 'leaderboard', label: 'Leaderboard', icon: IconTrophy },
];

function NavButton({ label, Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        padding: '11px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: tokens.radiusMd,
        border: 'none',
        borderLeft: '3px solid ' + (active ? tokens.brass : 'transparent'),
        backgroundColor: active ? tokens.panelRaised : 'transparent',
        color: active ? tokens.text : tokens.textDim,
        fontFamily: tokens.fontBody,
        fontWeight: 600,
        fontSize: '13.5px',
        transition: 'background-color 0.15s ease, color 0.15s ease',
      }}
    >
      <Icon size={16} color={active ? tokens.brass : tokens.textFaint} />
      {label}
    </button>
  );
}

function Dashboard({ token, onLogout }) {
  const [currentTab, setCurrentTab] = useState('town');
  const [gold, setGold] = useState(0);
  const [elixir, setElixir] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function fetchProfileBalances() {
    fetch('http://localhost:8080/player/profile', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (res) {
        if (res.ok === false) {
          throw new Error('Could not load your profile.');
        }
        return res.json();
      })
      .then(function (data) {
        let goldVal = 0;
        let elixirVal = 0;

        if (data && data.resources) {
          goldVal = data.resources.gold;
          elixirVal = data.resources.elixir;
        } else if (data && data.player && data.player.resources) {
          goldVal = data.player.resources.gold;
          elixirVal = data.player.resources.elixir;
        } else {
          const flatSource = data.player || data.profile || data;
          goldVal = flatSource.gold != null ? flatSource.gold : 0;
          elixirVal = flatSource.elixir != null ? flatSource.elixir : 0;
        }

        setGold(Number(goldVal) || 0);
        setElixir(Number(elixirVal) || 0);
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(function () {
    fetchProfileBalances();
  }, [token]);

  function handleResourceMutation() {
    fetchProfileBalances();
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: tokens.ink, color: tokens.text, fontFamily: tokens.fontBody }}>

      {/* ---------- sidebar ---------- */}
      <div style={{
        width: '248px',
        flexShrink: 0,
        backgroundColor: tokens.panel,
        borderRight: '1px solid ' + tokens.line,
        padding: '22px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 6px' }}>
          <IconSwords size={20} color={tokens.brass} />
          <h1 style={{ fontFamily: tokens.fontDisplay, fontSize: '18px', color: tokens.text, letterSpacing: '0.06em' }}>
            Vanguard
          </h1>
        </div>

        {/* resource ledger */}
        <div style={{
          backgroundColor: tokens.panelSunken,
          borderRadius: tokens.radiusLg,
          border: '1px solid ' + tokens.line,
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <IconGold size={17} />
            <div>
              <div style={{ fontSize: '10px', color: tokens.textFaint, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gold</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: tokens.brass }}>{gold.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px dashed ' + tokens.line, paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '9px' }}>
            <IconElixir size={17} />
            <div>
              <div style={{ fontSize: '10px', color: tokens.textFaint, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Elixir</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: tokens.berry }}>{elixir.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(function (item) {
            return (
              <NavButton
                key={item.key}
                label={item.label}
                Icon={item.icon}
                active={currentTab === item.key}
                onClick={function () { setCurrentTab(item.key); }}
              />
            );
          })}
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: '10px', backgroundColor: 'transparent', border: '1px solid ' + tokens.rust,
            color: tokens.rust, cursor: 'pointer', fontWeight: 700, fontSize: '13px',
            borderRadius: tokens.radiusMd, fontFamily: tokens.fontBody,
          }}
        >
          Exit village
        </button>
      </div>

      {/* ---------- main content ---------- */}
      <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
        {error !== '' && <Callout tone="rust">{error}</Callout>}

        {loading === true ? (
          <div style={{ fontSize: '13px', color: tokens.brass, fontWeight: 700 }}>Loading your village…</div>
        ) : (
          <div>
            {currentTab === 'town' && (
              <Town token={token} gold={gold} elixir={elixir} onPlacementSuccess={handleResourceMutation} />
            )}
            {currentTab === 'barracks' && (
              <TrainTroop token={token} elixir={elixir} onTrainingComplete={handleResourceMutation} />
            )}
            {currentTab === 'battle' && (
              <Battle token={token} onRaidComplete={handleResourceMutation} />
            )}
            {currentTab === 'replays' && (
              <BattleReplay token={token} />
            )}
            {currentTab === 'leaderboard' && (
              <Leaderboard token={token} />
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;
