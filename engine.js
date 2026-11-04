/* Pure game rules, shared by the browser and Node tests. */
(function(root) {
  'use strict';
  const FLOOR = 350, SIZE = 32, X = 125;
  class Runner {
    constructor(random = Math.random) { this.random = random; this.reset(); }
    reset() { this.state = 'ready'; this.y = FLOOR - SIZE; this.vy = 0; this.distance = 0; this.score = 0; this.speed = 300; this.obstacles = []; this.nextSpawn = 1.5; this.cleared = 0; }
    start() { this.reset(); this.state = 'running'; }
    pause() { if (this.state === 'running') this.state = 'paused'; }
    resume() { if (this.state === 'paused') this.state = 'running'; }
    jump() { if (this.state !== 'running' || this.y < FLOOR - SIZE - .1) return false; this.vy = -660; return true; }
    update(dt) {
      if (this.state !== 'running') return;
      let remaining = Math.min(Math.max(dt, 0), .1);
      while (remaining > 0 && this.state === 'running') { const step = Math.min(remaining, 1 / 120); this.step(step); remaining -= step; }
    }
    step(dt) {
      this.speed = Math.min(520, 300 + this.distance / 180);
      this.distance += this.speed * dt; this.score = Math.floor(this.distance / 30);
      this.vy += 1900 * dt; this.y = Math.min(FLOOR - SIZE, this.y + this.vy * dt);
      if (this.y === FLOOR - SIZE) this.vy = 0;
      this.nextSpawn -= dt;
      if (this.nextSpawn <= 0) {
        this.obstacles.push({ x: 1000, w: 26 + this.random() * 20, h: 38 + this.random() * 22, passed: false });
        // Full jump lasts ~.69s; >=1.2s spacing leaves time to land.
        this.nextSpawn = 1.2 + this.random() * .65;
      }
      for (const o of this.obstacles) {
        o.x -= this.speed * dt;
        if (X + SIZE - 4 > o.x && X + 4 < o.x + o.w && this.y + SIZE - 4 > FLOOR - o.h && this.y + 4 < FLOOR) this.state = 'over';
        if (!o.passed && o.x + o.w < X) { o.passed = true; this.cleared++; }
      }
      this.obstacles = this.obstacles.filter(o => o.x + o.w > -20);
    }
  }
  const api = { Runner, FLOOR, SIZE, X };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NeonEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
