/** Keep validation beside its field and announce it without replacing the screen. */
export function fieldError(input, output, message, focus = false) {
  if (output) output.textContent = message;
  if (!input) return;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  if (focus && input.isConnected) input.focus();
}
