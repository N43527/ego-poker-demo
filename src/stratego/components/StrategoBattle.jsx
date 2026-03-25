// src/stratego/components/StrategoBattle.jsx
import React from 'react';
import { getPieceDisplayRank, getPieceName } from '../utils/strategoConstants';

export default function StrategoBattle({ battle, myColor, onDismiss }) {
  if (!battle) return null;

  const { attackerPiece, defenderPiece, result } = battle;

  // Result text
  let resultText, resultClass;
  if (result === 'both') {
    resultText = `Both ${getPieceName(attackerPiece.rank)}s destroyed — equal rank!`;
    resultClass = 'draw';
  } else if (result === 'attacker') {
    resultText = `${getPieceName(attackerPiece.rank)} (${attackerPiece.color}) defeats ${getPieceName(defenderPiece.rank)} (${defenderPiece.color})!`;
    resultClass = attackerPiece.color === myColor ? 'win' : 'lose';
  } else {
    resultText = `${getPieceName(defenderPiece.rank)} (${defenderPiece.color}) defeats ${getPieceName(attackerPiece.rank)} (${attackerPiece.color})!`;
    resultClass = defenderPiece.color === myColor ? 'win' : 'lose';
  }

  const attackerLost = result === 'defender' || result === 'both';
  const defenderLost = result === 'attacker' || result === 'both';

  return (
    <div className="stratego-battle-overlay" onClick={onDismiss}>
      <div className="stratego-battle-card" onClick={e => e.stopPropagation()}>
        <div className="stratego-battle-title">⚔️ Battle!</div>
        <div className="stratego-battle-pieces">
          {/* Attacker — fully revealed */}
          <div className="stratego-battle-piece">
            <div className={`stratego-battle-piece-icon ${attackerPiece.color} ${attackerLost ? 'loser' : ''}`}>
              {getPieceDisplayRank(attackerPiece)}
            </div>
            <div className="stratego-battle-piece-label">
              {getPieceName(attackerPiece.rank)}
              <span className="stratego-battle-piece-sub">{attackerPiece.color} · attacker</span>
            </div>
          </div>

          <div className="stratego-battle-vs">VS</div>

          {/* Defender — fully revealed */}
          <div className="stratego-battle-piece">
            <div className={`stratego-battle-piece-icon ${defenderPiece.color} ${defenderLost ? 'loser' : ''}`}>
              {getPieceDisplayRank(defenderPiece)}
            </div>
            <div className="stratego-battle-piece-label">
              {getPieceName(defenderPiece.rank)}
              <span className="stratego-battle-piece-sub">{defenderPiece.color} · defender</span>
            </div>
          </div>
        </div>
        <div className={`stratego-battle-result ${resultClass}`}>{resultText}</div>
        <button className="stratego-btn stratego-btn-primary" onClick={onDismiss}>Continue</button>
      </div>
    </div>
  );
}
