import { shuffle } from './random.js';
import { rewardXP } from './rewards.js';

export class OrderSession {
  constructor({
    direction = 'receive',
    difficulty = 'normal',
    random = Math.random,
    targetLayers,
  } = {}) {
    this.type = 'order';
    this.kind = 'order';
    this.direction = direction;
    this.difficulty = difficulty;
    this.bank = shuffle([1, 2, 3, 4, 5, 6, 7], random);
    this.targets = direction === 'receive' ? [1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1];
    this.routeTargets = [...this.targets];
    if (targetLayers) this.targets = this.targets.filter((layer) => targetLayers.includes(layer));
    this.retry = Boolean(targetLayers);
    this.contextLayers = this.routeTargets.filter((layer) => !this.targets.includes(layer));
    this.built = [];
    this.outcomes = [];
    this.assisted = false;
    this.hadError = false;
    this.errors = 0;
    this.feedback = null;
    this.done = false;
  }

  get expected() {
    return this.targets[this.built.length];
  }

  answer(layer) {
    if (
      this.done ||
      (!this.recovery && (this.built.includes(layer) || this.contextLayers.includes(layer))) ||
      !this.bank.includes(layer)
    )
      return null;
    const correct = layer === this.expected;
    this.feedback = { correct, layer, target: this.expected };
    if (!correct) {
      this.hadError = true;
      this.errors++;
      return { correct: false };
    }
    const outcome = {
      correct: true,
      layer,
      errors: this.errors,
      hintUsed: this.assisted,
      assisted: this.assisted || this.hadError,
      difficulty: this.difficulty,
    };
    outcome.xp = this.practiceOnly ? 0 : rewardXP(outcome);
    this.outcomes.push(outcome);
    this.built.push(layer);
    this.assisted = false;
    this.hadError = false;
    this.errors = 0;
    this.done = this.built.length === this.targets.length;
    return outcome;
  }

  hint() {
    if (this.done || this.assisted) return false;
    this.assisted = true;
    return true;
  }

  get result() {
    return {
      kind: 'order',
      difficulty: this.difficulty,
      total: this.targets.length,
      correct: this.outcomes.filter((outcome) => !outcome.assisted).length,
      xp: this.outcomes.reduce((sum, outcome) => sum + outcome.xp, 0),
      outcomes: this.outcomes,
      missedIds: [],
    };
  }
}
