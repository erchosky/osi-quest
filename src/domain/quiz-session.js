import { shuffle } from './random.js';
import { rewardXP } from './rewards.js';

/** Owns a round only. Persistence and rendering belong to other modules. */
export class QuizSession {
  constructor(
    questions,
    { kind = 'function', difficulty = 'normal', random = Math.random, practiceOnly = false } = {},
  ) {
    this.type = 'quiz';
    this.kind = kind;
    this.difficulty = difficulty;
    this.questions = questions;
    this.index = 0;
    this.answers = {};
    this.flags = new Set();
    this.assisted = false;
    this.done = false;
    this.reviewing = false;
    this.practiceOnly = practiceOnly;
    this.options = questions.map((question) => {
      const indices = question.choices.map((_, index) => index);
      const choices = question.layerQuestion
        ? [
            question.correctIndex,
            ...shuffle(
              indices.filter((index) => index !== question.correctIndex),
              random,
            ).slice(0, 3),
          ]
        : indices;
      return shuffle(choices, random);
    });
  }

  get current() {
    return this.questions[this.index];
  }
  get currentAnswer() {
    return this.answers[this.current.id];
  }
  get isExam() {
    return this.kind === 'exam';
  }

  answer(choice) {
    if (this.done || (!this.isExam && this.currentAnswer)) return null;
    if (!this.options[this.index].includes(choice)) return null;
    const outcome = {
      question: this.current,
      selected: choice,
      correct: choice === this.current.correctIndex,
      assisted: this.isExam ? false : this.assisted,
      difficulty: this.difficulty,
    };
    outcome.xp = this.practiceOnly ? 0 : rewardXP(outcome);
    this.answers[this.current.id] = outcome;
    return outcome;
  }

  next() {
    if (!this.isExam && !this.currentAnswer) return false;
    if (this.index === this.questions.length - 1) {
      if (this.isExam) this.reviewing = true;
      else this.done = true;
    } else this.jump(this.index + 1);
    return true;
  }

  jump(index) {
    if (index < 0 || index >= this.questions.length || this.done) return;
    this.index = index;
    this.assisted = false;
    this.reviewing = false;
  }

  toggleFlag() {
    if (this.flags.has(this.current.id)) this.flags.delete(this.current.id);
    else this.flags.add(this.current.id);
  }

  hint() {
    if (this.done || this.currentAnswer || this.isExam) return false;
    this.assisted = true;
    return true;
  }

  submit() {
    if (!this.isExam || this.done) return [];
    const outcomes = this.questions.map(
      (question) =>
        this.answers[question.id] ?? {
          question,
          selected: null,
          correct: false,
          assisted: false,
          difficulty: this.difficulty,
          xp: 0,
        },
    );
    for (const outcome of outcomes) this.answers[outcome.question.id] = outcome;
    this.done = true;
    return outcomes;
  }

  get result() {
    const outcomes = Object.values(this.answers);
    return {
      kind: this.kind,
      difficulty: this.difficulty,
      total: this.questions.length,
      correct: outcomes.filter((outcome) => outcome.correct && !outcome.assisted).length,
      xp: outcomes.reduce((sum, outcome) => sum + (this.practiceOnly ? 0 : outcome.xp), 0),
      missedIds: outcomes
        .filter((outcome) => !outcome.correct || outcome.assisted)
        .map((outcome) => outcome.question.id),
      outcomes,
    };
  }
}
