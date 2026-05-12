import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Activity, RotateCcw } from "lucide-react";
import { audioSystem } from "../lib/audio";
import { Leaderboard } from "./Leaderboard";

interface Entity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'food' | 'enemy' | 'player';
  targetX?: number;
  targetY?: number;
}

const COLORS = {
  player: '#0ea5e9', // sky-500
  food: [ '#10b981', '#34d399', '#6ee7b7' ], // emeralds
  enemy: [ '#ef4444', '#f97316', '#eab308', '#8b5cf6' ],
};

export function CellStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'leaderboard'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const stateRef = useRef({
    player: { x: 0, y: 0, vx: 0, vy: 0, radius: 15, mass: 15, color: COLORS.player, speed: 4 },
    foods: [] as Entity[],
    enemies: [] as Entity[],
    camera: { x: 0, y: 0 },
    worldSize: 2000,
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    isPointerDown: false,
    lastTime: 0,
    frameId: 0,
    entityIdSeq: 0,
    score: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem("cellStageScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const spawnFood = useCallback(() => {
    const st = stateRef.current;
    if (st.foods.length > 200) return; // limit
    
    st.foods.push({
      id: st.entityIdSeq++,
      x: Math.random() * st.worldSize,
      y: Math.random() * st.worldSize,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 3 + Math.random() * 3,
      color: COLORS.food[Math.floor(Math.random() * COLORS.food.length)],
      type: 'food'
    });
  }, []);

  const spawnEnemy = useCallback(() => {
    const st = stateRef.current;
    if (st.enemies.length > 30) return;

    // Spawn away from player
    let ex = 0, ey = 0;
    while(true) {
       ex = Math.random() * st.worldSize;
       ey = Math.random() * st.worldSize;
       const dx = ex - st.player.x;
       const dy = ey - st.player.y;
       if (dx*dx + dy*dy > 400*400) break; // Spawn at least 400px away
    }

    // Relative to player size
    const sizeMultiplier = Math.random() > 0.6 ? (1.2 + Math.random() * 0.5) : (0.4 + Math.random() * 0.4); 
    const radius = Math.max(8, st.player.radius * sizeMultiplier);
    
    st.enemies.push({
      id: st.entityIdSeq++,
      x: ex,
      y: ey,
      vx: 0,
      vy: 0,
      radius: radius,
      color: COLORS.enemy[Math.floor(Math.random() * COLORS.enemy.length)],
      type: 'enemy'
    });
  }, []);

  const startGame = () => {
    const st = stateRef.current;
    st.player = { x: st.worldSize / 2, y: st.worldSize / 2, vx: 0, vy: 0, radius: 15, mass: 15, color: COLORS.player, speed: 4 };
    st.foods = [];
    st.enemies = [];
    st.score = 0;
    setScore(0);
    
    for(let i=0; i<150; i++) spawnFood();
    for(let i=0; i<15; i++) spawnEnemy();

    setGameState('playing');
    audioSystem.init();
    audioSystem.playSelect();
  };

  const endGame = () => {
    setGameState('gameover');
    audioSystem.playError();
    const currentScore = Math.floor(stateRef.current.player.mass);
    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem("cellStageScore", currentScore.toString());
    }
  };

  const drawFluidCell = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, time: number, isPlayer: boolean) => {
    ctx.beginPath();
    const points = 12;
    for (let i = 0; i <= points; i++) {
       const angle = (i / points) * Math.PI * 2;
       // Add some wobble based on time and position
       const wobble = Math.sin(time * 0.005 + i * 2) * (radius * 0.1);
       const r = radius + wobble;
       const px = x + Math.cos(angle) * r;
       const py = y + Math.sin(angle) * r;
       if (i === 0) ctx.moveTo(px, py);
       else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    // Add glow
    if (isPlayer) {
       ctx.shadowBlur = 15;
       ctx.shadowColor = color;
    } else {
       ctx.shadowBlur = 5;
       ctx.shadowColor = color;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw nucleus
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      const st = stateRef.current;
      const dt = timestamp - st.lastTime;
      st.lastTime = timestamp;

      // Handle resize
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (gameState === 'playing') {
        const p = st.player;
        
        // Input processing
        if (st.isPointerDown) {
           const dx = st.targetX - width / 2;
           const dy = st.targetY - height / 2;
           const dist = Math.hypot(dx, dy);
           if (dist > 0) {
              const speedCap = Math.max(1, 4 - (p.radius * 0.015)); // Adjusted speed
              const targetVx = (dx / dist) * speedCap;
              const targetVy = (dy / dist) * speedCap;
              p.vx += (targetVx - p.vx) * 0.1;
              p.vy += (targetVy - p.vy) * 0.1;
           }
        } else {
           p.vx *= 0.95;
           p.vy *= 0.95;
        }

        p.x += p.vx;
        p.y += p.vy;

        p.x = Math.max(p.radius, Math.min(st.worldSize - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(st.worldSize - p.radius, p.y));

        st.camera.x += (p.x - width / 2 - st.camera.x) * 0.1;
        st.camera.y += (p.y - height / 2 - st.camera.y) * 0.1;

        for (let i = st.foods.length - 1; i >= 0; i--) {
           const f = st.foods[i];
           f.x += f.vx;
           f.y += f.vy;
           if (f.x < 0 || f.x > st.worldSize) f.vx *= -1;
           if (f.y < 0 || f.y > st.worldSize) f.vy *= -1;

           const dx = p.x - f.x;
           const dy = p.y - f.y;
           const dist = Math.hypot(dx, dy);
           if (dist < p.radius + f.radius) {
              st.foods.splice(i, 1);
              p.radius += 0.5;
              p.mass += 1;
              st.score = Math.floor(p.mass);
              setScore(st.score);
              if (Math.random() > 0.5) spawnFood();
              if (Math.random() > 0.8) audioSystem.playClick();
           }
        }

        for (let i = st.enemies.length - 1; i >= 0; i--) {
            const e = st.enemies[i];
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.hypot(dx, dy);

            if (Math.random() < 0.02 || !e.targetX) {
               if (dist < 400) {
                  if (e.radius > p.radius * 1.1) {
                     e.targetX = p.x;
                     e.targetY = p.y;
                  } else if (p.radius > e.radius * 1.1) {
                     e.targetX = e.x - dx;
                     e.targetY = e.y - dy;
                  } else {
                     e.targetX = e.x + (Math.random() - 0.5) * 200;
                     e.targetY = e.y + (Math.random() - 0.5) * 200;
                  }
               } else {
                  e.targetX = e.x + (Math.random() - 0.5) * 300;
                  e.targetY = e.y + (Math.random() - 0.5) * 300;
               }
            }

            if (e.targetX !== undefined && e.targetY !== undefined) {
               const tx = e.targetX - e.x;
               const ty = e.targetY - e.y;
               const tDist = Math.hypot(tx, ty);
               if (tDist > 0) {
                  const speed = Math.max(0.5, 3 - (e.radius * 0.01));
                  e.vx += ((tx / tDist) * speed - e.vx) * 0.05;
                  e.vy += ((ty / tDist) * speed - e.vy) * 0.05;
               }
            }

            e.x += e.vx;
            e.y += e.vy;

            e.x = Math.max(e.radius, Math.min(st.worldSize - e.radius, e.x));
            e.y = Math.max(e.radius, Math.min(st.worldSize - e.radius, e.y));

            if (dist < p.radius + e.radius - Math.min(p.radius, e.radius) * 0.3) {
               if (p.radius > e.radius * 1.1) {
                  st.enemies.splice(i, 1);
                  p.radius += e.radius * 0.2;
                  p.mass += Math.floor(e.radius);
                  st.score = Math.floor(p.mass);
                  setScore(st.score);
                  audioSystem.playPop();
                  spawnEnemy();
               } else if (e.radius > p.radius * 1.1) {
                  endGame();
                  return;
               }
            }
        }

        if (Math.random() < 0.05) spawnFood();
        if (Math.random() < 0.01) spawnEnemy();
      }

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const cx = gameState !== 'start' ? -st.camera.x : 0;
      const cy = gameState !== 'start' ? -st.camera.y : 0;
      ctx.translate(cx, cy);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, st.worldSize, st.worldSize);

      const gridSize = 100;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x=0; x<=st.worldSize; x+=gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, st.worldSize); }
      for(let y=0; y<=st.worldSize; y+=gridSize) { ctx.moveTo(0, y); ctx.lineTo(st.worldSize, y); }
      ctx.stroke();

      const viewLeft = -cx;
      const viewRight = -cx + canvas.width;
      const viewTop = -cy;
      const viewBottom = -cy + canvas.height;

      for (const f of st.foods) {
         if (f.x + f.radius < viewLeft || f.x - f.radius > viewRight || f.y + f.radius < viewTop || f.y - f.radius > viewBottom) continue;
         ctx.beginPath();
         ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
         ctx.fillStyle = f.color;
         ctx.fill();
         ctx.fillStyle = 'rgba(255,255,255,0.4)';
         ctx.arc(f.x, f.y, f.radius*0.3, 0, Math.PI * 2);
         ctx.fill();
      }

      for (const e of st.enemies) {
         if (e.x + e.radius < viewLeft || e.x - e.radius > viewRight || e.y + e.radius < viewTop || e.y - e.radius > viewBottom) continue;
         drawFluidCell(ctx, e.x, e.y, e.radius, e.color, timestamp, false);
      }

      if (gameState === 'playing') {
         drawFluidCell(ctx, st.player.x, st.player.y, st.player.radius, st.player.color, timestamp, true);
      } else if (gameState === 'gameover' || gameState === 'leaderboard') {
         ctx.beginPath();
         ctx.arc(st.player.x, st.player.y, st.player.radius, 0, Math.PI * 2);
         ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
         ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, spawnFood, spawnEnemy]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.isPointerDown = true;
    stateRef.current.targetX = e.clientX - rect.left;
    stateRef.current.targetY = e.clientY - rect.top;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    if (stateRef.current.isPointerDown || e.pointerType === 'mouse') {
        stateRef.current.targetX = e.clientX - rect.left;
        stateRef.current.targetY = e.clientY - rect.top;
        if (e.pointerType === 'mouse') {
            stateRef.current.isPointerDown = true;
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') {
        stateRef.current.isPointerDown = false;
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    stateRef.current.isPointerDown = false;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 select-none lg:flex-row lg:items-start lg:pt-20 lg:justify-center lg:gap-12 overflow-hidden touch-none relative">
      
      {/* Side Score HUD for Desktop */}
      <div className="hidden lg:flex w-64 flex-col gap-6 mt-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Massa Bio</p>
           <p className="text-5xl font-black text-white">{score}</p>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl flex flex-col gap-4">
           <div>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
               Melhor Jogo
             </p>
             <p className="text-3xl font-bold text-slate-300">{highScore}</p>
           </div>
        </div>
      </div>

      <div className="w-full max-w-4xl relative flex flex-col items-center flex-1 h-full max-h-[850px] p-4">
        
        {/* Mobile HUD */}
        <div className="lg:hidden flex justify-between w-full mb-4 items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 z-10 shrink-0">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Massa</span>
            <span className="text-2xl font-black text-white">{score}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Max</span>
             <span className="text-xl font-bold text-slate-300">{highScore}</span>
          </div>
        </div>

        {/* Game Canvas container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative w-full flex-1">
            <canvas
              ref={canvasRef}
              className="w-full h-full block cursor-crosshair touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onContextMenu={(e) => e.preventDefault()}
            />

            <AnimatePresence>
                {gameState === 'start' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-24 h-24 bg-sky-500/20 rounded-full flex items-center justify-center mb-6 border border-sky-500/50 shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                            <Activity size={48} className="text-sky-400" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">Evolução<br/><span className="text-sky-500">Celular</span></h2>
                        <p className="text-slate-300 md:text-lg mb-8 max-w-sm">
                            Coma as células menores. Fuja das maiores. Sobreviva no caldo primordial.
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-sky-500 hover:bg-sky-400 text-white px-10 py-5 rounded-full font-black text-xl uppercase tracking-widest shadow-lg hover:shadow-sky-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            INICIAR VIDA
                        </button>
                    </motion.div>
                )}

                {gameState === 'gameover' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
                    >
                        <h2 className="text-4xl sm:text-5xl font-black text-white mb-2 uppercase tracking-tighter">Você foi Devorado!</h2>
                        <p className="text-rose-200 text-lg mb-6 font-medium">Sua linhagem terminou aqui.</p>
                        
                        <div className="bg-rose-900/50 border border-rose-800 rounded-3xl p-6 mb-8 min-w-[220px]">
                            <p className="text-rose-300 text-sm font-bold uppercase tracking-widest mb-1">Massa Final</p>
                            <p className="text-5xl font-black text-white">{score}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={startGame}
                                className="bg-rose-500 hover:bg-rose-400 text-white px-10 py-5 rounded-full font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={20} /> REPETIR
                            </button>
                            <button
                                onClick={() => setGameState('leaderboard')}
                                className="bg-white text-rose-900 px-10 py-5 rounded-full font-black text-lg uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                <Trophy size={20} /> RANK GLOBAL
                            </button>
                        </div>
                    </motion.div>
                )}

                {gameState === 'leaderboard' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 overflow-y-auto"
                  >
                     <Leaderboard 
                        gameId="cell-evolution"
                        gameName="Evolução Celular"
                        currentScore={score}
                        unit="Massa"
                        onClose={() => setGameState('gameover')}
                     />
                  </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
