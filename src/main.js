import { Timer, formatTime, parseDuration } from './timer.js';

const $ = (selector) => document.querySelector(selector);
const timer = new Timer();
const storageKey = 'timer-g-v1';
const fields = [$('#hours'), $('#minutes'), $('#seconds')];
const presets = [...document.querySelectorAll('.preset')];
let mode = 'Focus';
let soundEnabled = true;
let audioContext;
let toastTimeout;
let previousState;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && timer.restore(saved.timer)) {
    mode = ['Focus', 'Pausa breve', 'Pausa lunga', 'Il tuo timer'].includes(saved.mode) ? saved.mode : 'Il tuo timer';
    soundEnabled = typeof saved.sound === 'boolean' ? saved.sound : true;
  }
} catch { /* Il timer funziona anche senza accesso all'archiviazione. */ }

$('#sound').checked = soundEnabled;

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ timer: timer.snapshot(), mode, sound: soundEnabled })); } catch { /* Archiviazione facoltativa. */ }
}

function setFields() {
  const seconds = Math.round(timer.durationMs / 1000);
  fields[0].value = Math.floor(seconds / 3600);
  fields[1].value = Math.floor(seconds / 60) % 60;
  fields[2].value = seconds % 60;
}

function selectPreset() {
  presets.forEach((preset) => {
    const selected = preset.dataset.mode === mode && Number(preset.dataset.seconds) * 1000 === timer.durationMs;
    preset.classList.toggle('selected', selected);
    preset.setAttribute('aria-pressed', String(selected));
  });
  $('#timer-heading').textContent = mode;
}

function announce(message) { $('#announcement').textContent = message; }

function toast(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}

function unlockAudio() {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  } catch { /* Il browser può non supportare l'audio. */ }
}

function playChime() {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  try {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + index * 0.22;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.1);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 1.15);
    });
  } catch { /* La scadenza resta visibile se l'audio non è disponibile. */ }
}

function render() {
  timer.tick();
  const remaining = formatTime(timer.remainingMs);
  const running = timer.state === 'running';
  const status = { idle: 'TUTTO PRONTO', running: 'UN PASSO ALLA VOLTA', paused: 'IN PAUSA', finished: 'TEMPO SCADUTO' };
  const caption = { idle: 'Questo momento è tuo.', running: 'Respira. Sei nel tuo ritmo.', paused: 'Riprendi quando vuoi.', finished: 'Bel lavoro. Prenditi una pausa.' };
  $('#time-display').textContent = remaining;
  $('#time-display').classList.toggle('with-hours', remaining.length > 5);
  $('#time-display').setAttribute('aria-label', `${remaining} rimanenti`);
  $('.ring-progress').style.strokeDashoffset = String(100 * (1 - timer.remainingMs / timer.durationMs));
  $('.timer-panel').dataset.state = timer.state;
  $('#timer-status').textContent = status[timer.state];
  $('#timer-caption').textContent = caption[timer.state];
  $('#start-label').textContent = running ? 'Pausa' : timer.state === 'paused' ? 'Riprendi' : timer.state === 'finished' ? 'Ricomincia' : 'Inizia';
  $('#start-icon').innerHTML = running ? '<path d="M8 5v14M16 5v14"/>' : '<path d="m8 5 11 7-11 7Z"/>';
  $('#add-minute').disabled = timer.durationMs >= 86_399_000;
  document.title = timer.state === 'idle' ? 'timer/g — Il tempo, al tuo ritmo.' : `${remaining} · ${timer.state === 'finished' ? 'Tempo scaduto' : mode} — timer/g`;
  if (previousState && previousState !== 'finished' && timer.state === 'finished') {
    playChime();
    announce('Tempo scaduto. Bel lavoro!');
    toast('Tempo scaduto. Bel lavoro! 🌿');
    persist();
  }
  previousState = timer.state;
}

function toggleTimer() {
  unlockAudio();
  timer.tick();
  if (timer.state === 'running') timer.pause();
  else timer.start();
  render();
  persist();
  announce(timer.state === 'running' ? 'Timer avviato.' : 'Timer in pausa.');
}

$('#start').addEventListener('click', toggleTimer);
$('#reset').addEventListener('click', () => {
  timer.reset();
  render();
  persist();
  announce('Timer reimpostato.');
});

$('#add-minute').addEventListener('click', () => {
  const added = timer.addMinute();
  mode = 'Il tuo timer';
  setFields();
  selectPreset();
  render();
  persist();
  announce(`Aggiunti ${added / 1000} secondi.`);
});

presets.forEach((preset) => preset.addEventListener('click', () => {
  timer.configure(Number(preset.dataset.seconds) * 1000);
  mode = preset.dataset.mode;
  $('#duration-error').hidden = true;
  setFields();
  selectPreset();
  render();
  persist();
  announce(`${mode}: ${formatTime(timer.durationMs)}. Timer pronto.`);
}));

$('#duration-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const duration = parseDuration(...fields.map((field) => field.value));
  if (!duration) {
    $('#duration-error').textContent = 'Scegli da 1 secondo a 23:59:59. Minuti e secondi devono essere tra 0 e 59.';
    $('#duration-error').hidden = false;
    return;
  }
  $('#duration-error').hidden = true;
  timer.configure(duration);
  mode = 'Il tuo timer';
  selectPreset();
  render();
  persist();
  announce(`Durata impostata: ${formatTime(duration)}.`);
});

$('#sound').addEventListener('change', (event) => {
  soundEnabled = event.target.checked;
  if (soundEnabled) { unlockAudio(); playChime(); }
  persist();
});

$('#fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('.timer-panel').requestFullscreen();
  } catch { toast('Schermo intero non disponibile in questo browser.'); }
});
if (!document.fullscreenEnabled) $('#fullscreen').hidden = true;
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Esci da schermo intero' : 'Schermo intero';
  $('#fullscreen').setAttribute('aria-label', label);
  $('#fullscreen').title = label;
});

document.addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.code === 'Space') { event.preventDefault(); toggleTimer(); }
  if (event.key.toLowerCase() === 'r') { event.preventDefault(); $('#reset').click(); }
});
document.addEventListener('visibilitychange', () => { render(); persist(); });
window.addEventListener('pagehide', persist);
setFields();
selectPreset();
render();
setInterval(render, 200);
