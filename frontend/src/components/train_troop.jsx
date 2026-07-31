import React, { useState, useEffect } from 'react';
import { colors, TroopIcon, TROOP_DEFS, IconElixir } from './theme';


function normalizeTroopList(data) {
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && Array.isArray(data.troops)) {
    list = data.troops;
  } else if (data && Array.isArray(data.army)) {
    list = data.army;
  } else if (data && Array.isArray(data.units)) {
    list = data.units;
  }

  return list
    .map(function (t) {
      const name = t.name || t.troop_name || t.type || t.troop_type || '';
      const quantity = t.quantity != null ? t.quantity
        : t.count != null ? t.count
        : t.qty != null ? t.qty
        : 0;
      return { name: name, quantity: Number(quantity) || 0 };
    })
    .filter(function (t) { return t.name !== ''; });
}

function TrainTroop({ token, elixir, onTrainingComplete }) {
  const [troopName, setTroopName] = useState(TROOP_DEFS[0].key);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [myTroops, setMyTroops] = useState([]);
  const [troopsLoading, setTroopsLoading] = useState(true);
  const [troopsLoadError, setTroopsLoadError] = useState('');
  const [rawDebug, setRawDebug] = useState(null);

  const troopCosts = {};
  TROOP_DEFS.forEach(function (d) { troopCosts[d.key] = d.cost; });

  function loadMyTroops() {
    setTroopsLoading(true);
    setTroopsLoadError('');
    fetch('http://localhost:8080/troop/list', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) {
      if (res.ok === false) {
        throw new Error('Could not load your troops (status ' + res.status + ')');
      }
      return res.json();
    })
    .then(function(data) {
      setRawDebug(data);
      setMyTroops(normalizeTroopList(data));
      setTroopsLoading(false);
    })
    .catch(function(err) {
      setTroopsLoadError(err.message);
      setTroopsLoading(false);
    });
  }

  useEffect(function() {
    loadMyTroops();
  }, [token]);

  function handleTrain(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    var count = parseInt(qty);
    if (isNaN(count) === true || count <= 0) {
      setError('Please provide a valid troop headcount value.');
      return;
    }

    setLoading(true);

    fetch('http://localhost:8080/troop/train', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        troop_name: troopName,
        quantity: count
      })
    })
    .then(function(res) {
      if (res.ok === false) {
        return res.text().then(function(text) {
          throw new Error(text || 'Transaction rejected');
        });
      }
      return res.json();
    })
    .then(function(data) {
      setLoading(false);
      setMessage(count + ' ' + troopName + (count > 1 ? 's' : '') + ' trained!');
      loadMyTroops();
      if (onTrainingComplete) {
        onTrainingComplete();
      }
    })
    .catch(function(err) {
      setLoading(false);
      setError(err.message);
    });
  }

  const totalArmySize = myTroops.reduce(function(sum, t) { return sum + t.quantity; }, 0);

  return (
    <div style={{ padding: '24px', color: colors.textMain }}>
      <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Train your army</h2>
      <p style={{ color: colors.textDim, fontSize: '13px', marginBottom: '20px' }}>
        Spend elixir to recruit troops for your next raid.
      </p>

      <div style={{ backgroundColor: colors.bgCard, padding: '10px 16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid ' + colors.border }}>
        <IconElixir size={18} />
        <span style={{ fontWeight: 'bold', color: colors.elixir }}>{(elixir || 0).toLocaleString()} elixir</span>
      </div>

      {message !== '' ? (
        <div style={{ backgroundColor: colors.successDim, border: '1px solid #207a35', color: colors.success, padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {message}
        </div>
      ) : null}

      {error !== '' ? (
        <div style={{ backgroundColor: colors.dangerDim, border: '1px solid #7a2020', color: colors.danger, padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* training form */}
        <form onSubmit={handleTrain} style={{ backgroundColor: colors.bgCard, border: '1px solid ' + colors.border, borderRadius: '14px', padding: '20px', width: '300px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: colors.textDim, marginBottom: '8px' }}>Choose troop</label>
            <select
              value={troopName}
              onChange={function(e) { setTroopName(e.target.value); }}
              style={{ width: '100%', padding: '10px', backgroundColor: colors.bgDark, border: '1px solid ' + colors.border, borderRadius: '8px', color: colors.textMain }}
            >
              {TROOP_DEFS.map(function (d) {
                return (
                  <option key={d.key} value={d.key}>
                    {d.label} ({d.cost} elixir)
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: colors.textDim, marginBottom: '8px' }}>How many</label>
            <input
              type="number"
              value={qty}
              min="1"
              onChange={function(e) { setQty(e.target.value); }}
              style={{ width: '100%', padding: '10px', backgroundColor: colors.bgDark, border: '1px solid ' + colors.border, borderRadius: '8px', color: colors.textMain, boxSizing: 'border-box' }}
            />
          </div>

          

          <button
            type="submit"
            disabled={loading === true}
            style={{
              width: '100%',
              backgroundColor: loading ? '#444466' : colors.purple,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontWeight: 'bold',
              cursor: loading === true ? 'not-allowed' : 'pointer'
            }}
          >
            {loading === true ? 'Training...' : 'Train troops'}
          </button>
        </form>

        {/* current army list */}
        <div style={{ flex: 1, minWidth: '260px', backgroundColor: colors.bgCard, border: '1px solid ' + colors.border, borderRadius: '14px', padding: '20px' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: colors.textDim, fontWeight: 'bold' }}>
            Your army {totalArmySize > 0 ? '(' + totalArmySize + ' troops)' : ''}
          </p>

          {troopsLoading === true ? (
            <p style={{ color: colors.textDim, fontSize: '13px' }}>Loading...</p>
          ) : troopsLoadError !== '' ? (
            <div style={{ backgroundColor: colors.dangerDim, border: '1px solid #7a2020', color: colors.danger, padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              {troopsLoadError}
            </div>
          ) : myTroops.length === 0 ? (
            <div>
              <div style={{ backgroundColor: colors.bgDark, borderRadius: '8px', padding: '20px', textAlign: 'center', color: colors.textDim, fontSize: '13px' }}>
                No troops yet. Train some above before raiding!
              </div>
              {}
              {rawDebug ? (
                <details style={{ marginTop: '10px', fontSize: '11px', color: colors.textDim }}>
                  <summary style={{ cursor: 'pointer' }}>Debug: raw /troop/list response</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: colors.bgDark, padding: '8px', borderRadius: '6px', marginTop: '6px' }}>
                    {JSON.stringify(rawDebug, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myTroops.map(function(t, idx) {
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.bgDark,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    border: '1px solid ' + colors.border
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <TroopIcon name={t.name} size={20} color={colors.purpleLight} />
                      <span style={{ fontSize: '14px' }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: colors.purpleLight }}>x{t.quantity}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrainTroop;