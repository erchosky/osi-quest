export function focusElement(selector, { preventScroll = false, block = 'nearest' } = {}) {
  const element = document.querySelector(selector);
  if (!element) return;
  if (!element.hasAttribute('tabindex') && !element.matches('button, a, input, select, textarea'))
    element.tabIndex = -1;
  element.focus({ preventScroll: true });
  if (!preventScroll) element.scrollIntoView({ block, behavior: 'instant' });
}
