import React, { useState, useEffect } from 'react';
import { colors } from './theme';
import Town from './town';
import TrainTroop from './train_troop';
import Battle from './battle';
import BattleReplay from './battle_replay'; 
import Leaderboard from './leaderboard';  

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
    .then(function(res) {
      if (res.ok === false) {
        throw new Error('Could not establish terminal contact with database vault rows.');
      }
      return res.json();
    })
    .then(function(data) {
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
    .catch(function(err) {
      setError(err.message);
      setLoading(false);
    });
  }

  useEffect(function() {
    fetchProfileBalances();
  }, [token]);


  function handleResourceMutation() {
    fetchProfileBalances();
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bgDark, color: colors.textMain, fontFamily: 'monospace' }}>
      
      {}
      <div style={{ width: '240px', backgroundColor: colors.bgCard, borderRight: '1px solid ' + colors.border, padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase' }}>VANGUARD</h1>
        </div>

        {}
        <div style={{ backgroundColor: colors.bgDark, padding: '12px', border: '1px solid ' + colors.border, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '10px', color: colors.gold, fontWeight: 'bold', letterSpacing: '0.5px' }}>GOLD</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.gold }}>{gold.toLocaleString()}</div>
          </div>
          <div style={{ borderTop: '1px dashed ' + colors.border, paddingTop: '6px' }}>
            <div style={{ fontSize: '10px', color: colors.elixir, fontWeight: 'bold', letterSpacing: '0.5px' }}>ELIXIR</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.elixir }}>{elixir.toLocaleString()}</div>
          </div>
        </div>

        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button
            onClick={function() { setCurrentTab('town'); }}
            style={{
              padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', border: '1px solid ' + (currentTab === 'town' ? colors.purpleLight : colors.border),
              backgroundColor: currentTab === 'town' ? colors.bgCardRaised : 'transparent', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace'
            }}
          >
            Town Grid
          </button>
          <button
            onClick={function() { setCurrentTab('barracks'); }}
            style={{
              padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', border: '1px solid ' + (currentTab === 'barracks' ? colors.purpleLight : colors.border),
              backgroundColor: currentTab === 'barracks' ? colors.bgCardRaised : 'transparent', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace'
            }}
          >
            Train Troops
          </button>
          <button
            onClick={function() { setCurrentTab('battle'); }}
            style={{
              padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', border: '1px solid ' + (currentTab === 'battle' ? colors.danger : colors.border),
              backgroundColor: currentTab === 'battle' ? colors.dangerDim : 'transparent', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace'
            }}
          >
            Battles
          </button>
          <button
            onClick={function() { setCurrentTab('replays'); }}
            style={{
              padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', border: '1px solid ' + (currentTab === 'replays' ? colors.purpleLight : colors.border),
              backgroundColor: currentTab === 'replays' ? colors.bgCardRaised : 'transparent', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace'
            }}
          >
            Battle Replay Logs
          </button>
          <button
            onClick={function() { setCurrentTab('leaderboard'); }}
            style={{
              padding: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', border: '1px solid ' + (currentTab === 'leaderboard' ? colors.gold : colors.border),
              backgroundColor: currentTab === 'leaderboard' ? colors.goldDim : 'transparent', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace'
            }}
          >
            Leaderboard
          </button>
        </div>

        <button
          onClick={onLogout}
          style={{ padding: '10px', backgroundColor: 'transparent', border: '1px solid ' + colors.danger, color: colors.danger, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' }}
        >
          Exit
        </button>
      </div>

      {}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {error !== '' && (
          <div style={{ backgroundColor: colors.dangerDim, color: colors.danger, padding: '12px', marginBottom: '16px', border: '1px solid ' + colors.danger }}>
            ERROR: {error}
          </div>
        )}

        {loading === true ? (
          <div style={{ fontSize: '13px', color: colors.gold, fontWeight: 'bold' }}>SYNCING...</div>
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