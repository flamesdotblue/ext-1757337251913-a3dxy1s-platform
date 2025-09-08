import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const TILE = 16; // base pixel tile
const SCALE = 3; // visual scale multiplier
const VIEW_W = 24; // tiles wide
const VIEW_H = 14; // tiles tall
const GRAVITY = 0.45;
const JUMP_VELOCITY = -7.8;
const MOVE_SPEED = 2.1;
const FRICTION = 0.85;

// Simple level: 0 empty, 1 solid block, 2 coin, 3 flag
const LEVELS = [
  {
    width: 64,
    height: 16,
    data: buildLevel1()
  }
];

function buildLevel1() {
  const w = 64, h = 16;
  const arr = new Array(h).fill(0).map(() => new Array(w).fill(0));
  // ground
  for (let x = 0; x < w; x++) {
    for (let y = 12; y < h; y++) arr[y][x] = 1;
  }
  // platforms
  for (let x = 6; x < 12; x++) arr[9][x] = 1;
  for (let x = 18; x < 26; x++) arr[8][x] = 1;
  for (let x = 30; x < 36; x++) arr[10][x] = 1;
  for (let x = 42; x < 50; x++) arr[7][x] = 1;

  // coins
  arr[8][8] = 2;
  arr[7][20] = 2;
  arr[6][22] = 2;
  arr[9][33] = 2;
  arr[6][45] = 2;

  // gaps
  arr[12][14] = 0; arr[13][14] = 0; arr[14]?.[14] = 0; arr[15]?.[14] = 0;
  arr[12][15] = 0; arr[13][15] = 0; arr[12][16] = 0; arr[13][16] = 0;

  // flag at near end
  arr[11][60] = 3; arr[10][60] = 3; arr[9][60] = 3; arr[8][60] = 3; arr[7][60] = 3; arr[6][60] = 3;

  return arr;
}

function rectsIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

