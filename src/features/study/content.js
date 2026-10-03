import { layers } from '../../data/layers.js';
import { stories } from '../../data/stories.js';
import { practicalLessons } from '../../data/practical-lessons.js';
import { lessons } from '../../data/lessons.js';

export function lessonContent(unit) {
  if (!unit.layer) return lessons[unit.id] ?? practicalLessons[unit.id];
  const layer = layers.find((item) => item.number === unit.layer);
  const story = stories.find((item) => item.layer === unit.layer);
  return {
    introduction: layer.description,
    sections: [
      {
        title: '¿Para qué sirve?',
        paragraphs: [layer.purpose],
        items: [
          `Verbo para recordarla: ${layer.verb.toLowerCase()}.`,
          `Unidad de datos: ${layer.unit}.`,
          `Ejemplos: ${layer.examples}`,
        ],
      },
      { title: story.title, paragraphs: story.paragraphs },
      {
        title: 'Conéctalo con una red real',
        paragraphs: [layer.journey, layer.analogy],
        items: [layer.caution],
      },
    ],
    takeaway: story.takeaway,
    check: {
      prompt: layer.scenario,
      choices: layers.map((item) => `${item.number}. ${item.name}`),
      correctIndex: layer.number - 1,
      explanation: layer.reason,
    },
  };
}
