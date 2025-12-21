import Card from './Card';

class Hand {
    constructor(cards = []) {
        cards.forEach(c => {
            if (!(c instanceof Card)) throw new Error('Invalid Card');
        });
        this._cards = [...cards];
    }

    get cards() {
        return [...this._cards];
    }

    addCard(card) {
        if (!(card instanceof Card)) throw new Error('Invalid Card');
        this._cards.push(card);
    }

    resetHand() {
        this._cards = [];
    }

    toString() {
        return this._cards.map((card) => card.toString()).join(' ');
    }
}

export default Hand;