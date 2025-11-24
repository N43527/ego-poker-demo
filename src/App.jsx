// src/App.jsx
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from './firebase';
import { generateUUID } from './utils/gameUtils';
import { createGame, joinGame, startRound, performAction, endGame, sendMessage, setPlayerReady } from './utils/gameService';
import { registerProfile as registerProfileService, reconnectWithPasskey as reconnectService, checkProfile } from './utils/profileService';

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

    const loadProfile = async () => {
      const profileData = await checkProfile(storedPlayerId);
      if (profileData) {
        setIsRegistered(true);
        setPlayerName(profileData.name);
      }
    };
    loadProfile();
  }, []);

  // --- Listen for real-time game updates ---
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

  // --- Registration ---
  const registerProfile = async () => {
    const result = await registerProfileService(localPlayerId, playerName, passkey);
    if (result.success) setIsRegistered(true);
    else alert(result.message);
  };

  // --- Reconnect ---
  const reconnectWithPasskey = async () => {
    const retrievedPlayerId = await reconnectService(playerName, passkey);
    if (retrievedPlayerId) {
      localStorage.setItem('localPlayerId', retrievedPlayerId);
      setLocalPlayerId(retrievedPlayerId);
      setIsRegistered(true);
    } else {
      alert('No profile found with that name/passkey.');
    }
  };

  // --- UI ---
  return (
    <div style={{ fontFamily: 'sans-serif', height: '100vh', overflow: 'hidden' }}>
      {!gameId ? (
        <div style={{ padding: '20px' }}>
          <h1>♠ Ego Poker Demo Lobby</h1>
          <Lobby
            isRegistered={isRegistered}
            playerName={playerName}
            setPlayerName={setPlayerName}
            passkey={passkey}
            setPasskey={setPasskey}
            registerProfile={registerProfile}
            reconnectWithPasskey={reconnectWithPasskey}
            createGame={() => createGame(localPlayerId, playerName, setGameId)}
            joinInput={joinInput}
            setJoinInput={setJoinInput}
            joinGame={() => joinGame(localPlayerId, playerName, joinInput, setGameId)}
          />
        </div>
      ) : (
        <GameScreen
          gameData={gameData}
          localPlayerId={localPlayerId}
          startGame={() => startRound(gameId, gameData)}
          performAction={(action, value) => performAction(gameId, gameData, localPlayerId, playerName, action, value)}
          endGame={() => endGame(gameId)}
          setPlayerReady={() => setPlayerReady(gameId, localPlayerId)}
          startNextRound={() => startRound(gameId, gameData)}
          messageInput={messageInput}
          setMessageInput={setMessageInput}
          sendMessage={() => sendMessage(gameId, localPlayerId, playerName, messageInput, setMessageInput)}
        />
      )}
    </div>
  );
}

export default App;