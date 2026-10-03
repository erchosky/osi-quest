import { html, pageHeading, raw } from '../../components/html.js';
import { icon } from '../../components/icons.js';
import { layerMap } from '../../components/layer-map.js';

export function exploreView() {
  const tools = [
    [
      'inspector',
      'lab',
      'Inspector hexadecimal',
      'Explora una trama Ethernet: encuentra MAC, IP, puertos y una petición HTTP.',
      'Inspeccionar bytes',
    ],
    [
      'lab',
      'lab',
      'Laboratorio de envolturas',
      'Construye un envío TCP/IP/Ethernet y descubre qué contiene cada unidad de datos.',
      'Manipular →',
    ],
    [
      'journey',
      'scenario',
      'El viaje de un mensaje',
      'Sigue los catorce pasos del emisor al receptor. Una función cada vez.',
      'Seguir el viaje →',
    ],
    [
      'glossary',
      'study',
      'Diccionario sin misterios',
      'Consulta los términos de redes con explicaciones claras y fuentes para ampliar.',
      'Buscar un término →',
    ],
  ];
  return {
    section: 'explore',
    title: '',
    html: html`${raw(
        pageHeading(
          'DE LOS NOMBRES A LAS CONEXIONES',
          'Mira qué pasa por dentro.',
          'Experimenta con las ideas que has aprendido. Puedes explorar libremente y volver cuando tengas una duda.',
        ),
      )}
      <div class="explore-grid">
        <div>
          ${raw(
            tools
              .map(
                ([route, symbol, title, description, action]) =>
                  html`<a class="panel explore-card" href="#/explore/${route}"
                    ><span class="activity-icon">${raw(icon(symbol))}</span>
                    <div>
                      <h2>${title}</h2>
                      <p>${description}</p>
                      <span class="text-link">${action}</span>
                    </div></a
                  >`,
              )
              .join(''),
          )}
        </div>
        <aside class="panel">
          <p class="eyebrow">UNA VISTA DE CONJUNTO</p>
          <h2>Las siete capas.</h2>
          ${raw(layerMap(null, false, true))}
          <p class="small-note">
            Pulsa una capa para entrenarla. Sus explicaciones siguen en Estudiar.
          </p>
        </aside>
      </div>`,
  };
}
