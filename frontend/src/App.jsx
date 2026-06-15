import React, { useState } from 'react';
import Auth from './components/auth'; 

function App() {
  const [session, setSession] = useState(localStorage.getItem('vanguard_token') || '');

  const saveSession = (jwt) => {
    localStorage.setItem('vanguard_token', jwt);
    setSession(jwt);
  };

  const clearSession = () => {
    localStorage.removeItem('vanguard_token');
    setSession('');
  };

  return (
    <div className="app-root-frame" style={{ minHeight: '100vh', backgroundColor: '#1b1f18' }}>
      {!session ? (
        <Auth onAuthSuccess={saveSession} />
      ) : (
        <div style={{ textAlign: 'center', paddingTop: '120px' }}>
          <h2 style={{ color: '#f4f6f0' }}>⚔️ CAMPSITE ACCESS GRANTED ⚔️</h2>
          <p style={{ color: '#d4a373' }}>Session profile is authenticated and active!</p>
          
          <button 
            onClick={clearSession}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#ae2012', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 'bold',
              borderRadius: '4px',
              marginTop: '15px'
            }}
          >
            LEAVE OUTPOST
          </button>
        </div>
      )}
    </div>
  );
}

export default App;