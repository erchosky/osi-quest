import { matchingTasks } from '../data/matching.js';
import { shuffle } from './random.js';
import { rewardXP } from './rewards.js';

export class MatchingSession {
  constructor({ difficulty = 'normal', random = Math.random, taskIds } = {}) {
    this.type = 'matching';
    this.kind = 'matching';
    this.difficulty = difficulty === 'hard' ? 'hard' : 'normal';
    this.layerOrder = shuffle([1, 2, 3, 4, 5, 6, 7], random);
    this.cards = shuffle(
      this.layerOrder.map((layer) => {
        const candidates = matchingTasks.filter(
          (task) => task.layer === layer && task.difficulty === this.difficulty,
        );
        return { ...candidates[Math.floor(random() * candidates.length)] };
      }),
      random,
    );
    if (taskIds) {
      this.cards = shuffle(
        matchingTasks.filter((task) => taskIds.includes(task.id)),
        random,
      );
      this.layerOrder = shuffle([1, 2, 3, 4, 5, 6, 7], random);
    }
    this.retry = Boolean(taskIds);
    this.selectedTask = null;
    this.selectedLayer = null;
    this.matched = [];
    this.outcomes = [];
    this.hinted = new Set();
    this.assisted = new Set();
    this.errorCounts = new Map();
    this.feedback = null;
    this.done = false;
  }

  get current() {
    return this.cards.find((task) => task.id === this.selectedTask) ?? null;
  }

  get summary() {
    return {
      selectedTask: this.selectedTask,
      selectedLayer: this.selectedLayer,
      matched: [...this.matched],
      total: this.cards.length,
      tasks: this.cards.map(({ id, title, prompt }) => ({ id, title, prompt })),
    };
  }

  selectTask(id) {
    if (this.done || this.matched.includes(id) || !this.cards.some((task) => task.id === id))
      return null;
    this.feedback = null;
    this.selectedTask = this.selectedTask === id ? null : id;
    return this.selectedTask && this.selectedLayer
      ? this.pair(this.selectedTask, this.selectedLayer)
      : null;
  }

  selectLayer(layer) {
    if (
      this.done ||
      !this.layerOrder.includes(layer) ||
      this.outcomes.some((outcome) => outcome.layer === layer)
    )
      return null;
    this.feedback = null;
    this.selectedLayer = this.selectedLayer === layer ? null : layer;
    return this.selectedTask && this.selectedLayer
      ? this.pair(this.selectedTask, this.selectedLayer)
      : null;
  }

  pair(id, layer) {
    const task = this.cards.find((card) => card.id === id);
    if (
      this.done ||
      !task ||
      this.matched.includes(id) ||
      !this.layerOrder.includes(layer) ||
      this.outcomes.some((outcome) => outcome.layer === layer)
    )
      return null;
    this.selectedTask = id;
    this.selectedLayer = null;
    if (task.layer !== layer) {
      this.assisted.add(id);
      this.errorCounts.set(id, (this.errorCounts.get(id) ?? 0) + 1);
      this.feedback = { correct: false, taskId: id, layer, explanation: task.explanation };
      return null;
    }
    const outcome = {
      taskId: id,
      layer,
      errors: this.errorCounts.get(id) ?? 0,
      hintUsed: this.hinted.has(id),
      correct: true,
      assisted: this.assisted.has(id),
      difficulty: this.difficulty,
    };
    outcome.xp = this.practiceOnly ? 0 : rewardXP(outcome, this.difficulty);
    this.outcomes.push(outcome);
    this.matched.push(id);
    this.selectedTask = null;
    this.feedback = {
      correct: true,
      taskId: id,
      layer,
      explanation: task.explanation,
      xp: outcome.xp,
    };
    this.done = this.matched.length === this.cards.length;
    return outcome;
  }

  hint(id = this.selectedTask) {
    if (this.done || this.matched.includes(id) || !this.cards.some((task) => task.id === id))
      return false;
    this.selectedTask = id;
    this.selectedLayer = null;
    this.hinted.add(id);
    this.assisted.add(id);
    return true;
  }

  get result() {
    return {
      kind: this.kind,
      difficulty: this.difficulty,
      total: this.cards.length,
      correct: this.outcomes.filter((outcome) => !outcome.assisted).length,
      xp: this.outcomes.reduce((sum, outcome) => sum + outcome.xp, 0),
      outcomes: [...this.outcomes],
      missedIds: [],
    };
  }
}
