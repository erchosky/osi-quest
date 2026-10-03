import { storageNotice } from '../components/storage-notice.js';
import { pausedRoundBanner, retryNotice } from '../features/play/round-controls.js';
import { challengeBanner } from '../features/class/banner.js';
/** Persistent storage problems outrank version updates, then round context. */
export function contextNotice(app, inRound) {
  if (app.repository.storageIssue) return '';
  const challenge = inRound && app.activity?.challenge;
  return challenge
    ? challengeBanner(challenge)
    : pausedRoundBanner(app) || (inRound ? retryNotice(app.activity) : '');
}
export function primaryNotice(app) {
  return storageNotice(app.repository);
}
export function syncNotices(app) {
  const version = document.querySelector('.update-notice');
  if (version)
    version.hidden =
      !app.updateAvailable || Boolean(app.repository.storageIssue) || app.hasOpenRound();
  const toast = document.querySelector('#reward-toast');
  if (toast)
    toast.classList.toggle(
      'is-suppressed',
      Boolean(app.repository.storageIssue || (version && !version.hidden)),
    );
  const context = document.querySelector('#context-notice');
  if (context)
    context.hidden = Boolean(app.repository.storageIssue || (version && !version.hidden));
}
