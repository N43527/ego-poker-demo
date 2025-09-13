// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, query, collection, where, getDocs } from 'firebase/firestore'; // Import query, collection, where, getDocs

// Helper to generate a UUID (similar to your current player ID but longer for more uniqueness)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const firebaseConfig = {
  apiKey: "AIzaSyBpZUfu31W_0z9CxI2tVGc6fIwDpAq5lD0",
  authDomain: "ego-demo.firebaseapp.com",
  projectId: "ego-demo",
  storageBucket: "ego-demo.firebasestorage.app",
  messagingSenderId: "6937934046",
  appId: "1:6937934046:web:75038e4b2227be6f28ea4f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [playerName, setPlayerName] = useState('');
  const [passkey, setPasskey] = useState(''); // New state for passkey
  const [gameId, setGameId] = useState('');
  const [gameData, setGameData] = useState(null);
  const [joinInput, setJoinInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState(''); // This will be the persistent ID
  const [isRegistered, setIsRegistered] = useState(false); // To track if current localPlayerId has a profile

  // --- Initial setup for persistent localPlayerId ---
  useEffect(() => {
    let storedPlayerId = localStorage.getItem('localPlayerId');
    if (!storedPlayerId) {
      storedPlayerId = generateUUID();
      localStorage.setItem('localPlayerId', storedPlayerId);
    }
    setLocalPlayerId(storedPlayerId);

    // Check if this localPlayerId has an existing profile
    const checkProfile = async () => {
      const profileRef = doc(db, 'profiles', storedPlayerId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        setIsRegistered(true);
        setPlayerName(profileSnap.data().name); // Pre-fill name if registered
      }
    };
    checkProfile();
  }, []); // Run once on component mount

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
        setGameId('');
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  // --- New Registration/Login Functions ---

  const registerProfile = async () => {
    if (!playerName || !passkey) { alert('Please enter both name and passkey!'); return; }
    if (localPlayerId === '') { alert('Error: No local player ID found.'); return; }

    const profileRef = doc(db, 'profiles', localPlayerId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      alert('This device already has a profile registered. If you want to use a different one, please use "Reconnect with Passkey" or clear your browser data.');
      return;
    }

    await setDoc(profileRef, {
      name: playerName,
      passkey: passkey // INSECURE for production, for demo simplicity
    });
    setIsRegistered(true);
    alert('Profile registered successfully!');
  };

  const reconnectWithPasskey = async () => {
    if (!playerName || !passkey) { alert('Please enter both name and passkey to reconnect!'); return; }

    // Query for a profile matching name AND passkey
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('name', '==', playerName), where('passkey', '==', passkey));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Found a matching profile
      const profileDoc = querySnapshot.docs[0];
      const retrievedPlayerId = profileDoc.id; // The document ID is the localPlayerId we need

      localStorage.setItem('localPlayerId', retrievedPlayerId); // Update local storage
      setLocalPlayerId(retrievedPlayerId); // Update state
      setIsRegistered(true);
      alert(`Reconnected as ${playerName}!`);
    } else {
      alert('No profile found with that name and passkey combination.');
    }
  };

  // --- Game Functions (Modified to use localPlayerId) ---

  const createGame = async () => {
    if (!playerName || !isRegistered) { alert('Please register or reconnect your player profile first!'); return; }
    const newGameId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const gameRef = doc(db, 'games', newGameId);

    await setDoc(gameRef, {
      status: 'waiting',
      players: {
        [localPlayerId]: { name: playerName, lastSeen: Date.now() }
      },
      chatLog: []
    });
    setGameId(newGameId);
  };

  const joinGame = async () => {
    if (!playerName || !isRegistered) { alert('Please register or reconnect your player profile first!'); return; }
    if (!joinInput) { alert('Please enter a Game ID!'); return; }

    const gameRef = doc(db, 'games', joinInput.toUpperCase());
    const docSnap = await getDoc(gameRef);

    if (docSnap.exists()) {
      // Add current player to the game
      await updateDoc(gameRef, {
        [`players.${localPlayerId}`]: { name: playerName, lastSeen: Date.now() }
      });
      setGameId(joinInput.toUpperCase());
    } else {
      alert('Game not found!');
    }
  };

  const sendMessage = async () => {
    if (!gameId || !messageInput || !localPlayerId) return;
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

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>♠ Ego Poker Demo Lobby</h1>

      {!gameId ? (
        // Pre-game Lobby UI
        <div>
          {!isRegistered && ( // Show registration/reconnect only if not registered
            <>
              <input
                type="text"
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{ marginRight: '10px', padding: '8px' }}
              />
              <input
                type="password" // Use password type to obscure input
                placeholder="Passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                style={{ marginRight: '10px', padding: '8px' }}
              />
              <button onClick={registerProfile} style={{ padding: '8px 15px', marginRight: '10px' }}>Register New Profile</button>
              <button onClick={reconnectWithPasskey} style={{ padding: '8px 15px' }}>Reconnect with Passkey</button>
              <br /><br />
            </>
          )}

          {isRegistered && ( // Show game creation/joining if registered
            <>
              <p>Welcome back, <strong>{playerName}</strong>!</p>
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
            </>
          )}
        </div>
      ) : (
        // In-game Lobby UI
        <div>
          <h2>Game ID: {gameId}</h2>
          <h3>Players:</h3>
          <ul>
            {gameData && Object.entries(gameData.players).map(([id, player]) => (
              <li key={id}>
                {player.name} {id === localPlayerId ? '(You)' : ''}
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