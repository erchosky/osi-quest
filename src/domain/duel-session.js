import { QuizSession } from './quiz-session.js';
import { seededRandom } from './random.js';

export class DuelSession {
  constructor(
    questions,
    { difficulty = 'normal', names = ['Persona 1', 'Persona 2'], seed = 'duel' } = {},
  ) {
    this.type = 'duel';
    this.kind = 'duel';
    this.difficulty = difficulty;
    this.questions = questions;
    this.names = names.map(
      (name, index) =>
        String(name ?? '')
          .trim()
          .slice(0, 24) || `Persona ${index + 1}`,
    );
    this.players = this.names.map(
      () => new QuizSession(questions, { difficulty, random: seededRandom(seed) }),
    );
    this.index = 0;
    this.turn = 0;
    this.phase = 'handoff';
    this.done = false;
  }
  get playerIndex() {
    return (this.index + this.turn) % 2;
  }
  get current() {
    return this.questions[this.index];
  }
  get options() {
    return this.players[this.playerIndex].options[this.index];
  }
  get outcomes() {
    return this.players.map((player) => player.answers[this.current.id]);
  }
  beginTurn() {
    if (this.done || this.phase !== 'handoff') return false;
    this.phase = 'question';
    return true;
  }
  answer(choice) {
    if (this.done || this.phase !== 'question') return null;
    const player = this.players[this.playerIndex];
    player.jump(this.index);
    const outcome = player.answer(choice);
    if (!outcome) return null;
    if (this.turn === 0) {
      this.turn = 1;
      this.phase = 'handoff';
    } else this.phase = 'reveal';
    return outcome;
  }
  next() {
    if (this.done || this.phase !== 'reveal') return false;
    if (this.index === this.questions.length - 1) {
      this.done = true;
      return true;
    }
    this.index++;
    this.turn = 0;
    this.phase = 'handoff';
    return true;
  }
  get result() {
    const players = this.players.map((player, index) => ({
      ...player.result,
      name: this.names[index],
    }));
    return {
      kind: 'duel',
      difficulty: this.difficulty,
      total: this.questions.length * 2,
      correct: players.reduce((sum, player) => sum + player.correct, 0),
      xp: 0,
      players,
      outcomes: players.flatMap((player) => player.outcomes),
      missedIds: [...new Set(players.flatMap((player) => player.missedIds))],
    };
  }
}
