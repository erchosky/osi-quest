import { html, raw } from './html.js';
import { independentStreak, rewardXP, REWARDS } from '../domain/rewards.js';

export function rewardHud(session) {
  if (session.practiceOnly)
    return '<div class="reward-hud">Repaso guiado · sin XP ni estadísticas al perfil del dispositivo.</div>';
  const base = (REWARDS[session.difficulty] ?? REWARDS.normal) / (session.recovery ? 2 : 1);
  const outcomes = session.outcomes ?? Object.values(session.answers ?? {});
  const streak = independentStreak(outcomes);
  const xp = outcomes.reduce((total, outcome) => total + rewardXP(outcome, session.difficulty), 0);
  return html`<div class="reward-hud" aria-label="Recompensas de la ronda">
    <span>✧ <strong>+${base} XP</strong> por acierto</span>
    <span
      >${raw(session.isExam ? 'Se suman al entregar' : `<strong>${xp} XP</strong> en esta ronda`)}</span
    >
    ${raw(
      !session.isExam && !session.recovery
        ? `<span class="streak-badge ${streak >= 2 ? '' : 'reserved-hidden'}" ${streak >= 2 ? '' : 'aria-hidden="true"'}>↗ ${Math.max(2, streak)} respuestas seguidas sin ayuda</span>`
        : '',
    )}
  </div>`;
}
