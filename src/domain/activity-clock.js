/** Active, monotonic time only; invalid readings never turn a duration into NaN. */
export class ActivityClock {
  constructor(now = Date.now) {
    this.now = now;
    this.accumulated = 0;
    this.since = null;
    this.stopped = false;
    this.lastTime = null;
  }
  read() {
    const value = this.now();
    if (Number.isFinite(value)) this.lastTime = Math.max(this.lastTime ?? value, value);
    return this.lastTime;
  }
  setActive(active) {
    if (this.stopped) return;
    if (active && this.since === null) this.since = this.read();
    if (!active && this.since !== null) {
      this.accumulated += Math.max(0, (this.read() ?? this.since) - this.since);
      this.since = null;
    }
  }
  get elapsedMs() {
    return (
      this.accumulated +
      (this.since === null ? 0 : Math.max(0, (this.read() ?? this.since) - this.since))
    );
  }
  stop() {
    this.setActive(false);
    this.stopped = true;
    return this.elapsedMs;
  }
}
