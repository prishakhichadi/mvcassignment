import React, { useState } from 'react';
import TownGrid from './towngrid';
import Barracks from './barracks';
import RaidCampaign from './raidcampaign';

function Dashboard({ token, onLogout }) {
  // menu switch tab: 'town', 'barracks', or 'attack'
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
    <div className="game-layout" style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1c2e' }}>
      
      {/* Sidebar controls */}
      <div className="sidebar" style={{
        width: '260px', 
        backgroundColor: '#252740', 
        padding: '32px 20px',
        borderRight: '1px solid #3d3f6b', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
      }}>
        <div>
          <h3 style={{ color: '#e8e8f0', textAlign: 'center', margin: '0 0 4px 0', fontSize: '18px', letterSpacing: '0.5px' }}>
            Vanguard
          </h3>
          
          <button 
            onClick={switchToTown}
            style={{
              display: 'block', 
              width: '100%', 
              padding: '12px', 
              margin: '10px 0',
              backgroundColor: currentTab === 'town' ? '#5b4fcf' : '#1a1c2e',
              color: '#fff', 
              border: currentTab === 'town' ? 'none' : '1px solid #3d3f6b', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '0.5px'
            }}
          >
            TOWN LAYOUT
          </button>

          <button 
            onClick={switchToBarracks}
            style={{
              display: 'block', 
              width: '100%', 
              padding: '12px', 
              margin: '10px 0',
              backgroundColor: currentTab === 'barracks' ? '#5b4fcf' : '#1a1c2e',
              color: '#fff', 
              border: currentTab === 'barracks' ? 'none' : '1px solid #3d3f6b', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '0.5px'
            }}
          >
            TRAIN FORCES
          </button>

          <button 
            onClick={switchToAttack}
            style={{
              display: 'block', 
              width: '100%', 
              padding: '12px', 
              margin: '10px 0',
              backgroundColor: currentTab === 'attack' ? '#5b4fcf' : '#1a1c2e',
              color: '#fff', 
              border: currentTab === 'attack' ? 'none' : '1px solid #3d3f6b', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '0.5px'
            }}
          >
            RAID CAMPAIGN
          </button>
        </div>

        <button 
          onClick={onLogout} 
          style={{
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#3d1a1a',
            color: '#ff8888', 
            border: '1px solid #7a2020', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '13px',
            letterSpacing: '0.5px'
          }}
        >
          DISCONNECT SESSION
        </button>
      </div>

      {/* Main viewport displays */}
      <div className="main-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {currentTab === 'town' ? (
          <div>
            <h2 style={{ color: '#e8e8f0', margin: '0 0 4px 0', fontSize: '22px' }}>Town Metrics & Grid Sector</h2>
            <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '28px' }}>Inspect and organize your active village structures.</p>
            <TownGrid userToken={token} />
          </div>
        ) : null}

        {currentTab === 'barracks' ? (
          <div>
            <h2 style={{ color: '#e8e8f0', margin: '0 0 4px 0', fontSize: '22px', textAlign: 'center' }}>Army Training Grounds</h2>
            <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '28px', textAlign: 'center' }}>Manage and recruit defensive forces.</p>
            <Barracks userToken={token} />
          </div>
        ) : null}

        {currentTab === 'attack' ? (
          <div>
            <h2 style={{ color: '#e8e8f0', margin: '0 0 4px 0', fontSize: '22px', textAlign: 'center' }}>Combat Simulation Center</h2>
            <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '28px', textAlign: 'center' }}>Deploy troops to raid foreign targets.</p>
            <RaidCampaign userToken={token} />
          </div>
        ) : null}

      </div>
    </div>
  );
}

export default Dashboard;