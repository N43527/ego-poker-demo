// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBpZUfu31W_0z9CxI2tVGc6fIwDpAq5lD0",
  authDomain: "ego-demo.firebaseapp.com",
  projectId: "ego-demo",
  storageBucket: "ego-demo.firebasestorage.app",
  messagingSenderId: "6937934046",
  appId: "1:6937934046:web:75038e4b2227be6f28ea4f"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [gameData, setGameData] = useState(null); // Stores real-time game state
  const [joinInput, setJoinInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState(''); // Unique ID for this client

  // Generate a unique ID for this player session
  useEffect(() => {
    setCurrentPlayerId(Math.random().toString(36).substring(2, 9));
  }, []);

  // Listen for real-time updates to the game document
  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameData(docSnap.data());
      } else {
        console.log("No such game!");
        setGameData(null);
        setGameId(''); // Clear gameId if game disappears
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [gameId]); // Re-run effect if gameId changes

  const createGame = async () => {
    if (!playerName) { alert('Please enter your name!'); return; }
    const newGameId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const gameRef = doc(db, 'games', newGameId);

    await setDoc(gameRef, {
      status: 'waiting',
      players: {
        [currentPlayerId]: { name: playerName, lastSeen: Date.now() }
      },
      chatLog: []
    });
    setGameId(newGameId);
  };

  const joinGame = async () => {
    if (!playerName) { alert('Please enter your name!'); return; }
    if (!joinInput) { alert('Please enter a Game ID!'); return; }

    const gameRef = doc(db, 'games', joinInput.toUpperCase());
    const docSnap = await getDoc(gameRef);

    if (docSnap.exists()) {
      // Add current player to the game
      await updateDoc(gameRef, {
        [`players.${currentPlayerId}`]: { name: playerName, lastSeen: Date.now() }
      });
      setGameId(joinInput.toUpperCase());
    } else {
      alert('Game not found!');
    }
  };

  const sendMessage = async () => {
    if (!gameId || !messageInput) return;
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      chatLog: arrayUnion({
        senderId: currentPlayerId,
        senderName: playerName,
        message: messageInput,
        timestamp: Date.now()
      })
    });
    setMessageInput(''); // Clear input after sending
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>♠ Ego Poker Demo Lobby</h1>

      {!gameId ? (
        // Pre-game Lobby UI
        <div>
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ marginRight: '10px', padding: '8px' }}
          />
          <button onClick={createGame} style={{ padding: '8px 15px', marginRight: '10px' }}>Create New Game</button>
          <br /><br />
          <input
            type="text"
            placeholder="Enter Game ID"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            style={{ marginRight: '10px', padding: '8px' }}
          />
          <button onClick={joinGame} style={{ padding: '8px 15px' }}>Join Game</button>
        </div>
      ) : (
        // In-game Lobby UI
        <div>
          <h2>Game ID: {gameId}</h2>
          <h3>Players:</h3>
          <ul>
            {gameData && Object.entries(gameData.players).map(([id, player]) => (
              <li key={id}>
                {player.name} {id === currentPlayerId ? '(You)' : ''}
              </li>
            ))}
          </ul>

          <h3>Chat:</h3>
          <div style={{ border: '1px solid #ccc', padding: '10px', height: '150px', overflowY: 'scroll', marginBottom: '10px' }}>
            {gameData && gameData.chatLog.map((chat, index) => (
              <p key={index} style={{ margin: '0' }}>
                <strong>{chat.senderName}:</strong> {chat.message}
              </p>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            style={{ width: 'calc(100% - 100px)', padding: '8px' }}
          />
          <button onClick={sendMessage} style={{ padding: '8px 15px', marginLeft: '10px' }}>Say Hi!</button>
        </div>
      )}
    </div>
  );
}

export default App;
