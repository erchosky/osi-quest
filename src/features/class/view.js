import { html, pageHeading, escapeHtml, raw } from '../../components/html.js';
import { classModes } from '../../data/class-modes.js';
import { parseChallenge, challengeLink } from '../../domain/class-challenge.js';
import { bindClassBuilder, bindClassInvitation } from './controller.js';

function randomSeed() {
  const values = crypto.getRandomValues(new Uint32Array(1));
  return values[0].toString(36).toUpperCase().padStart(7, '0');
}

export function classView(app, code) {
  if (code) {
    try {
      return invitationView(app, parseChallenge(code));
    } catch (error) {
      return {
        section: 'play',
        title: 'Revisa el reto',
        html: html`<section class="panel empty-state">
          <h1>No podemos abrir este reto.</h1>
          <p>${raw(escapeHtml(error.message))}</p>
          <a href="#/class" class="button button-primary">Revisar el código →</a>
        </section>`,
      };
    }
  }
  return {
    section: 'play',
    title: 'Reto de clase',
    html: html`<a class="text-link" href="#/play">← Todas las actividades</a>
      ${raw(pageHeading('APRENDER EN COMPAÑÍA', 'El mismo reto para todos.', 'Crea un código o pega el de tu clase. Todos reciben las mismas preguntas, piezas y opciones, en el mismo orden.'))}
      <div class="class-grid">
        <form id="class-create" class="panel class-form">
          <span class="badge badge-lime">CREAR UN RETO</span>
          <h2>Prepara la práctica.</h2>
          <label for="class-mode">Actividad</label>
          <select name="mode" id="class-mode">
            ${raw(classModes.map((mode) => html`<option value="${mode.id}">${raw(escapeHtml(mode.label))}</option>`).join(''))}
          </select>
          <label for="class-difficulty">Dificultad</label>
          <select name="difficulty" id="class-difficulty">
            <option value="normal">Normal · 8 XP por acierto</option>
            <option value="hard">Difícil · 20 XP por acierto</option>
          </select>
          <p class="small-note" id="class-level-note"></p>
          <label for="class-seed">Semilla: el nombre de esta ronda</label>
          <input
            id="class-seed"
            name="seed"
            value="${randomSeed()}"
            required
            maxlength="24"
            pattern="[A-Za-z0-9]{1,24}"
            aria-describedby="class-seed-help class-create-error"
            autocomplete="off"
            spellcheck="false"
          />
          <p class="small-note" id="class-seed-help">
            Usa letras y números, por ejemplo CLASE1. Cambia la semilla para preparar otra ronda.
          </p>
          <p id="class-create-error" class="class-error" role="alert"></p>
          <button type="submit" class="button button-primary">Crear código y enlace →</button>
        </form>
        <div class="class-side">
          <form id="class-join" class="panel class-form">
            <span class="badge">UNIRME A UN RETO</span>
            <h2>¿Ya tienes el código?</h2>
            <label for="class-import">Código o enlace de tu clase</label>
            <input
              id="class-import"
              aria-describedby="class-join-error"
              name="challenge"
              required
              maxlength="2048"
              placeholder="OSI2-…"
              spellcheck="false"
              autocomplete="off"
            />
            <p id="class-join-error" class="class-error" role="alert"></p>
            <button type="submit" class="button button-secondary">Abrir el reto →</button>
          </form>
          <aside class="notice">
            <h2>Compartir, practicar y comentar.</h2>
            <p>
              Cada persona responde a su ritmo y guarda su propio resultado. Al terminar, podéis
              comparar aciertos y comentar las explicaciones.
            </p>
            <p>
              El repaso adaptativo y las tarjetas siguen siendo personales: dependen de lo que cada
              uno necesita recordar.
            </p>
          </aside>
        </div>
      </div>`,
    bind: () => bindClassBuilder(app),
  };
}

function invitationView(app, challenge) {
  const link = challengeLink(challenge.code, location.href);
  return {
    section: 'play',
    title: 'Reto compartido',
    html: html`<a class="text-link" href="#/class">← Crear o abrir otro reto</a>
      ${raw(pageHeading('TU CLASE, UN MISMO RETO', escapeHtml(challenge.label), 'El código fija la práctica. Al abrirlo, cada persona comienza desde la primera pregunta y responde a su ritmo.'))}
      <section class="panel class-invitation">
        <div class="class-facts">
          <span class="badge badge-lime"
            >${challenge.difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL'}</span
          ><span>Semilla <strong>${raw(escapeHtml(challenge.seed))}</strong></span
          ><span>Mismo orden y mismas opciones</span>
        </div>
        <div class="class-form">
          <label for="class-code">Código del reto</label>
          <div class="class-copy-row">
            <input
              id="class-code"
              value="${raw(escapeHtml(challenge.code))}"
              readonly
              spellcheck="false"
            /><button class="button button-secondary" data-class-copy="#class-code">
              Copiar código
            </button>
          </div>
          <label for="class-link">Enlace para compartir</label>
          <div class="class-copy-row">
            <input id="class-link" value="${raw(escapeHtml(link))}" readonly /><button
              class="button button-secondary"
              data-class-copy="#class-link"
            >
              Copiar enlace
            </button>
          </div>
          <p class="small-note">
            Para usar el enlace en otros dispositivos, abre la app desde su dirección publicada. Si
            la tienes en tu ordenador, comparte el código y que cada persona lo pegue en su copia de
            la misma versión.
          </p>
          <p id="class-copy-status" role="status" class="small-note"></p>
        </div>
        <div class="class-start">
          <p>
            No hace falta una cuenta. El resultado se guarda en tu navegador; no se envía a un
            profesor ni a otros participantes.
          </p>
          <button id="class-start" class="button button-primary">Empezar este reto →</button>
        </div>
      </section>`,
    bind: () => bindClassInvitation(app, challenge),
  };
}

export { challengeBanner } from './banner.js';
