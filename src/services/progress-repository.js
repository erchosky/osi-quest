import { serializeProgress, verifyIntegrity } from './progress-integrity.js';
import { assertSafeStructure } from './safe-data.js';
import { storyById } from '../data/progress-catalog.js';
import { chapterUnlocked, storyPassed } from '../domain/story-progress.js';
import { RECOVERY_WAIT } from '../domain/recovery.js';
import { emptyProgress, sanitizeProgress, STORAGE_KEY } from './progress-schema.js';
import { localDay, recordQuestion, scheduleCard } from '../domain/scheduling.js';
import { rewardXP } from '../domain/rewards.js';
import { misconceptionByQuestion } from '../data/progress-catalog.js';
import { recordConcept } from '../domain/concept-badges.js';
import { activityOptions, PLAY_FILTERS } from '../domain/activity-preferences.js';
import { units } from '../data/units.js';

export function createProgressRepository(
  storage,
  { onReward = () => {}, onStatusChange = () => {}, onSave = () => {} } = {},
) {
  let data = emptyProgress();
  let persistent = Boolean(storage);
  let writeBlocked = false;
  let original = null;
  let issue = storage ? null : 'unavailable';
  let batching = false;
  let batchReward = null;
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    if (stored != null) {
      original = stored;
      if (new TextEncoder().encode(stored).length > 2_000_000)
        throw new Error('Progreso demasiado grande');
      const candidate = JSON.parse(stored);
      assertSafeStructure(candidate);
      if (
        ![1, 2, 3].includes(candidate.version) ||
        !Array.isArray(candidate.read) ||
        !candidate.stats ||
        typeof candidate.stats !== 'object' ||
        Array.isArray(candidate.stats)
      )
        throw new Error('Formato de progreso no reconocido');
      verifyIntegrity(candidate);
      data = sanitizeProgress(candidate);
      original = null;
    }
  } catch {
    persistent = false;
    writeBlocked = true;
    issue = original !== null ? 'corrupt' : 'unavailable';
  }

  function persist() {
    if (batching || writeBlocked) return;
    const priorIssue = issue;
    try {
      storage?.setItem(STORAGE_KEY, serializeProgress(data));
      persistent = Boolean(storage);
      issue = storage ? null : 'unavailable';
    } catch (error) {
      persistent = false;
      issue = error.name === 'QuotaExceededError' ? 'quota' : 'unavailable';
    }
    if (persistent) onSave();
    if (issue !== priorIssue) onStatusChange(issue);
  }
  function activity() {
    const day = localDay();
    if (!data.days.includes(day)) data.days.push(day);
  }
  function reward(layer, kind, outcome) {
    const amount = rewardXP(outcome);
    if (!amount) return;
    const previousXP = data.xp;
    data.xp += amount;
    if (
      !outcome.assisted &&
      !outcome.recovery &&
      layer &&
      ['order', 'function', 'scenario', 'protocol', 'matching', 'packet'].includes(kind)
    ) {
      const achievement = `${kind}-${layer}`;
      if (!data.mastered.includes(achievement)) data.mastered.push(achievement);
    }
    if (outcome.recovery && outcome.recoveryKey)
      data.recoveryRewards[outcome.recoveryKey] = Date.now() + RECOVERY_WAIT;
    const notice = {
      amount,
      previousXP,
      totalXP: data.xp,
      difficulty: outcome.difficulty ?? 'normal',
    };
    if (batching)
      batchReward = batchReward
        ? { ...notice, previousXP: batchReward.previousXP, amount: batchReward.amount + amount }
        : notice;
    else onReward(notice);
  }
  const repository = {
    get data() {
      return data;
    },
    get persistent() {
      return persistent;
    },
    get storageIssue() {
      return issue;
    },
    get originalProgress() {
      return original;
    },
    setRadarLevel(level) {
      if (['all', 'normal', 'hard'].includes(level)) {
        data.radarLevel = level;
        persist();
      }
    },
    setDifficulty(difficulty) {
      data.difficulty = difficulty === 'hard' ? 'hard' : 'normal';
      persist();
    },
    setPlayFilter(filter) {
      if (!PLAY_FILTERS.includes(filter)) return;
      data.playFilter = filter;
      persist();
    },
    activityOptions(kind) {
      return activityOptions(kind, data.activityPreferences[kind], data.difficulty);
    },
    rememberActivity(kind, options) {
      const preferences = activityOptions(kind, options, data.difficulty);
      if (!preferences) return;
      data.activityPreferences[kind] = preferences;
      persist();
    },
    rememberLesson(unitId, sectionIndex = 0) {
      if (!units.some((unit) => unit.id === unitId)) return;
      data.lessonBookmark = {
        unitId,
        sectionIndex: Number.isInteger(sectionIndex) ? Math.min(100, Math.max(0, sectionIndex)) : 0,
      };
      persist();
    },
    setRead(id, read = true) {
      if (!units.some((unit) => unit.id === id)) return;
      if (read && !data.read.includes(id)) data.read.push(id);
      if (!read) data.read = data.read.filter((unitId) => unitId !== id);
      activity();
      persist();
    },
    markRead(id) {
      if (!data.read.includes(id)) data.read.push(id);
      activity();
      persist();
    },
    completeChapter(id, result) {
      const chapter = storyById.get(id);
      if (!chapter || !chapterUnlocked(data.story.completed, id) || !storyPassed(result))
        return false;
      if (!data.story.completed.includes(id)) {
        data.story.completed.push(id);
        activity();
        persist();
      }
      return true;
    },
    recordAnswers(outcomes, kind) {
      batching = true;
      batchReward = null;
      try {
        return outcomes.map((outcome) => repository.recordAnswer(outcome, kind));
      } finally {
        batching = false;
        persist();
        if (batchReward) onReward(batchReward);
        batchReward = null;
      }
    },
    recordAnswer(outcome, kind) {
      if (outcome.recovery) {
        reward(outcome.question.layer, kind, outcome);
        activity();
        persist();
        return null;
      }
      const { question, correct, assisted } = outcome;
      const prior = data.stats[question.id];
      const difficulty = outcome.difficulty === 'hard' ? 'hard' : 'normal';
      data.stats[question.id] = {
        ...recordQuestion(prior, correct, assisted),
        levels: {
          ...prior?.levels,
          [difficulty]: recordQuestion(prior?.levels?.[difficulty], correct, assisted),
        },
      };
      const concept = misconceptionByQuestion.get(question.id);
      let earned = null;
      if (concept) {
        const before = data.concepts[concept.id];
        const updated = recordConcept(before, outcome);
        data.concepts[concept.id] = updated;
        if (!before?.earnedAt && updated.earnedAt) earned = concept;
      }
      reward(question.layer, kind, outcome);
      activity();
      persist();
      return earned;
    },
    recordOrder(outcome) {
      reward(outcome.layer, 'order', outcome);
      activity();
      persist();
    },
    recordActivity(outcome, kind) {
      reward(outcome.layer, kind, outcome);
      activity();
      persist();
    },
    rateCard(id, known) {
      data.cards[id] = scheduleCard(data.cards[id], known);
      activity();
      persist();
    },
    recordRound(result) {
      data.history.push({
        mode: result.kind,
        when: Date.now(),
        total: result.total,
        correct: result.correct,
        xp: result.xp,
        difficulty: result.difficulty,
        durationMs: result.durationMs ?? null,
        timed: Boolean(result.timed),
        retry: Boolean(result.retry),
        recovery: Boolean(result.recovery),
        challengeCode: result.challengeCode ?? null,
        caseId: result.caseId ?? null,
        chapterId: result.chapterId ?? null,
        focusLayer: result.focusLayer ?? null,
        direction: result.direction ?? null,
        failures: result.failures ?? [],
        players:
          result.players?.map((player, index) => ({
            name: index === 0 ? 'Jugador A' : 'Jugador B',
            correct: player.correct,
            total: player.total,
          })) ?? [],
      });
      data.history = data.history.slice(-30);
      persist();
    },
    clearHistory() {
      data.history = [];
      persist();
    },
    export({ includeHistory = true } = {}) {
      return serializeProgress({ ...data, history: includeHistory ? data.history : [] }, true);
    },
    restore(candidate) {
      verifyIntegrity(candidate);
      const validated = sanitizeProgress(candidate);
      data = validated;
      writeBlocked = false;
      original = null;
      persist();
    },
    reset() {
      data = emptyProgress();
      writeBlocked = false;
      original = null;
      persist();
    },
  };
  return repository;
}
