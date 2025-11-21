// src/utils/gameUtils.js

// Generate a UUID
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Suits and ranks for a standard poker deck
const suits = ['S', 'H', 'D', 'C'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

// Build a shuffled deck
export const buildDeck = () => {
    const deck = [];
    for (let s of suits) {
        for (let r of ranks) {
            deck.push(`${r}${s}`);
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};