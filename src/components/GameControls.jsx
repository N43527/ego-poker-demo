import React, { useState, useEffect } from 'react';

export default function GameControls({ gameData, localPlayerId, performAction, endGame }) {
  if (!gameData) return null;

  const isMyTurn = gameData.currentTurn === localPlayerId;
  const isHost = gameData.host === localPlayerId;

  const globalConfidence = gameData.confidence || 0;
  const [raiseAmount, setRaiseAmount] = useState(globalConfidence + 1);

  useEffect(() => {
    setRaiseAmount(globalConfidence + 1);
  }, [globalConfidence]);

  return (
    <div>
      {isMyTurn && (
        <div>
          <button onClick={() => performAction('Fold')}>Fold</button>
          <button onClick={() => performAction('Call')}>Call</button>

          <div style={{ marginTop: '10px' }}>
            {globalConfidence < 10 && (
              <>
                <input
                  type="range"
                  min={globalConfidence + 1}
                  max="10"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                />
                <button onClick={() => performAction('Raise', raiseAmount)}>
                  Raise to {raiseAmount}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {isHost && <button onClick={endGame}>End Game</button>}
    </div>
  );
}
