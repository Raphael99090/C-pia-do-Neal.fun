import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Wind, MousePointer2, Settings2, RefreshCw } from "lucide-react";

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;

  constructor(canvasWidth: number, canvasHeight: number, color: string) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.maxLife = 50 + Math.random() * 100;
    this.life = this.maxLife;
    this.color = color;
    this.size = 1 + Math.random() * 2;
  }

  update(mouseX: number | null, mouseY: number | null, gravity: number) {
    if (mouseX !== null && mouseY !== null) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 300) {
        const force = (300 - dist) / 300;
        this.vx += (dx / dist) * force * gravity;
        this.vy += (dy / dist) * force * gravity;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= 1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const opacity = this.life / this.maxLife;
    ctx.fillStyle = this.color.replace('opacity', opacity.toString());
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function ParticleFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gravity, setGravity] = useState(0.5);
  const [colorMode, setColorMode] = useState<'cyan' | 'rose' | 'amber' | 'rainbow'>('cyan');
  const mousePos = useRef<{ x: number, y: number } | null>(null);
  const requestRef = useRef<number>();

  const getColors = (mode: typeof colorMode) => {
    switch (mode) {
      case 'rose': return ['rgba(244, 63, 94, opacity)', 'rgba(251, 113, 133, opacity)'];
      case 'amber': return ['rgba(245, 158, 11, opacity)', 'rgba(251, 191, 36, opacity)'];
      case 'rainbow': return ['rgba(59, 130, 246, opacity)', 'rgba(244, 63, 94, opacity)', 'rgba(16, 185, 129, opacity)', 'rgba(245, 158, 11, opacity)'];
      default: return ['rgba(6, 182, 212, opacity)', 'rgba(34, 211, 238, opacity)'];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = getColors(colorMode);
    const initialParticles = Array.from({ length: 400 }, () => 
      new Particle(canvas.width, canvas.height, colors[Math.floor(Math.random() * colors.length)])
    );
    let pArray = initialParticles;

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // slate-950 with trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pArray.forEach((p, i) => {
        p.update(mousePos.current?.x ?? null, mousePos.current?.y ?? null, gravity);
        p.draw(ctx);
        if (p.life <= 0) {
          const colors = getColors(colorMode);
          pArray[i] = new Particle(canvas.width, canvas.height, colors[Math.floor(Math.random() * colors.length)]);
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [colorMode, gravity]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const colors = getColors(colorMode);
    // Force reset via state or local logic if needed, here we just let them die naturally or could re-init
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 lg:p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl flex flex-col w-full max-w-6xl aspect-[16/10] lg:aspect-[21/9] relative group">
        
        {/* Interaction Canvas */}
        <div className="flex-1 relative cursor-none" onPointerMove={handlePointerMove} onPointerLeave={() => mousePos.current = null}>
          <canvas ref={canvasRef} className="w-full h-full bg-slate-950" />
          
          {/* Custom Cursor */}
          <motion.div 
            style={{ 
              left: mousePos.current?.x ?? -100, 
              top: mousePos.current?.y ?? -100,
              position: 'absolute'
            }}
            className="w-8 h-8 -ml-4 -mt-4 border border-white/20 rounded-full flex items-center justify-center pointer-events-none mix-blend-difference"
          >
            <div className="w-1 h-1 bg-white rounded-full animate-ping" />
          </motion.div>

          <div className="absolute top-10 left-10 pointer-events-none">
            <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-white/20">Particle Flow</h2>
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-white/10 mt-2">Experimental Physics Engine v1.0</p>
          </div>
        </div>

        {/* HUD Controls */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between p-4 glass-card rounded-2xl opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Settings2 size={16} className="text-blue-400" />
              <div className="flex gap-1">
                {(['cyan', 'rose', 'amber', 'rainbow'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setColorMode(mode)}
                    className={`w-6 h-6 rounded-full border border-white/10 transition-transform ${colorMode === mode ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                    style={{ background: mode === 'rainbow' ? 'linear-gradient(45deg, #3b82f6, #ef4444)' : mode === 'cyan' ? '#06b6d4' : mode === 'rose' ? '#f43f5e' : '#f59e0b' }}
                  />
                ))}
              </div>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <Zap size={16} className="text-amber-400" />
              <input 
                type="range" min="0.1" max="2" step="0.1"
                value={gravity}
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-24 accent-amber-500 bg-white/10 rounded-full h-1 appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest hidden sm:block">
               Active Particles: 400
             </div>
             <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
               <RefreshCw size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
