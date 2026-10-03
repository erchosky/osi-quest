import { storyById } from '../../data/story.js';
import { chapterUnlocked } from '../../domain/story-progress.js';
import { applyRecovery } from '../../domain/recovery.js';
import { questions, questionById } from '../../data/questions/index.js';
import { misconceptions, misconceptionQuestions } from '../../data/misconceptions.js';
import { cases } from '../../data/cases.js';
import { flashcards } from '../../data/flashcards.js';
import { OrderSession } from '../../domain/order-session.js';
import { QuizSession } from '../../domain/quiz-session.js';
import { FlashcardSession } from '../../domain/flashcard-session.js';
import { MatchingSession } from '../../domain/matching-session.js';
import { PacketSession } from '../../domain/packet-session.js';
import { seededRandom } from '../../domain/random.js';
import { shuffle } from '../../domain/random.js';
import { SurvivalSession } from '../../domain/survival-session.js';
import { SpeedrunSession } from '../../domain/speedrun-session.js';
import { DuelSession } from '../../domain/duel-session.js';
import {
  selectByLayer,
  selectExam,
  selectAdaptive,
  selectProtocols,
  eligibleQuestions,
} from '../../domain/question-selection.js';

export function createSession(kind, options, progress) {
  const session = makeSession(kind, options, progress);
  session.practiceOnly = Boolean(options.practiceOnly);
  return options.recovery ? applyRecovery(session, progress) : session;
}

function makeSession(kind, options, progress) {
  const difficulty = options.difficulty ?? 'normal';
  const random = options.seed === undefined ? Math.random : seededRandom(options.seed);
  if (kind === 'matching')
    return new MatchingSession({ difficulty, random, taskIds: options.taskIds });
  if (kind === 'packet')
    return new PacketSession({ difficulty, random, stageIds: options.stageIds });
  if (kind === 'order')
    return new OrderSession({
      difficulty,
      direction: options.direction ?? 'receive',
      random,
      targetLayers: options.targetLayers,
    });
  if (kind === 'speedrun')
    return new SpeedrunSession(
      shuffle(
        eligibleQuestions(questions, difficulty).filter((q) => q.layerQuestion),
        random,
      ),
      { difficulty, random, now: options.now },
    );
  if (kind === 'survival') {
    const base = selectExam(questions, difficulty, random);
    const ids = new Set(base.map((question) => question.id));
    const extras = shuffle(
      eligibleQuestions(questions, difficulty).filter((question) => !ids.has(question.id)),
      random,
    );
    return new SurvivalSession([...base, ...extras].slice(0, 20), {
      difficulty,
      random,
      timed: options.timed === true || options.timed === 'on',
      now: options.now,
    });
  }
  if (kind === 'duel')
    return new DuelSession(selectByLayer(questions, 'scenario', difficulty, random), {
      difficulty,
      names: [options.player1, options.player2],
      seed: `duel-${random()}`,
    });
  if (kind === 'flashcards') {
    const now = Date.now();
    const due = flashcards.filter(
      (card) => !progress.cards[card.id] || progress.cards[card.id].due <= now,
    );
    const selected = options.cardIds
      ? flashcards.filter((card) => options.cardIds.includes(card.id))
      : due.length
        ? due
        : flashcards;
    const session = new FlashcardSession(selected);
    session.earlyReview = !due.length;
    session.retry = Boolean(options.cardIds);
    return session;
  }
  let selected;
  let caseStudy;
  if (kind === 'story') {
    const chapter = storyById.get(options.chapterId);
    if (!chapter || !chapterUnlocked(progress.story?.completed ?? [], chapter.id))
      throw new Error('Completa el capítulo anterior para abrir este.');
    selected = chapter.questions;
  } else if (kind === 'confusions')
    selected = shuffle(
      misconceptions.find((item) => item.id === options.conceptId)?.questions ??
        misconceptionQuestions,
      random,
    );
  else if (kind === 'retry')
    selected = [...new Set(options.questionIds ?? [])]
      .map((id) => questionById.get(id))
      .filter(Boolean);
  else if (kind === 'exam') selected = selectExam(questions, difficulty, random);
  else if (kind === 'focus') {
    const pool = eligibleQuestions(questions, difficulty).filter(
      (q) => q.layer === Number(options.layer),
    );
    const preferred =
      difficulty === 'hard'
        ? [
            ...shuffle(
              pool.filter((q) => q.difficulty === 'hard'),
              random,
            ),
            ...shuffle(
              pool.filter((q) => q.difficulty === 'normal'),
              random,
            ),
          ]
        : shuffle(pool, random);
    selected = shuffle(preferred.slice(0, 10), random);
  } else if (kind === 'adaptive')
    selected = selectAdaptive(questions, progress.stats, difficulty, Date.now(), random);
  else if (kind === 'protocol') selected = selectProtocols(questions, difficulty, random);
  else if (kind === 'cases') {
    caseStudy = cases.find((item) => item.id === options.caseId) ?? cases[0];
    selected = caseStudy.questionIds.map((id) => questions.find((question) => question.id === id));
  } else selected = selectByLayer(questions, kind, difficulty, random);
  if (!selected.length) throw new Error('No hay preguntas disponibles para este repaso.');
  const session = new QuizSession(selected, {
    kind,
    difficulty: kind === 'confusions' ? 'normal' : difficulty,
    random,
    practiceOnly: Boolean(options.practiceOnly),
  });
  session.caseStudy =
    caseStudy ?? (kind === 'retry' ? cases.find((item) => item.id === options.caseId) : null);
  if (kind === 'story' || (kind === 'retry' && storyById.has(options.chapterId))) {
    session.storyChapter = storyById.get(options.chapterId);
    session.label = session.storyChapter.title;
  }
  session.retry = kind === 'retry';
  if (kind === 'focus') {
    session.focusLayer = Number(options.layer);
    session.label = `Práctica · Capa ${session.focusLayer}`;
  }
  if (kind === 'retry') session.label = 'Solo tus fallos';
  if (kind === 'confusions')
    session.label =
      misconceptions.find((item) => item.id === options.conceptId)?.title ??
      'Confusiones superadas';
  return session;
}
