import { fieldError } from '../../components/field-error.js';
import { createChallenge, parseChallenge, challengeOptions } from '../../domain/class-challenge.js';

export function bindClassBuilder(app) {
  const form = document.querySelector('#class-create');
  const mode = form.elements.mode;
  const difficulty = form.elements.difficulty;
  function updateMode() {
    const guided = mode.value.startsWith('CAS');
    if (guided) difficulty.value = 'normal';
    difficulty.disabled = guided;
    document.querySelector('#class-level-note').textContent = guided
      ? 'Este caso es guiado y se comparte en nivel normal.'
      : 'La dificultad también queda fijada para toda la clase.';
  }
  mode.addEventListener('change', updateMode);
  updateMode();
  form.noValidate = true;
  const seed = form.elements.seed;
  const seedError = document.querySelector('#class-create-error');
  seed.addEventListener('input', () => {
    if (seed.hasAttribute('aria-invalid'))
      fieldError(
        seed,
        seedError,
        seed.validity.valid ? '' : 'Usa de 1 a 24 letras o números, sin espacios.',
      );
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!seed.validity.valid) {
      fieldError(seed, seedError, 'Usa de 1 a 24 letras o números, sin espacios.', true);
      return;
    }
    try {
      const challenge = createChallenge({
        mode: mode.value,
        difficulty: difficulty.value,
        seed: form.elements.seed.value,
      });
      app.router.navigate(`class/${challenge.code}`);
    } catch (error) {
      fieldError(seed, seedError, error.message, true);
    }
  });
  const join = document.querySelector('#class-join');
  const codeField = join.elements.challenge;
  const codeError = document.querySelector('#class-join-error');
  join.noValidate = true;
  codeField.addEventListener('input', () => fieldError(codeField, codeError, ''));
  join.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const challenge = parseChallenge(event.target.elements.challenge.value);
      app.router.navigate(`class/${challenge.code}`);
    } catch (error) {
      fieldError(codeField, codeError, error.message, true);
    }
  });
}

export function bindClassInvitation(app, challenge) {
  document.querySelector('#class-start').addEventListener('click', () => {
    app.startActivity(challenge.kind, challengeOptions(challenge));
  });
  document.querySelectorAll('[data-class-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const field = document.querySelector(button.dataset.classCopy);
      const status = document.querySelector('#class-copy-status');
      try {
        await navigator.clipboard.writeText(field.value);
        status.textContent =
          button.dataset.classCopy === '#class-code' ? 'Código copiado.' : 'Enlace copiado.';
      } catch {
        field.focus();
        field.select();
        status.textContent =
          'El navegador no permite copiar automáticamente. El texto está seleccionado para que lo copies.';
      }
    });
  });
}
