import { html } from '../../components/html.js';
import { setHTML } from '../../components/dom-renderer.js';
import { examplePacket, hexText, inspectPacket, parseHex } from '../../domain/packet-inspector.js';
import { layerMap } from '../../components/layer-map.js';
export function bindInspector() {
  let decoded,
    activeField = 0,
    step = 0;
  function choose(index) {
    activeField = index;
    const f = decoded.fields[index];
    document
      .querySelectorAll('[data-byte]')
      .forEach((el) =>
        el.classList.toggle(
          'selected',
          Number(el.dataset.byte) >= f.start && Number(el.dataset.byte) < f.end,
        ),
      );
    document
      .querySelectorAll('[data-field]')
      .forEach((el) => el.setAttribute('aria-pressed', String(Number(el.dataset.field) === index)));
    setHTML(
      document.querySelector('#packet-detail'),
      html`<span class="badge">Capa ${f.layer}</span>
        <h2>${f.name}</h2>
        <pre>${f.value}</pre>
        <p>${f.why}</p>
        <small>Bytes ${f.start}–${f.end - 1} · ${f.end - f.start} bytes</small>`,
    );
    setHTML(document.querySelector('#packet-map'), layerMap(f.layer, true));
  }
  function render(bytes) {
    decoded = inspectPacket(bytes);
    document.querySelector('#hex-input').value = hexText(bytes);
    setHTML(
      document.querySelector('#packet-segments'),
      decoded.segments
        .map(
          (s, i) =>
            html`<button class="button button-secondary" data-segment="${i}">
              ${s.name} · Capa ${s.layer} · ${s.end - s.start} B
            </button>`,
        )
        .join(''),
    );
    setHTML(
      document.querySelector('#hex-bytes'),
      Array.from(
        bytes,
        (n, i) =>
          html`<span
            data-byte="${i}"
            class="hex-byte layer-byte-${decoded.segments.find((s) => i >= s.start && i < s.end)
              ?.layer ?? 0}"
            title="Byte ${i}"
            >${n.toString(16).padStart(2, '0')}</span
          >`,
      ).join(''),
    );
    setHTML(
      document.querySelector('#packet-fields'),
      decoded.fields
        .map(
          (f, i) =>
            html`<button class="button button-ghost" data-field="${i}" aria-pressed="false">
              ${f.name}<small>${f.start}–${f.end - 1}</small>
            </button>`,
        )
        .join(''),
    );
    document
      .querySelectorAll('[data-field]')
      .forEach((el) => el.addEventListener('click', () => choose(Number(el.dataset.field))));
    document.querySelectorAll('[data-segment]').forEach((el) =>
      el.addEventListener('click', () => {
        const s = decoded.segments[Number(el.dataset.segment)];
        choose(decoded.fields.findIndex((f) => f.start >= s.start && f.start < s.end));
      }),
    );
    document.querySelector('#packet-warnings').textContent = decoded.warnings.join(' ');
    choose(0);
  }
  render(examplePacket());
  document.querySelector('#hex-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      render(parseHex(document.querySelector('#hex-input').value));
      document.querySelector('#hex-error').textContent = '';
      document.querySelector('#hex-input').removeAttribute('aria-invalid');
    } catch (error) {
      document.querySelector('#hex-error').textContent = error.message;
      document.querySelector('#hex-input').setAttribute('aria-invalid', 'true');
    }
  });
  document.querySelector('#hex-reset').addEventListener('click', () => {
    render(examplePacket());
    document.querySelector('#hex-error').textContent = '';
  });
  const checks = [
    [
      '¿Qué campo identifica el siguiente salto en tu enlace local?',
      'MAC destino',
      'La MAC llega al siguiente salto. La IP apunta al destino final.',
    ],
    [
      '¿Qué campo identifica el servidor final?',
      'IP destino',
      'La IP sigue señalando el destino aunque las MAC cambien en cada enlace.',
    ],
    [
      '¿Qué campo apunta al servicio del servidor?',
      'Puerto destino',
      'El puerto 80 suele usarse para HTTP; no identifica el equipo ni cifra los datos.',
    ],
  ];
  document.querySelectorAll('[data-inspect-answer]').forEach((el) =>
    el.addEventListener('click', () => {
      const correct = el.dataset.inspectAnswer === checks[step][1];
      document.querySelector('#inspect-feedback').textContent =
        (correct ? 'Correcto. ' : 'Prueba otra vez. ') + checks[step][2];
      if (correct) document.querySelector('#inspect-next').hidden = false;
    }),
  );
  document.querySelector('#inspect-next').addEventListener('click', () => {
    step = (step + 1) % checks.length;
    document.querySelector('#inspect-prompt').textContent = checks[step][0];
    document.querySelector('#inspect-feedback').textContent = '';
    document.querySelector('#inspect-next').hidden = true;
  });
}
