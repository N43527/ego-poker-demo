// src/stratego/components/StrategoGameOver.jsx
import React from 'react';

export default function StrategoGameOver({ winnerName, isWinner, onBack }) {
  return (
    <div className="stratego-gameover-overlay">
      <div className="stratego-gameover-card">
        <h2>{isWinner ? '🏆 Victory!' : '💀 Defeat'}</h2>
        <p>{winnerName} captured the flag and won the game!</p>
        <button className="stratego-btn stratego-btn-primary" onClick={onBack}>
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
