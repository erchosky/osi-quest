import { layers } from '../../data/layers.js';

// A small original diagram, drawn locally; no image dependencies or animation loop.
export function drawLayerIllustration() {
  const canvas = document.querySelector('#layer-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#173d30';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#749085';
  context.setLineDash([3, 6]);
  context.beginPath();
  context.moveTo(365, 42);
  context.lineTo(365, 313);
  context.stroke();
  context.setLineDash([]);
  [...layers].reverse().forEach((layer, index) => {
    const x = 52 + index * 7;
    const y = 32 + index * 40;
    context.fillStyle = '#102e27';
    context.beginPath();
    (context.roundRect?.bind(context) ?? ((x, y, w, h) => context.rect(x, y, w, h)))(
      x + 6,
      y + 6,
      265,
      34,
      9,
    );
    context.fill();
    context.fillStyle = layer.tint;
    context.beginPath();
    (context.roundRect?.bind(context) ?? ((x, y, w, h) => context.rect(x, y, w, h)))(
      x,
      y,
      265,
      34,
      9,
    );
    context.fill();
    context.fillStyle = layer.color;
    context.font = 'bold 14px system-ui';
    context.fillText(String(layer.number), x + 14, y + 22);
    context.fillStyle = '#213d32';
    context.font = '600 13px system-ui';
    context.fillText(layer.name, x + 44, y + 22);
    context.fillStyle = '#365243';
    context.font = '11px system-ui';
    context.fillText(layer.verb, x + 183, y + 22);
  });
  context.fillStyle = '#d1ed90';
  context.font = 'bold 21px system-ui';
  context.fillText('↓', 357, 328);
}
