// src/stratego/components/StrategoGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  BOARD_SIZE, LAKE_POSITIONS, posToRowCol, rowColToPos,
  getPieceDisplayRank, getPieceName, posToLabel,
} from '../utils/strategoConstants';
import { getValidMoves } from '../utils/strategoRules';
import { makeMove } from '../services/strategoService';
import StrategoBattle from './StrategoBattle';
import StrategoNoteEditor from './StrategoNoteEditor';
import StrategoGameOver from './StrategoGameOver';
import StrategoCapturedPanel from './StrategoCapturedPanel';

// Normalize old string notes to new object format
function normalizeNote(note) {
  if (!note) return null;
  if (typeof note === 'string') return { text: note, perceivedRank: null, confidence: null };
  return note;
}

export default function StrategoGame({ gameData, gameId, localPlayerId, myColor, onBack }) {
  const [selectedPos, setSelectedPos] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [notes, setNotes] = useState({});
  const [noteTarget, setNoteTarget] = useState(null); // pieceId
  const [showBattle, setShowBattle] = useState(false);
  const [lastBattleTs, setLastBattleTs] = useState(null);
  const [hoverNote, setHoverNote] = useState(null); // pieceId for tooltip

  const board = gameData.board || {};
  const isMyTurn = gameData.currentTurn === localPlayerId;
  const flipBoard = myColor === 'blue';
  const lastMove = gameData.lastMove || null;

  // --- Load notes from localStorage (with normalization) ---
  useEffect(() => {
    const key = `stratego-notes-${gameId}`;
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '{}');
      const normalized = {};
      for (const [id, note] of Object.entries(raw)) {
        const n = normalizeNote(note);
        if (n) normalized[id] = n;
      }
      setNotes(normalized);
    } catch { /* ignore */ }
  }, [gameId]);

  // Save note — noteData is { text, perceivedRank, confidence } or null
  const saveNote = useCallback((pieceId, noteData) => {
    setNotes(prev => {
      const next = { ...prev };
      if (noteData && (noteData.text || noteData.perceivedRank != null)) {
        next[pieceId] = noteData;
      } else {
        delete next[pieceId];
      }
      localStorage.setItem(`stratego-notes-${gameId}`, JSON.stringify(next));
      return next;
    });
  }, [gameId]);

  // --- Detect new battle ---
  useEffect(() => {
    if (gameData.lastBattle && gameData.lastBattle.timestamp !== lastBattleTs) {
      setShowBattle(true);
      setLastBattleTs(gameData.lastBattle.timestamp);
    }
  }, [gameData.lastBattle, lastBattleTs]);

  // --- Clear selection when turn changes ---
  useEffect(() => {
    setSelectedPos(null);
    setValidMoves([]);
  }, [gameData.currentTurn]);

  // --- Handle cell click ---
  const handleCellClick = async (pos) => {
    if (gameData.status === 'ended') return;
    const piece = board[String(pos)];

    // If we have a selected piece and this is a valid move → execute it
    if (selectedPos !== null && validMoves.includes(pos)) {
      setSelectedPos(null);
      setValidMoves([]);
      await makeMove(gameId, localPlayerId, selectedPos, pos);
      return;
    }

    // If we click our own piece → select it
    if (piece && piece.color === myColor && isMyTurn) {
      if (selectedPos === pos) {
        setSelectedPos(null);
        setValidMoves([]);
      } else {
        setSelectedPos(pos);
        setValidMoves(getValidMoves(board, pos, myColor));
      }
      return;
    }

    // If we click enemy piece with no selection → open note editor
    if (piece && piece.color !== myColor && selectedPos === null) {
      setNoteTarget(piece.id);
      return;
    }

    // Clicking empty / invalid → clear selection
    setSelectedPos(null);
    setValidMoves([]);
  };

  // --- Right-click → note editor ---
  const handleContextMenu = (pos, e) => {
    e.preventDefault();
    const piece = board[String(pos)];
    if (piece && piece.color !== myColor) {
      setNoteTarget(piece.id);
    }
  };

  // --- Get opponent info ---
  const opponent = Object.entries(gameData.players).find(([id]) => id !== localPlayerId);
  const opponentName = opponent ? opponent[1].name : 'Opponent';
  const myName = gameData.players[localPlayerId]?.name || 'You';

  // --- Get note for a piece ---
  const getNoteForPiece = (pieceId) => normalizeNote(notes[pieceId]);

  // --- Render ---
  const renderCell = (visualIdx) => {
    const vRow = Math.floor(visualIdx / BOARD_SIZE);
    const vCol = visualIdx % BOARD_SIZE;
    const actualRow = flipBoard ? (BOARD_SIZE - 1 - vRow) : vRow;
    const actualCol = flipBoard ? (BOARD_SIZE - 1 - vCol) : vCol;
    const pos = rowColToPos(actualRow, actualCol);

    const isLake = LAKE_POSITIONS.has(pos);
    const isLight = (actualRow + actualCol) % 2 === 0;
    const piece = board[String(pos)];
    const isSelected = selectedPos === pos;
    const isValid = validMoves.includes(pos);
    const hasEnemy = isValid && piece && piece.color !== myColor;

    // Last move highlighting
    const isLastFrom = lastMove && lastMove.fromPos === pos;
    const isLastTo = lastMove && lastMove.toPos === pos;
    const lastMoveColor = lastMove?.playerColor;

    let cellClass = 'stratego-cell';
    cellClass += isLake ? ' lake' : isLight ? ' light' : ' dark';
    if (isValid) cellClass += ' valid-move';
    if (hasEnemy) cellClass += ' has-enemy';
    if (isLastFrom) cellClass += ` last-move-from last-move-${lastMoveColor}`;
    if (isLastTo) cellClass += ` last-move-to last-move-${lastMoveColor}`;
    if (isLastTo && lastMove?.wasBattle) cellClass += ' last-move-battle';

    return (
      <div
        key={pos}
        className={cellClass}
        onClick={() => handleCellClick(pos)}
        onContextMenu={(e) => handleContextMenu(pos, e)}
      >
        {piece && renderPiece(piece, pos, isSelected)}
      </div>
    );
  };

  const renderPiece = (piece, pos, isSelected) => {
    const isMine = piece.color === myColor;
    const note = !isMine ? getNoteForPiece(piece.id) : null;
    const perceivedRank = note?.perceivedRank;
    const confidence = note?.confidence;
    const hasTextNote = note?.text;

    const showActualRank = isMine || piece.revealed; // revealed after surviving a battle
    const showPerceivedRank = !showActualRank && perceivedRank != null;
    const isHidden = !showActualRank && !showPerceivedRank;

    let displayContent;
    if (showActualRank) {
      displayContent = getPieceDisplayRank(piece);
    } else if (showPerceivedRank) {
      displayContent = getPieceDisplayRank({ rank: perceivedRank });
    } else {
      displayContent = '?';
    }

    let pieceClass = 'stratego-piece';
    pieceClass += ` ${piece.color}`;
    if (isHidden) pieceClass += ' hidden-piece';
    if (showPerceivedRank && confidence === 'certain') pieceClass += ' perceived-certain';
    if (showPerceivedRank && confidence === 'probable') pieceClass += ' perceived-probable';
    if (isMine && piece.revealed) pieceClass += ' known-to-opponent';
    if (isSelected) pieceClass += ' selected-piece';

    // Build tooltip text
    let tooltipText = '';
    if (isMine && piece.revealed) {
      tooltipText += 'Opponent knows this piece';
    }
    if (perceivedRank != null) {
      tooltipText += (tooltipText ? '\n' : '') + `Guessed: ${getPieceName(perceivedRank)} (${confidence === 'certain' ? '100%' : 'probable'})`;
    }
    if (hasTextNote) {
      tooltipText += (tooltipText ? '\n' : '') + note.text;
    }

    return (
      <div
        className={pieceClass}
        onMouseEnter={() => (tooltipText || (isMine && piece.revealed)) && setHoverNote(piece.id)}
        onMouseLeave={() => setHoverNote(null)}
      >
        {displayContent}

        {/* "Known to opponent" eye badge — on my pieces the opponent can see */}
        {isMine && piece.revealed && (
          <span className="stratego-known-badge" title="Opponent knows this piece">👁</span>
        )}

        {/* Note badge — shown if there's a text note AND no perceived rank (rank is its own visual) */}
        {hasTextNote && !showPerceivedRank && (
          <span
            className="stratego-note-badge"
            onClick={(e) => { e.stopPropagation(); setNoteTarget(piece.id); }}
          >
            ✎
          </span>
        )}

        {/* Confidence indicator for perceived rank */}
        {showPerceivedRank && (
          <span
            className={`stratego-confidence-indicator ${confidence}`}
            onClick={(e) => { e.stopPropagation(); setNoteTarget(piece.id); }}
          >
            {confidence === 'certain' ? '✓' : '?'}
          </span>
        )}

        {/* Hover tooltip */}
        {hoverNote === piece.id && tooltipText && (
          <div className="stratego-tooltip">{tooltipText}</div>
        )}
      </div>
    );
  };

  return (
    <div className="stratego-game-layout">
      <button className="stratego-back-btn" onClick={onBack}>← Leave</button>

      {/* Header / turn indicator */}
      <div className="stratego-game-header">
        <div className="stratego-player-tag">
          <span className={`stratego-player-dot ${myColor}`} />
          {myName} ({myColor})
        </div>
        <div className={`stratego-turn-label ${isMyTurn ? 'my-turn' : 'their-turn'}`}>
          {gameData.status === 'ended'
            ? 'Game Over'
            : isMyTurn ? '⚡ Your Turn' : `Waiting for ${opponentName}…`}
        </div>
        <div className="stratego-player-tag">
          <span className={`stratego-player-dot ${myColor === 'red' ? 'blue' : 'red'}`} />
          {opponentName}
        </div>
      </div>

      {/* Board + Captured Panel side by side */}
      <div className="stratego-game-content">
        <div className="stratego-board-wrapper">
          {(() => {
            const colLabels = flipBoard
              ? ['J','I','H','G','F','E','D','C','B','A']
              : ['A','B','C','D','E','F','G','H','I','J'];
            const rowLabels = flipBoard
              ? [10,9,8,7,6,5,4,3,2,1]
              : [1,2,3,4,5,6,7,8,9,10];
            return (
              <div className="stratego-board-labeled">
                <div className="stratego-col-labels">
                  <div className="stratego-label-corner" />
                  {colLabels.map(l => <div key={l} className="stratego-col-label">{l}</div>)}
                  <div className="stratego-label-corner" />
                </div>
                <div className="stratego-board-mid">
                  <div className="stratego-row-labels">
                    {rowLabels.map(l => <div key={l} className="stratego-row-label">{l}</div>)}
                  </div>
                  <div className="stratego-board">
                    {Array.from({ length: 100 }, (_, i) => renderCell(i))}
                  </div>
                  <div className="stratego-row-labels">
                    {rowLabels.map(l => <div key={l} className="stratego-row-label">{l}</div>)}
                  </div>
                </div>
                <div className="stratego-col-labels">
                  <div className="stratego-label-corner" />
                  {colLabels.map(l => <div key={l} className="stratego-col-label">{l}</div>)}
                  <div className="stratego-label-corner" />
                </div>
              </div>
            );
          })()}
        </div>

        <StrategoCapturedPanel
          capturedPieces={gameData.capturedPieces || []}
          myColor={myColor}
        />
      </div>

      {/* Last move description */}
      {lastMove && (
        <div className="stratego-last-move-label">
          <span className={`stratego-player-dot ${lastMove.playerColor}`} />
          {lastMove.playerColor === myColor ? myName : opponentName}
          {lastMove.wasBattle
            ? ` attacked at ${posToLabel(lastMove.toPos)} ⚔`
            : ` moved ${posToLabel(lastMove.fromPos)} → ${posToLabel(lastMove.toPos)}`}
        </div>
      )}

      <div style={{ color: '#7a8599', fontSize: '0.75rem', textAlign: 'center' }}>
        Click your piece → click destination to move &nbsp;|&nbsp; Click opponent piece to tag / add notes
      </div>

      {/* Note editor */}
      {noteTarget && (
        <StrategoNoteEditor
          pieceId={noteTarget}
          currentNote={getNoteForPiece(noteTarget)}
          onSave={saveNote}
          onClose={() => setNoteTarget(null)}
        />
      )}

      {/* Battle overlay */}
      {showBattle && gameData.lastBattle && (
        <StrategoBattle
          battle={gameData.lastBattle}
          myColor={myColor}
          onDismiss={() => setShowBattle(false)}
        />
      )}

      {/* Game over overlay */}
      {gameData.status === 'ended' && (
        <StrategoGameOver
          winnerName={gameData.winnerName || 'Unknown'}
          isWinner={gameData.winner === localPlayerId}
          onBack={onBack}
        />
      )}
    </div>
  );
}
