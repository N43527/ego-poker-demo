// src/stratego/components/StrategoLobby.jsx
import React, { useState } from 'react';
import { createStrategoGame, joinStrategoGame } from '../services/strategoService';

export default function StrategoLobby({ localPlayerId, playerName, onGameJoined, onBack }) {
  const [joinCode, setJoinCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const code = await createStrategoGame(localPlayerId, playerName);
      setCreatedCode(code);
      onGameJoined(code);
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const code = await joinStrategoGame(localPlayerId, playerName, joinCode);
      onGameJoined(code);
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="stratego-lobby">
      <button className="stratego-back-btn" onClick={onBack}>← Home</button>

      <h1 className="stratego-lobby-title">⚔ Stratego</h1>
      <p className="stratego-lobby-subtitle">Classic strategy board game — 2 players</p>

      <p style={{ color: '#34d399', fontWeight: 600 }}>
        Playing as: {playerName}
      </p>

      {/* Create game */}
      <div className="stratego-lobby-card">
        <h3>Create a Game</h3>
        <button
          className="stratego-btn stratego-btn-primary"
          onClick={handleCreate}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Creating…' : 'Create New Game'}
        </button>
        {createdCode && (
          <>
            <p style={{ textAlign: 'center', color: '#7a8599', margin: 0 }}>
              Share this code with your opponent:
            </p>
            <div className="stratego-game-code">{createdCode}</div>
          </>
        )}
      </div>

      {/* Join game */}
      <div className="stratego-lobby-card">
        <h3>Join a Game</h3>
        <input
          className="stratego-input"
          placeholder="Enter 4-letter game code"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase())}
          maxLength={4}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
        />
        <button
          className="stratego-btn stratego-btn-primary"
          onClick={handleJoin}
          disabled={loading || !joinCode.trim()}
          style={{ width: '100%' }}
        >
          Join
        </button>
      </div>
    </div>
  );
}
