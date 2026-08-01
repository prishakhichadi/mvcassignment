import React, { useState, useEffect } from 'react';
import { tokens, Card, Button, Field, TextInput, Select, Badge, PageHeading, Callout } from './ui';
import { TroopIcon, TROOP_DEFS, IconElixir } from './theme';

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
      .then(function (res) {
        if (res.ok === false) {
          throw new Error('Could not load your troops (status ' + res.status + ')');
        }
        return res.json();
      })
      .then(function (data) {
        setRawDebug(data);
        setMyTroops(normalizeTroopList(data));
        setTroopsLoading(false);
      })
      .catch(function (err) {
        setTroopsLoadError(err.message);
        setTroopsLoading(false);
      });
  }

  useEffect(function () {
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
      .then(function (res) {
        if (res.ok === false) {
          return res.text().then(function (text) {
            throw new Error(text || 'Transaction rejected');
          });
        }
        return res.json();
      })
      .then(function () {
        setLoading(false);
        setMessage(count + ' ' + troopName + (count > 1 ? 's' : '') + ' trained.');
        loadMyTroops();
        if (onTrainingComplete) {
          onTrainingComplete();
        }
      })
      .catch(function (err) {
        setLoading(false);
        setError(err.message);
      });
  }

  const totalArmySize = myTroops.reduce(function (sum, t) { return sum + t.quantity; }, 0);

  return (
    <div>
      <PageHeading eyebrow="Barracks" title="Train your army" subtitle="Spend elixir to recruit troops for your next raid." />

      <Badge tone="berry" style={{ marginBottom: '20px' }}>
        <IconElixir size={16} /> {(elixir || 0).toLocaleString()} elixir
      </Badge>

      {message !== '' ? <Callout tone="moss">{message}</Callout> : null}
      {error !== '' ? <Callout tone="rust">{error}</Callout> : null}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* training form */}
        <Card style={{ width: '300px' }}>
          <Field label="Choose troop">
            <Select
              value={troopName}
              onChange={function (e) { setTroopName(e.target.value); }}
            >
              {TROOP_DEFS.map(function (d) {
                return (
                  <option key={d.key} value={d.key}>
                    {d.label} ({d.cost} elixir)
                  </option>
                );
              })}
            </Select>
          </Field>

          <Field label="How many">
            <TextInput
              type="number"
              value={qty}
              min="1"
              onChange={function (e) { setQty(e.target.value); }}
            />
          </Field>

         
          <Button type="submit" variant="primary" fullWidth disabled={loading === true} onClick={handleTrain}>
            {loading === true ? 'Training…' : 'Train troops'}
          </Button>
        </Card>

        {/* current army list */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <Card>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: tokens.textDim, fontWeight: 700 }}>
              Your army {totalArmySize > 0 ? '(' + totalArmySize + ' troops)' : ''}
            </p>

            {troopsLoading === true ? (
              <p style={{ color: tokens.textDim, fontSize: '13px' }}>Loading…</p>
            ) : troopsLoadError !== '' ? (
              <Callout tone="rust">{troopsLoadError}</Callout>
            ) : myTroops.length === 0 ? (
              <div>
                <div style={{
                  backgroundColor: tokens.panelSunken, borderRadius: tokens.radiusMd, padding: '20px',
                  textAlign: 'center', color: tokens.textDim, fontSize: '13px',
                }}>
                  No troops yet. Train some above before raiding.
                </div>
                {rawDebug ? (
                  <details style={{ marginTop: '10px', fontSize: '11px', color: tokens.textFaint }}>
                    <summary style={{ cursor: 'pointer' }}>Debug: raw /troop/list response</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: tokens.panelSunken, padding: '8px', borderRadius: tokens.radiusSm, marginTop: '6px', fontFamily: tokens.fontMono }}>
                      {JSON.stringify(rawDebug, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myTroops.map(function (t, idx) {
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: tokens.panelSunken,
                      borderRadius: tokens.radiusMd,
                      padding: '9px 12px',
                      border: '1px solid ' + tokens.line,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <TroopIcon name={t.name} size={20} color={tokens.brass} />
                        <span style={{ fontSize: '14px' }}>{t.name}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: tokens.brass }}>x{t.quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TrainTroop;