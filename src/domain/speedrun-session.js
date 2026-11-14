import { QuizSession } from './quiz-session.js';
import { shuffle } from './random.js';
import { ActivityClock } from './activity-clock.js';
export class SpeedrunSession extends QuizSession {
  constructor(questions, { difficulty = 'normal', random = Math.random, now = Date.now } = {}) {
    if (!questions.length) throw new Error('No hay preguntas de capas disponibles.');
    super(questions, { kind: 'speedrun', difficulty, random });
    this.type = 'speedrun';
    this.bank = [...questions];
    this.random = random;
    this.attempts = [];
    this.cycle = 1;
    this.timed = true;
    this.clock = new ActivityClock(now);
    this.limitMs = 60000;
    this.chain = 0;
    this.bestChain = 0;
    this.bonusMs = 0;
    this.finishReason = null;
  }
  get outcomes() {
    return this.attempts;
  }
  get attemptNumber() {
    return this.attempts.length + (this.currentAnswer ? 0 : 1);
  }
  setActive(active) {
    this.clock.setActive(Boolean(active && !this.done));
  }
  get remainingMs() {
    return Math.max(0, this.limitMs - this.clock.elapsedMs);
  }
  tick() {
    if (this.done || this.remainingMs > 0) return false;
    this.done = true;
    this.finishReason = 'time';
    this.clock.stop();
    return true;
  }
  answer(choice) {
    if (this.tick()) return null;
    const outcome = super.answer(choice);
    if (!outcome) return null;
    this.chain = outcome.correct && !outcome.assisted ? this.chain + 1 : 0;
    this.bestChain = Math.max(this.bestChain, this.chain);
    outcome.timeBonusMs = this.chain ? (this.chain >= 5 ? 4000 : this.chain >= 3 ? 3000 : 2000) : 0;
    this.bonusMs = outcome.timeBonusMs;
    this.limitMs += this.bonusMs;
    this.attempts.push(outcome);
    return outcome;
  }
  next() {
    if (this.tick()) return true;
    if (this.done || !this.currentAnswer) return false;
    if (this.index < this.questions.length - 1) return super.next();
    // A cycle is a shuffled traversal of the bank, not the end of the timed round.
    const previousId = this.current.id;
    const nextBank = shuffle(this.bank, this.random);
    if (nextBank.length > 1 && nextBank[0].id === previousId) {
      [nextBank[0], nextBank[1]] = [nextBank[1], nextBank[0]];
    }
    const cycle = new QuizSession(nextBank, { random: this.random });
    this.questions = cycle.questions;
    this.options = cycle.options;
    this.answers = {};
    this.index = 0;
    this.assisted = false;
    this.bonusMs = 0;
    this.cycle += 1;
    return true;
  }

  get result() {
    const r = super.result;
    return {
      ...r,
      total: this.attempts.length,
      correct: this.attempts.filter((o) => o.correct && !o.assisted).length,
      xp: this.attempts.reduce((sum, o) => sum + (this.practiceOnly ? 0 : o.xp), 0),
      missedIds: [
        ...new Set(this.attempts.filter((o) => !o.correct || o.assisted).map((o) => o.question.id)),
      ],
      outcomes: [...this.attempts],
      planned: this.questions.length,
      bestChain: this.bestChain,
      finishReason: this.finishReason,
    };
  }
}
