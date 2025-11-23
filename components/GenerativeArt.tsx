import React, { useRef, useEffect, useMemo } from 'react';

interface GenerativeArtProps {
  intensity?: number;
  speed?: number;
  color?: string;
  variant?: 'network' | 'particles' | 'matrix' | 'flow';
}

interface Animatable {
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export const GenerativeArt: React.FC<GenerativeArtProps> = React.memo(({
  intensity = 50,
  speed = 1,
  color = '#000',
  variant = 'network'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reduce intensity on mobile devices to improve performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveIntensity = isMobile ? Math.floor(intensity * 0.5) : intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Optimization: Disable alpha if not needed, but here we use it for fades.
    // 'alpha: false' would be faster if the background is opaque.
    // Since we use mix-blend-mode or transparency, we keep alpha: true.
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;

    // Helper to parse hex
    const hexToRgb = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgb = hexToRgb(color);

    // Mouse state
    const mouse = {
      x: -9999,
      y: -9999,
      isActive: false
    };

    let resizeTimeout: NodeJS.Timeout;
    const resize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }, 100);
    };
    // Initial resize
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // --- NETWORK NODE CLASS ---
    class Node implements Animatable {
      x: number;
      y: number;
      vx: number;
      vy: number;
      originalVx: number;
      originalVy: number;
      history: { x: number, y: number }[];

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.originalVx = (Math.random() - 0.5) * speed;
        this.originalVy = (Math.random() - 0.5) * speed;
        this.vx = this.originalVx;
        this.vy = this.originalVy;
        this.history = [];
      }

      update() {
        if (mouse.isActive) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          if (Math.abs(dx) < 200 && Math.abs(dy) < 200) {
            const distanceSq = dx * dx + dy * dy;
            const interactionRadiusSq = 40000; // 200^2

            if (distanceSq < interactionRadiusSq) {
              const distance = Math.sqrt(distanceSq);
              const forceDirectionX = dx / distance;
              const forceDirectionY = dy / distance;
              const force = (200 - distance) / 200;
              const push = force * 0.8;
              this.vx += forceDirectionX * push;
              this.vy += forceDirectionY * push;
            }
          }
        }

        this.x += this.vx;
        this.y += this.vy;

        this.vx += (this.originalVx - this.vx) * 0.05;
        this.vy += (this.originalVy - this.vy) * 0.05;

        if (this.x < 0 || this.x > canvas!.width) {
          this.vx *= -1;
          this.originalVx *= -1;
        }
        if (this.y < 0 || this.y > canvas!.height) {
          this.vy *= -1;
          this.originalVy *= -1;
        }

