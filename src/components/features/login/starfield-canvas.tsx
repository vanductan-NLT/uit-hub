"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number;
  r: number;           // radius
  opacity: number;     // base opacity
  twinkleSpeed: number;
  twinklePhase: number;
  // blue-white color tint for realism
  hue: number;
}

interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  tailLen: number;
  opacity: number;
  active: boolean;
  cooldown: number; // frames until next spawn
}

/**
 * Canvas-based starfield: 300+ stars with individual twinkling + shooting stars.
 * Runs on requestAnimationFrame, cleans up on unmount.
 * Respects prefers-reduced-motion (disables animation).
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Disable animation for users who prefer reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Build star field ──
    const makeStars = (): Star[] =>
      Array.from({ length: 320 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        // Most stars tiny (0.3–1.2px); rare large ones up to 2.2px
        r: Math.random() < 0.08
          ? Math.random() * 1.0 + 1.2
          : Math.random() * 0.9 + 0.3,
        opacity: Math.random() * 0.6 + 0.25,
        twinkleSpeed: Math.random() * 0.018 + 0.004,
        twinklePhase: Math.random() * Math.PI * 2,
        // Slight blue-white variation (hue 0 = pure white, positive = bluish)
        hue: Math.floor(Math.random() * 40),
      }));

    let stars = makeStars();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = makeStars(); // re-scatter on resize so stars fill new dimensions
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Shooting stars pool (3 slots) ──
    const shooters: ShootingStar[] = Array.from({ length: 3 }, (_, i) => ({
      x: 0, y: 0, vx: 0, vy: 0, tailLen: 0, opacity: 0,
      active: false,
      cooldown: 120 + i * 180, // stagger initial spawns
    }));

    const spawnShooter = (s: ShootingStar) => {
      s.x = Math.random() * canvas.width * 0.75;
      s.y = Math.random() * canvas.height * 0.45;
      const deg = Math.random() * 25 + 20; // 20–45° downward angle
      const rad = deg * (Math.PI / 180);
      const speed = Math.random() * 9 + 7;
      s.vx = Math.cos(rad) * speed;
      s.vy = Math.sin(rad) * speed;
      s.tailLen = Math.random() * 90 + 60;
      s.opacity = 0.9;
      s.active = true;
    };

    let frame = 0;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Draw stars ──
      for (const s of stars) {
        const twinkle = prefersReduced
          ? 1
          : Math.sin(frame * s.twinkleSpeed + s.twinklePhase) * 0.35 + 0.65;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        // Slightly warm/cool white for realism
        ctx.fillStyle = s.hue > 20
          ? `rgba(${200 + s.hue},${210 + s.hue},255,${s.opacity * twinkle})`
          : `rgba(255,255,${255 - s.hue * 2},${s.opacity * twinkle})`;
        ctx.fill();
      }

      if (prefersReduced) return;

      // ── Draw shooting stars ──
      for (const s of shooters) {
        if (!s.active) {
          if (--s.cooldown <= 0) {
            spawnShooter(s);
            s.cooldown = Math.random() * 350 + 220; // next spawn delay
          }
          continue;
        }

        s.x += s.vx;
        s.y += s.vy;
        s.opacity -= 0.022;

        if (s.opacity <= 0 || s.x > canvas.width || s.y > canvas.height) {
          s.active = false;
          continue;
        }

        // Tail gradient: transparent → bright white
        const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        const tailX = s.x - (s.vx / spd) * s.tailLen;
        const tailY = s.y - (s.vy / spd) * s.tailLen;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.6, `rgba(200,220,255,${s.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(255,255,255,${s.opacity})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bright head glow
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4);
        glow.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
