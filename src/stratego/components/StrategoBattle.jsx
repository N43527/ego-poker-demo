// src/stratego/components/StrategoBattle.jsx
import React from 'react';
import { getPieceDisplayRank, getPieceName } from '../utils/strategoConstants';

export default function StrategoBattle({ battle, myColor, onDismiss }) {
  if (!battle) return null;

  const { attackerPiece, defenderPiece, result } = battle;

  const iAmAttacker = attackerPiece.color === myColor;
  const myPiece = iAmAttacker ? attackerPiece : defenderPiece;
  const opponentPiece = iAmAttacker ? defenderPiece : attackerPiece;

  // Determine outcome from my perspective
  const iWon = (iAmAttacker && result === 'attacker') || (!iAmAttacker && result === 'defender');
  const iLost = (iAmAttacker && result === 'defender') || (!iAmAttacker && result === 'attacker');
  const draw = result === 'both';

  // Bomb exception: if I attacked and lost to a bomb, I learn it was a bomb
  const wasBombed = iAmAttacker && defenderPiece.rank === 'B' && result === 'defender';

  // Equal rank: both die → I can deduce they had my same rank
  const equalRank = draw;

  // Result text
  let resultText, resultClass;
  if (draw) {
    resultText = `Your ${getPieceName(myPiece.rank)} clashed with an equal rank — both destroyed!`;
    resultClass = 'draw';
  } else if (iWon) {
    resultText = `Your ${getPieceName(myPiece.rank)} won the engagement!`;
    resultClass = 'win';
  } else if (wasBombed) {
    resultText = `Your ${getPieceName(myPiece.rank)} was bombed! 💣`;
    resultClass = 'lose';
  } else {
    resultText = `Your ${getPieceName(myPiece.rank)} was defeated!`;
    resultClass = 'lose';
  }

  // What to show for the opponent piece
  let opponentDisplay, opponentLabel;
  if (wasBombed) {
    opponentDisplay = '💣';
    opponentLabel = 'Bomb';
  } else if (equalRank) {
    opponentDisplay = getPieceDisplayRank(myPiece); // same rank as mine
    opponentLabel = getPieceName(myPiece.rank);
  } else {
    opponentDisplay = '?';
    opponentLabel = 'Unknown';
  }

  const opponentColor = opponentPiece.color;

  return (
    <div className="stratego-battle-overlay" onClick={onDismiss}>
      <div className="stratego-battle-card" onClick={e => e.stopPropagation()}>
        <div className="stratego-battle-title">⚔️ Battle!</div>
        <div className="stratego-battle-pieces">
          {/* My piece — fully revealed */}
          <div className="stratego-battle-piece">
            <div className={`stratego-battle-piece-icon ${myPiece.color} ${iLost ? 'loser' : ''}`}>
              {getPieceDisplayRank(myPiece)}
            </div>
            <div className="stratego-battle-piece-label">
              {getPieceName(myPiece.rank)} (You)
            </div>
          </div>

          <div className="stratego-battle-vs">VS</div>

          {/* Opponent piece — hidden unless bomb/equal */}
          <div className="stratego-battle-piece">
            <div className={`stratego-battle-piece-icon ${opponentColor} ${iWon ? 'loser' : ''} ${opponentDisplay === '?' ? 'mystery' : ''}`}>
              {opponentDisplay}
            </div>
            <div className="stratego-battle-piece-label">
              {opponentLabel} ({opponentColor})
            </div>
          </div>
        </div>
        <div className={`stratego-battle-result ${resultClass}`}>{resultText}</div>
        <button className="stratego-btn stratego-btn-primary" onClick={onDismiss}>Continue</button>
      </div>
    </div>
  );
}
