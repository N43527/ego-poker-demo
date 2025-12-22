import Card, { RANKS, SUITS } from "./Card";

class Deck {
    constructor() {
        this._cards = []
        for (let s of SUITS) {
            for (let r of RANKS) {
                this._cards.push(new Card(r, s));
            }
        }
        this.shuffle();
    }

    get cards() {
        return this._cards;
    }

    deal() {
        if (this._cards.length === 0) throw new Error("No cards left in deck");
        return this._cards.pop();
    }

    shuffle() {
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
    }

}
export default Deck;