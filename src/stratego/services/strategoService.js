// src/stratego/services/strategoService.js
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { resolveBattle } from '../utils/strategoRules';

const COLLECTION = 'strategoGames';

export async function createStrategoGame(localPlayerId, playerName) {
  const gameId = Math.random().toString(36).substring(2, 6).toUpperCase();
  const gameRef = doc(db, COLLECTION, gameId);
  await setDoc(gameRef, {
    status: 'waiting',
    host: localPlayerId,
    players: {
      [localPlayerId]: { name: playerName, color: 'red', ready: false },
    },
    board: {},
    currentTurn: null,
    turnNumber: 0,
    lastBattle: null,
    lastMove: null,
    winner: null,
    winnerName: null,
    chatLog: [],
    capturedPieces: [],
    createdAt: Date.now(),
  });
  return gameId;
}

export async function joinStrategoGame(localPlayerId, playerName, gameCode) {
  const code = gameCode.trim().toUpperCase();
  const gameRef = doc(db, COLLECTION, code);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) throw new Error('Game not found');
  const data = snap.data();
  if (Object.keys(data.players).length >= 2) throw new Error('Game is full');
  if (data.players[localPlayerId]) throw new Error('Already in game');

  await updateDoc(gameRef, {
    [`players.${localPlayerId}`]: { name: playerName, color: 'blue', ready: false },
    status: 'setup',
  });
  return code;
}

export async function submitSetup(gameId, playerId, pieces) {
  const gameRef = doc(db, COLLECTION, gameId);
  const updates = {};
  for (const [pos, piece] of Object.entries(pieces)) {
    updates[`board.${pos}`] = piece;
  }
  updates[`players.${playerId}.ready`] = true;
  await updateDoc(gameRef, updates);

  // Check if both players are ready → transition to in-progress
  const snap = await getDoc(gameRef);
  const data = snap.data();
  const allReady = Object.values(data.players).every(p => p.ready);
  if (allReady) {
    const redId = Object.entries(data.players).find(([, p]) => p.color === 'red')[0];
    await updateDoc(gameRef, { status: 'in-progress', currentTurn: redId, turnNumber: 1 });
  }
}

export async function makeMove(gameId, playerId, fromPos, toPos) {
  const gameRef = doc(db, COLLECTION, gameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.currentTurn !== playerId || data.status !== 'in-progress') return;

  const board = data.board || {};
  const attacker = board[String(fromPos)];
  const defender = board[String(toPos)];
  if (!attacker) return;

  const playerColor = data.players[playerId].color;
  if (attacker.color !== playerColor) return;

  const updates = {};
  const otherPlayerId = Object.keys(data.players).find(id => id !== playerId);

  if (defender && defender.color !== playerColor) {
    // --- Battle ---
    const result = resolveBattle(attacker, defender);
    updates.lastBattle = {
      attackerPiece: { ...attacker, revealed: true },
      defenderPiece: { ...defender, revealed: true },
      result, fromPos, toPos,
      timestamp: Date.now(),
    };

    if (result === 'attacker') {
      updates[`board.${fromPos}`] = null;
      updates[`board.${toPos}`] = { ...attacker, revealed: true };
      updates.capturedPieces = arrayUnion({ rank: defender.rank, color: defender.color });
      if (defender.rank === 'F') {
        updates.winner = playerId;
        updates.winnerName = data.players[playerId].name;
        updates.status = 'ended';
      }
    } else if (result === 'defender') {
      updates[`board.${fromPos}`] = null;
      updates[`board.${toPos}`] = { ...defender, revealed: true };
      updates.capturedPieces = arrayUnion({ rank: attacker.rank, color: attacker.color });
    } else {
      updates[`board.${fromPos}`] = null;
      updates[`board.${toPos}`] = null;
      updates.capturedPieces = arrayUnion(
        { rank: attacker.rank, color: attacker.color },
        { rank: defender.rank, color: defender.color }
      );
    }
  } else {
    // --- Simple move ---
    updates[`board.${fromPos}`] = null;
    updates[`board.${toPos}`] = attacker;
    updates.lastBattle = null;
  }

  // Always record lastMove for board highlighting
  updates.lastMove = {
    fromPos, toPos,
    playerColor,
    wasBattle: !!(defender && defender.color !== playerColor),
    timestamp: Date.now(),
  };

  if (updates.status !== 'ended') {
    updates.currentTurn = otherPlayerId;
    updates.turnNumber = (data.turnNumber || 0) + 1;
  }
  await updateDoc(gameRef, updates);
}

export function subscribeToStrategoGame(gameId, callback) {
  const gameRef = doc(db, COLLECTION, gameId);
  return onSnapshot(gameRef, (snap) => {
    callback(snap.exists() ? { ...snap.data(), id: snap.id } : null);
  });
}
