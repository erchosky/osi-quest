export function installKeyboardControls() {
  document.addEventListener('keydown', async (event) => {
    if (
      document.querySelector('dialog[open]') ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.target.closest('input, textarea, select, [contenteditable], dialog')
    )
      return;
    if (event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        /* Fullscreen may be unavailable in an embedded preview. */
      }
    }
    if (/^[a-d]$/i.test(event.key)) {
      const index = event.key.toLowerCase().charCodeAt(0) - 97;
      const answer = document.querySelectorAll('[data-choice]')[index];
      if (answer && !answer.disabled && answer.getAttribute('aria-disabled') !== 'true') {
        event.preventDefault();
        answer.click();
      }
    }
    if (event.key === 'Escape' && document.fullscreenElement) await document.exitFullscreen();
  });
}
