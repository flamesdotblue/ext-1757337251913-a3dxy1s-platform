import { useEffect, useRef } from 'react';

const TILE = 16; // base tile size in pixels
const COLS = 40;
const ROWS = 18;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;

const SOLID = new Set([1, 2]);

function makeLevel() {
  // 0 empty, 1 ground, 2 brick, 3 coin
  const arr = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));

  // ground
  for (let x = 0; x < COLS; x++) {
    arr[ROWS - 2][x] = 1; // top ground layer
    arr[ROWS - 1][x] = 1; // bedrock
  }

  // some platforms
  for (let x = 6; x < 12; x++) arr[12][x] = 2;
  for (let x = 15; x < 20; x++) arr[9][x] = 2;
  for (let x = 24; x < 28; x++) arr[7][x] = 2;

  // coins
  arr[11][7] = 3; arr[11][9] = 3; arr[8][16] = 3; arr[6][25] = 3; arr[6][27] = 3;
  arr[15][5] = 3; arr[15][10] = 3; arr[15][18] = 3; arr[15][22] = 3; arr[15][30] = 3;

  // gaps in ground
  arr[ROWS - 2][12] = 0; arr[ROWS - 2][13] = 0; arr[ROWS - 2][14] = 0; arr[ROWS - 2][15] = 0;
  arr[ROWS - 1][12] = 0; arr[ROWS - 1][13] = 0; arr[ROWS - 1][14] = 0; arr[ROWS - 1][15] = 0;

  return arr;
}

