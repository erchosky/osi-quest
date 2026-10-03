import { layers } from '../../data/layers.js';
import { html, pageHeading, progressBar, raw } from '../../components/html.js';

const path = [
  ...[...layers].reverse().map((layer) => ({ layer, sending: true })),
  ...layers.map((layer) => ({ layer, sending: false })),
];

export function journeyView(app) {
  const index = app.exploration.journeyStep;
  const { layer, sending } = path[index];
  return {
    section: 'explore',
    title: 'El viaje',
    html: html`<a class="text-link" href="#/explore">← Todas las herramientas</a>${raw(
        pageHeading(
          'DEL EMISOR AL RECEPTOR',
          'Sigue el viaje de un mensaje.',
          'Una visión conceptual de las responsabilidades OSI. Las funciones de las capas superiores pueden combinarse en los protocolos reales.',
        ),
      )}
      <section class="panel journey-panel">
        ${raw(progressBar(((index + 1) / path.length) * 100, 'Viaje del mensaje'))}
        <div class="journey-track">
          <span class="${sending ? 'active' : ''}">Tu dispositivo<br /><b>7 → 1</b></span>
          <div class="journey-line"><span>El medio físico</span>→</div>
          <span class="${!sending ? 'active' : ''}">El destino<br /><b>1 → 7</b></span>
        </div>
        <div class="journey-focus" style="--layer-color:${layer.color};--layer-tint:${layer.tint}">
          <span class="layer-number">${layer.number}</span>
          <p class="eyebrow">PASO ${index + 1} / 14 · ${sending ? 'EMISOR' : 'RECEPTOR'}</p>
          <h2>${layer.name}</h2>
          <p>${sending ? layer.journey : receiveText(layer)}</p>
          <span class="badge">${layer.verb} · ${layer.unit}</span>
        </div>
        <div class="journey-dots" aria-label="Elegir paso del recorrido">
          ${raw(
            path
              .map(
                (item, i) =>
                  html`<button
                    data-journey="${i}"
                    aria-label="Paso ${i + 1}, ${item.sending ? 'emisor' : 'receptor'}, ${
                      item.layer.name
                    }"
                    ${raw(i === index ? 'aria-current="step"' : '')}
                  >
                    ${item.layer.number}
                  </button>`,
              )
              .join(''),
          )}
        </div>
        <div class="game-actions">
          <button
            class="button button-secondary"
            id="journey-prev"
            ${index === 0 ? 'disabled' : ''}
          >
            ← Anterior</button
          ><a href="#/study/layer-${layer.number}" class="text-link">Entender esta capa</a
          ><button class="button button-primary" id="journey-next">
            ${index === 13 ? 'Volver al inicio ↻' : 'Siguiente paso →'}
          </button>
        </div>
      </section>`,
    bind() {
      document.querySelectorAll('[data-journey]').forEach((button) =>
        button.addEventListener('click', () => {
          app.exploration.journeyStep = Number(button.dataset.journey);
          app.refresh();
        }),
      );
      document.querySelector('#journey-prev').addEventListener('click', () => {
        app.exploration.journeyStep = Math.max(0, index - 1);
        app.refresh();
      });
      document.querySelector('#journey-next').addEventListener('click', () => {
        app.exploration.journeyStep = (index + 1) % 14;
        app.refresh();
      });
    },
  };
}

function receiveText(layer) {
  return [
    'Las señales recibidas se interpretan como bits.',
    'Se procesa la trama del enlace y se comprueba su información de control.',
    'Se procesa el paquete IP destinado al equipo receptor.',
    'El transporte dirige los datos al proceso correspondiente. TCP ofrece un flujo fiable y ordenado.',
    'La aplicación coordina el diálogo y los puntos de sincronización cuando corresponda.',
    'Se interpreta la representación de los datos para que su contenido sea comprensible.',
    'El servicio de aplicación procesa la petición. Ya puede generar una respuesta que hará su propio viaje.',
  ][layer.number - 1];
}
