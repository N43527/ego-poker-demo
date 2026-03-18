// src/stratego/components/StrategoSetup.jsx
import React, { useState, useMemo } from 'react';
import {
  PIECES, BOARD_SIZE, LAKE_POSITIONS, TOTAL_PIECES_PER_PLAYER,
  getSetupPositions, posToRowCol, rowColToPos, getPieceDisplayRank, getRankLabel,
} from '../utils/strategoConstants';
import { submitSetup } from '../services/strategoService';

export default function StrategoSetup({ gameId, localPlayerId, myColor, opponentReady }) {
  // Tray: how many of each piece remain to be placed
  const initialTray = useMemo(() =>
    PIECES.map(p => ({ rank: p.rank, name: p.name, remaining: p.count })), []);

  const [tray, setTray] = useState(initialTray);
  const [placedPieces, setPlacedPieces] = useState({}); // { pos: rank }
  const [selectedRank, setSelectedRank] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setupPositions = useMemo(() => new Set(getSetupPositions(myColor)), [myColor]);
  const placedCount = Object.keys(placedPieces).length;
  const allPlaced = placedCount === TOTAL_PIECES_PER_PLAYER;
  const flipBoard = myColor === 'blue';

  // --- Tray interactions ---
  const selectFromTray = (rank) => {
    const item = tray.find(t => t.rank === rank);
    if (!item || item.remaining <= 0) return;
    setSelectedRank(rank);
  };

  // --- Board interactions ---
  const handleCellClick = (pos) => {
    if (!setupPositions.has(pos)) return;

    if (placedPieces[pos] !== undefined) {
      // Remove piece → return to tray
      const rank = placedPieces[pos];
      setTray(prev => prev.map(t => t.rank === rank ? { ...t, remaining: t.remaining + 1 } : t));
      setPlacedPieces(prev => { const copy = { ...prev }; delete copy[pos]; return copy; });
      return;
    }

    if (selectedRank === null) return;

    // Place piece
    setPlacedPieces(prev => ({ ...prev, [pos]: selectedRank }));
    setTray(prev => {
      const updated = prev.map(t =>
        t.rank === selectedRank ? { ...t, remaining: t.remaining - 1 } : t
      );
      // If this type is now depleted, clear selection
      const item = updated.find(t => t.rank === selectedRank);
      if (item && item.remaining <= 0) setSelectedRank(null);
      return updated;
    });
  };

  // --- Auto-place ---
  const autoPlace = () => {
    const positions = [...setupPositions];
    const alreadyPlaced = { ...placedPieces };
    const emptyPositions = positions.filter(p => alreadyPlaced[p] === undefined);

    // Build list of remaining pieces
    const remaining = [];
    for (const t of tray) {
      for (let i = 0; i < t.remaining; i++) remaining.push(t.rank);
    }
    // Shuffle
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    const newPlaced = { ...alreadyPlaced };
    const newTray = tray.map(t => ({ ...t }));
    for (let i = 0; i < Math.min(remaining.length, emptyPositions.length); i++) {
      newPlaced[emptyPositions[i]] = remaining[i];
      const item = newTray.find(t => t.rank === remaining[i]);
      if (item) item.remaining--;
    }
    setPlacedPieces(newPlaced);
    setTray(newTray);
    setSelectedRank(null);
  };

  // --- Clear all ---
  const clearAll = () => {
    setPlacedPieces({});
    setTray(PIECES.map(p => ({ rank: p.rank, name: p.name, remaining: p.count })));
    setSelectedRank(null);
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!allPlaced) return;
    setSubmitting(true);
    try {
      // Convert placedPieces { pos: rank } to Firebase format { pos: pieceObj }
      let idx = 0;
      const pieces = {};
      const sortedPositions = Object.keys(placedPieces).map(Number).sort((a, b) => a - b);
      for (const pos of sortedPositions) {
        pieces[pos] = {
          id: `${myColor}-${idx}`,
          rank: placedPieces[pos],
          color: myColor,
          revealed: false,
        };
        idx++;
      }
      await submitSetup(gameId, localPlayerId, pieces);
    } catch (e) {
      alert('Error submitting setup: ' + e.message);
      setSubmitting(false);
    }
  };

  // --- Render board ---
  const renderBoard = () => {
    const cells = [];
    for (let visualIdx = 0; visualIdx < 100; visualIdx++) {
      const vRow = Math.floor(visualIdx / BOARD_SIZE);
      const vCol = visualIdx % BOARD_SIZE;
      const actualRow = flipBoard ? (BOARD_SIZE - 1 - vRow) : vRow;
      const actualCol = flipBoard ? (BOARD_SIZE - 1 - vCol) : vCol;
      const pos = rowColToPos(actualRow, actualCol);

      const isLake = LAKE_POSITIONS.has(pos);
      const isSetup = setupPositions.has(pos);
      const isLight = (actualRow + actualCol) % 2 === 0;
      const placed = placedPieces[pos];

      let cellClass = 'stratego-cell';
      cellClass += isLake ? ' lake' : isLight ? ' light' : ' dark';
      if (isSetup && !isLake) cellClass += ' setup-zone';

      cells.push(
        <div key={pos} className={cellClass} onClick={() => handleCellClick(pos)}>
          {placed !== undefined && (
            <div className={`stratego-piece ${myColor}`}>
              {getPieceDisplayRank({ rank: placed })}
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="stratego-setup">
      {/* Tray */}
      <div className="stratego-setup-tray">
        <h3>Your Pieces</h3>
        {tray.map(item => (
          <div
            key={String(item.rank)}
            className={`stratego-tray-item ${selectedRank === item.rank ? 'selected' : ''} ${item.remaining <= 0 ? 'depleted' : ''}`}
            onClick={() => selectFromTray(item.rank)}
          >
            <div className={`stratego-tray-icon ${myColor}`}>
              {getPieceDisplayRank({ rank: item.rank })}
            </div>
            <span className="stratego-tray-label">{getRankLabel(item.rank)}</span>
            <span className="stratego-tray-count">×{item.remaining}</span>
          </div>
        ))}
      </div>

      {/* Board & controls */}
      <div className="stratego-setup-main">
        <div className="stratego-setup-header">
          <h2>Place Your Pieces</h2>
          <p>
            {allPlaced
              ? 'All pieces placed! Click Ready when done.'
              : `Select a piece from the tray, then click a highlighted square. (${placedCount}/${TOTAL_PIECES_PER_PLAYER})`}
            {opponentReady && <span style={{ color: '#34d399', marginLeft: 8 }}>✓ Opponent ready</span>}
          </p>
        </div>

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
                  <div className="stratego-board">{renderBoard()}</div>
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

        <div className="stratego-setup-actions">
          <button className="stratego-btn stratego-btn-secondary" onClick={autoPlace}>
            🎲 Auto-place
          </button>
          <button className="stratego-btn stratego-btn-danger" onClick={clearAll}>
            Clear
          </button>
          <button
            className="stratego-btn stratego-btn-primary"
            disabled={!allPlaced || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting…' : '✅ Ready'}
          </button>
        </div>
      </div>
    </div>
  );
}
