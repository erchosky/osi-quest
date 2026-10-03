import { setHTML } from '../components/dom-renderer.js';
import { levelProgress } from '../domain/rewards.js';

let hideTimer;

/** Retire the visual notice while its live-region text finishes announcing the reward. */
export function retireReward() {
  const toast = document.querySelector('#reward-toast');
  if (toast && !toast.hidden) toast.classList.add('is-reading');
}

export function showReward({ amount, previousXP, totalXP, difficulty }) {
  const toast = document.querySelector('#reward-toast');
  if (!toast) return;
  clearTimeout(hideTimer);
  window.removeEventListener('scroll', retireReward);
  window.addEventListener('scroll', retireReward, { once: true, passive: true });
  const level = levelProgress(totalXP).level;
  const levelUp = level > levelProgress(previousXP).level || toast.classList.contains('level-up');
  toast.hidden = false;
  toast.classList.toggle('is-reading', window.scrollY > 0);
  toast.classList.toggle('level-up', levelUp);
  setHTML(
    toast,
    `<span class="reward-toast-symbol">${levelUp ? '✦' : '✧'}</span><div><strong>${levelUp ? `¡Nivel ${level}!` : `+${amount} XP`}</strong><small>${levelUp ? 'Tu práctica sigue sumando.' : difficulty === 'hard' ? 'Reto difícil resuelto' : 'Una conexión más'}</small></div>`,
  );
  document.querySelector('#xp-pill')?.classList.add('is-gaining');
  hideTimer = setTimeout(() => {
    window.removeEventListener('scroll', retireReward);
    toast.hidden = true;
    toast.classList.remove('level-up');
    document.querySelector('#xp-pill')?.classList.remove('is-gaining');
  }, 2300);
}

export function clearReward() {
  clearTimeout(hideTimer);
  window.removeEventListener('scroll', retireReward);
  const toast = document.querySelector('#reward-toast');
  if (toast) {
    toast.hidden = true;
    toast.classList.remove('level-up', 'is-reading');
  }
  document.querySelector('#xp-pill')?.classList.remove('is-gaining');
}
