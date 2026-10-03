export function installDevelopmentPanel() {
  const panel = document.createElement('details');
  panel.className = 'development-panel';
  const title = document.createElement('summary');
  title.textContent = 'Diagnóstico local';
  const output = document.createElement('pre');
  panel.append(title, output);
  panel.addEventListener('toggle', () => {
    if (!panel.open) return;
    output.textContent =
      performance
        .getEntriesByType('measure')
        .filter((e) => e.name.startsWith('osi:'))
        .slice(-12)
        .map((e) => `${e.name}: ${e.duration.toFixed(1)} ms`)
        .join('\n') || 'Interactúa con la app para medir.';
  });
  document.querySelector('.app-footer')?.append(panel);
}
