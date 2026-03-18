// src/HomePage.jsx
import React from 'react';

export default function HomePage({ onSelectGame }) {
  return (
    <div className="home-page">
      <h1 className="home-title">Game Hub</h1>
      <p className="home-subtitle">Choose a game to play</p>

      <div className="home-cards">
        {/* EGO Poker */}
        <div
          className="home-card home-card-ego"
          onClick={() => onSelectGame('ego')}
        >
          <div className="home-card-icon">♠</div>
          <h3>EGO Poker</h3>
          <p>Bluff, raise, and outplay your friends in this custom poker variant.</p>
        </div>

        {/* Stratego */}
        <div
          className="home-card home-card-stg"
          onClick={() => onSelectGame('stratego')}
        >
          <div className="home-card-icon">⚔️</div>
          <h3>Stratego</h3>
          <p>Classic strategy board game. Deploy your army and capture the enemy flag.</p>
        </div>
      </div>
    </div>
  );
}
