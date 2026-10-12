export const MAX_DURATION = (24 * 60 * 60 - 1) * 1000;

export class Timer {
  constructor(durationMs = 25 * 60 * 1000, now = Date.now) {
    this.now = now;
    this.configure(durationMs);
  }

  configure(durationMs) {
    if (!Number.isInteger(durationMs) || durationMs < 1000 || durationMs > MAX_DURATION) {
      throw new RangeError('La durata deve essere tra 1 secondo e 23:59:59.');
    }
    this.durationMs = durationMs;
    this.remainingMs = durationMs;
    this.deadline = null;
    this.state = 'idle';
  }

  tick() {
    if (this.state === 'running') {
      this.remainingMs = Math.max(0, this.deadline - this.now());
      if (this.remainingMs === 0) {
        this.state = 'finished';
        this.deadline = null;
      }
    }
    return this.remainingMs;
  }

  start() {
    this.tick();
    if (this.state === 'running') return;
    if (this.state === 'finished') this.reset();
    this.deadline = this.now() + this.remainingMs;
    this.state = 'running';
  }

  pause() {
    this.tick();
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.deadline = null;
  }

  reset() {
    this.configure(this.durationMs);
  }

  addMinute() {
    this.tick();
    if (this.state === 'finished') this.reset();
    const added = Math.min(60_000, MAX_DURATION - this.durationMs);
    this.durationMs += added;
    this.remainingMs += added;
    if (this.state === 'running') this.deadline += added;
    return added;
  }

  snapshot() {
    this.tick();
    return { durationMs: this.durationMs, remainingMs: this.remainingMs, deadline: this.deadline, state: this.state };
  }

  restore(saved) {
    if (!saved || !['idle', 'running', 'paused', 'finished'].includes(saved.state)) return false;
    if (!Number.isInteger(saved.durationMs) || saved.durationMs < 1000 || saved.durationMs > MAX_DURATION) return false;
    if (!Number.isFinite(saved.remainingMs) || saved.remainingMs < 0 || saved.remainingMs > saved.durationMs) return false;
    if (saved.state === 'running' && !Number.isFinite(saved.deadline)) return false;
    if (saved.state === 'idle' && saved.remainingMs !== saved.durationMs) return false;
    if (saved.state === 'finished' && saved.remainingMs !== 0) return false;
    this.durationMs = saved.durationMs;
    this.remainingMs = saved.remainingMs;
    this.deadline = saved.state === 'running' ? saved.deadline : null;
    this.state = saved.state;
    this.tick();
    return true;
  }
}

export function formatTime(milliseconds) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const seconds = String(total % 60).padStart(2, '0');
  const minutes = String(Math.floor(total / 60) % 60).padStart(2, '0');
  const hours = Math.floor(total / 3600);
  return hours ? `${String(hours).padStart(2, '0')}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function parseDuration(hours, minutes, seconds) {
  const values = [hours, minutes, seconds];
  if (values.some((value) => !/^\d{1,2}$/.test(String(value)))) return null;
  const [h, m, s] = values.map(Number);
  if (h > 23 || m > 59 || s > 59) return null;
  const total = (h * 3600 + m * 60 + s) * 1000;
  return total > 0 ? total : null;
}
