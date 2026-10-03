class TrustedMarkup {
  constructor(value) {
    this.value = String(value ?? '');
  }
  toString() {
    return this.value;
  }
}
/** Mark only authored fragments or escaped strings as composable markup. */
export function raw(value) {
  return value instanceof TrustedMarkup ? value : new TrustedMarkup(value);
}
/** Text is escaped by default; markup composition is explicit. */
export function html(strings, ...values) {
  return strings.reduce(
    (output, text, index) =>
      output +
      text +
      (values[index] instanceof TrustedMarkup
        ? String(values[index])
        : escapeHtml(values[index] ?? '')),
    '',
  );
}
export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

export function routeLink(route, label, className = 'button button-secondary') {
  return `<a href="#/${escapeHtml(route)}" class="${escapeHtml(className)}">${escapeHtml(label)}</a>`;
}

export function pageHeading(eyebrow, title, description) {
  return `<div class="page-heading"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="page-description">${escapeHtml(description)}</p></div>`;
}

export function badge(text, tone = '') {
  return `<span class="badge ${escapeHtml(tone)}">${escapeHtml(text)}</span>`;
}

export function progressBar(percent, label) {
  return `<div class="progress-track" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span style="width:${Math.min(100, Math.max(0, percent))}%"></span></div>`;
}
