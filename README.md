# Ego Poker ♠️

A psychological poker variant built with React and Firebase.

**Playabale at https://ego-demo.web.app/**

## 🌟 Current Status: Stable Demo (v1.0)
This version represents the stable, functional "MVP" of the Ego Poker application before a planned major architectural refactor. All core game mechanics, multiplayer synchronization, and UI themes are working.

### Features
-   **Multiplayer Lobby**: Create games, join via 4-letter codes.
-   **Real-time Gameplay**: Powered by Firebase Firestore.
-   **Game Logic**:
    -   5 Community Cards (Face Up).
    -   "Confidence" Betting System (1-10).
    -   Showdown evaluation using `pokersolver`.
    -   Scoring system (+/- Confidence points).
-   **UI**: Modern "Neon Dark" aesthetic with split layout and circular table.

## 🛠️ Tech Stack
-   **Frontend**: React, Vite
-   **Backend**: Firebase Firestore (Serverless)
-   **Styling**: CSS Modules / Global CSS
-   **State Management**: React Hooks + Firestore Subscription

## 🚀 How to Run
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
3.  **Build for Production**:
    ```bash
    npm run build
    ```

## ⚠️ Note on Refactor
The `main` branch is about to undergo a transition to an **Object-Oriented Architecture** (Layered Pattern). If looking for the functional-style implementation, refer to the commit tagged `stable-v1-functional`.
