"use client";
import { useEffect, useRef } from "react";

export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      o: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.3 + 0.05,
    }));
    let t = 0, animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.008;
      stars.forEach((s) => {
        const pulse = s.o + Math.sin(t * s.speed + s.x) * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,228,218,${pulse})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={ref} className="stars-canvas" />;
}
