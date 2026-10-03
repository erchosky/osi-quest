import { html, pageHeading, raw } from '../../components/html.js';

const envelopes = [
  {
    name: 'Datos de aplicación',
    layer: '7–5 · Funciones de aplicación',
    short: 'HTTP',
    detail:
      'Una petición HTTP representa lo que la aplicación solicita. Aquí usamos una conexión sobre TCP como ejemplo.',
  },
  {
    name: 'Segmento TCP',
    layer: '4 · Transporte',
    short: 'TCP',
    detail:
      'Añade puertos de origen y destino y datos de control, como números de secuencia. La fiabilidad de TCP no implica cifrado.',
  },
  {
    name: 'Paquete IP',
    layer: '3 · Red',
    short: 'IP',
    detail:
      'Añade las direcciones IP. Los routers usan la información de red para decidir el siguiente salto.',
  },
  {
    name: 'Trama Ethernet',
    layer: '2 · Enlace',
    short: 'Ethernet',
    detail:
      'Añade MAC para el enlace y un control de errores. En otro enlace se prepara una nueva trama.',
  },
  {
    name: 'Señales',
    layer: '1 · Física',
    short: 'Bits',
    detail:
      'Los bits se representan mediante señales eléctricas en este ejemplo de Ethernet sobre cobre. Con fibra se usaría luz; un medio inalámbrico utiliza radio.',
  },
];

function nestedEnvelope(step) {
  if (step === 4)
    return html`<div class="signal-display">
      <span>01001000 01010100 01010100 01010000</span
      ><svg viewBox="0 0 500 60" role="img" aria-label="Representación esquemática de una señal">
        <path
          d="M0 45H25V15H50V45H90V15H135V45H175V15H210V45H270V15H300V45H360V15H410V45H445V15H500"
        />
      </svg>
      <p>Bits convertidos en señales · ilustración conceptual</p>
    </div>`;
  let content =
    '<div class="envelope envelope-data"><strong>Datos</strong><span>GET / · petición HTTP</span></div>';
  for (let index = 1; index <= step; index++) {
    const labels = [
      '',
      'Puertos · secuencia',
      'IP origen → IP destino',
      'MAC origen → MAC siguiente salto',
    ];
    content = html`<div class="envelope envelope-${index}">
      <header><strong>${envelopes[index].name}</strong><span>${labels[index]}</span></header>
      ${raw(content)}${raw(index === 3 ? '<footer>Control de errores · FCS</footer>' : '')}
    </div>`;
  }
  return content;
}

export function labView(app) {
  const step = app.exploration.labStep;
  const current = envelopes[step];
  return {
    section: 'explore',
    title: 'Laboratorio',
    html: html`<a class="text-link" href="#/explore">← Todas las herramientas</a>${raw(
        pageHeading(
          'LABORATORIO INTERACTIVO',
          'Un mensaje, varias envolturas.',
          'Añade información capa a capa. Después quítala como lo haría el receptor.',
        ),
      )}
      <div class="lab-layout">
        <section class="panel">
          <div class="lab-step-tabs" aria-label="Elegir envoltura">
            ${raw(
              envelopes
                .map(
                  (item, i) =>
                    html`<button
                      data-step="${i}"
                      class="${i === step ? 'active' : ''}"
                      aria-pressed="${i === step}"
                    >
                      ${item.short}
                    </button>`,
                )
                .join(''),
            )}
          </div>
          <div class="envelope-stage">${raw(nestedEnvelope(step))}</div>
          <div class="button-row">
            <button class="button button-secondary" id="unwrap" ${step === 0 ? 'disabled' : ''}>
              ← Quitar envoltura</button
            ><button class="button button-primary" id="wrap" ${step === 4 ? 'disabled' : ''}>
              ${step === 3 ? 'Transmitir señales' : 'Añadir envoltura'} →
            </button>
          </div>
        </section>
        <aside class="panel lab-explanation">
          <span class="badge">${current.layer}</span>
          <h2>${current.name}</h2>
          <p>${current.detail}</p>
          <div class="notice">
            <strong>Lo que queda dentro</strong>
            <p>
              ${
                step === 0
                  ? 'El contenido de la petición.'
                  : step === 4
                    ? 'Los bits representan la trama completa.'
                    : 'Los datos anteriores siguen dentro. La nueva información sirve a otra responsabilidad.'
              }
            </p>
          </div>
          <p class="small-note">
            Ejemplo didáctico TCP/IP/Ethernet. Otros protocolos tienen formatos diferentes.
          </p>
          <a class="text-link" href="#/study/encapsulation">Leer la explicación completa →</a>
        </aside>
      </div>`,
    bind() {
      document.querySelectorAll('[data-step]').forEach((button) =>
        button.addEventListener('click', () => {
          app.exploration.labStep = Number(button.dataset.step);
          app.refresh();
        }),
      );
      document.querySelector('#wrap').addEventListener('click', () => {
        app.exploration.labStep = Math.min(4, step + 1);
        app.refresh();
      });
      document.querySelector('#unwrap').addEventListener('click', () => {
        app.exploration.labStep = Math.max(0, step - 1);
        app.refresh();
      });
    },
  };
}
