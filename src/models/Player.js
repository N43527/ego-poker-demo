import Hand from "./Hand";

class Player {
    constructor(id, name) {
        this._id = id;
        this._name = name;
        this._hand = new Hand();
        this._totalScore = 0;
        this._roundConfidence = 0;
        this._isFolded = false;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get hand() {
        return this._hand;
    }

    get isFolded() {
        return this._isFolded;
    }

    get totalScore() {
        return this._totalScore;
    }

    get roundConfidence() {
        return this._roundConfidence;
    }

    deal(card) {
        this._hand.addCard(card);
    }

    toString() {
        return `Player ${this._name} (${this._id})`;
    }

    handToString() {
        return this._hand.toString();
    }

    bet(amount) {
        if (amount < 1) throw new Error("Player cannot bet less than 1");
        this._roundConfidence = amount;
    }

    fold() {
        if (this._isFolded) return;
        this._isFolded = true;
    }

    awardPoints(points) {
        this._totalScore += points;
    }

    resetRoundState() {
        this._isFolded = false;
        this._roundConfidence = 0;
        this._hand.resetHand();
    }

}

export default Player;