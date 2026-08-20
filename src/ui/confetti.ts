import { prefersReducedMotion } from '../lib/dom';

interface Bit {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; size: number; color: string; life: number;
}

/**
 * A short canvas burst for a perfect run. Reads the live accent so the
 * celebration matches whatever theme is active.
 */
export function burst(count = 90): void {
  if (prefersReducedMotion()) return;

  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--accent').trim() || '#e8ff47';
  const text = styles.getPropertyValue('--text').trim() || '#fff';
  const ok = styles.getPropertyValue('--ok').trim() || '#4ade80';
  const palette = [accent, text, ok];

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:95';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.34;
  const bits: Bit[] = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: 4 + Math.random() * 5,
      color: palette[Math.floor(Math.random() * palette.length)]!,
      life: 1,
    };
  });

  let frame = 0;
  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = false;

    for (const b of bits) {
      b.vy += 0.32;
      b.vx *= 0.995;
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      b.life -= 0.008;
      if (b.life <= 0 || b.y > window.innerHeight + 40) continue;
      alive = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size * 0.6);
      ctx.restore();
    }

    if (alive && frame < 320) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
