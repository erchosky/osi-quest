import { setHTML } from './dom-renderer.js';
import { html, progressBar } from './html.js';
import { units } from '../data/units.js';
import { levelProgress } from '../domain/rewards.js';
import { readInterface, saveInterface, applyInterface } from '../services/interface-preferences.js';
export function profileMenu() {
  return html`
    <details class="profile-menu" id="profile-menu">
      <summary aria-label="Tu perfil y preferencias">
        <span id="profile-name">Mi perfil</span
        ><span class="level-pill" id="level-pill">Nivel 1</span
        ><span class="xp-pill" id="xp-pill">0 XP</span>
      </summary>
      <div class="profile-panel panel">
        <strong id="profile-route"></strong>
        <div id="profile-progress"></div>
        <a class="text-link" href="#/progress">Ver mi progreso →</a>
        <form id="interface-form">
          <label for="local-name">Tu nombre en este dispositivo</label
          ><input
            id="local-name"
            name="learnerAlias"
            maxlength="24"
            autocomplete="off"
            placeholder="¿Cómo te llamas?"
          />
          <label for="interface-density">Espacio entre elementos</label
          ><select id="interface-density" name="density">
            <option value="comfortable">Cómodo</option>
            <option value="compact">Compacto</option>
          </select>
          <label for="interface-theme">Tema</label
          ><select id="interface-theme" name="theme">
            <option value="system">Según tu dispositivo</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="contrast">Contraste elevado</option>
          </select>
          <label for="interface-motion">Animaciones</label
          ><select id="interface-motion" name="motion">
            <option value="system">Según tu dispositivo</option>
            <option value="reduce">Reducidas</option>
          </select>
          <button class="button button-secondary" type="submit">Guardar preferencias</button>
          <p id="interface-status" role="status"></p>
        </form>
        <div class="pwa-options">
          <button type="button" id="install-app" class="button button-secondary">
            Instalar OSI Quest
          </button>
          <p id="offline-status" class="small-note" role="status"></p>
        </div>
        <small>Nombre local. No forma parte de las copias de progreso.</small>
      </div>
    </details>
  `;
}
export function bindProfileMenu() {
  const preferences = readInterface();
  applyInterface(preferences);
  const form = document.querySelector('#interface-form');
  for (const [key, value] of Object.entries(preferences))
    form.elements.namedItem(key === 'name' ? 'learnerAlias' : key).value = value;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const result = saveInterface({ ...values, name: values.learnerAlias });
    applyInterface(result.preferences);
    document.querySelector('#profile-name').textContent = result.preferences.name || 'Mi perfil';
    document.querySelector('#interface-status').textContent = result.saved
      ? 'Guardado ✓'
      : 'Solo para esta sesión: no se pudo guardar.';
    document
      .querySelector('#home-greeting')
      ?.replaceChildren(
        document.createTextNode(
          result.preferences.name
            ? `Hola, ${result.preferences.name}. ¿Qué conectamos hoy?`
            : 'Tu espacio para aprender redes.',
        ),
      );
  });
  const menu = document.querySelector('#profile-menu');
  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
}
export function updateProfileMenu(progress) {
  document.querySelector('#xp-pill').textContent = `✧ ${progress.xp} XP`;
  document.querySelector('#level-pill').textContent = `Nivel ${levelProgress(progress.xp).level}`;
  document.querySelector('#profile-name').textContent = readInterface().name || 'Mi perfil';
  document.querySelector('#profile-route').textContent =
    `${progress.read.length} de ${units.length} lecciones leídas`;
  setHTML(
    document.querySelector('#profile-progress'),
    progressBar((progress.read.length / units.length) * 100, 'Ruta de estudio'),
  );
}
