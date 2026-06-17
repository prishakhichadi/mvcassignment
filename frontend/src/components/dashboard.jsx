import React, { useState, useEffect } from 'react';
import Town from './town';
import TrainTroop from './train_troop';
import Battle from './battle';
import Leaderboard from './leaderboard';
import BattleReplay from './battle_replay';

function Dashboard({ token, onLogout }) {
  const [currentTab, setCurrentTab] = useState('town');
  const [walletGold, setWalletGold] = useState(0);
  const [walletElixir, setWalletElixir] = useState(0);

  function refreshBalances() {
    fetch('http://localhost:8080/town/layout', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) {
      if (res.ok === true) {
        return res.json();
      }
    })
    .then(function(data) {
      if (data) {
        setWalletGold(data.gold || 0);
        setWalletElixir(data.elixir || 0);
      }
    })
    .catch(function(err) {
      console.log('sync err');
    });
  }

  useEffect(function() {
    refreshBalances();
  }, [token]);

  function goToTown() { setCurrentTab('town'); refreshBalances(); }
  function goToTrain() { setCurrentTab('train'); refreshBalances(); }
  function goToBattle() { setCurrentTab('battle'); refreshBalances(); }
  function goToLeaderboard() { setCurrentTab('leaderboard'); }
  function goToReplays() { setCurrentTab('replays'); }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1c2e', color: '#edf2f4', fontFamily: 'sans-serif' }}>
      {/*sidebar*/}
      <div style={{ width: '260px', backgroundColor: '#252740', borderRight: '1px solid #3d3f6b', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e8e8f0', textAlign: 'center', marginBottom: '24px', letterSpacing: '1px' }}>
          VANGUARD
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button onClick={goToTown} style={{ padding: '12px', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', backgroundColor: currentTab === 'town' ? '#3d3f6b' : 'transparent', color: currentTab === 'town' ? 'white' : '#8888aa' }}>
            TOWN GRID
          </button>
          <button onClick={goToTrain} style={{ padding: '12px', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', backgroundColor: currentTab === 'train' ? '#3d3f6b' : 'transparent', color: currentTab === 'train' ? 'white' : '#8888aa' }}>
            TRAIN TROOPS
          </button>
          <button onClick={goToBattle} style={{ padding: '12px', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', backgroundColor: currentTab === 'battle' ? '#3d3f6b' : 'transparent', color: currentTab === 'battle' ? 'white' : '#8888aa' }}>
            BATTLE
          </button>
          <button onClick={goToLeaderboard} style={{ padding: '12px', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', backgroundColor: currentTab === 'leaderboard' ? '#3d3f6b' : 'transparent', color: currentTab === 'leaderboard' ? 'white' : '#8888aa' }}>
            LEADERBOARD
          </button>
          <button onClick={goToReplays} style={{ padding: '12px', border: 'none', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', backgroundColor: currentTab === 'replays' ? '#3d3f6b' : 'transparent', color: currentTab === 'replays' ? 'white' : '#8888aa' }}>
            BATTLE REPLAYS
          </button>
        </div>

        <button onClick={onLogout} style={{ padding: '12px', border: '1px solid #ff4d6d', backgroundColor: 'transparent', color: '#ff4d6d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          EXIT
        </button>
      </div>

      {/*main pane*/}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1a1c2e' }}>
        {currentTab === 'town' ? <Town token={token} gold={walletGold} elixir={walletElixir} onPlacementSuccess={refreshBalances} /> : null}
        {currentTab === 'train' ? <TrainTroop token={token} elixir={walletElixir} onTrainingComplete={refreshBalances} /> : null}
        {currentTab === 'battle' ? <Battle token={token} onRaidComplete={refreshBalances} /> : null}
        {currentTab === 'leaderboard' ? <Leaderboard token={token} /> : null}
        {currentTab === 'replays' ? <BattleReplay token={token} /> : null}
      </div>
    </div>
  );
}

export default Dashboard;