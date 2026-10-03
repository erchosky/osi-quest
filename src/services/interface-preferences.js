const KEY = 'osi-quest-interface';
export function sanitizeInterface(input = {}) {
  return {
    name:
      typeof input?.name === 'string'
        ? input.name
            .replace(/[\u0000-\u001f\u007f]/g, '')
            .trim()
            .slice(0, 24)
        : '',
    density: input?.density === 'compact' ? 'compact' : 'comfortable',
    theme: ['light', 'dark', 'contrast'].includes(input?.theme) ? input.theme : 'system',
    motion: input?.motion === 'reduce' ? 'reduce' : 'system',
  };
}
export function readInterface() {
  try {
    const text = localStorage.getItem(KEY);
    return sanitizeInterface(text && text.length < 4096 ? JSON.parse(text) : {});
  } catch {
    return sanitizeInterface();
  }
}
export function saveInterface(input) {
  const preferences = sanitizeInterface(input);
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
    return { preferences, saved: true };
  } catch {
    return { preferences, saved: false };
  }
}
export function applyInterface(preferences) {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.density = preferences.density;
  document.documentElement.dataset.motion = preferences.motion;
}
