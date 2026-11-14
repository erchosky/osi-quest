import { layerLessons } from '../../data/layer-lessons/index.js';
import { practicalLessons } from '../../data/practical-lessons.js';
import { lessons } from '../../data/lessons.js';

export function lessonContent(unit) {
  return unit.layer ? layerLessons[unit.layer] : (lessons[unit.id] ?? practicalLessons[unit.id]);
}
