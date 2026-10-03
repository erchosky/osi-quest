const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  study:
    '<path d="M3 4h7a2 2 0 0 1 2 2v15a4 4 0 0 0-4-2H3zM21 4h-7a2 2 0 0 0-2 2v15a4 4 0 0 1 4-2h5z"/>',
  play: '<path d="M9 5h6a5 5 0 0 1 5 4l2 7a3 3 0 0 1-5 3l-3-2h-4l-3 2a3 3 0 0 1-5-3l2-7a5 5 0 0 1 5-4Z"/><path d="M7 9v6M4 12h6M16 10h.01M19 13h.01"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4z"/>',
  progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  order: '<path d="M4 5h16M4 12h12M4 19h8"/>',
  function: '<path d="m12 3 9 9-9 9-9-9z"/><path d="M9 12h6M12 9v6"/>',
  scenario: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M8 10h4M10 8v4"/>',
  protocol: '<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
  adaptive: '<path d="M20 7a9 9 0 1 0 1 9M20 3v5h-5"/>',
  exam: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 10 2 2 5-5M8 16h8"/>',
  flashcards:
    '<rect x="5" y="6" width="15" height="15" rx="2"/><path d="M16 3H4a2 2 0 0 0-2 2v12M9 11h7M9 15h4"/>',
  lab: '<path d="M9 3h6M10 3v6l-6 10a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M7 15h10"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
export function icon(name, className = '') {
  return `<svg class="icon ${className}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.layers}</svg>`;
}
