import { layers } from '../data/layers.js';

export function layerMap(activeLayer = null, compact = false, practice = false) {
  return `<div class="layer-map ${compact ? 'compact' : ''}">${[...layers]
    .reverse()
    .map(
      (layer) =>
        `<a href="${practice ? `#/setup/focus?layer=${layer.number}` : `#/study/layer-${layer.number}`}" class="layer-row ${layer.number === activeLayer ? 'current' : ''}" style="--layer-color:${layer.color};--layer-tint:${layer.tint}"><span class="layer-number">${layer.number}</span><span>${layer.name}</span><span class="layer-verb">${layer.verb}</span></a>`,
    )
    .join('')}</div>`;
}
