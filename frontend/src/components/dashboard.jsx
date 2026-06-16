import React, { useState } from 'react';
import TownGrid from './towngrid';

function Dashboard({ token, onLogout }) {
  //menu switch tab: 'town', 'barracks', or 'attack'
  const [currentTab, setCurrentTab] = useState('town');

  function switchToTown() {
    setCurrentTab('town');
  }

  function switchToBarracks() {
    setCurrentTab('barracks');
  }

  function switchToAttack() {
    setCurrentTab('attack');
  }

  return (
    <div className="game-layout" style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1d1a' }}>
      
      {/* Sidebar controls */}
      <div className="sidebar" style={{
        width: '240px', backgroundColor: '#2b2d42', padding: '20px',
        borderRight: '3px solid #00b4d8', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ color: '#edf2f4', textAlign: 'center', margin: '10px 0 25px 0', letterSpacing: '1px' }}>
            TOWN HQ CONTROL
          </h3>
          
          <button 
            onClick={switchToTown}
            style={{
              display: 'block', width: '100%', padding: '12px', margin: '10px 0',
              backgroundColor: currentTab === 'town' ? '#7209b7' : '#1d1e2c',
              color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            TOWN LAYOUT
          </button>

          <button 
            onClick={switchToBarracks}
            style={{
              display: 'block', width: '100%', padding: '12px', margin: '10px 0',
              backgroundColor: currentTab === 'barracks' ? '#7209b7' : '#1d1e2c',
              color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            TRAIN FORCES
          </button>

          <button 
            onClick={switchToAttack}
            style={{
              display: 'block', width: '100%', padding: '12px', margin: '10px 0',
              backgroundColor: currentTab === 'attack' ? '#7209b7' : '#1d1e2c',
              color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            RAID CAMPAIGN
          </button>
        </div>

        <button 
          onClick={onLogout} 
          style={{
            width: '100%', padding: '10px', backgroundColor: '#ef233c',
            color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          DISCONNECT SESSION
        </button>
      </div>

      {/* Main viewport displays */}
      <div className="main-content" style={{ flex: 1, padding: '30px', overflowY: 'auto', color: '#edf2f4' }}>
        
        {}
        {currentTab === 'town' ? (
          <div>
            <h2>TOWN METRICS & GRID SECTOR</h2>
            <p style={{ color: '#00b4d8' }}>Inspect your active structures below.</p>
            <TownGrid userToken={token} />
          </div>
        ) : null}

        {currentTab === 'barracks' ? (
          <div>
            <h2>ARMY BARRACKS</h2>
            <p style={{ color: '#00b4d8' }}>Recruit reinforcements using your local elixir reserves.</p>
            <div style={{ padding: '20px', background: '#2b2d42', borderRadius: '6px' }}>
              <p>[ Troop Recruitment Controls Placeholder ]</p>
            </div>
          </div>
        ) : null}

        {currentTab === 'attack' ? (
          <div>
            <h2>COMBAT SIMULATION ENGAGEMENT</h2>
            <p style={{ color: '#ef233c' }}>Deploy your standing army to execute dynamic matchmaking sweeps.</p>
            <div style={{ padding: '20px', background: '#2b2d42', borderRadius: '6px' }}>
              <p>[ Live Target Matchmaking Framework Placeholder ]</p>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}

export default Dashboard;