// src/stratego/StrategoApp.jsx
import React, { useState, useEffect } from 'react';
import { checkProfile } from '../utils/profileService';
import { subscribeToStrategoGame } from './services/strategoService';
import StrategoLobby from './components/StrategoLobby';
import StrategoSetup from './components/StrategoSetup';
import StrategoGame from './components/StrategoGame';
import './stratego.css';

export default function StrategoApp({ onBack }) {
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [gameId, setGameId] = useState('');
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Load profile ---
  useEffect(() => {
    const init = async () => {
      const storedId = localStorage.getItem('localPlayerId');
      if (storedId) {
        setLocalPlayerId(storedId);
        const profile = await checkProfile(storedId);
        if (profile) {
          setPlayerName(profile.name);
          setIsRegistered(true);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // --- Subscribe to game ---
  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeToStrategoGame(gameId, (data) => {
      if (data) setGameData(data);
      else { setGameData(null); setGameId(''); }
    });
    return () => unsub();
  }, [gameId]);

  const handleLeave = () => {
    setGameId('');
    setGameData(null);
  };

  if (loading) {
    return (
      <div className="stratego-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#7a8599' }}>Loading…</p>
      </div>
    );
  }

  // Not registered → tell user to register via EGO first (or we could add registration here)
  if (!isRegistered) {
    return (
      <div className="stratego-root">
        <div className="stratego-lobby">
          <button className="stratego-back-btn" onClick={onBack}>← Home</button>
          <h1 className="stratego-lobby-title">⚔ Stratego</h1>
          <div className="stratego-lobby-card">
            <h3>Registration Required</h3>
            <p style={{ color: '#7a8599', margin: 0 }}>
              Please register a profile first via the <strong>EGO Poker</strong> game, then come back here.
              Your profile is shared across all games.
            </p>
            <button className="stratego-btn stratego-btn-primary" onClick={onBack}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No game yet → show lobby
  if (!gameId || !gameData) {
    return (
      <div className="stratego-root">
        <StrategoLobby
          localPlayerId={localPlayerId}
          playerName={playerName}
          onGameJoined={(code) => setGameId(code)}
          onBack={onBack}
        />
      </div>
    );
  }

  // Determine my color
  const myColor = gameData.players[localPlayerId]?.color || 'red';
  const opponentId = Object.keys(gameData.players).find(id => id !== localPlayerId);
  const opponentReady = opponentId ? gameData.players[opponentId]?.ready : false;
  const myReady = gameData.players[localPlayerId]?.ready || false;

  // Waiting for opponent to join
  if (gameData.status === 'waiting') {
    return (
      <div className="stratego-root">
        <div className="stratego-lobby">
          <button className="stratego-back-btn" onClick={handleLeave}>← Leave</button>
          <h1 className="stratego-lobby-title">⚔ Stratego</h1>
          <div className="stratego-lobby-card" style={{ textAlign: 'center' }}>
            <h3>Waiting for Opponent</h3>
            <p style={{ color: '#7a8599', margin: 0 }}>Share this code:</p>
            <div className="stratego-game-code">{gameData.id}</div>
            <p className="stratego-waiting-msg">Waiting for another player to join…</p>
          </div>
        </div>
      </div>
    );
  }

  // Setup phase (and I haven't submitted yet)
  if (gameData.status === 'setup' && !myReady) {
    return (
      <div className="stratego-root">
        <button className="stratego-back-btn" onClick={handleLeave}>← Leave</button>
        <StrategoSetup
          gameId={gameId}
          localPlayerId={localPlayerId}
          myColor={myColor}
          opponentReady={opponentReady}
        />
      </div>
    );
  }

  // Setup phase but I'm already ready → waiting for opponent
  if (gameData.status === 'setup' && myReady) {
    return (
      <div className="stratego-root">
        <div className="stratego-lobby">
          <button className="stratego-back-btn" onClick={handleLeave}>← Leave</button>
          <h1 className="stratego-lobby-title">⚔ Stratego</h1>
          <div className="stratego-lobby-card" style={{ textAlign: 'center' }}>
            <h3>Pieces Placed ✅</h3>
            <p className="stratego-waiting-msg">Waiting for opponent to finish setup…</p>
          </div>
        </div>
      </div>
    );
  }

  // In-progress or ended → game board
  return (
    <div className="stratego-root">
      <StrategoGame
        gameData={gameData}
        gameId={gameId}
        localPlayerId={localPlayerId}
        myColor={myColor}
        onBack={handleLeave}
      />
    </div>
  );
}
