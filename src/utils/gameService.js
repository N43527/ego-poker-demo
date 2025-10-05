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
    players: { 
      [localPlayerId]: { 
        name: playerName, 
        lastSeen: Date.now(),
        folded: false,
        totalConfidence: 0,
        roundConfidence: 0 
      } 
    },
    chatLog: [],
    hands: {},
    actions: [],
    confidence: 0,
    roundNumber: 1,
    roundActive: true,
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
      [`players.${localPlayerId}`]: { 
        name: playerName, 
        lastSeen: Date.now(),
        totalConfidence: 0,
        roundConfidence: 0 
      }
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
    confidence: 0,
    actions: [],
    currentTurn: firstTurn
  });
}

// Perform an action
export async function performAction(gameId, gameData, localPlayerId, playerName, action) {
  if (!gameId || !gameData) return;

  const gameRef = doc(db, "games", gameId);

  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;

  const data = snap.data();

  // 🛑 Guard: if round has ended, no actions allowed
  if (!data.roundActive) {
    console.warn("Round already ended — no further actions allowed.");
    return;
  }

  // Define the generic action payload
  const baseAction = {
    playerId: localPlayerId,
    name: playerName,
    action,
    timestamp: Date.now(),
  };

  // Default update payload (for Call, Fold, etc.)
  let updatePayload = {
    actions: arrayUnion(baseAction),
  };

  // If the player RAISES → modify payload accordingly
  if (action === "Raise") {
    const raiseAction = await buildRaiseAction(gameRef, localPlayerId, baseAction);
    updatePayload = { ...updatePayload, ...raiseAction };
  }

  // If the player FOLDS → mark them as folded
  if (action === "Fold") {
    const foldAction = buildFoldAction(localPlayerId);
    updatePayload = { ...updatePayload, ...foldAction };
  }

  // After applying the action, figure out who’s next
  const nextTurn = getNextActivePlayer(data, localPlayerId);

  // If no next active player → end round
  if (!nextTurn) {
    updatePayload.roundActive = false;
    updatePayload.currentTurn = null;
  } else {
    updatePayload.currentTurn = nextTurn;
  }

  await updateDoc(gameRef, updatePayload);

  // After update, check if round should end
  await checkRoundStillActive(gameRef);
}

// Helper function for Raise
async function buildRaiseAction(gameRef, localPlayerId, baseAction) {
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return {};

  const data = snap.data();
  const currentConfidence = data.confidence || 0;
  const newConfidence = currentConfidence + 1;

  return {
    confidence: newConfidence, // global confidence increment
    [`players.${localPlayerId}.roundConfidence`]: newConfidence,
  };
}

function buildFoldAction(localPlayerId) {
  return {
    [`players.${localPlayerId}.folded`]: true,
    [`players.${localPlayerId}.roundConfidence`]: 0,
  };
}

function getNextActivePlayer(players, currentPlayerId) {
  const playerIds = Object.keys(players);
  const total = playerIds.length;
  const currentIndex = playerIds.indexOf(currentPlayerId);

  for (let i = 1; i <= total; i++) {
    const nextId = playerIds[(currentIndex + i) % total];
    if (!players[nextId].folded) {
      return nextId;
    }
  }

  // No active players left (should trigger round end soon)
  return null;
}


async function checkRoundStillActive(gameRef) {
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const players = data.players || {};

  // Get all active players (not folded)
  const activePlayers = Object.entries(players)
    .filter(([_, p]) => !p.folded)
    .map(([id]) => id);

  // If only one player remains → they win this round
  if (activePlayers.length === 1) {
    const winnerId = activePlayers[0];
    const confidence = data.confidence || 0;

    const updates = {
      [`players.${winnerId}.totalConfidence`]:
        (players[winnerId].totalConfidence || 0) + confidence,
      roundActive: false,
      winner: winnerId,
    };

    await updateDoc(gameRef, updates);
  }
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
