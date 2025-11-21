// src/utils/gameService.js
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { buildDeck } from './gameUtils';
import { Hand } from 'pokersolver';

// Create a new game
export async function createGame(localPlayerId, playerName, setGameId) {
  const newGameId = Math.random().toString(36).substring(2, 6).toUpperCase();
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
        roundConfidence: 1
      }
    },
    chatLog: [],
    hands: {},
    actions: [],
    confidence: 1,
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

// Mark player as ready for next round
export async function setPlayerReady(gameId, localPlayerId) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    [`players.${localPlayerId}.ready`]: true
  });
}

// Start the round (Initial or Next)
export async function startRound(gameId, gameData) {
  if (!gameId || !gameData) return;

  const deck = buildDeck();
  const hands = {};
  const updates = {};

  // Common setup
  const faceUps = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];

  // Reset players
  Object.keys(gameData.players).forEach(pid => {
    hands[pid] = [deck.pop(), deck.pop()];
    updates[`players.${pid}.folded`] = false;
    updates[`players.${pid}.roundConfidence`] = 1;
    updates[`players.${pid}.ready`] = false; // Reset ready status
  });

  // Determine Turn
  let nextTurn;
  let roundNumber = gameData.roundNumber || 1;

  if (gameData.status === 'waiting') {
    // First round
    nextTurn = Object.keys(gameData.players).sort()[0];
  } else {
    // Next round
    roundNumber += 1;
    const playerIds = Object.keys(gameData.players).sort(); // Sort for consistent order
    const nextStartIdx = (roundNumber - 1) % playerIds.length;
    nextTurn = playerIds[nextStartIdx];
  }

  updates.status = 'in-progress';
  updates.deck = deck;
  updates.hands = hands;
  updates.faceUps = faceUps;
  updates.confidence = 1;
  updates.actions = [];
  updates.currentTurn = nextTurn;
  updates.roundActive = true;
  updates.winner = null;
  updates.winReason = null;
  updates.roundNumber = roundNumber;

  await updateDoc(doc(db, 'games', gameId), updates);
}

// Perform an action
export async function performAction(gameId, gameData, localPlayerId, playerName, action, value = 0) {
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
    // Validate raise
    const currentConfidence = data.confidence || 0;
    if (value <= currentConfidence || value > 10) {
      console.error("Invalid raise amount");
      return;
    }
    const raiseAction = await buildRaiseAction(gameRef, localPlayerId, value);
    updatePayload = { ...updatePayload, ...raiseAction };
  }

  // If the player CALLS → match the global confidence
  if (action === "Call") {
    const currentConfidence = data.confidence || 0;
    updatePayload[`players.${localPlayerId}.roundConfidence`] = currentConfidence;
  }

  // If the player FOLDS → mark them as folded
  if (action === "Fold") {
    const foldAction = buildFoldAction(localPlayerId);
    updatePayload = { ...updatePayload, ...foldAction };
  }

  // After applying the action, figure out who’s next
  const nextTurn = getNextActivePlayer(data.players, localPlayerId);

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
async function buildRaiseAction(gameRef, localPlayerId, value) {
  return {
    confidence: value, // Set global confidence to the new raised value
    [`players.${localPlayerId}.roundConfidence`]: value,
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
      currentTurn: null,
      winner: winnerId,
    };

    await updateDoc(gameRef, updates);
    await checkGameWinCondition(gameRef, winnerId, updates[`players.${winnerId}.totalConfidence`]);
    return;
  }

  // 2. Showdown Detection
  // Condition: More than 1 player, everyone matched confidence, everyone acted
  const globalConfidence = data.confidence || 0;
  const allMatched = activePlayers.every(pid => (players[pid].roundConfidence || 0) === globalConfidence);

  // Heuristic: If everyone matched and we have enough actions.
  // A simple proxy is if actions.length >= activePlayers.length (everyone had a chance).
  // Note: This is a simplification. In a real app, we'd track "actors this street".
  if (allMatched && data.actions.length >= activePlayers.length) {
    await evaluateShowdown(gameRef, data, activePlayers);
  }
}

async function evaluateShowdown(gameRef, data, activePlayerIds) {
  const hands = data.hands;
  const faceUps = data.faceUps;

  const solvedHands = activePlayerIds.map(pid => {
    const playerHand = hands[pid];
    const fullHand = [...playerHand, ...faceUps];
    const solved = Hand.solve(fullHand);
    solved.playerId = pid;
    return solved;
  });

  const winners = Hand.winners(solvedHands);
  const winnerIds = winners.map(w => w.playerId);

  const confidence = data.confidence || 0;
  const updates = {
    roundActive: false,
    currentTurn: null,
    winner: winnerIds.join(', '),
    winReason: winners[0].descr
  };

  // Scoring Logic: Winner +Conf, Loser -Conf
  const players = data.players;

  for (const pid of activePlayerIds) {
    const currentScore = players[pid].totalConfidence || 0;
    let newScore = currentScore;

    if (winnerIds.includes(pid)) {
      newScore += confidence;
    } else {
      newScore -= confidence;
    }

    updates[`players.${pid}.totalConfidence`] = newScore;

    // Check win condition (50 points)
    if (newScore >= 50) {
      updates.status = 'ended';
      updates.gameWinner = pid;
    }
  }

  await updateDoc(gameRef, updates);
}

async function checkGameWinCondition(gameRef, playerId, score) {
  if (score >= 50) {
    await updateDoc(gameRef, {
      status: 'ended',
      gameWinner: playerId
    });
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
