import { buildDeck } from "../utils/gameUtils";

class Round {
    constructor(roundNum, players) {
        this._roundNum = roundNum;
        this._players = players;
        this._centerCards = [];
    }

    get roundNum() {
        return this._roundNum;
    }

    get players() {
        return this._players;
    }

    get centerCards() {
        return this._centerCards;
    }

    deal() {

    }

    toString() {
        return `${this._rank}${this._suit}`;
    }
}

export default Card;