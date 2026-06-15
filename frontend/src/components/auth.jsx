import React, { useState } from 'react';

function Auth({ onAuthSuccess }) {
  const [showLogin, setShowLogin] = useState(true);
  const [userTxt, setUserTxt] = useState('');
  const [passTxt, setPassTxt] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setStatusMsg('');

    const apiPath = showLogin ? '/player/login' : '/player/register';
    
    try {
      const res = await fetch(`http://localhost:8080${apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userTxt, password: passTxt }),
      });

      if (!res.ok) {
        const fallbackErr = await res.text();
        throw new Error(fallbackErr || 'Server rejected credentials');
      }

      const payload = await res.json();

      if (showLogin) {
        if (payload.token) {
          onAuthSuccess(payload.token);
        } else {
          throw new Error('No auth token sent back by server');
        }
      } else {
        alert('Campsite profile registered! Switch over to log in.');
        setShowLogin(true);
        setPassTxt('');
      }
    } catch (error) {
      setStatusMsg(error.message);
    }
  };

  return (
    <div className="auth-container" style={{
      maxWidth: '380px',
      margin: '80px auto',
      padding: '25px',
      backgroundColor: '#2b2d42', // Weathered Slate Wall Grey
      border: '2px solid #00b4d8', // Vivid Sky-Blue Neon Border
      borderRadius: '6px',
      textAlign: 'center',
      boxShadow: '0 8px 16px rgba(0,0,0,0.4)'
    }}>
      <h2 style={{ color: '#edf2f4', letterSpacing: '2px', fontSize: '20px' }}>
        {showLogin ? '⚔️ STRONGHOLD: ACCESS' : '🛡️ STRONGHOLD: ENLIST'}
      </h2>
      
      {statusMsg && (
        <p style={{ color: '#ef233c', fontSize: '13px', backgroundColor: '#1d1e2c', padding: '8px', borderRadius: '4px' }}>
          ⚠️ Notice: {statusMsg}
        </p>
      )}

      <form onSubmit={handleFormSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="Chieftain Name"
            className="auth-input"
            value={userTxt}
            onChange={(e) => setUserTxt(e.target.value)}
            required
            style={{ 
              padding: '10px', 
              width: '85%', 
              backgroundColor: '#1d1e2c', 
              border: '1px solid #4a4e69', 
              color: '#edf2f4',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ marginBottom: '18px' }}>
          <input
            type="password"
            placeholder="Secret Passphrase"
            className="auth-input"
            value={passTxt}
            onChange={(e) => setPassTxt(e.target.value)}
            required
            style={{ 
              padding: '10px', 
              width: '85%', 
              backgroundColor: '#1d1e2c', 
              border: '1px solid #4a4e69', 
              color: '#edf2f4',
              borderRadius: '4px'
            }}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            backgroundColor: '#7209b7', // Deep Royal Purple Call-to-Action
            color: '#fff', 
            padding: '12px', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 'bold',
            borderRadius: '4px',
            width: '92%',
            boxShadow: '0 4px #3f076b',
            letterSpacing: '1px'
          }}
        >
          {showLogin ? 'BREACH GATEWAY' : 'INITIALIZE WALLS'}
        </button>
      </form>

      <div 
        onClick={() => {
          setShowLogin(!showLogin);
          setStatusMsg('');
        }} 
        style={{ color: '#00b4d8', cursor: 'pointer', marginTop: '22px', fontSize: '13px', fontWeight: '500' }}
      >
        {showLogin ? "Claim a new territorial outpost" : "Return to fortress gates"}
      </div>
    </div>
  );
}

export default Auth;