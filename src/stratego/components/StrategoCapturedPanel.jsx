// src/stratego/components/StrategoCapturedPanel.jsx
import React from 'react';
import { PIECES, getPieceDisplayRank } from '../utils/strategoConstants';

export default function StrategoCapturedPanel({ capturedPieces, myColor }) {
  const opponentColor = myColor === 'red' ? 'blue' : 'red';

  // Count captured pieces for the opponent's army
  const opponentCaptured = {};
  for (const cp of capturedPieces) {
    if (cp.color === opponentColor) {
      const key = String(cp.rank);
      opponentCaptured[key] = (opponentCaptured[key] || 0) + 1;
    }
  }

  // Count MY captured pieces (pieces I lost)
  const myCaptured = {};
  for (const cp of capturedPieces) {
    if (cp.color === myColor) {
      const key = String(cp.rank);
      myCaptured[key] = (myCaptured[key] || 0) + 1;
    }
  }

  const renderArmy = (title, color, capturedCounts) => (
    <div className="stratego-captured-section">
      <h4 className="stratego-captured-title">
        <span className={`stratego-player-dot ${color}`} />
        {title}
      </h4>
      <div className="stratego-captured-list">
        {PIECES.map(piece => {
          const count = piece.count;
          const capturedCount = Math.min(capturedCounts[String(piece.rank)] || 0, count);
          const allCaptured = capturedCount >= count;

          return (
            <div
              key={String(piece.rank)}
              className={`stratego-captured-row ${allCaptured ? 'all-captured' : ''}`}
            >
              <div className={`stratego-captured-icon ${color}`}>
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
                {capturedCount > 0 ? `−${capturedCount}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="stratego-captured-panel">
      {renderArmy('Enemy Losses', opponentColor, opponentCaptured)}
      <div className="stratego-captured-divider" />
      {renderArmy('My Losses', myColor, myCaptured)}
    </div>
  );
}
