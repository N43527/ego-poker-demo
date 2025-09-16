// src/App.jsx
import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, query, collection, where, getDocs } from 'firebase/firestore';

import { db } from './firebase';

import { generateUUID, buildDeck } from './utils/gameUtils';

import GameScreen from './components/GameScreen';
import Lobby from './components/Lobby';

function App() {
  const [playerName, setPlayerName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [gameId, setGameId] = useState('');
  const [gameData, setGameData] = useState(null);
  const [joinInput, setJoinInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  // --- Initial setup ---
  useEffect(() => {
    let storedPlayerId = localStorage.getItem('localPlayerId');
    if (!storedPlayerId) {
      storedPlayerId = generateUUID();
      localStorage.setItem('localPlayerId', storedPlayerId);
    }
    setLocalPlayerId(storedPlayerId);

    const checkProfile = async () => {
      const profileRef = doc(db, 'profiles', storedPlayerId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setIsRegistered(true);
        setPlayerName(profileSnap.data().name);
      }
    };
    checkProfile();
  }, []);

  // --- Listen for real-time updates ---
  useEffect(() => {
    if (!gameId) return;
    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameData({ ...docSnap.data(), id: docSnap.id });
      } else {
        setGameData(null);
        setGameId('');
      }
    });
    return () => unsubscribe();
  }, [gameId]);

  // --- Registration/Login ---
  const registerProfile = async () => {
    if (!playerName || !passkey) { alert('Enter both name and passkey!'); return; }
    const profileRef = doc(db, 'profiles', localPlayerId);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) { alert('This device already has a profile.'); return; }
    await setDoc(profileRef, { name: playerName, passkey });
    setIsRegistered(true);
  };

  const reconnectWithPasskey = async () => {
    if (!playerName || !passkey) return;
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('name', '==', playerName), where('passkey', '==', passkey));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const profileDoc = querySnapshot.docs[0];
      const retrievedPlayerId = profileDoc.id;
      localStorage.setItem('localPlayerId', retrievedPlayerId);
      setLocalPlayerId(retrievedPlayerId);
      setIsRegistered(true);
    } else {
      alert('No profile found with that name/passkey.');
    }
  };

  // --- Game functions ---
  const createGame = async () => {
    if (!isRegistered) return;
    const newGameId = Math.random().toString(36).substring(2, 6).toUpperCase();
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
  };

  const joinGame = async () => {
    if (!isRegistered || !joinInput) return;
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
  };

  const startGame = async () => {
    if (!gameId || !gameData) return;
    if (gameData.host !== localPlayerId) { alert('Only host can start'); return; }

    const deck = buildDeck();
    const hands = {};
    // card #1
    Object.keys(gameData.players).forEach(pid => {
      hands[pid] = [deck.pop()];
    });
    // card #2
    Object.keys(gameData.players).forEach(pid => {
      hands[pid].push(deck.pop());
    });

    const burned = deck.pop();
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
  };

  const performAction = async (action) => {
    if (!gameId || !gameData) return;
    if (gameData.currentTurn !== localPlayerId) return;

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
  };

  const endGame = async () => {
    if (!gameId || !gameData) return;
    if (gameData.host !== localPlayerId) return;
    await updateDoc(doc(db, 'games', gameId), { status: 'ended' });
  };

  const sendMessage = async () => {
    if (!gameId || !messageInput) return;
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      chatLog: arrayUnion({
        senderId: localPlayerId,
        senderName: playerName,
        message: messageInput,
        timestamp: Date.now()
      })
    });
    setMessageInput('');
  };

  // --- UI ---
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>♠ Ego Poker Demo Lobby</h1>

      {!gameId ? (
        <Lobby
          isRegistered={isRegistered}
          playerName={playerName}
          setPlayerName={setPlayerName}
          passkey={passkey}
          setPasskey={setPasskey}
          registerProfile={registerProfile}
          reconnectWithPasskey={reconnectWithPasskey}
          createGame={createGame}
          joinInput={joinInput}
          setJoinInput={setJoinInput}
          joinGame={joinGame}
        />
      ) : (
        <GameScreen
          gameData={gameData}
          localPlayerId={localPlayerId}
          startGame={startGame}
          performAction={performAction}
          endGame={endGame}
          messageInput={messageInput}
          setMessageInput={setMessageInput}
          sendMessage={sendMessage}
        />
      )}
    </div>
  );
}

export default App;