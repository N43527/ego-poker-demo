// src/components/GameControls.jsx
import React from 'react';

export default function GameControls({ gameData, localPlayerId, performAction, endGame }) {
  if (!gameData) return null;

  const isMyTurn = gameData.currentTurn === localPlayerId;
  const isHost = gameData.host === localPlayerId;

  return (
    <div>
      {isMyTurn && (
        <div>
          <button onClick={() => performAction('Fold')}>Fold</button>
          <button onClick={() => performAction('Call')}>Call</button>
          <button onClick={() => performAction('Raise')}>Raise</button>
        </div>
      )}
      {isHost && <button onClick={endGame}>End Game</button>}
    </div>
  );
}
