// src/components/ChatBox.jsx
import React from "react";

function ChatBox({ chatLog, messageInput, setMessageInput, sendMessage }) {
  return (
    <div>
      <h3>Chat:</h3>
      <div
        style={{
          border: "1px solid #ccc",
          height: "150px",
          overflowY: "scroll",
          marginBottom: "8px",
        }}
      >
        {chatLog?.map((chat, i) => (
          <p key={i}>
            <strong>{chat.senderName}:</strong> {chat.message}
          </p>
        ))}
      </div>
      <input
        placeholder="Message..."
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatBox;
