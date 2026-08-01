import React, { useState, useEffect } from 'react';
import { tokens, Card, Button, Field, Select, TextInput, PageHeading, Callout, tileColorFor } from './ui';

function TownGrid({ userToken }) {
  const [mapMatrix, setMapMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [targetBuilding, setTargetBuilding] = useState('Cannon');
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [placementStatus, setPlacementStatus] = useState('');

  function fetchTownLayout() {
    setLoading(true);
    setErrorMsg('');

    fetch('http://localhost:8080/town/layout', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      }
    })
      .then(function (res) {
        if (res.ok === false) {
          throw new Error('HTTP status error: ' + res.status);
        }
        return res.json();
      })
      .then(function (parsed) {
        if (parsed.grid_matrix) {
          setMapMatrix(parsed.grid_matrix);
        }
        else if (Array.isArray(parsed)) {
          setMapMatrix(parsed);
        }
        else if (parsed.grid) {
          setMapMatrix(parsed.grid);
        }
        else {
          throw new Error('Unexpected backend response: ' + JSON.stringify(parsed));
        }
        setLoading(false);
      })
      .catch(function (err) {
        setErrorMsg(err.message);
        setLoading(false);
      });
  }

  useEffect(function () {
    fetchTownLayout();
  }, [userToken]);

  function executePlacement(e) {
    e.preventDefault();
    setPlacementStatus('');

    const finalX = parseInt(targetX);
    const finalY = parseInt(targetY);

    fetch('http://localhost:8080/town/place', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        building_name: targetBuilding,
        x: finalX,
        y: finalY
      })
    })
      .then(function (res) {
        if (res.ok === false) {
          return res.text().then(function (errorTxt) {
            throw new Error(errorTxt || 'Server rejected coordinate placement');
          });
        }
        setPlacementStatus('Structure successfully deployed to town layout.');
        fetchTownLayout();
      })
      .catch(function (err) {
        setPlacementStatus('Error: ' + err.message);
      });
  }

  function handleCellClick(clickedX, clickedY) {
    setTargetX(clickedX);
    setTargetY(clickedY);
  }

  if (loading === true) {
    return <p style={{ color: tokens.textDim, fontSize: '13px' }}>Syncing town grid…</p>;
  }

  if (errorMsg !== '') {
    return <Callout tone="rust">Town map error: {errorMsg}</Callout>;
  }

  const isError = placementStatus.toLowerCase().indexOf('error') === 0;

  return (
    <div>
      <PageHeading eyebrow="Village" title="Town Blueprint Designer" />

      <Card style={{ marginBottom: '24px', maxWidth: '700px' }}>
        <form onSubmit={executePlacement} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Building">
            <Select
              value={targetBuilding}
              onChange={function (e) { setTargetBuilding(e.target.value); }}
            >
              <option value="Cannon">Cannon</option>
              <option value="TownHall">TownHall</option>
              <option value="Barracks">Barracks</option>
            </Select>
          </Field>

          <Field label="Coordinate X">
            <TextInput
              type="number" min="0" max="9" value={targetX}
              onChange={function (e) { setTargetX(e.target.value); }}
              style={{ width: '65px' }}
            />
          </Field>

          <Field label="Coordinate Y">
            <TextInput
              type="number" min="0" max="9" value={targetY}
              onChange={function (e) { setTargetY(e.target.value); }}
              style={{ width: '65px' }}
            />
          </Field>

          <Button type="submit" variant="primary" style={{ marginBottom: '16px' }}>
            Deploy into town
          </Button>
        </form>

        {placementStatus !== '' ? (
          <Callout tone={isError ? 'rust' : 'moss'}>{placementStatus}</Callout>
        ) : null}
      </Card>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 52px)',
        gridTemplateRows: 'repeat(10, 52px)',
        gap: '6px',
        backgroundColor: tokens.panel,
        padding: '16px',
        borderRadius: tokens.radiusLg,
        border: '1px solid ' + tokens.line,
        width: 'fit-content',
        boxShadow: tokens.shadowPanel
      }}>
        {mapMatrix.map(function (rowArr, yIndex) {
          return rowArr.map(function (tileValue, xIndex) {
            const c = tileColorFor(tileValue);
            const isEmpty = tileValue === 'EMPTY' || tileValue === 'empty';

            return (
              <div
                key={yIndex + '-' + xIndex}
                title={'Town tile [' + xIndex + ', ' + yIndex + '] — ' + tileValue}
                onClick={function () { handleCellClick(xIndex, yIndex); }}
                style={{
                  backgroundColor: isEmpty ? tokens.panelSunken : c.bg,
                  border: '1px solid ' + (isEmpty ? tokens.lineSoft : c.border),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: tokens.text,
                  borderRadius: tokens.radiusSm,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {isEmpty ? xIndex + ',' + yIndex : tileValue.substring(0, 4)}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

export default TownGrid;
