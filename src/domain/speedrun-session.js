import { QuizSession } from './quiz-session.js';
import { ActivityClock } from './activity-clock.js';
export class SpeedrunSession extends QuizSession {
  constructor(questions, { difficulty = 'normal', random = Math.random, now = Date.now } = {}) {
    if (!questions.length) throw new Error('No hay preguntas de capas disponibles.');
    super(questions, { kind: 'speedrun', difficulty, random });
    this.type = 'speedrun';
    this.timed = true;
    this.clock = new ActivityClock(now);
    this.limitMs = 60000;
    this.chain = 0;
    this.bestChain = 0;
    this.bonusMs = 0;
    this.finishReason = null;
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
    return outcome;
  }
  next() {
    if (this.tick()) return true;
    const moved = super.next();
    if (this.done) {
      this.finishReason = 'complete';
      this.clock.stop();
    }
    return moved;
  }
  get result() {
    const r = super.result;
    return {
      ...r,
      total: r.outcomes.length,
      planned: this.questions.length,
      bestChain: this.bestChain,
      finishReason: this.finishReason,
    };
  }
}
