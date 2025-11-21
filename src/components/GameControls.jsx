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

          <div style={{ marginTop: '10px' }}>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>Raise to:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', maxWidth: '300px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  disabled={val <= globalConfidence}
                  onClick={() => performAction('Raise', val)}
                  style={{
                    padding: '8px',
                    backgroundColor: val <= globalConfidence ? '#ccc' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: val <= globalConfidence ? 'not-allowed' : 'pointer',
                    opacity: val <= globalConfidence ? 0.6 : 1
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
