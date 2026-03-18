// src/stratego/components/StrategoCapturedPanel.jsx
import React, { useState, useEffect } from 'react';
import { PIECES, getPieceDisplayRank } from '../utils/strategoConstants';

export default function StrategoCapturedPanel({ gameId, myColor }) {
  const opponentColor = myColor === 'red' ? 'blue' : 'red';
  const storageKey = `stratego-captured-${gameId}`;

  // { [rank]: capturedCount }
  const [captured, setCaptured] = useState({});

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setCaptured(raw);
    } catch { /* ignore */ }
  }, [storageKey]);

  const updateCaptured = (rank, delta) => {
    setCaptured(prev => {
      const piece = PIECES.find(p => p.rank === rank);
      const max = piece?.count || 1;
      const current = prev[String(rank)] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      const updated = { ...prev, [String(rank)]: next };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="stratego-captured-panel">
      <h4 className="stratego-captured-title">
        <span className={`stratego-player-dot ${opponentColor}`} />
        Opponent's Army
      </h4>
      <div className="stratego-captured-list">
        {PIECES.map(piece => {
          const count = piece.count;
          const capturedCount = captured[String(piece.rank)] || 0;
          const allCaptured = capturedCount >= count;

          return (
            <div
              key={String(piece.rank)}
              className={`stratego-captured-row ${allCaptured ? 'all-captured' : ''}`}
              onClick={() => updateCaptured(piece.rank, 1)}
              onContextMenu={(e) => { e.preventDefault(); updateCaptured(piece.rank, -1); }}
            >
              <div className={`stratego-captured-icon ${opponentColor}`}>
                {getPieceDisplayRank({ rank: piece.rank })}
              </div>
              <div className="stratego-captured-info">
                <span className="stratego-captured-name">{piece.name}</span>
                <div className="stratego-captured-pips">
                  {Array.from({ length: count }, (_, i) => (
                    <span
                      key={i}
                      className={`stratego-captured-pip ${i < capturedCount ? 'out' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <span className="stratego-captured-count">
                {capturedCount}/{count}
              </span>
            </div>
          );
        })}
      </div>
      <div className="stratego-captured-hint">
        Click +1 &nbsp;|&nbsp; Right-click −1
      </div>
    </div>
  );
}
