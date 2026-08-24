import React, { useEffect, useRef } from "react";
import buildingImage from "@/assets/building-samalocation.jpg";

interface Particle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  repX: number;
  repY: number;
  r: number;
  g: number;
  b: number;
  a: number;
  delay: number; // Staggered entry delay for assembling effect
  size: number;
}

export const Hero20ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: -99999, y: -99999, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = container.clientHeight);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = buildingImage;

    img.onload = () => {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext("2d");
      if (!offCtx) return;

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > canvasAspect) {
        drawH = width / imgAspect;
        drawY = height - drawH;
      } else {
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
        drawY = height - drawH;
      }

      offCtx.drawImage(img, drawX, drawY, drawW, drawH);
      const imgData = offCtx.getImageData(0, 0, width, height).data;

      const particles: Particle[] = [];
      const step = Math.max(3, Math.round(width / 220)); // High resolution dot grid

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          const red = imgData[index];
          const green = imgData[index + 1];
          const blue = imgData[index + 2];
          const alpha = imgData[index + 3];

          // Sample non-white pixels from the illustration
          if (alpha > 30 && (red < 240 || green < 240 || blue < 240)) {
            // Random scattered starting points around the canvas for assembly animation
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * Math.max(width, height) * 0.8 + 100;
            const startX = x + Math.cos(angle) * dist;
            const startY = y + Math.sin(angle) * dist;

            particles.push({
              x: startX,
              y: startY,
              startX,
              startY,
              homeX: x,
              homeY: y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              repX: 0,
              repY: 0,
              r: imgData[index],
              g: imgData[index + 1],
              b: imgData[index + 2],
              a: alpha / 255,
              delay: Math.random() * 0.4, // Staggered timing for building effect
              size: Math.random() > 0.85 ? 2.4 : 1.5,
            });
          }
        }
      }

      particlesRef.current = particles;
      startTimeRef.current = Date.now();
    };

    // Resize Handler
    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth;
      height = canvas.height = container.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse Event Handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -99999, y: -99999, active: false };
    };

    window.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Ease-out cubic calculation
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    // Main Particle Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000; // seconds
      const assembleDuration = 2.0; // 2 seconds assembly duration

      const repulsionRadius = 90;
      const repulsionForce = 14;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Assembling progress with staggered delay
        const pProgress = Math.max(0, Math.min(1, (elapsedTime - p.delay) / assembleDuration));
        const easeProgress = easeOutCubic(pProgress);

        // Interpolate target home position during assembly
        const targetX = p.startX + (p.homeX - p.startX) * easeProgress;
        const targetY = p.startY + (p.homeY - p.startY) * easeProgress;

        // Repulsion physics from mouse cursor
        if (mouse.active && easeProgress > 0.8) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repulsionRadius && dist > 0) {
            const force = (1 - dist / repulsionRadius) * repulsionForce;
            const angle = Math.atan2(dy, dx);
            p.repX += Math.cos(angle) * force;
            p.repY += Math.sin(angle) * force;
          }
        }

        // Dampen repulsion
        p.repX *= 0.90;
        p.repY *= 0.90;

        // Smooth velocity movement towards target
        p.vx += (targetX - p.x) * 0.08;
        p.vy += (targetY - p.y) * 0.08;
        p.vx *= 0.82;
        p.vy *= 0.82;

        p.x += p.vx + p.repX * 0.15;
        p.y += p.vy + p.repY * 0.15;

        // Render dot
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a * easeProgress * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default Hero20ParticleCanvas;
