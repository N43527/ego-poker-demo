// src/components/PlayerList.jsx
import React from "react";

function PlayerList({ players, localPlayerId }) {
  if (!players) return null;

  return (
    <div>
      <h3>Players:</h3>
      <ul>
        {Object.entries(players).map(([id, player]) => (
          <li key={id}>
            {player.name} {id === localPlayerId ? "(You)" : ""} - Score: {player.totalConfidence || 0}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlayerList;