const GameCanvas = forwardRef(function GameCanvas({ onGameUpdate }, ref) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(0);

  useImperativeHandle(ref, () => ({
    reset: () => initState(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = VIEW_W * TILE * SCALE;
      const height = VIEW_H * TILE * SCALE;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const keys = new Set();
    const onKeyDown = (e) => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
      keys.add(e.key);
    };
    const onKeyUp = (e) => keys.delete(e.key);

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    resize();

    initState();

    function initState() {
      const levelIndex = 0;
      const level = LEVELS[levelIndex];
      stateRef.current = {
        levelIndex,
        level,
        cameraX: 0,
        player: {
          x: 2 * TILE,
          y: 0,
          w: 12,
          h: 16,
          vx: 0,
          vy: 0,
          onGround: false,
          facing: 1,
        },
        score: 0,
        coins: 0,
        lives: 3,
        won: false,
      };
      sendHUD();
    }

    function tileAt(px, py) {
      const { level } = stateRef.current;
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      if (ty < 0 || ty >= level.height || tx < 0 || tx >= level.width) return 1; // treat out of bounds as solid
      return level.data[ty][tx];
    }

    function setTile(tx, ty, val) {
      const { level } = stateRef.current;
      if (ty < 0 || ty >= level.height || tx < 0 || tx >= level.width) return;
      level.data[ty][tx] = val;
    }

    function update(dt) {
      const s = stateRef.current;
      const p = s.player;

      // Input
      const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
      const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
      const jumpPressed = keys.has(' ') || keys.has('ArrowUp') || keys.has('w') || keys.has('W');

      if (left) { p.vx -= MOVE_SPEED; p.facing = -1; }
      if (right) { p.vx += MOVE_SPEED; p.facing = 1; }

      // friction when no input
      if (!left && !right) p.vx *= FRICTION;

      // jump
      if (jumpPressed && p.onGround) {
        p.vy = JUMP_VELOCITY;
        p.onGround = false;
      }

      // gravity
      p.vy += GRAVITY;

      // Integrate and collide X
      let newX = p.x + p.vx * dt;
      if (p.vx !== 0) {
        const dir = Math.sign(p.vx);
        const ahead = newX + (dir > 0 ? p.w : 0);
        const top = p.y + 1;
        const bottom = p.y + p.h - 2;
        const step = TILE / 2;
        for (let yy = top; yy <= bottom; yy += step) {
          const tile = tileAt(ahead, yy);
          if (tile === 1) { // solid
            newX = Math.floor(ahead / TILE) * TILE - (dir > 0 ? p.w : -1);
            p.vx = 0;
            break;
          }
        }
      }
      p.x = newX;

      // Integrate and collide Y
      let newY = p.y + p.vy * dt;
      p.onGround = false;
      if (p.vy !== 0) {
        const dir = Math.sign(p.vy);
        const ahead = newY + (dir > 0 ? p.h : 0);
        const leftX = p.x + 2;
        const rightX = p.x + p.w - 2;
        const step = TILE / 2;
        for (let xx = leftX; xx <= rightX; xx += step) {
          const tile = tileAt(xx, ahead);
          if (tile === 1) {
            newY = Math.floor(ahead / TILE) * TILE - (dir > 0 ? p.h : -1);
            p.vy = 0;
            if (dir > 0) p.onGround = true;
            break;
          }
        }
      }
      p.y = newY;

      // Collect coins / check flag
      const centerX = p.x + p.w / 2;
      const centerY = p.y + p.h / 2;
      const tx = Math.floor(centerX / TILE);
      const ty = Math.floor(centerY / TILE);
      const t = tileAt(centerX, centerY);
      if (t === 2) {
        setTile(tx, ty, 0);
        s.coins += 1;
        s.score += 100;
        sendHUD();
      } else if (t === 3 && !s.won) {
        s.won = true;
        s.score += 500;
        sendHUD();
      }

      // Death if falling
      if (p.y > (s.level.height + 2) * TILE) {
        s.lives -= 1;
        if (s.lives <= 0) {
          // reset everything
          initState();
        } else {
          // respawn
          p.x = 2 * TILE; p.y = 0; p.vx = 0; p.vy = 0; p.onGround = false;
          sendHUD();
        }
      }

      // Cap speeds
      p.vx = Math.max(Math.min(p.vx, 6), -6);
      p.vy = Math.max(Math.min(p.vy, 12), -12);

      // Camera follows player
      const viewPxW = VIEW_W * TILE;
      s.cameraX = Math.max(0, Math.min(p.x - viewPxW / 3, s.level.width * TILE - viewPxW));
    }

    function draw() {
      const s = stateRef.current;
      const { level } = s;
      const p = s.player;
      const viewW = VIEW_W * TILE;
      const viewH = VIEW_H * TILE;

      // clear
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, viewW * SCALE, viewH * SCALE);

      ctx.save();
      ctx.scale(SCALE, SCALE);

      // parallax background
      ctx.fillStyle = '#0e1b3a';
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.fillStyle = '#0c1530';
      for (let i = 0; i < 50; i++) {
        const x = (i * 73) % (viewW * 4) - (s.cameraX * 0.3) % (viewW * 4);
        const y = 4 + (i * 29) % (viewH - 8);
        ctx.fillRect(x, y, 2, 2);
      }

      ctx.translate(-s.cameraX, 0);

      // draw level tiles
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const t = level.data[y][x];
          const px = x * TILE, py = y * TILE;
          if (t === 1) {
            // solid block
            ctx.fillStyle = '#2b3a5a';
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#3b507d';
            ctx.fillRect(px+2, py+2, TILE-4, TILE-4);
          } else if (t === 2) {
            // coin
            ctx.fillStyle = '#f7c948';
            ctx.beginPath();
            ctx.arc(px + TILE/2, py + TILE/2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff2b2';
            ctx.fillRect(px + TILE/2 - 1, py + TILE/2 - 3, 2, 6);
          } else if (t === 3) {
            // flag pole
            ctx.fillStyle = '#c4d0e6';
            ctx.fillRect(px + TILE/2 - 1, py, 2, TILE);
            ctx.fillStyle = '#f2555a';
            ctx.beginPath();
            ctx.moveTo(px + TILE/2, py + 4);
            ctx.lineTo(px + TILE/2 + 8, py + 8);
            ctx.lineTo(px + TILE/2, py + 12);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // draw player (simple pixel Mario-like)
      drawMario(ctx, p.x, p.y, p.facing);

      // win banner
      if (s.won) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(s.cameraX + 20, 20, 140, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('Level Complete!', s.cameraX + 30, 38);
      }

      ctx.restore();
    }

    function drawMario(ctx, x, y, facing) {
      ctx.save();
      if (facing < 0) {
        ctx.translate(x + 8, 0);
        ctx.scale(-1, 1);
        x = 0; // after transform, draw at 0
      }
      // body base
      ctx.fillStyle = '#ef4444'; // hat/shirt
      ctx.fillRect(x + 2, y, 12, 4); // hat brim
      ctx.fillRect(x + 4, y + 2, 8, 4); // hat top

      ctx.fillStyle = '#f1c27d'; // face
      ctx.fillRect(x + 5, y + 6, 6, 6);

      ctx.fillStyle = '#2563eb'; // overalls
      ctx.fillRect(x + 3, y + 12, 10, 8);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x + 3, y + 14, 10, 6);

      ctx.fillStyle = '#ef4444'; // sleeves
      ctx.fillRect(x + 2, y + 12, 3, 4);
      ctx.fillRect(x + 11, y + 12, 3, 4);

      ctx.fillStyle = '#f1c27d'; // hands
      ctx.fillRect(x + 1, y + 15, 3, 3);
      ctx.fillRect(x + 12, y + 15, 3, 3);

      ctx.fillStyle = '#1f2937'; // boots
      ctx.fillRect(x + 3, y + 20, 4, 3);
      ctx.fillRect(x + 9, y + 20, 4, 3);
      ctx.restore();
    }

    let last = 0;
    function loop(ts) {
      const s = stateRef.current;
      if (!s) return;
      const dt = Math.min((ts - last) / 16.67, 2); // normalize to ~60fps steps
      last = ts;
      update(dt);
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    function sendHUD() {
      const s = stateRef.current;
      onGameUpdate?.({ score: s.score, coins: s.coins, lives: s.lives, level: (s.levelIndex + 1) });
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onGameUpdate]);

  return (
    <div className="relative w-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
      <canvas ref={canvasRef} className="block mx-auto aspect-[24/14]" />
    </div>
  );
});

export default GameCanvas;