        const maxHistory = isMobile ? 10 : 20;
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > maxHistory) this.history.shift();
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const step = isMobile ? 2 : 1;
        for (let i = 0; i < this.history.length; i += step) {
          const point = this.history[i];
          ctx.lineTo(point.x + (Math.random() - 0.5) * 2, point.y + (Math.random() - 0.5) * 2);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // --- PARTICLE CLASS ---
    class Particle implements Animatable {
      x: number;
      y: number;
      vx: number;
      vy: number;
      originalVx: number;
      originalVy: number;
      size: number;
      alpha: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        const s = speed * 0.3;
        this.originalVx = (Math.random() - 0.5) * s;
        this.originalVy = (Math.random() - 0.5) * s;
        this.vx = this.originalVx;
        this.vy = this.originalVy;
        this.size = Math.random() * 4 + 2;
        this.alpha = Math.random() * 0.3 + 0.1;
      }

      update() {
        if (mouse.isActive) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          if (Math.abs(dx) < 250 && Math.abs(dy) < 250) {
            const distSq = dx * dx + dy * dy;
            if (distSq < 62500) { // 250^2
              const distance = Math.sqrt(distSq);
              const forceDirectionX = dx / distance;
              const forceDirectionY = dy / distance;
              const force = (250 - distance) / 250;
              const push = force * 1.5;
              this.vx += forceDirectionX * push;
              this.vy += forceDirectionY * push;
            }
          }
        }
        this.x += this.vx;
        this.y += this.vy;
        this.vx += (this.originalVx - this.vx) * 0.02;
        this.vy += (this.originalVy - this.vy) * 0.02;
        if (this.x < -50) this.x = canvas!.width + 50;
        if (this.x > canvas!.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas!.height + 50;
        if (this.y > canvas!.height + 50) this.y = -50;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    // --- MATRIX RAIN ---
    class MatrixStream {
      columns: number;
      drops: number[];
      fontSize: number;
      chars: string;

      constructor() {
        this.fontSize = 14;
        this.columns = Math.ceil(canvas!.width / this.fontSize);
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
          this.drops[i] = Math.random() * -100; // Start above screen
        }
        this.chars = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      }

      update() { }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = color;
        ctx.font = `${this.fontSize}px 'JetBrains Mono'`;

        for (let i = 0; i < this.drops.length; i++) {
          const text = this.chars.charAt(Math.floor(Math.random() * this.chars.length));
          const x = i * this.fontSize;
          const y = this.drops[i] * this.fontSize;

          ctx.globalAlpha = Math.random() > 0.9 ? 1 : 0.3;
          ctx.fillText(text, x, y);

          if (y > canvas!.height && Math.random() > 0.975) {
            this.drops[i] = 0;
          }

          this.drops[i] += speed * 0.5;
        }
        ctx.globalAlpha = 1;
      }
    }

    // --- FLOW FIELD ---
    class FlowField {
      cellSize: number;
      rows: number;
      cols: number;
      flow: number[];
      particles: { x: number, y: number, vx: number, vy: number, history: { x: number, y: number }[], age: number }[];

      constructor() {
        this.cellSize = 20;
        this.rows = Math.floor(canvas!.height / this.cellSize) + 1;
        this.cols = Math.floor(canvas!.width / this.cellSize) + 1;
        this.flow = new Array(this.cols * this.rows).fill(0);
        this.particles = [];

        for (let y = 0; y < this.rows; y++) {
          for (let x = 0; x < this.cols; x++) {
            const index = x + y * this.cols;
            const angle = (Math.cos(x * 0.1) + Math.sin(y * 0.1)) * Math.PI * 2;
            this.flow[index] = angle;
          }
        }

        const count = effectiveIntensity * 5;
        for (let i = 0; i < count; i++) {
          this.resetParticle(i, true);
        }
      }

      resetParticle(index: number, random: boolean = false) {
        if (!this.particles[index]) {
          this.particles[index] = { x: 0, y: 0, vx: 0, vy: 0, history: [], age: 0 };
        }
        const p = this.particles[index];
        p.x = Math.random() * canvas!.width;
        p.y = Math.random() * canvas!.height;
        p.vx = 0;
        p.vy = 0;
        p.history = [];
        p.age = Math.random() * 100;
      }

      update() {
        const time = Date.now() * 0.0002 * speed;
        for (let y = 0; y < this.rows; y++) {
          for (let x = 0; x < this.cols; x++) {
            const index = x + y * this.cols;
            const angle = (Math.cos(x * 0.05 + time) + Math.sin(y * 0.05 + time)) * Math.PI;
            this.flow[index] = angle;
          }
        }

        this.particles.forEach((p, i) => {
          const xGrid = Math.floor(p.x / this.cellSize);
          const yGrid = Math.floor(p.y / this.cellSize);
          const index = xGrid + yGrid * this.cols;

          if (this.flow[index] !== undefined) {
            const angle = this.flow[index];
            p.vx += Math.cos(angle) * 0.1;
            p.vy += Math.sin(angle) * 0.1;
          }

          if (mouse.isActive) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            if (Math.abs(dx) < 200 && Math.abs(dy) < 200) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 200) {
                p.vx += (dx / dist) * 0.5;
                p.vy += (dy / dist) * 0.5;
              }
            }
          }

          const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (vel > 2) {
            p.vx = (p.vx / vel) * 2;
            p.vy = (p.vy / vel) * 2;
          }

          p.x += p.vx;
          p.y += p.vy;
          p.age++;

          p.history.push({ x: p.x, y: p.y });
          if (p.history.length > 10) p.history.shift();

          if (p.x < 0 || p.x > canvas!.width || p.y < 0 || p.y > canvas!.height || p.age > 200) {
            this.resetParticle(i);
          }
        });
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        this.particles.forEach(p => {
          if (p.history.length > 1) {
            ctx.moveTo(p.history[0].x, p.history[0].y);
            for (let i = 1; i < p.history.length; i++) {
              ctx.lineTo(p.history[i].x, p.history[i].y);
            }
          }
        });
        ctx.stroke();
      }
    }

    let elements: Animatable[] = [];
    let matrixStream: MatrixStream | null = null;
    let flowField: FlowField | null = null;

    if (variant === 'network') {
      for (let i = 0; i < effectiveIntensity; i++) elements.push(new Node());
    } else if (variant === 'particles') {
      for (let i = 0; i < effectiveIntensity; i++) elements.push(new Particle());
    } else if (variant === 'matrix') {
      matrixStream = new MatrixStream();
    } else if (variant === 'flow') {
      flowField = new FlowField();
    }

    const handleClick = () => {
      if (variant === 'network' || variant === 'particles') {
        elements.forEach((el: any) => {
          const dx = el.x - mouse.x;
          const dy = el.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const blastRadius = 800;
          if (distance < blastRadius) {
            const force = (blastRadius - distance) / blastRadius;
            const angle = Math.atan2(dy, dx);
            const power = 20 * force;
            el.vx += Math.cos(angle) * power;
            el.vy += Math.sin(angle) * power;
          }
        });
      }
    };

    window.addEventListener('mousedown', handleClick);

    const render = () => {
      if (variant === 'network') {
        ctx.fillStyle = 'rgba(230, 230, 230, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        elements.forEach((node, i) => {
          node.update();
          node.draw(ctx);
          if (node instanceof Node) {
            for (let j = i + 1; j < elements.length; j++) {
              const otherNode = elements[j] as Node;
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;

              if (Math.abs(dx) > 150 || Math.abs(dy) > 150) continue;

              const distSq = dx * dx + dy * dy;
              if (distSq < 22500) {
                const dist = Math.sqrt(distSq);
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.quadraticCurveTo(
                  (node.x + otherNode.x) / 2 + (Math.random() - 0.5) * 20,
                  (node.y + otherNode.y) / 2 + (Math.random() - 0.5) * 20,
                  otherNode.x, otherNode.y
                );
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - dist / 150})`;
                ctx.lineWidth = 0.2;
                ctx.stroke();
              }
            }
          }
        });
      } else if (variant === 'matrix') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        matrixStream?.draw(ctx);
      } else if (variant === 'flow') {
        ctx.fillStyle = 'rgba(230, 230, 230, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flowField?.update();
        flowField?.draw(ctx);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        elements.forEach(p => {
          p.update();
          p.draw(ctx);
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleClick);
      cancelAnimationFrame(animationFrameId);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [effectiveIntensity, speed, color, variant]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply" style={{ opacity: variant === 'network' ? 0.6 : (variant === 'matrix' ? 1 : 0.8) }} />;
});