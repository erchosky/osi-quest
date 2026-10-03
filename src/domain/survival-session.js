import { QuizSession } from './quiz-session.js';
import { ActivityClock } from './activity-clock.js';

export class SurvivalSession extends QuizSession {
  constructor(
    questions,
    { difficulty = 'normal', random = Math.random, timed = false, now = Date.now } = {},
  ) {
    super(questions, { kind: 'survival', difficulty, random });
    this.type = 'survival';
    this.lives = 3;
    this.timed = timed;
    this.limitMs = 30000;
    this.now = now;
    this.questionClock = new ActivityClock(now);
    this.paused = false;
    this.active = false;
    this.finishReason = null;
  }
  setActive(active) {
    this.active = active;
    this.questionClock.setActive(active && !this.paused && !this.currentAnswer && !this.done);
  }
  get remainingMs() {
    return Math.max(0, this.limitMs - this.questionClock.elapsedMs);
  }
  togglePause() {
    this.paused = !this.paused;
    this.setActive(this.active);
  }
  tick() {
    if (!this.timed || this.done || this.currentAnswer || this.paused || this.remainingMs > 0)
      return null;
    const outcome = {
      question: this.current,
      selected: null,
      correct: false,
      assisted: false,
      timedOut: true,
      difficulty: this.difficulty,
      xp: 0,
    };
    this.answers[this.current.id] = outcome;
    this.lives--;
    this.questionClock.stop();
    return outcome;
  }
  answer(choice) {
    if (this.paused || this.done || this.currentAnswer) return null;
    const timeout = this.tick();
    if (timeout) return timeout;
    const outcome = super.answer(choice);
    if (outcome) {
      if (!outcome.correct) this.lives--;
      this.questionClock.stop();
    }
    return outcome;
  }
  hint() {
    if (this.done || this.currentAnswer || this.paused) return false;
    this.assisted = true;
    return true;
  }
  next() {
    if (this.done || !this.currentAnswer) return false;
    if (this.lives === 0 || this.index === this.questions.length - 1) {
      this.done = true;
      this.finishReason = this.lives === 0 ? 'lives' : 'complete';
      return true;
    }
    this.jump(this.index + 1);
    this.questionClock = new ActivityClock(this.now);
    this.setActive(this.active);
    return true;
  }
  get result() {
    const result = super.result;
    return {
      ...result,
      total: result.outcomes.length,
      planned: this.questions.length,
      lives: this.lives,
      finishReason: this.finishReason,
      timed: this.timed,
    };
  }
}
