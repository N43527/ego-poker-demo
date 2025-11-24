import React, { useState, useEffect } from 'react';

export default function GameControls({ gameData, localPlayerId, performAction, endGame }) {
  if (!gameData) return null;

  const isMyTurn = gameData.currentTurn === localPlayerId;
  const isHost = gameData.host === localPlayerId;

  const globalConfidence = gameData.confidence || 0;

  return (
    <div>
      {isMyTurn && (
        <div>
          <button onClick={() => performAction('Fold')}>Fold</button>
          <button onClick={() => performAction('Call')}>Call</button>

          <div style={{ marginTop: '15px' }}>
            <p style={{ margin: '5px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>RAISE CONFIDENCE:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', maxWidth: '350px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  disabled={val <= globalConfidence}
                  onClick={() => performAction('Raise', val)}
                  style={{
                    padding: '12px',
                    background: val <= globalConfidence ? '#2a2a35' : 'var(--accent-gradient)',
                    color: val <= globalConfidence ? '#555' : '#000',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: val <= globalConfidence ? 'not-allowed' : 'pointer',
                    opacity: val <= globalConfidence ? 0.5 : 1,
                    boxShadow: val > globalConfidence ? '0 0 10px rgba(188, 19, 254, 0.4)' : 'none'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {isHost && <button onClick={endGame}>End Game</button>}
    </div>
  );
}
