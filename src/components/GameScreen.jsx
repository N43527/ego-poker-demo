import React from 'react';
import PlayerList from './PlayerList';
import ChatBox from './ChatBox';
import GameControls from './GameControls';

export default function GameScreen({
  gameData,
  localPlayerId,
  startGame,
  performAction,
  endGame,
  messageInput,
  setMessageInput,
  sendMessage,
  setPlayerReady,
  startNextRound
}) {
  if (!gameData) return null;

  const { id, players = {}, hands = {}, faceUps = [], actions = [], chatLog = [], status, host, currentTurn } = gameData;

  const isHost = host === localPlayerId;
  const yourTurn = currentTurn === localPlayerId;

  const [showGameOver, setShowGameOver] = React.useState(false);

  // Auto-start next round if everyone is ready (Host only)
  React.useEffect(() => {
    if (isHost && !gameData.roundActive && gameData.winner && status !== 'ended') {
      const allReady = Object.values(players).every(p => p.ready);
      if (allReady) {
        startNextRound();
      }
    }
  }, [gameData, isHost, startNextRound, status]);

  if (showGameOver) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '48px' }}>🏆 Game Over 🏆</h1>
        {gameData.gameWinner && (
          <h2>Winner: {players[gameData.gameWinner]?.name || gameData.gameWinner}</h2>
        )}

        <h3>Final Scores:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.entries(players)
            .sort(([, a], [, b]) => b.totalConfidence - a.totalConfidence)
            .map(([id, p]) => (
              <li key={id} style={{ fontSize: '18px', margin: '5px 0' }}>
                {p.name}: {p.totalConfidence}
              </li>
            ))}
        </ul>

        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  // Calculate positions for circular table
  const playerIds = Object.keys(players).sort();
  const totalPlayers = playerIds.length;
  const myIndex = playerIds.indexOf(localPlayerId);

  // Rotate array so "Me" is at index 0 (bottom)
  const rotatedIds = [
    ...playerIds.slice(myIndex),
    ...playerIds.slice(0, myIndex)
  ];

  const getPosition = (index, total) => {
    // Start from bottom (90 degrees) and go clockwise
    const angle = (index / total) * 2 * Math.PI + (Math.PI / 2);
    const radius = 230; // Reduced distance to prevent overflow
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` };
  };

  return (
    <div className="game-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 style={{ color: 'var(--accent-blue)', margin: '0 0 20px 0' }}>EGO POKER</h2>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid #333' }}>
          <div style={{ color: '#888', fontSize: '10px', letterSpacing: '1px', marginBottom: '5px' }}>LOBBY CODE</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', letterSpacing: '4px', fontFamily: 'monospace' }}>{id}</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ChatBox
            chatLog={chatLog}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            sendMessage={sendMessage}
          />
        </div>
        <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '10px' }}>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-area">
        {status === 'waiting' ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h1 className="glow-text" style={{ fontSize: '3rem', marginBottom: '10px' }}>WAITING FOR PLAYERS...</h1>
            <p style={{ color: '#888', marginBottom: '40px' }}>Share the Lobby Code to invite friends</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', maxWidth: '800px', margin: '0 auto 40px auto' }}>
              {Object.values(players).map(p => (
                <div key={p.name} className="glow-box" style={{
                  background: '#1e1e24',
                  padding: '20px',
                  borderRadius: '12px',
                  minWidth: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    border: '2px solid var(--accent-blue)'
                  }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{p.name}</div>
                </div>
              ))}
            </div>

            {isHost && (
              <button
                onClick={startGame}
                style={{
                  padding: '20px 60px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(188, 19, 254, 0.5)',
                  color: '#000'
                }}
              >
                START GAME
              </button>
            )}
          </div>
        ) : (
          <div className="poker-table">

            {/* Center Pot & Cards */}
            <div className="center-area">
              <div style={{ marginBottom: '15px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '1px' }}>CONFIDENCE</span>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--accent-purple)', textShadow: '0 0 15px rgba(188,19,254,0.6)' }}>
                  {gameData.confidence || 0}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {faceUps.map((card, i) => (
                  <div key={i} className="poker-card">{card}</div>
                ))}
              </div>

              {!gameData.roundActive && gameData.winner && (
                <div className="glow-box" style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                    Winner: {gameData.winner.split(', ').map(id => players[id]?.name).join(', ')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>{gameData.winReason}</div>

                  {/* Next Round / Results Button */}
                  <div style={{ marginTop: '10px' }}>
                    {status === 'ended' ? (
                      <button onClick={() => setShowGameOver(true)} style={{ background: 'var(--accent-blue)', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>See Results</button>
                    ) : (
                      !players[localPlayerId]?.ready ? (
                        <button onClick={setPlayerReady} style={{ background: 'var(--success)', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Ready</button>
                      ) : <span style={{ fontSize: '12px', color: '#888' }}>Waiting...</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Players */}
            {rotatedIds.map((pid, i) => {
              const p = players[pid];
              const isMe = pid === localPlayerId;
              const pos = getPosition(i, totalPlayers);
              const isActive = currentTurn === pid;

              return (
                <div
                  key={pid}
                  className={`player-seat ${isActive ? 'active' : ''}`}
                  style={{
                    left: pos.left,
                    top: pos.top,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="player-avatar">
                    {p.name.charAt(0).toUpperCase()}
                    {p.folded && <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'red' }}>FOLD</div>}
                  </div>

                  <div className="player-info">
                    <div style={{ fontWeight: 'bold', color: isMe ? 'var(--accent-blue)' : 'white' }}>{p.name}</div>
                    <div style={{ color: 'var(--accent-purple)' }}>{p.totalConfidence} pts</div>
                  </div>

                  <div className="player-cards">
                    {isMe ? (
                      hands[localPlayerId]?.map((c, k) => <div key={k} className="poker-card" style={{ width: '35px', height: '50px', fontSize: '0.8rem' }}>{c}</div>)
                    ) : (
                      <>
                        <div className="poker-card face-down" style={{ width: '35px', height: '50px' }}></div>
                        <div className="poker-card face-down" style={{ width: '35px', height: '50px' }}></div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* My Controls (Below Table) */}
        {status === 'in-progress' && (
          <div style={{ marginTop: 'auto', marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '12px', border: '1px solid #333' }}>
              <GameControls
                gameData={gameData}
                localPlayerId={localPlayerId}
                performAction={performAction}
                endGame={endGame}
              />
            </div>
          </div>
        )}
      </div>

      {/* Game Over Overlay */}
      {showGameOver && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 className="glow-text" style={{ fontSize: '48px', marginBottom: '20px' }}>GAME OVER</h1>
          <h2 style={{ color: 'var(--accent-blue)' }}>Winner: {players[gameData.gameWinner]?.name}</h2>

          <div style={{ margin: '30px 0', width: '300px' }}>
            {Object.entries(players)
              .sort(([, a], [, b]) => b.totalConfidence - a.totalConfidence)
              .map(([id, p], idx) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #333' }}>
                  <span>{idx + 1}. {p.name}</span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{p.totalConfidence}</span>
                </div>
              ))}
          </div>

          <button onClick={() => window.location.reload()} style={{ padding: '15px 30px', background: 'var(--accent-blue)', border: 'none', borderRadius: '30px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
