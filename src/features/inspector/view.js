import { html, raw, pageHeading } from '../../components/html.js';
import { bindInspector } from './controller.js';
export function inspectorView() {
  return {
    section: 'explore',
    title: 'Inspector de paquetes',
    html: html` <a class="text-link" href="#/explore">Volver a Explorar</a>${raw(
        pageHeading(
          'LABORATORIO DE BYTES',
          'De hexadecimal a una petición web.',
          'Elige una cabecera y descubre qué significa cada byte.',
        ),
      )}
      <div class="notice">
        Trama de ejemplo construida según los formatos reales Ethernet II, IPv4 y TCP, con una
        petición HTTP válida y direcciones reservadas para documentación. No captura tu tráfico. No
        incluye preámbulo ni FCS.
      </div>
      <section class="panel inspector-panel">
        <div id="packet-segments" class="button-row" role="group" aria-label="Cabeceras"></div>
        <div class="hex-scroll">
          <div id="hex-bytes" class="hex-bytes" aria-label="Bytes de la trama"></div>
        </div>
        <div class="inspector-layout">
          <div id="packet-fields" class="packet-fields"></div>
          <div>
            <div id="packet-detail" class="notice" role="status"></div>
            <div id="packet-map"></div>
          </div>
        </div>
        <p id="packet-warnings" role="status"></p>
      </section>
      <section class="panel inspector-challenge">
        <h2>Comprueba lo que has visto</h2>
        <p id="inspect-prompt">¿Qué campo identifica el siguiente salto en tu enlace local?</p>
        <div id="inspect-answers" class="button-row">
          <button class="button button-secondary" data-inspect-answer="MAC destino">
            MAC destino</button
          ><button class="button button-secondary" data-inspect-answer="IP destino">
            IP destino</button
          ><button class="button button-secondary" data-inspect-answer="Puerto destino">
            Puerto destino
          </button>
        </div>
        <p id="inspect-feedback" role="status"></p>
        <button id="inspect-next" class="button button-primary" hidden>
          Siguiente comprobación
        </button>
      </section>
      <details class="panel">
        <summary>Inspeccionar otra trama hexadecimal</summary>
        <form id="hex-form">
          <label for="hex-input">Ethernet II con IPv4 y TCP · hasta 4096 bytes</label
          ><textarea id="hex-input" rows="5" maxlength="16384" spellcheck="false"></textarea>
          <p id="hex-error" class="class-error" role="alert"></p>
          <div class="button-row">
            <button class="button button-primary">Decodificar</button
            ><button id="hex-reset" class="button button-secondary" type="button">
              Restaurar ejemplo
            </button>
          </div>
        </form>
      </details>
      <p class="small-note">
        Referencias:
        <a href="https://www.rfc-editor.org/rfc/rfc791" target="_blank" rel="noopener noreferrer"
          >IPv4 · RFC 791</a
        >
        y
        <a href="https://www.rfc-editor.org/rfc/rfc9293" target="_blank" rel="noopener noreferrer"
          >TCP · RFC 9293</a
        >. Un paquete aislado puede contener solo parte de un mensaje; Wireshark también reensambla
        flujos.
      </p>`,
    bind: bindInspector,
  };
}
