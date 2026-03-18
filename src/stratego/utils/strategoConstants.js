// src/stratego/utils/strategoConstants.js

export const BOARD_SIZE = 10;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

// Lake positions (impassable) — two 2×2 lakes in the middle
export const LAKE_POSITIONS = new Set([
  42, 43, 52, 53,   // Left lake  (rows 4-5, cols 2-3)
  46, 47, 56, 57    // Right lake (rows 4-5, cols 6-7)
]);

// Piece definitions: rank, name, count per player
export const PIECES = [
  { rank: 'F', name: 'Flag',       count: 1, movable: false },
  { rank: 'B', name: 'Bomb',       count: 6, movable: false },
  { rank: 1,   name: 'Spy',        count: 1, movable: true },
  { rank: 2,   name: 'Scout',      count: 8, movable: true },
  { rank: 3,   name: 'Miner',      count: 5, movable: true },
  { rank: 4,   name: 'Sergeant',   count: 4, movable: true },
  { rank: 5,   name: 'Lieutenant', count: 4, movable: true },
  { rank: 6,   name: 'Captain',    count: 4, movable: true },
  { rank: 7,   name: 'Major',      count: 3, movable: true },
  { rank: 8,   name: 'Colonel',    count: 2, movable: true },
  { rank: 9,   name: 'General',    count: 1, movable: true },
  { rank: 10,  name: 'Marshal',    count: 1, movable: true },
];

export const TOTAL_PIECES_PER_PLAYER = 40;

// Setup zones (row indices)
export const RED_SETUP_ROWS = [6, 7, 8, 9];
export const BLUE_SETUP_ROWS = [0, 1, 2, 3];

// --- Helpers ---

export function posToRowCol(pos) {
  return { row: Math.floor(pos / BOARD_SIZE), col: pos % BOARD_SIZE };
}

export function rowColToPos(row, col) {
  return row * BOARD_SIZE + col;
}

export function isLake(pos) {
  return LAKE_POSITIONS.has(pos);
}

export function getSetupPositions(color) {
  const rows = color === 'red' ? RED_SETUP_ROWS : BLUE_SETUP_ROWS;
  const positions = [];
  for (const row of rows) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push(rowColToPos(row, col));
    }
  }
  return positions;
}

export function getPieceDisplayRank(piece) {
  if (!piece) return '';
  if (piece.rank === 'F') return '🏴';
  if (piece.rank === 'B') return '💣';
  if (piece.rank === 1) return 'S';
  return String(piece.rank);
}

export function getPieceName(rank) {
  const p = PIECES.find(x => x.rank === rank);
  return p ? p.name : '?';
}

export function getRankLabel(rank) {
  if (rank === 'F') return 'Flag';
  if (rank === 'B') return 'Bomb';
  if (rank === 1)  return 'Spy (1)';
  const p = PIECES.find(x => x.rank === rank);
  return p ? `${p.name} (${rank})` : String(rank);
}

/** Convert position index to human-readable label, e.g. 0 → "A1", 99 → "J10" */
export function posToLabel(pos) {
  const { row, col } = posToRowCol(pos);
  const colLetter = String.fromCharCode(65 + col); // A-J
  return `${colLetter}${row + 1}`;
}
