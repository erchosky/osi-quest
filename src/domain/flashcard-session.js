import { shuffle } from './random.js';

export class FlashcardSession {
  constructor(cards, random = Math.random) {
    this.type = 'flashcards';
    this.kind = 'flashcards';
    this.difficulty = 'normal';
    this.cards = shuffle(cards, random);
    this.index = 0;
    this.revealed = false;
    this.ratings = [];
  }
  get current() {
    return this.cards[this.index];
  }
  get done() {
    return this.index >= this.cards.length;
  }
  reveal() {
    if (!this.done) this.revealed = true;
  }
  rate(known = false) {
    if (!this.revealed || this.done) return null;
    const card = this.current;
    this.ratings.push({ cardId: card.id, layer: card.layer, correct: known, assisted: false });
    this.index += 1;
    this.revealed = false;
    return card;
  }
  get result() {
    return {
      kind: this.kind,
      difficulty: this.difficulty,
      total: this.cards.length,
      correct: this.ratings.filter((outcome) => outcome.correct).length,
      xp: 0,
      missedIds: this.ratings
        .filter((outcome) => !outcome.correct)
        .map((outcome) => outcome.cardId),
      outcomes: this.ratings,
      selfRated: true,
    };
  }
}
