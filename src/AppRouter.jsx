// src/AppRouter.jsx
import React, { useState } from 'react';
import App from './App';
import HomePage from './HomePage';
import StrategoApp from './stratego/StrategoApp';

export default function AppRouter() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'ego' | 'stratego'

  if (currentView === 'ego') {
    return (
      <div>
        <button
          onClick={() => setCurrentView('home')}
          style={{
            position: 'absolute', top: 16, left: 16, zIndex: 50,
            background: 'transparent', border: '1px solid #2a3040',
            color: '#7a8599', padding: '6px 14px', borderRadius: 6,
            cursor: 'pointer', fontSize: '0.85rem',
          }}
        >
          ← Home
        </button>
        <App />
      </div>
    );
  }

  if (currentView === 'stratego') {
    return <StrategoApp onBack={() => setCurrentView('home')} />;
  }

  return <HomePage onSelectGame={setCurrentView} />;
}
