import React, { useState } from 'react';
import { tokens, Card, Button, Field, TextInput, Callout } from './ui';
import forestBg from '../assets/forest.jpeg';
// Removed troop and portrait imports as they are no longer needed here.

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

    let endpoint = isLogin ? '/login' : '/register';

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
          setIsLogin(true);
          setPassword('');
          setError('');
        }
        setLoading(false);
      })
      .catch(function (err) {
        setError(err.message);
        setLoading(false);
      });
  }

  function toggleAuthMode() {
    setIsLogin(!isLogin);
    setError('');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.ink, // Fallback color
      fontFamily: tokens.fontBody,
      position: 'relative', // Context for absolute background
      padding: '32px',
    }}>

      {/* ---- 1. Full Screen Background Layer ---- */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0, // Keeps it behind content
        overflow: 'hidden'
      }}>
        <img
          src={forestBg}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* The overlay gradient, deepened for better form readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(16,18,12,0.4) 0%, rgba(16,18,12,0.7) 50%, rgba(16,18,12,0.9) 100%)',
        }} />
      </div>

      {/* ---- 2. Content Layer (Form) ---- */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        position: 'relative', // Required for z-index to work
        zIndex: 1, // Layers above background
      }}>

        {/* Logo and Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: tokens.radiusMd,
            backgroundColor: tokens.brassSoft, border: '1px solid ' + tokens.brassDim,
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', // Added shadow to pop
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M3 21 11 13M21 3l-8 8" stroke={tokens.brass} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M3 3l4 1 1 4-2 2-4-1Z" fill={tokens.brass} />
              <path d="M21 21l-4-1-1-4 2-2 4 1Z" fill={tokens.brass} />
            </svg>
          </div>
          <h1 style={{
            fontFamily: tokens.fontDisplay,
            fontSize: '28px', // Slightly larger
            color: tokens.text,
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)' // Added shadow
          }}>
            Vanguard
          </h1>
          <p style={{
            color: '#f1ead2', // Brighter color against dark background
            fontSize: '14px',
            marginTop: '8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)' // Added shadow
          }}>
            {isLogin ? 'Sign in to command your village' : 'Found a new village'}
          </p>
        </div>

        {/* Form Card */}
        <Card style={{
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)', // Deepened shadow
          backdropFilter: 'blur(4px)', // Optional: slight blur effect on the card
        }}>
          {error !== '' ? <Callout tone="rust" style={{ marginBottom: '16px' }}>{error}</Callout> : null}

          <form onSubmit={handleSubmit}>
            <Field label="Username">
              <TextInput
                type="text"
                value={username}
                onChange={function (e) { setUsername(e.target.value); }}
                required
                placeholder="Enter your username"
              />
            </Field>

            <Field label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={function (e) { setPassword(e.target.value); }}
                required
                placeholder="Enter your password"
              />
            </Field>

            <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ marginTop: '12px' }}>
              {loading === true ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </Card>

        {/* Toggle link */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: '#f1ead2', // Brighter color against dark background
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}>
          {isLogin ? "Don't have a village yet? " : 'Already have a village? '}
          <span
            onClick={toggleAuthMode}
            style={{ color: tokens.brass, cursor: 'pointer', fontWeight: 700 }}
          >
            {isLogin ? 'Register' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;