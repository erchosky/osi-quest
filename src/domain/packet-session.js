import { packetMissions } from '../data/packet-missions.js';
import { shuffle } from './random.js';
import { rewardXP } from './rewards.js';

/** Owns assembly rules; storage and DOM interactions belong to the feature controller. */
export class PacketSession {
  constructor({ difficulty = 'normal', random = Math.random, stageIds } = {}) {
    this.type = 'packet';
    this.kind = 'packet';
    this.difficulty = difficulty === 'hard' ? 'hard' : 'normal';
    this.missions = stageIds
      ? packetMissions.filter((mission) => stageIds.includes(mission.id))
      : packetMissions;
    this.retry = Boolean(stageIds);
    this.options = this.missions.map((mission) =>
      shuffle(
        mission.choices.filter((choice) => this.difficulty === 'hard' || !choice.hardOnly),
        random,
      ),
    );
    this.index = 0;
    this.selected = null;
    this.placements = [];
    this.outcomes = [];
    this.assisted = false;
    this.hadError = false;
    this.errors = 0;
    this.feedback = null;
    this.done = false;
    this.fillContext();
  }

  get current() {
    return this.missions[this.index];
  }
  get choices() {
    return this.options[this.index];
  }
  get placed() {
    return this.placements.includes(this.current.id);
  }

  fillContext() {
    if (!this.retry) return;
    const pending = this.missions.find((mission) => !this.placements.includes(mission.id));
    const before = pending
      ? packetMissions.findIndex((mission) => mission.id === pending.id)
      : packetMissions.length;
    for (const mission of packetMissions.slice(0, before))
      if (!this.placements.includes(mission.id)) this.placements.push(mission.id);
  }

  select(id) {
    if (this.done || this.placed || !this.choices.some((choice) => choice.id === id)) return false;
    this.selected = id;
    this.feedback = null;
    return true;
  }

  hint() {
    if (this.done || this.placed || this.assisted) return false;
    this.assisted = true;
    return true;
  }

  place() {
    if (this.done || this.placed || !this.selected) return null;
    const choice = this.choices.find((option) => option.id === this.selected);
    if (!choice) return null;
    const correct = choice.id === this.current.correctId;
    this.feedback = {
      correct,
      title: correct ? '¡Esta pieza encaja!' : 'Revisa qué función necesitas.',
      text: correct ? this.current.explanation : choice.why,
    };
    if (!correct) {
      this.hadError = true;
      this.errors++;
      return { correct: false, layer: this.current.layer, difficulty: this.difficulty, xp: 0 };
    }
    const outcome = {
      stageId: this.current.id,
      errors: this.errors,
      hintUsed: this.assisted,
      label: this.current.label,
      explanation: this.current.explanation,
      layer: this.current.layer,
      correct: true,
      assisted: this.assisted || this.hadError,
      difficulty: this.difficulty,
    };
    outcome.xp = this.practiceOnly ? 0 : rewardXP(outcome, this.difficulty);
    this.outcomes.push(outcome);
    this.placements.push(this.current.id);
    this.fillContext();
    return outcome;
  }

  next() {
    if (this.done || !this.placed) return false;
    if (this.index === this.missions.length - 1) {
      this.done = true;
      return true;
    }
    this.index += 1;
    this.selected = null;
    this.assisted = false;
    this.hadError = false;
    this.errors = 0;
    this.feedback = null;
    return true;
  }

  get result() {
    return {
      kind: this.kind,
      difficulty: this.difficulty,
      total: this.missions.length,
      correct: this.outcomes.filter((outcome) => !outcome.assisted).length,
      xp: this.outcomes.reduce((sum, outcome) => sum + outcome.xp, 0),
      outcomes: this.outcomes,
      missedIds: [],
    };
  }
}
