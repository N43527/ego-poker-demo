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
  sendMessage,
  setPlayerReady,
  startNextRound
}) {
  if (!gameData) return null;

  const { id, players = {}, hands = {}, faceUps = [], actions = [], chatLog = [], status, host, currentTurn } = gameData;

  const isHost = host === localPlayerId;
  const yourTurn = currentTurn === localPlayerId;

  // Auto-start next round if everyone is ready (Host only)
  React.useEffect(() => {
    if (isHost && !gameData.roundActive && gameData.winner) {
      const allReady = Object.values(players).every(p => p.ready);
      if (allReady) {
        startNextRound();
      }
    }
  }, [gameData, isHost, startNextRound]);

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

          {!gameData.roundActive && gameData.winner && (
            <div style={{ padding: '10px', backgroundColor: '#e6fffa', border: '1px solid #b2f5ea', borderRadius: '5px', margin: '10px 0' }}>
              <h3>🎉 Round Winner: {gameData.winner.split(', ').map(id => players[id]?.name || id).join(', ')}</h3>
              {gameData.winReason && <p>Reason: {gameData.winReason}</p>}
            </div>
          )}

          <h3>Current Confidence:</h3>
          <p>{gameData.confidence || "None yet"}</p>

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

      {!gameData.roundActive && gameData.winner && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {!players[localPlayerId]?.ready ? (
            <button
              onClick={setPlayerReady}
              style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Ready for Next Round
            </button>
          ) : (
            <p>Waiting for other players...</p>
          )}

          <p style={{ fontSize: '12px', color: '#666' }}>
            {Object.values(players).filter(p => p.ready).length} / {Object.keys(players).length} players ready
          </p>
        </div>
      )}

      <ChatBox
        chatLog={chatLog}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
      />
    </div>
  );
}
