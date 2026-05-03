import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Circle, MousePointer2, RefreshCw, Info } from "lucide-react";

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
}

export function GravitySandbox() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bodies, setBodies] = useState<Body[]>([]);
  const [activeTab, setActiveTab] = useState<'play' | 'info'>('play');
  const mouseStart = useRef<{ x: number, y: number } | null>(null);
  const mouseCurrent = useRef<{ x: number, y: number } | null>(null);
  const requestRef = useRef<number>();

  const G = 0.5;

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

    // Initial sun
    const initialBodies: Body[] = [
      { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0, mass: 1000, radius: 20, color: '#f59e0b' }
    ];
    let bArray = [...initialBodies];

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Physics
      for (let i = 0; i < bArray.length; i++) {
        for (let j = i + 1; j < bArray.length; j++) {
          const b1 = bArray[i];
          const b2 = bArray[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          
          if (dist < b1.radius + b2.radius) {
             // Basic collision: bounce or ignore
             continue;
          }

          // Softening factor to prevent infinite force at close distances
          const softening = 400; 
          const force = (G * b1.mass * b2.mass) / (distSq + softening);
          const ax = force * (dx / dist);
          const ay = force * (dy / dist);

          b1.vx += ax / b1.mass;
          b1.vy += ay / b1.mass;
          b2.vx -= ax / b2.mass;
          b2.vy -= ay / b2.mass;
        }
      }

      // Update positions
      bArray.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;

        // Draw glow
        ctx.shadowBlur = b.mass > 500 ? 20 : 5;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw launch line
      if (mouseStart.current && mouseCurrent.current) {
        ctx.strokeStyle = 'white';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(mouseStart.current.x, mouseStart.current.y);
        ctx.lineTo(mouseCurrent.current.x, mouseCurrent.current.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && mouseStart.current) {
      mouseCurrent.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!mouseStart.current || !mouseCurrent.current) return;
    
    const dx = mouseStart.current.x - mouseCurrent.current.x;
    const dy = mouseStart.current.y - mouseCurrent.current.y;
    
    const newBody: Body = {
      x: mouseStart.current.x,
      y: mouseStart.current.y,
      vx: dx * 0.05,
      vy: dy * 0.05,
      mass: 10 + Math.random() * 50,
      radius: 4 + Math.random() * 6,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };

    // Note: Since the loop is in the useEffect we need a way to push to the local bArray
    // To keep it simple, I'll just use a hacky event or ref for this demo-level app
    // or properly sync via state. Let's use a workaround with window variable for simple local hack
    // or just put bArray in a Ref. Let's use a Ref for bodies.
  };

  // Redesigning to use bodiesRef for easier physics loop management
  const bodiesRef = useRef<Body[]>([
    { x: 500, y: 300, vx: 0, vy: 0, mass: 1000, radius: 20, color: '#f59e0b' }
  ]);

  useEffect(() => {
    // Sync center if resized
    if (canvasRef.current) {
        bodiesRef.current[0].x = canvasRef.current.width / 2;
        bodiesRef.current[0].y = canvasRef.current.height / 2;
    }
  }, []);

  const launchBody = () => {
    if (!mouseStart.current || !mouseCurrent.current) return;
    if (bodiesRef.current.length > 50) {
        // Remove oldest small body if limit reached, keep the sun
        bodiesRef.current.splice(1, 1);
    }
    
    const dx = mouseStart.current.x - mouseCurrent.current.x;
    const dy = mouseStart.current.y - mouseCurrent.current.y;
    
    bodiesRef.current.push({
      x: mouseStart.current.x,
      y: mouseStart.current.y,
      vx: dx * 0.03, // Reduced from 0.05 for more stable speed
      vy: dy * 0.03,
      mass: 20 + Math.random() * 80,
      radius: 5 + Math.random() * 8,
      color: `hsl(${Math.random() * 360}, 80%, 70%)`
    });
    mouseStart.current = null;
    mouseCurrent.current = null;
  };

  const reset = () => {
    if (!canvasRef.current) return;
    bodiesRef.current = [
      { x: canvasRef.current.width / 2, y: canvasRef.current.height / 2, vx: 0, vy: 0, mass: 1000, radius: 20, color: '#f59e0b' }
    ];
  };

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-8 overflow-hidden bg-slate-950">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <div className="flex flex-col">
                <h1 className="font-display text-4xl font-black text-white italic uppercase tracking-tighter">Gravity Sandbox</h1>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">N-Body Simulation v2.4</p>
            </div>
            <div className="flex gap-2">
                <button onClick={reset} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>

        <div className="flex-1 glass-card rounded-[40px] overflow-hidden relative cursor-crosshair group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <canvas 
                ref={canvasRef} 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={launchBody}
                className="w-full h-full bg-slate-950"
            />
            
            <div className="absolute top-8 left-8 p-4 glass-card rounded-2xl flex flex-col gap-1 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <MousePointer2 size={12} className="text-blue-400" />
                    DRAG TO LAUNCH
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Click and drag to orbit particles around the star</div>
            </div>

            <div className="absolute bottom-8 right-8 flex gap-4">
                <div className="px-4 py-2 glass-card rounded-xl text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    Mass: {bodiesRef.current.length > 1 ? 'Variable' : '1.0 Sun'}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
