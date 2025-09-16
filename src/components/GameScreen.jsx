// src/components/GameScreen.jsx
import React from 'react';
import PlayerList from './PlayerList';
import ChatBox from './ChatBox';
import GameControls from './GameControls';

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

  const { id, players = {}, hands = {}, faceUps = [], actions = [], chatLog = [], status, host, currentTurn } = gameData;

  const isHost = host === localPlayerId;
  const yourTurn = currentTurn === localPlayerId;

  return (
    <div>
      <h2>Game ID: {id || '???'}</h2>

      <PlayerList players={players} localPlayerId={localPlayerId} />

      {status === 'waiting' && isHost && (
        <button onClick={startGame}>Start Game</button>
      )}

  {status === 'in-progress' && (
    <div>
      <h3>Your Hand:</h3>
      <p>{hands[localPlayerId]?.join(', ') || 'Not dealt'}</p>
  
      <h3>Center Cards:</h3>
      <p>{faceUps.join(', ') || 'Not dealt'}</p>
  
      <h3>Actions:</h3>
      <ul>
        {actions.map((a, i) => (
          <li key={i}><strong>{a.name}</strong>: {a.action}</li>
        ))}
      </ul>
  
      <GameControls
        gameData={gameData}
        localPlayerId={localPlayerId}
        performAction={performAction}
        endGame={endGame}
      />
    </div>
  )}

      {status === 'ended' && <h3>Game Over</h3>}

      <ChatBox
        chatLog={chatLog}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
      />
    </div>
  );
}
