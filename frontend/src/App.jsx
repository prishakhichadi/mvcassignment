import React, { useState } from 'react';
import Auth from './components/auth';
import Dashboard from './components/dashboard';
import { tokens } from './components/ui';

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
    <div className="app-root-frame" style={{ minHeight: '100vh', backgroundColor: tokens.ink }}>
      {!session ? (
        <Auth onAuthSuccess={saveSession} />
      ) : (
        <Dashboard token={session} onLogout={clearSession} />
      )}
    </div>
  );
}

export default App;
