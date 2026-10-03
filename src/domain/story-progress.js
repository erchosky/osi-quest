import { storyChapters } from '../data/progress-catalog.js';

export function sanitizeStory(value) {
  const completed = [];
  for (const chapter of storyChapters) {
    if (!Array.isArray(value?.completed) || !value.completed.includes(chapter.id)) break;
    completed.push(chapter.id);
  }
  return { completed };
}
export function chapterUnlocked(completed, id) {
  const index = storyChapters.findIndex((chapter) => chapter.id === id);
  return (
    index >= 0 && storyChapters.slice(0, index).every((chapter) => completed.includes(chapter.id))
  );
}
export function unlockedActivities(completed) {
  return [
    ...new Set(
      storyChapters
        .filter((chapter) => completed.includes(chapter.id))
        .flatMap((chapter) => chapter.unlocks),
    ),
  ];
}
export function storyPassed(result) {
  return (
    result.outcomes.length === 3 && result.outcomes.filter((outcome) => outcome.correct).length >= 2
  );
}
