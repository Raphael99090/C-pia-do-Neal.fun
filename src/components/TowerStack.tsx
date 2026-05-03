import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { RotateCcw, Layers, Trophy } from "lucide-react";

type GameState = "start" | "playing" | "gameover";

const CANVAS_W = 400;
const CANVAS_H = 600;
const BLOCK_H = 40;
const COLORS = ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function TowerStack() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>("start");
  gameStateRef.current = gameState;

  const gameData = useRef({
    blocks: [] as any[],
    movingBlock: null as any,
    speed: 300,
    cameraY: 0,
    targetCameraY: 0,
    colorIdx: 0,
    particles: [] as any[],
  });

  useEffect(() => {
    const saved = localStorage.getItem("towerScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    let reqId: number;
    let lastTime = performance.now();

    const drawBlock = (ctx: CanvasRenderingContext2D, b: any) => {
      ctx.fillStyle = b.color;
      // Shadow for neon look
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      
      // Top highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(b.x, b.y, b.w, 4);
    };

    const loop = (time: number) => {
      reqId = requestAnimationFrame(loop);
      
      const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt to 100ms
      lastTime = time;

      const g = gameData.current;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      // Update Moving Block
      if (gameStateRef.current === "playing" && g.movingBlock) {
        g.movingBlock.x += g.movingBlock.dir * g.speed * dt;
        if (g.movingBlock.x <= 0) {
          g.movingBlock.x = 0;
          g.movingBlock.dir = 1;
        } else if (g.movingBlock.x + g.movingBlock.w >= CANVAS_W) {
          g.movingBlock.x = CANVAS_W - g.movingBlock.w;
          g.movingBlock.dir = -1;
        }
      }

      // Update Camera
      if (g.cameraY < g.targetCameraY) {
        g.cameraY += (g.targetCameraY - g.cameraY) * 10 * dt;
        // Snap when close
        if (Math.abs(g.cameraY - g.targetCameraY) < 0.5) g.cameraY = g.targetCameraY;
      }

      // Clear Canvas
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw grid lines background
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = g.cameraY % 40; y < CANVAS_H; y += 40) {
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
      }
      ctx.stroke();

      ctx.save();
      ctx.translate(0, g.cameraY);

      // Draw Placed Blocks
      g.blocks.forEach(b => drawBlock(ctx, b));

      // Draw Moving Block
      if (g.movingBlock && gameStateRef.current === "playing") {
        drawBlock(ctx, g.movingBlock);
      }

      // Update and Draw Particles (Cutoff pieces)
      for (let i = g.particles.length - 1; i >= 0; i--) {
        let p = g.particles[i];
        p.vy += 1500 * dt; // gravity
        p.y += p.vy * dt;
        p.x += p.vx * dt;
        p.rotation = (p.rotation || 0) + (p.vx * dt);

        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));
        
        ctx.globalAlpha = 0.8;
        drawBlock(ctx, p);
        ctx.restore();

        if (p.y > CANVAS_H + g.cameraY + 100) {
          g.particles.splice(i, 1);
        }
      }

      ctx.restore();
    };

    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, []);

  const startGame = () => {
    audioSystem.init();
    audioSystem.playSelect();
    
    // Reset Data
    gameData.current = {
      blocks: [{ x: 100, y: CANVAS_H - BLOCK_H - 20, w: 200, h: BLOCK_H, color: "#334155" }],
      movingBlock: { x: 0, y: CANVAS_H - BLOCK_H * 2 - 20, w: 200, h: BLOCK_H, color: COLORS[0], dir: 1 },
      speed: 300,
      cameraY: 0,
      targetCameraY: 0,
      colorIdx: 0,
      particles: [],
    };

    setScore(0);
    setGameState("playing");
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (gameState === "start") {
      startGame();
    } else if (gameState === "gameover") {
      startGame();
    } else if (gameState === "playing") {
      dropBlock();
    }
  };

  const dropBlock = () => {
    const g = gameData.current;
    if (!g.movingBlock) return;

    audioSystem.init();
    const m = g.movingBlock;
    const top = g.blocks[g.blocks.length - 1];

    // Calculate overlap
    const left = Math.max(m.x, top.x);
    const right = Math.min(m.x + m.w, top.x + top.w);
    const diff = right - left;

    if (diff <= 0) {
      // Complete Miss
      gameOver();
      // Drop the whole block as a particle
      g.particles.push({
        x: m.x, y: m.y, w: m.w, h: m.h, color: m.color,
        vy: 0, vx: m.dir * 100
      });
      g.movingBlock = null;
      return;
    }

    // Determine perfect hit tolerance
    const tolerance = 8;
    let perfect = false;
    let newW = diff;
    let newX = left;

    if (Math.abs(m.x - top.x) < tolerance) {
      perfect = true;
      newW = top.w;
      newX = top.x;
    }

    if (perfect) {
      audioSystem.playPop(); // Better sound for perfect later if desired
    } else {
      audioSystem.playClick();
      // Spawn cutoff piece
      const leftoverW = m.w - newW;
      const leftoverX = m.x < top.x ? m.x : top.x + top.w;
      g.particles.push({
        x: leftoverX, y: m.y, w: leftoverW, h: m.h, color: m.color,
        vy: 0, vx: (leftoverX > top.x ? 1 : -1) * 150
      });
    }

    // Add exactly placed piece
    g.blocks.push({ x: newX, y: m.y, w: newW, h: BLOCK_H, color: m.color });
    const currentScore = g.blocks.length - 1;
    setScore(currentScore);

    // Prepare next level
    g.colorIdx = (g.colorIdx + 1) % COLORS.length;
    const newY = m.y - BLOCK_H;
    const spawnDir = Math.random() > 0.5 ? 1 : -1;
    const spawnX = spawnDir === 1 ? -newW : CANVAS_W; // spawn slightly offscreen
    
    g.movingBlock = {
      x: spawnX, y: newY, w: newW, h: BLOCK_H,
      color: COLORS[g.colorIdx], dir: spawnDir
    };

    // Increase speed linearly initially, then logarithmically to prevent impossible speeds
    g.speed = 300 + currentScore * 15;

    // Move camera if building high
    if (newY < CANVAS_H / 2) {
      g.targetCameraY = (CANVAS_H / 2) - newY;
    }
  };

  const gameOver = useCallback(() => {
    setGameState("gameover");
    audioSystem.playError();
    setScore((s) => {
      if (s > highScore) {
        setHighScore(s);
        localStorage.setItem("towerScore", s.toString());
        setTimeout(() => audioSystem.playWin(), 500);
      }
      return s;
    });
  }, [highScore]);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 select-none touch-none overflow-hidden"
      onPointerDown={handlePointerDown}
    >
      <div className="w-full max-w-md relative pb-10">
        
        {/* Header HUD */}
        <div className="flex justify-between items-center mb-6 text-white px-2">
          <div className="flex flex-col">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Height</span>
            <span className="text-4xl font-black text-rose-500">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              <Trophy size={14} /> Best
            </span>
            <span className="text-2xl font-bold text-slate-200">{highScore}</span>
          </div>
        </div>

        {/* Game Window */}
        <div className="relative w-full aspect-[2/3] bg-slate-900/50 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm cursor-pointer">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="absolute inset-0 w-full h-full block"
          />

          <AnimatePresence>
            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                  <Layers size={40} />
                </div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Tower Stack</h2>
                <p className="text-slate-400 font-medium mb-10">Tap to drop the block. Build as high as you can.</p>
                <button
                  className="px-10 py-5 bg-rose-500 text-white font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:scale-105 active:scale-95 transition-all outline-none"
                >
                  START STACKING
                </button>
              </motion.div>
            )}

            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Collapsed!</h2>
                <p className="text-rose-400 font-bold tracking-widest uppercase text-sm mb-8">Final Height</p>
                
                <div className="text-8xl font-black text-white mb-12 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">
                  {score}
                </div>

                <button
                  className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all outline-none"
                >
                  <RotateCcw size={20} /> Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs opacity-70">
          Tap anywhere to drop
        </p>

      </div>
    </div>
  );
}
