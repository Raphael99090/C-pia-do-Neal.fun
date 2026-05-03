import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Target, Trophy, Info } from "lucide-react";
import { audioSystem } from "../lib/audio";

export function PerfectCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
  const [status, setStatus] = useState<'idle' | 'drawing' | 'calculated'>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw center dot
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    
  }, []);

  const getCoordinates = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (status === 'calculated') reset();
    setIsDrawing(true);
    setStatus('drawing');
    const pos = getCoordinates(e);
    setPoints([pos]);
    audioSystem.playClick();
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const pos = getCoordinates(e);
    setPoints(prev => [...prev, pos]);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    const last = points[points.length - 1];
    if (last) {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    calculateScore();
  };

  const calculateScore = () => {
    if (points.length < 20) {
        setStatus('idle');
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Calculate distances to center
    const distances = points.map(p => {
        return Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    });

    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    
    // Deviation calculation
    let varianceSum = 0;
    distances.forEach(d => {
        varianceSum += Math.pow(d - avgDistance, 2);
    });
    const standardDeviation = Math.sqrt(varianceSum / distances.length);
    
    // Check if it's a closed-ish loop
    const first = points[0];
    const last = points[points.length - 1];
    const closureDist = Math.sqrt(Math.pow(first.x - last.x, 2) + Math.pow(first.y - last.y, 2));
    
    // Score logic (highly subjective, target small SD)
    // 100 - (SD / avgDistance * 500) - (closureDist / avgDistance * 50)
    let finalScore = 100 - (standardDeviation / avgDistance * 400) - (closureDist / avgDistance * 100);
    finalScore = Math.max(0, Math.min(100, finalScore));

    setScore(parseFloat(finalScore.toFixed(1)));
    setStatus('calculated');
    
    if (finalScore > 90) audioSystem.playSuccess();
    else audioSystem.playPop();

    // Draw perfect circle for comparison
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, avgDistance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
  };

  const reset = () => {
    setPoints([]);
    setScore(null);
    setStatus('idle');
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        
        <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
                <h2 className="font-display text-5xl font-black italic uppercase tracking-tighter text-white">Círculo Perfeito</h2>
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Teste de precisão motora</p>
            </div>
            {score !== null && (
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-end"
                >
                    <div className="text-6xl font-black text-blue-400 leading-none">{score}%</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">Precisão Final</div>
                </motion.div>
            )}
        </div>

        <div className="relative aspect-square w-full bg-slate-900 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl cursor-crosshair group touch-none">
            <canvas 
                ref={canvasRef}
                width={800}
                height={800}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={endDrawing}
                onPointerLeave={endDrawing}
                className="w-full h-full"
            />
            
            <AnimatePresence>
                {status === 'idle' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    >
                        <div className="w-16 h-16 border-2 border-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Target className="text-white/20" size={32} />
                        </div>
                        <p className="text-white/30 text-sm font-bold uppercase tracking-[0.4em] text-center px-12">Desenhe um círculo ao redor do ponto central</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <button 
                onClick={reset}
                className="absolute bottom-8 right-8 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all backdrop-blur-md"
            >
                <RefreshCw size={24} />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 glass-card rounded-[32px] flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                    <Target size={24} />
                </div>
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Dica #1</div>
                   <div className="text-sm font-bold text-white leading-tight">Mantenha a velocidade constante</div>
                </div>
            </div>
            <div className="p-6 glass-card rounded-[32px] flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <RefreshCw size={24} />
                </div>
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Dica #2</div>
                   <div className="text-sm font-bold text-white leading-tight">Feche o loop com cuidado</div>
                </div>
            </div>
            <div className="p-6 glass-card rounded-[32px] flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400">
                    <Trophy size={24} />
                </div>
                <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Objetivo</div>
                   <div className="text-sm font-bold text-white leading-tight">Alcance 95% de precisão</div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
