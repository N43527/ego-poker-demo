// src/components/GameScreen.jsx
import React from 'react';
import PlayerList from './PlayerList';
import ChatBox from './ChatBox';

export default function GameScreen({
  gameData,
  localPlayerId,
  startGame,
  performAction,
  endGame,
  messageInput,
  setMessageInput,
  sendMessage
}) {
  if (!gameData) return null;

  const isHost = gameData.host === localPlayerId;
  const yourTurn = gameData.currentTurn === localPlayerId;

  return (
    <div>
      <h2>Game ID: {gameData.id || '???'}</h2>

      <PlayerList players={gameData.players} localPlayerId={localPlayerId} />

      {gameData.status === 'waiting' && isHost && (
        <button onClick={startGame}>Start Game</button>
      )}

      {gameData.status === 'in-progress' && (
        <div>
          <h3>Your Hand:</h3>
          <p>{gameData.hands?.[localPlayerId]?.join(', ') || 'Not dealt'}</p>

          <h3>Center Cards:</h3>
          <p>{gameData.faceUps?.join(', ') || 'Not dealt'}</p>

          <h3>Actions:</h3>
          <ul>
            {gameData.actions?.map((a, i) => (
              <li key={i}><strong>{a.name}</strong>: {a.action}</li>
            ))}
          </ul>

          {yourTurn && (
            <div>
              <button onClick={() => performAction('Fold')}>Fold</button>
              <button onClick={() => performAction('Call')}>Call</button>
              <button onClick={() => performAction('Raise')}>Raise</button>
            </div>
          )}

          {isHost && (
            <button onClick={endGame}>End Game</button>
          )}
        </div>
      )}

      {gameData.status === 'ended' && <h3>Game Over</h3>}

      <ChatBox
        chatLog={gameData.chatLog}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
      />
    </div>
  );
}
