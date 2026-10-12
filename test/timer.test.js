import test from 'node:test';
import assert from 'node:assert/strict';
import { Timer, MAX_DURATION, formatTime, parseDuration } from '../src/timer.js';

test('conteggio basato sulla scadenza, anche dopo la sospensione della scheda', () => {
  let now = 1000;
  const timer = new Timer(10_000, () => now);
  timer.start();
  now += 2500;
  assert.equal(timer.tick(), 7500);
  now += 60_000;
  assert.equal(timer.tick(), 0);
  assert.equal(timer.state, 'finished');
});

test('pausa, ripresa e reset conservano correttamente il tempo', () => {
  let now = 0;
  const timer = new Timer(10_000, () => now);
  timer.start();
  now = 3000;
  timer.pause();
  now = 100_000;
  assert.equal(timer.tick(), 7000);
  timer.start();
  now += 2000;
  assert.equal(timer.tick(), 5000);
  timer.reset();
  assert.equal(timer.remainingMs, 10_000);
  assert.equal(timer.state, 'idle');
});

test('aggiunta di un minuto durante il conteggio e limite della durata', () => {
  let now = 0;
  const timer = new Timer(10_000, () => now);
  timer.start();
  now = 5000;
  assert.equal(timer.addMinute(), 60_000);
  assert.equal(timer.remainingMs, 65_000);
  now += 10_000;
  assert.equal(timer.tick(), 55_000);
  timer.configure(MAX_DURATION - 10_000);
  assert.equal(timer.addMinute(), 10_000);
  assert.equal(timer.addMinute(), 0);
});

test('un timer scaduto può ripartire e non torna in pausa', () => {
  let now = 0;
  const timer = new Timer(1000, () => now);
  timer.start();
  now = 2000;
  timer.pause();
  assert.equal(timer.state, 'finished');
  timer.start();
  assert.equal(timer.remainingMs, 1000);
  assert.equal(timer.state, 'running');
});

test('il ripristino tiene conto del tempo trascorso dopo il caricamento', () => {
  let now = 1000;
  const original = new Timer(10_000, () => now);
  original.start();
  const saved = original.snapshot();
  now = 8000;
  const restored = new Timer(1500, () => now);
  assert.equal(restored.restore(saved), true);
  assert.equal(restored.remainingMs, 3000);
  now = 20_000;
  assert.equal(restored.tick(), 0);
  assert.equal(restored.state, 'finished');
});

test('rifiuta dati salvati corrotti e durate non valide', () => {
  const timer = new Timer();
  assert.equal(timer.restore({ state: 'running', durationMs: 1000, remainingMs: 1000 }), false);
  assert.equal(timer.restore({ state: 'idle', durationMs: 1000, remainingMs: 0 }), false);
  assert.equal(timer.restore({ state: 'finished', durationMs: 1000, remainingMs: 1000 }), false);
  for (const value of [0, -1, 1000.5, NaN, Infinity, MAX_DURATION + 1]) {
    assert.throws(() => timer.configure(value), RangeError);
  }
});

test('formattazione con arrotondamento dei secondi e supporto delle ore', () => {
  assert.equal(formatTime(1500), '00:02');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(25 * 60_000), '25:00');
  assert.equal(formatTime(3_600_000), '01:00:00');
  assert.equal(formatTime(MAX_DURATION), '23:59:59');
});

test('durate personalizzate: estremi e rifiuto di input ambigui', () => {
  assert.equal(parseDuration('0', '0', '1'), 1000);
  assert.equal(parseDuration('23', '59', '59'), MAX_DURATION);
  for (const values of [['0', '0', '0'], ['24', '0', '0'], ['0', '60', '0'], ['0', '0', '60'], ['', '2', '0'], ['-1', '0', '0'], ['0', '1.5', '0'], ['0', '1e1', '0']]) {
    assert.equal(parseDuration(...values), null);
  }
});
