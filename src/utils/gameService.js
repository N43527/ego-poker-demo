// src/utils/gameService.js
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { buildDeck } from './gameUtils';

// Create a new game
export async function createGame(localPlayerId, playerName, setGameId) {
  const newGameId = Math.random().toString(36).substring(2,6).toUpperCase();
  const gameRef = doc(db, 'games', newGameId);

  await setDoc(gameRef, {
    status: 'waiting',
    host: localPlayerId,
    players: { [localPlayerId]: { name: playerName, lastSeen: Date.now() } },
    chatLog: [],
    hands: {},
    actions: [],
    pot: 0,
    currentTurn: null,
    deck: [],
    faceUps: []
  });

  setGameId(newGameId);
  return newGameId;
}

// Join an existing game
export async function joinGame(localPlayerId, playerName, joinInput, setGameId) {
  const gameRef = doc(db, 'games', joinInput.toUpperCase());
  const docSnap = await getDoc(gameRef);
  if (docSnap.exists()) {
    await updateDoc(gameRef, {
      [`players.${localPlayerId}`]: { name: playerName, lastSeen: Date.now() }
    });
    setGameId(joinInput.toUpperCase());
  } else {
    alert('Game not found!');
  }
}

// Start the game
export async function startGame(gameId, gameData) {
  if (!gameId || !gameData) return;
  const deck = buildDeck();
  const hands = {};
  Object.keys(gameData.players).forEach(pid => {
    hands[pid] = [deck.pop(), deck.pop()];
  });
  const faceUps = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  const firstTurn = Object.keys(gameData.players)[0];

  await updateDoc(doc(db, 'games', gameId), {
    status: 'in-progress',
    deck,
    hands,
    faceUps,
    pot: 0,
    actions: [],
    currentTurn: firstTurn
  });
}

// Perform an action
export async function performAction(gameId, gameData, localPlayerId, playerName, action) {
  if (!gameId || !gameData) return;
  const players = Object.keys(gameData.players);
  const currentIndex = players.indexOf(localPlayerId);
  const nextTurn = players[(currentIndex + 1) % players.length];

  await updateDoc(doc(db, 'games', gameId), {
    actions: arrayUnion({
      playerId: localPlayerId,
      name: playerName,
      action,
      timestamp: Date.now()
    }),
    currentTurn: nextTurn
  });
}

// End the game
export async function endGame(gameId) {
  if (!gameId) return;
  await updateDoc(doc(db, 'games', gameId), { status: 'ended' });
}

// Send a chat message
export async function sendMessage(gameId, localPlayerId, playerName, message, setMessageInput) {
  if (!gameId || !message) return;
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    chatLog: arrayUnion({
      senderId: localPlayerId,
      senderName: playerName,
      message,
      timestamp: Date.now()
    })
  });
  if (setMessageInput) setMessageInput('');
}
