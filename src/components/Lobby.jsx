// src/components/Lobby.jsx
import React from 'react';

export default function Lobby({
  isRegistered,
  playerName,
  setPlayerName,
  passkey,
  setPasskey,
  registerProfile,
  reconnectWithPasskey,
  createGame,
  joinInput,
  setJoinInput,
  joinGame
}) {
  return (
    <div>
      {!isRegistered ? (
        <>
          <input
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input
            type="password"
            placeholder="Passkey"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
          />
          <button onClick={registerProfile}>Register</button>
          <button onClick={reconnectWithPasskey}>Reconnect</button>
        </>
      ) : (
        <>
          <p>Welcome, <strong>{playerName}</strong></p>
          <button onClick={createGame}>Create Game</button>
          <input
            placeholder="Enter Game ID"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
          />
          <button onClick={joinGame}>Join Game</button>
        </>
      )}
    </div>
  );
}
