import { routeLink } from './html.js';

export function questionStudyLink(question) {
  return question.layer
    ? routeLink(
        `study/layer-${question.layer}`,
        `Entender la capa ${question.layer} →`,
        'text-link',
      )
    : routeLink('study/basics', 'Revisar los fundamentos →', 'text-link');
}
