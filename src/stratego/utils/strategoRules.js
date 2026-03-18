// src/stratego/utils/strategoRules.js
import {
  BOARD_SIZE, LAKE_POSITIONS, PIECES, posToRowCol, rowColToPos,
} from './strategoConstants';

/** Can this piece move at all? */
export function isMovable(piece) {
  if (!piece) return false;
  const def = PIECES.find(p => p.rank === piece.rank);
  return def ? def.movable : false;
}

/** Return an array of valid destination positions for the piece at `fromPos`. */
export function getValidMoves(board, fromPos, playerColor) {
  const piece = board[String(fromPos)];
  if (!piece || piece.color !== playerColor || !isMovable(piece)) return [];

  const { row, col } = posToRowCol(fromPos);
  const moves = [];
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  if (piece.rank === 2) {
    // Scout — slides any distance in a straight line
    for (const [dr, dc] of DIRS) {
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const pos = rowColToPos(r, c);
        if (LAKE_POSITIONS.has(pos)) break;
        const target = board[String(pos)];
        if (target) {
          if (target.color !== playerColor) moves.push(pos); // can attack
          break; // blocked
        }
        moves.push(pos);
        r += dr;
        c += dc;
      }
    }
  } else {
    // Normal piece — 1 square orthogonally
    for (const [dr, dc] of DIRS) {
      const r = row + dr, c = col + dc;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue;
      const pos = rowColToPos(r, c);
      if (LAKE_POSITIONS.has(pos)) continue;
      const target = board[String(pos)];
      if (target && target.color === playerColor) continue;
      moves.push(pos);
    }
  }
  return moves;
}

/**
 * Resolve a battle.
 * @returns {'attacker' | 'defender' | 'both'}
 */
export function resolveBattle(attacker, defender) {
  if (defender.rank === 'F') return 'attacker';           // Flag captured
  if (defender.rank === 'B') {
    return attacker.rank === 3 ? 'attacker' : 'defender'; // Miner defuses bombs
  }
  if (attacker.rank === 1 && defender.rank === 10) return 'attacker'; // Spy kills Marshal
  if (typeof attacker.rank === 'number' && typeof defender.rank === 'number') {
    if (attacker.rank > defender.rank) return 'attacker';
    if (attacker.rank < defender.rank) return 'defender';
    return 'both'; // equal rank
  }
  return 'defender'; // fallback
}

/** Check if either side has lost. Returns winning color or null. */
export function checkWinCondition(board) {
  let redFlag = false, blueFlag = false;
  let redMoves = false, blueMoves = false;

  for (const pos in board) {
    const p = board[pos];
    if (!p) continue;
    if (p.rank === 'F') { if (p.color === 'red') redFlag = true; else blueFlag = true; }
    if (isMovable(p)) {
      const moves = getValidMoves(board, parseInt(pos), p.color);
      if (moves.length > 0) { if (p.color === 'red') redMoves = true; else blueMoves = true; }
    }
  }
  if (!redFlag)  return 'blue';
  if (!blueFlag) return 'red';
  if (!redMoves) return 'blue';
  if (!blueMoves) return 'red';
  return null;
}
