'use strict';
const { Runner, FLOOR, SIZE, X } = NeonEngine;
const game = new Runner();
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ } }
};
const savedBest = store.get('neon-best', 0);
let best = Number.isFinite(savedBest) && savedBest >= 0 ? Math.floor(savedBest) : 0;
let sound = store.get('neon-sound', false) === true;
let reduced = store.get('neon-motion', matchMedia('(prefers-reduced-motion: reduce)').matches) === true;
let audio, previous = 0;
const format = n => String(n).padStart(5, '0');
$('best').textContent = format(best); $('sound').checked = sound; $('motion').checked = reduced;
function beep(frequency, duration = .08) {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.07, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch { /* Audio support is optional. */ }
}
function announce(text) { $('announcement').textContent = text; }
function showOverlay(kicker, title, copy, button) {
  $('overlay-kicker').textContent = kicker; $('overlay-title').textContent = title;
  $('overlay-copy').textContent = copy; $('start-btn').textContent = button;
  $('overlay').hidden = false; $('start-btn').focus({ preventScroll: true });
}
function startOrResume() {
  if (game.state === 'paused') game.resume(); else game.start();
  $('overlay').hidden = true; $('pause-btn').disabled = false; $('pause-btn').textContent = 'Pause'; $('jump-btn').disabled = false;
  $('status').textContent = 'KEEP YOUR RHYTHM'; previous = performance.now(); canvas.focus({ preventScroll: true });
  announce('Run started. Jump over the pink barriers.');
}
function pause() {
  if (game.state !== 'running') return;
  game.pause(); $('pause-btn').textContent = 'Resume'; $('jump-btn').disabled = true; $('status').textContent = 'TAKE A BREATHER';
  showOverlay('THE CITY CAN WAIT', 'PAUSED', 'Your run will be right here.', 'RESUME RUN ↗'); announce('Game paused.');
}
function jump() { if (game.jump()) beep(440); }
function finish() {
  const record = game.score > best;
  if (record) { best = game.score; store.set('neon-best', best); $('best').textContent = format(best); }
  $('pause-btn').disabled = true; $('jump-btn').disabled = true; $('status').textContent = 'ONE MORE TRY?';
  showOverlay(record ? 'A NEW PERSONAL BEST' : 'THE HORIZON IS STILL THERE', 'RUN OVER', `${game.score} points · ${game.cleared} barriers cleared`, 'RUN IT BACK ↗');
  announce(`Run over. Score ${game.score}.${record ? ' New personal best!' : ''}`); beep(110, .22);
}
$('start-btn').addEventListener('click', startOrResume);
$('pause-btn').addEventListener('click', () => game.state === 'paused' ? startOrResume() : pause());
$('jump-btn').addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
$('jump-btn').addEventListener('click', e => { if (e.detail === 0) jump(); });
canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.focus({ preventScroll: true }); jump(); });
document.addEventListener('keydown', e => {
  if ($('settings').open || e.target.tagName === 'INPUT') return;
  if (['Escape','KeyP'].includes(e.code) && !e.repeat) { e.preventDefault(); if (game.state === 'paused') startOrResume(); else pause(); return; }
  if (['BUTTON','A'].includes(e.target.tagName)) return;
  if (['Space','ArrowUp','KeyW'].includes(e.code)) { e.preventDefault(); if (!e.repeat) jump(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);
$('settings-btn').addEventListener('click', () => { pause(); $('settings').showModal(); });
$('sound').addEventListener('change', e => { sound = e.target.checked; store.set('neon-sound', sound); beep(600); });
$('motion').addEventListener('change', e => { reduced = e.target.checked; store.set('neon-motion', reduced); });
function draw() {
  const w = 960, h = 440, travel = reduced ? 0 : game.distance;
  const sky = ctx.createLinearGradient(0,0,0,h); sky.addColorStop(0,'#0b1020'); sky.addColorStop(.8,'#1e1731'); sky.addColorStop(1,'#101a2d');
  ctx.fillStyle = sky; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#c0d3ea';
  for (let i=0;i<45;i++) { ctx.globalAlpha = .15+(i%4)*.13; ctx.fillRect((i*137+53)%w,(i*73+15)%220,1.5,1.5); } ctx.globalAlpha = 1;
  const glow = ctx.createRadialGradient(730,140,10,730,140,155); glow.addColorStop(0,'#fa649b1e'); glow.addColorStop(1,'#fa649b00'); ctx.fillStyle = glow; ctx.fillRect(570,0,330,320);
  ctx.strokeStyle = '#cc709655'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(730,140,63,0,Math.PI*2); ctx.stroke();
  for (let layer=0;layer<2;layer++) {
    const spacing = layer ? 85 : 65, offset = travel*(layer ? .14 : .05);
    for (let i=-1;i<18;i++) {
      const bx = i*spacing-offset%spacing, bh = 50+((i+20)*47+layer*29)%125;
      ctx.fillStyle = layer ? '#111a2b' : '#1c2036'; ctx.fillRect(bx,FLOOR-bh,spacing-10,bh);
      ctx.fillStyle = layer ? '#4ee3d01b' : '#9c67961e';
      for (let y=FLOOR-bh+15;y<FLOOR-10;y+=21) for (let x=bx+10;x<bx+spacing-18;x+=17) ctx.fillRect(x,y,4,7);
    }
  }
  ctx.fillStyle = '#0b1324'; ctx.fillRect(0,FLOOR,w,h-FLOOR); ctx.strokeStyle = '#65f7e32b'; ctx.lineWidth = 1;
  for (let i=-12;i<25;i++) { const x=i*80-travel%80; ctx.beginPath(); ctx.moveTo(x,FLOOR); ctx.lineTo(x+(x-480)*.4,h); ctx.stroke(); }
  for (const y of [365,390,428]) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  ctx.shadowColor = '#65f7e3'; ctx.shadowBlur = reduced ? 0 : 10; ctx.fillStyle = '#65f7e3'; ctx.fillRect(0,FLOOR,w,2); ctx.shadowBlur = 0;
  for (const o of game.obstacles) {
    ctx.shadowColor = '#fa649b'; ctx.shadowBlur = reduced ? 0 : 15; ctx.fillStyle = '#52233e'; ctx.fillRect(o.x,FLOOR-o.h,o.w,o.h);
    ctx.strokeStyle = '#fa649b'; ctx.lineWidth = 2; ctx.strokeRect(o.x+1,FLOOR-o.h+1,o.w-2,o.h-2); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fa649b'; ctx.fillRect(o.x+6,FLOOR-o.h+7,o.w-12,3);
  }
  if (!reduced && game.state === 'running') for (let i=1;i<=5;i++) { ctx.fillStyle = `rgba(101,247,227,${.12/i})`; ctx.fillRect(X-i*13,game.y+i*2,SIZE,SIZE-i*4); }
  ctx.shadowColor = '#65f7e3'; ctx.shadowBlur = reduced ? 0 : 18; ctx.fillStyle = '#65f7e3'; ctx.fillRect(X,game.y,SIZE,SIZE); ctx.shadowBlur = 0;
  ctx.fillStyle = '#14353c'; ctx.fillRect(X+19,game.y+8,8,7); ctx.fillRect(X+6,game.y+24,20,3);
}
function frame(time) {
  const dt = previous ? (time-previous)/1000 : 0; previous = time;
  const wasRunning = game.state === 'running'; game.update(dt);
  $('score').textContent = format(game.score); $('pace').textContent = `PACE ${String(1+Math.floor((game.speed-300)/55)).padStart(2,'0')}`;
  draw(); if (wasRunning && game.state === 'over') finish(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
