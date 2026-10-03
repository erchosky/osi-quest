import { layers } from '../data/layers.js';
export function answerLayer(number) {
  const layer = layers.find((item) => item.number === number);
  if (!layer)
    return '<div class="answer-layer"><span class="revealed-layer" data-revealed-layer="0">Fundamentos · el modelo completo</span></div>';
  return `<div class="answer-layer"><span class="revealed-layer" data-revealed-layer="${number}" style="--layer-color:${layer.color};--layer-tint:${layer.tint}">Capa ${number} · ${layer.name}</span><div class="answer-minimap" aria-hidden="true">${[
    ...layers,
  ]
    .reverse()
    .map(
      (item) =>
        `<span class="mini-layer ${item.number === number ? 'is-active' : ''}" data-mini-layer="${item.number}" style="--layer-color:${item.color};--layer-tint:${item.tint}" title="Capa ${item.number}: ${item.name}">${item.number}</span>`,
    )
    .join('')}</div></div>`;
}
