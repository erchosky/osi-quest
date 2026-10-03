import { fieldError } from '../../components/field-error.js';
import { allowsPrefetch, idleTask } from '../../services/idle.js';
import { activityById } from '../../data/activities.js';
import { layers } from '../../data/layers.js';
import { cases } from '../../data/cases.js';
import { html, pageHeading, routeLink, escapeHtml, raw } from '../../components/html.js';
import { icon } from '../../components/icons.js';
import { playView } from './view.js';
import { REWARDS } from '../../domain/rewards.js';
import { activityOptions, NO_DIFFICULTY } from '../../domain/activity-preferences.js';

export function setupView(app, kind) {
  const activity = activityById.get(kind);
  if (!activity) return playView(app);
  const options = activityOptions(
    kind,
    app.repository.data.activityPreferences?.[kind],
    app.repository.data.difficulty,
  );
  if (kind === 'focus') {
    const value = new URLSearchParams(location.hash.split('?')[1]).get('layer');
    if (value && Number(value) >= 1 && Number(value) <= 7) options.layer = Number(value);
  }
  const difficulty = options.difficulty;
  return {
    section: 'play',
    title: activity.name,
    html: html`<a class="text-link" href="#/play">← Cambiar de actividad</a>${raw(
        pageHeading('PREPARA TU RETO', activity.name, activity.description),
      )}
      <div class="setup-layout">
        <form class="panel setup-form" id="setup-form">
          <div class="setup-step">
            <span class="step-number">1</span>
            <div>
              <h2>Tu actividad</h2>
              <p>
                ${activity.length} ·
                ${kind === 'exam'
                  ? 'Corrección al entregar'
                  : kind === 'flashcards'
                    ? 'Recuerdo activo y repaso espaciado'
                    : 'Explicaciones para aprender de cada intento'}
              </p>
            </div>
            ${raw(icon(activity.icon))}
          </div>
          ${raw(
            !NO_DIFFICULTY.has(kind)
              ? html`<fieldset class="difficulty-field">
                  <legend><span class="step-number">2</span>Elige la dificultad</legend>
                  <div class="difficulty-options">
                    <label
                      ><input
                        type="radio"
                        name="difficulty"
                        value="normal"
                        ${difficulty === 'normal' ? 'checked' : ''}
                      /><span
                        ><strong>Normal <span class="badge">Desde cero</span></strong
                        ><small>Ideas básicas, ejemplos claros y pistas para avanzar.</small></span
                      ></label
                    ><label
                      ><input
                        type="radio"
                        name="difficulty"
                        value="hard"
                        ${difficulty === 'hard' ? 'checked' : ''}
                      /><span
                        ><strong
                          >Difícil <span class="badge badge-peach">Ojo al detalle</span></strong
                        ><small
                          >${kind === 'order'
                            ? 'Sin mostrar el mapa de capas. Puedes elegir envío o recepción.'
                            : ['matching', 'packet'].includes(kind)
                              ? 'Funciones y piezas que se parecen. Distingue las trampas con atención.'
                              : 'Preguntas trampa sobre confusiones habituales. Lee con atención.'}</small
                        ></span
                      ></label
                    >
                  </div>
                </fieldset>`
              : html`<div class="notice">
                  <strong
                    >${kind === 'flashcards'
                      ? 'Practica a tu ritmo'
                      : kind === 'confusions'
                        ? 'Comprueba las ideas que se parecen'
                        : 'Casos guiados para aprender'}</strong
                  >
                  <p>
                    ${kind === 'flashcards'
                      ? 'No hay niveles: intenta recordar, gira la tarjeta y decide cuándo volver a verla.'
                      : kind === 'confusions'
                        ? 'Cuatro preguntas por confusión. Dos aciertos distintos sin ayuda desbloquean su insignia; un error o una pista reinician la comprobación.'
                        : 'Cada caso te guía con pruebas concretas. Las respuestas se explican paso a paso.'}
                  </p>
                </div>`,
          )}${raw(
            kind === 'order'
              ? html`<fieldset>
                  <legend>Dirección del recorrido</legend>
                  <div class="segmented">
                    <label
                      ><input
                        type="radio"
                        name="direction"
                        value="receive"
                        ${options.direction === 'receive' ? 'checked' : ''}
                      />
                      Recepción · 1 → 7</label
                    ><label
                      ><input
                        type="radio"
                        name="direction"
                        value="send"
                        ${options.direction === 'send' ? 'checked' : ''}
                      />
                      Envío · 7 → 1</label
                    >
                  </div>
                </fieldset>`
              : '',
          )}${raw(
            kind === 'cases'
              ? html`<fieldset>
                  <legend>Elige una investigación</legend>
                  <div class="case-options">
                    ${raw(
                      cases
                        .map(
                          (item) =>
                            html`<label
                              ><input
                                type="radio"
                                name="caseId"
                                value="${item.id}"
                                ${options.caseId === item.id ? 'checked' : ''}
                              /><span
                                ><strong>${raw(escapeHtml(item.title))}</strong
                                ><small>${raw(escapeHtml(item.description))}</small></span
                              ></label
                            >`,
                        )
                        .join(''),
                    )}
                  </div>
                </fieldset>`
              : '',
          )}
          ${raw(
            kind === 'focus'
              ? `<fieldset><legend>¿Qué capa quieres practicar?</legend><label for="focus-layer">Capa OSI</label><select id="focus-layer" name="layer">${layers.map((layer) => `<option value="${layer.number}" ${options.layer === layer.number ? 'selected' : ''}>Capa ${layer.number} · ${layer.name}</option>`).join('')}</select><p class="small-note">Todas las preguntas de esta ronda pertenecen a la capa elegida.</p></fieldset>`
              : '',
          )}
          ${raw(
            kind === 'speedrun'
              ? '<div class="notice"><strong>60 segundos para conectar capas</strong><p>Acierto: +2 s. Desde el tercer acierto seguido: +3 s. Desde el quinto: +4 s. Las pistas no dan tiempo extra. El reloj se pausa con la X y al ocultar la pestaña; sigue corriendo al leer las respuestas. Puedes revisar todas las explicaciones al terminar.</p></div>'
              : '',
          )}
          ${raw(
            kind === 'survival'
              ? `<fieldset class="mode-options"><legend>¿Quieres jugar con reloj?</legend><label><input type="checkbox" name="timed" ${options.timed ? 'checked' : ''} /> Contrarreloj · 30 segundos por pregunta</label><p class="small-note">Un error o agotar el tiempo cuesta una vida. El reloj se detiene al leer la explicación, al pausar y al ocultar la pestaña.</p></fieldset>`
              : '',
          )}
          ${raw(
            kind === 'duel'
              ? '<fieldset class="mode-options"><legend>¿Quién juega?</legend><label for="duel-player1">Primera persona</label><input id="duel-player1" name="player1" maxlength="24" placeholder="Persona 1" /><label for="duel-player2">Segunda persona</label><input id="duel-player2" name="player2" aria-describedby="duel-player-error" maxlength="24" placeholder="Persona 2" /><p id="duel-player-error" class="class-error" role="alert"></p><p class="small-note">Cada acierto vale 1 punto. Las respuestas se comparan al acabar los dos turnos. El marcador se guarda con nombres anónimos (Jugador A/B). Los nombres escritos solo duran en esta pestaña y no se exportan.</p></fieldset>'
              : '',
          )}
          <div class="setup-start">
            <p>
              ${kind === 'exam'
                ? 'Puedes cambiar respuestas y marcar dudas. Las preguntas en blanco cuentan como errores.'
                : kind === 'survival'
                  ? 'Empiezas con tres vidas. Activa el reloj solo si quieres jugar a contrarreloj.'
                  : kind === 'speedrun'
                    ? 'El reloj es global: responde y continúa para acumular aciertos.'
                    : 'Sin límite de tiempo. Si necesitas salir, lo que ya hayas practicado se queda guardado.'}
            </p>
            <button type="submit" class="button button-primary">
              ${kind === 'flashcards' ? 'Abrir tarjetas' : 'Empezar el reto'} →
            </button>
          </div>
        </form>
        <aside class="panel setup-aside">
          <p class="eyebrow">APRENDER CON INTENCIÓN</p>
          <h2>Entiende el porqué.</h2>
          <p>
            No hace falta acertarlo todo. Cada explicación es una oportunidad de conectar las
            piezas.
          </p>
          <ul>
            ${raw(
              kind === 'duel'
                ? '<li>1 punto por acierto para cada persona.</li><li>La primera respuesta queda oculta hasta que ambos contestan.</li>'
                : kind === 'flashcards'
                  ? '<li>Las tarjetas no suman XP: tú evalúas lo que recuerdas.</li>'
                  : `<li>Normal: ${REWARDS.normal} XP por acierto; ${REWARDS.normal / 2} con ayuda.</li>${!['cases', 'confusions'].includes(kind) ? `<li>Difícil: ${REWARDS.hard} XP por acierto; ${REWARDS.hard / 2} con ayuda.</li>` : ''}<li>Una respuesta incorrecta no suma XP.</li>`,
            )}
            <li>El repaso vuelve a lo que necesitas reforzar.</li>
          </ul>
          ${raw(routeLink('study', 'Consultar la ruta de estudio'))}
        </aside>
      </div>`,
    bind() {
      const cancelPrefetch = allowsPrefetch()
        ? idleTask(() => {
            if (!app.launching) {
              import('./session-factory.js').catch(() => {});
              app.prefetchScreen(
                [
                  'matching',
                  'packet',
                  'order',
                  'flashcards',
                  'survival',
                  'duel',
                  'speedrun',
                ].includes(kind)
                  ? kind
                  : 'quiz',
              );
            }
          })
        : () => {};
      const form = document.querySelector('#setup-form');
      form.querySelectorAll('[name="difficulty"]').forEach((input) => {
        const rate = document.createElement('small');
        rate.className = 'difficulty-reward';
        rate.textContent =
          kind === 'duel'
            ? '1 punto por acierto · dificultad compartida'
            : `+${REWARDS[input.value]} XP por acierto · ${REWARDS[input.value] / 2} con ayuda`;
        input.nextElementSibling.append(rate);
      });
      if (kind === 'duel')
        for (const field of [form.elements.player1, form.elements.player2])
          field.addEventListener('input', () =>
            fieldError(form.elements.player2, document.querySelector('#duel-player-error'), ''),
          );
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form));
        if (
          kind === 'duel' &&
          values.player1?.trim() &&
          values.player1.trim().toLocaleLowerCase('es') ===
            values.player2?.trim().toLocaleLowerCase('es')
        ) {
          fieldError(
            form.elements.player2,
            document.querySelector('#duel-player-error'),
            'Usa dos nombres diferentes para distinguir los turnos.',
            true,
          );
          return;
        }
        app.startActivity(kind, { ...values, difficulty: values.difficulty ?? 'normal' });
      });
      return cancelPrefetch;
    },
  };
}
