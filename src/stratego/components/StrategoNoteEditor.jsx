// src/stratego/components/StrategoNoteEditor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { PIECES, getPieceDisplayRank, getRankLabel } from '../utils/strategoConstants';

// All possible ranks for the selector
const RANK_OPTIONS = PIECES.map(p => p.rank); // ['F','B',1,2,...,10]

export default function StrategoNoteEditor({ pieceId, currentNote, onSave, onClose }) {
  // currentNote = { text, perceivedRank, confidence } or null
  const [text, setText] = useState(currentNote?.text || '');
  const [perceivedRank, setPerceivedRank] = useState(currentNote?.perceivedRank ?? null);
  const [confidence, setConfidence] = useState(currentNote?.confidence || 'probable');
  const textareaRef = useRef(null);

  useEffect(() => {
    // Focus textarea on mount
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleSave = () => {
    const noteData = {
      text: text.trim(),
      perceivedRank: perceivedRank,
      confidence: perceivedRank != null ? confidence : null,
    };

    // If everything is empty, treat as clear
    if (!noteData.text && noteData.perceivedRank == null) {
      onSave(pieceId, null);
    } else {
      onSave(pieceId, noteData);
    }
    onClose();
  };

  const handleClear = () => {
    onSave(pieceId, null);
    onClose();
  };

  const toggleRank = (rank) => {
    setPerceivedRank(prev => prev === rank ? null : rank);
  };

  return (
    <div className="stratego-note-overlay" onClick={onClose}>
      <div className="stratego-note-card" onClick={e => e.stopPropagation()}>

        {/* Perceived Rank Selector */}
        <h4>🎯 Tag Piece — Perceived Rank</h4>
        <div className="stratego-rank-grid">
          {RANK_OPTIONS.map(rank => (
            <button
              key={String(rank)}
              className={`stratego-rank-badge ${perceivedRank === rank ? 'active' : ''}`}
              onClick={() => toggleRank(rank)}
              title={getRankLabel(rank)}
            >
              {getPieceDisplayRank({ rank })}
            </button>
          ))}
        </div>

        {/* Confidence Selector — only when a rank is selected */}
        {perceivedRank != null && (
          <div className="stratego-confidence-row">
            <span className="stratego-confidence-label">Confidence:</span>
            <button
              className={`stratego-confidence-btn certain ${confidence === 'certain' ? 'active' : ''}`}
              onClick={() => setConfidence('certain')}
            >
              ✓✓ Certain
            </button>
            <button
              className={`stratego-confidence-btn probable ${confidence === 'probable' ? 'active' : ''}`}
              onClick={() => setConfidence('probable')}
            >
              ? Probable
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="stratego-note-divider" />

        {/* Free-form text note */}
        <h4 style={{ marginTop: 0 }}>📝 Note</h4>
        <textarea
          ref={textareaRef}
          className="stratego-note-textarea"
          placeholder="e.g. 'Moved 3 squares — must be Scout' or 'Hasn't moved, could be Bomb or Flag'"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
        />

        {/* Actions */}
        <div className="stratego-note-actions">
          {(currentNote?.text || currentNote?.perceivedRank != null) && (
            <button className="stratego-btn stratego-btn-danger" onClick={handleClear}>Clear All</button>
          )}
          <button className="stratego-btn stratego-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="stratego-btn stratego-btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
