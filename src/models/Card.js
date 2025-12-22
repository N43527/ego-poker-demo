export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS = ['h', 'd', 'c', 's'];

class Card {
    constructor(rank, suit) {
        if (!RANKS.includes(rank)) {
            throw new Error(`Invalid rank: ${rank}`);
        }
        if (!SUITS.includes(suit)) {
            throw new Error(`Invalid suit: ${suit}`);
        }
        this._rank = rank;
        this._suit = suit;
    }

    get rank() {
        return this._rank;
    }

    get suit() {
        return this._suit;
    }

    toString() {
        return `${this._rank}${this._suit}`;
    }
}

export default Card;