export default function GameCanvas({ onUpdate }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const level = makeLevel();

    const player = {
      x: 2 * TILE,
      y: 6 * TILE,
      w: 12,
      h: 14,
      vx: 0,
      vy: 0,
      speed: 0.9,
      jump: 4,
      onGround: false,
      lives: 3,
      score: 0,
      coins: 0,
    };

    const keys = new Set();
    function onKeyDown(e) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", "KeyR"].includes(e.code)) e.preventDefault();
      keys.add(e.code);
      if (e.code === 'KeyR') reset();
    }
    function onKeyUp(e) { keys.delete(e.code); }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function reset() {
      // reset player and level coins
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (level[r][c] === 3) level[r][c] = 0; // clear old coins to avoid duplication
        }
      }
      const fresh = makeLevel();
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) level[r][c] = fresh[r][c];
      }
      player.x = 2 * TILE; player.y = 6 * TILE; player.vx = 0; player.vy = 0; player.onGround = false;
      player.coins = 0; player.score = 0;
      startTimeRef.current = performance.now();
    }

    function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function getTile(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 1; // out of bounds solid
      return level[row][col];
    }

    function collideAndResolve(px, py, pw, ph, vx, vy) {
      let nx = px + vx;
      let ny = py + vy;

      // Horizontal
      if (vx !== 0) {
        const dir = Math.sign(vx);
        const ahead = dir > 0 ? Math.floor((nx + pw - 1) / TILE) : Math.floor(nx / TILE);
        const top = Math.floor(py / TILE);
        const bottom = Math.floor((py + ph - 1) / TILE);
        let blocked = false;
        for (let r = top; r <= bottom; r++) {
          if (SOLID.has(getTile(ahead, r))) { blocked = true; break; }
        }
        if (blocked) {
          nx = dir > 0 ? ahead * TILE - pw : (ahead + 1) * TILE;
          vx = 0;
        }
      }

      // Vertical
      if (vy !== 0) {
        const dir = Math.sign(vy);
        const below = dir > 0 ? Math.floor((ny + ph - 1) / TILE) : Math.floor(ny / TILE);
        const left = Math.floor(nx / TILE);
        const right = Math.floor((nx + pw - 1) / TILE);
        let blocked = false;
        for (let c = left; c <= right; c++) {
          if (SOLID.has(getTile(c, below))) { blocked = true; break; }
        }
        if (blocked) {
          ny = dir > 0 ? below * TILE - ph : (below + 1) * TILE;
          vy = 0;
        }
      }

      return { x: nx, y: ny, vx, vy };
    }

    function collectCoins() {
      const left = Math.floor(player.x / TILE);
      const right = Math.floor((player.x + player.w - 1) / TILE);
      const top = Math.floor(player.y / TILE);
      const bottom = Math.floor((player.y + player.h - 1) / TILE);
      for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
          if (getTile(c, r) === 3) {
            level[r][c] = 0;
            player.coins += 1;
            player.score += 100;
          }
        }
      }
    }

    function update(dt) {
      const accel = player.speed;
      const onGroundBefore = player.onGround;

      // input
      const left = keys.has('ArrowLeft') || keys.has('KeyA');
      const right = keys.has('ArrowRight') || keys.has('KeyD');
      const jump = keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW');

      player.vx = 0;
      if (left) player.vx -= accel * dt * 0.06 * TILE; // scaled
      if (right) player.vx += accel * dt * 0.06 * TILE;

      // gravity
      player.vy += 0.24 * TILE * (dt / 16.67);
      if (player.vy > 6) player.vy = 6;

      // jumping
      player.onGround = false;
      const afterX = collideAndResolve(player.x, player.y, player.w, player.h, player.vx, 0);
      player.x = afterX.x; player.vx = afterX.vx;
      const afterY = collideAndResolve(player.x, player.y, player.w, player.h, 0, player.vy);
      if (player.vy > 0 && afterY.vy === 0) player.onGround = true; // landed
      player.y = afterY.y; player.vy = afterY.vy;

      if (jump && player.onGround && !onGroundBefore) {
        player.vy = -player.jump;
      }

      // fall off map -> lose a life and reset position
      if (player.y > WORLD_H + 50) {
        player.lives = Math.max(0, player.lives - 1);
        player.x = 2 * TILE; player.y = 6 * TILE; player.vx = 0; player.vy = 0; player.onGround = false;
      }

      collectCoins();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // parallax sky
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // simple background hills
      ctx.fillStyle = '#1b2d5b';
      for (let i = 0; i < 8; i++) {
        const w = 60 + (i % 3) * 20;
        const h = 20 + (i % 3) * 10;
        const x = (i * 70) % canvas.width;
        const y = canvas.height - 60 - h;
        ctx.fillRect(x, y, w, h);
      }

      // tiles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const t = level[r][c];
          if (!t) continue;
          const x = c * TILE;
          const y = r * TILE;
          if (t === 1) { // ground
            ctx.fillStyle = '#3b2f2f';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = '#715a2e';
            ctx.fillRect(x+1, y+1, TILE-2, TILE-6);
          } else if (t === 2) { // brick
            ctx.fillStyle = '#9b4a11';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = '#e2a06b';
            ctx.lineWidth = 1;
            ctx.strokeRect(x+0.5, y+0.5, TILE-1, TILE-1);
            ctx.beginPath();
            ctx.moveTo(x, y+TILE/2);
            ctx.lineTo(x+TILE, y+TILE/2);
            ctx.stroke();
          } else if (t === 3) { // coin
            ctx.fillStyle = '#ffd33d';
            ctx.beginPath();
            ctx.arc(x + TILE/2, y + TILE/2, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // player
      ctx.fillStyle = '#ff3131';
      ctx.fillRect(player.x, player.y, player.w, player.h);
      // hat
      ctx.fillStyle = '#b00000';
      ctx.fillRect(player.x, player.y - 3, player.w, 4);
      // eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(player.x + 3, player.y + 5, 2, 2);
      ctx.fillRect(player.x + 7, player.y + 5, 2, 2);

      // ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      const shadowY = Math.min(canvas.height - 12, player.y + player.h + 6);
      ctx.fillRect(player.x - 2, shadowY, player.w + 4, 3);
    }

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(32, now - last);
      last = now;
      update(dt);
      draw();

      const elapsed = (now - startTimeRef.current) / 1000;
      if (onUpdate) onUpdate({ score: player.score, coins: player.coins, lives: player.lives, time: elapsed });

      rafRef.current = requestAnimationFrame(loop);
    }

    // handle pixel scaling with CSS while keeping internal resolution crisp
    function resize() {
      const parent = canvas.parentElement;
      const maxW = parent.clientWidth;
      const scale = Math.floor(Math.max(1, Math.min(maxW / WORLD_W, 3)));
      canvas.style.width = WORLD_W * scale + 'px';
      canvas.style.height = WORLD_H * scale + 'px';
      canvas.width = WORLD_W;
      canvas.height = WORLD_H;
    }

    resize();
    window.addEventListener('resize', resize);

    rafRef.current = requestAnimationFrame(loop);

    stateRef.current = { reset };

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onUpdate]);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-neutral-950 p-3 shadow-inner">
      <div className="mx-auto flex justify-center">
        <canvas
          ref={canvasRef}
          className="[image-rendering:pixelated]"
          width={WORLD_W}
          height={WORLD_H}
        />
      </div>
      <div className="mt-3 text-center text-xs text-neutral-400">Collect coins and avoid falling into gaps. Press R to reset.</div>
    </div>
  );
}
