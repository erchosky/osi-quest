/** Only screen navigation animates; question feedback keeps its existing stable layout. */
export async function renderTransition(commit, enabled) {
  const reduced =
    document.documentElement.dataset.motion === 'reduce' ||
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!enabled || reduced || !document.startViewTransition || !document.querySelector('#main h1')) {
    commit();
    return;
  }
  const transition = document.startViewTransition(commit);
  // A newer navigation may skip an animation; painting failures still propagate.
  transition.ready.catch(() => {});
  transition.finished.catch(() => {});
  await transition.updateCallbackDone;
}
