import React, { useState } from 'react';

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let endpoint = '/register';
    if (isLogin === true) {
      endpoint = '/login';
    }

    fetch('http://localhost:8080' + endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        username: username, 
        password: password 
      })
    })
    .then(function (res) {
      if (res.ok === false) {
        return res.text().then(function (errorTxt) {
          throw new Error(errorTxt || 'Something went wrong');
        });
      }
      return res.text(); 
    })
    .then(function (textData) {
      if (isLogin === true) {
        let parsedData = JSON.parse(textData);
        onAuthSuccess(parsedData.token);
      } else {
        alert('Account created! You can now log in.');
        setIsLogin(true);
        setPassword('');
      }
      setLoading(false);
    })
    .catch(function (err) {
      setError(err.message);
      setLoading(false);
    });
  } 

  function toggleAuthMode() {
    if (isLogin === true) {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
    setError('');
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1c2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '360px',
        backgroundColor: '#252740',
        border: '1px solid #3d3f6b',
        borderRadius: '8px',
        padding: '32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ color: '#e8e8f0', textAlign: 'center', fontSize: '22px', marginBottom: '4px' }}>
          ⚔️ Vanguard
        </h1>
        <p style={{ color: '#8888aa', textAlign: 'center', fontSize: '13px', marginBottom: '28px' }}>
          {isLogin ? 'Sign in to your village' : 'Create a new village'}
        </p>

        {error !== '' ? (
          <div style={{
            backgroundColor: '#3d1a1a',
            border: '1px solid #7a2020',
            color: '#ff8888',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', color: '#aaaacc', fontSize: '13px', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={function (e) { setUsername(e.target.value); }}
              required
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1c2e',
                border: '1px solid #3d3f6b',
                borderRadius: '4px',
                color: '#e8e8f0',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', color: '#aaaacc', fontSize: '13px', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={function (e) { setPassword(e.target.value); }}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1c2e',
                border: '1px solid #3d3f6b',
                borderRadius: '4px',
                color: '#e8e8f0',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#444466' : '#5b4fcf',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {loading === true ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#8888aa' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={toggleAuthMode}
            style={{ color: '#7b6fdc', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Register' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;