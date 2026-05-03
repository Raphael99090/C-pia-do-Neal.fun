import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MousePointerClick, RotateCcw } from "lucide-react";
import { audioSystem } from "../lib/audio";

type GameState = "start" | "ready" | "playing" | "finished";
type ClickEffect = { id: number; x: number; y: number };

export function CPSTest() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [effects, setEffects] = useState<ClickEffect[]>([]);
  const duration = 5.0;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(0);
  const effectCountRef = useRef(0);

  const startReady = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e) e.stopPropagation();
    audioSystem.init();
    audioSystem.playSelect();
    setGameState("ready");
    setClicks(0);
    setTimeLeft(duration);
    setEffects([]);
  };

  const startGame = () => {
    setGameState("playing");
    setClicks(1); 
    setTimeLeft(duration);
    lastTimeRef.current = performance.now();

    timerRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastTimeRef.current) / 1000;
      setTimeLeft((prev) => {
        const next = prev - elapsed;
        if (next <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          setGameState("finished");
          audioSystem.playWin();
          return 0;
        }
        lastTimeRef.current = now;
        return next;
      });
    }, 50);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (gameState === "finished" || gameState === "start") return;
    
    audioSystem.init();
    audioSystem.playClick();

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newEffect = { id: effectCountRef.current++, x, y };
    setEffects(prev => [...prev.slice(-15), newEffect]);
    
    if (gameState === "ready") {
      startGame();
    } else if (gameState === "playing") {
      setClicks((prev) => prev + 1);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const reset = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearInterval(timerRef.current);
    startReady();
  };

  const cps = gameState === "finished"
    ? (clicks / duration).toFixed(2)
    : (clicks / (duration - timeLeft || 0.001)).toFixed(1);

  // Dynamic heat background based on current CPS
  const getHeatClass = () => {
    const activeCps = parseFloat(cps);
    if (gameState !== "playing") return "bg-indigo-600 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.4)]";
    if (activeCps > 13) return "bg-rose-600 border-rose-500 shadow-[0_0_60px_rgba(225,29,72,0.8)]";
    if (activeCps > 10) return "bg-orange-500 border-orange-400 shadow-[0_0_50px_rgba(249,115,22,0.6)]";
    if (activeCps > 7) return "bg-amber-500 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)]";
    if (activeCps > 4) return "bg-indigo-500 border-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.4)]";
    return "bg-indigo-600 border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.3)]";
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 select-none touch-none">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-white">CPS Test</h2>
          <p className="text-slate-400 font-medium">How fast can you tap in 5 seconds?</p>
        </div>

        <div className="flex justify-between items-center bg-slate-900 border-2 border-slate-800 rounded-t-3xl p-6 shadow-xl relative z-10">
          <div className="text-center flex-1 border-r border-slate-700/50">
            <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
              Time
            </p>
            <p className="text-3xl sm:text-4xl font-mono text-white tabular-nums">{timeLeft.toFixed(1)}s</p>
          </div>
          <div className="text-center flex-1 border-r border-slate-700/50">
            <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
              Clicks
            </p>
            <p className="text-3xl sm:text-4xl font-mono text-white tabular-nums">{clicks}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
              CPS
            </p>
            <p className="text-3xl sm:text-4xl font-mono text-emerald-400 tabular-nums font-black drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              {gameState === "playing" || gameState === "finished" ? cps : "0.0"}
            </p>
          </div>
        </div>

        <motion.div
          animate={{ scale: gameState === "playing" ? [1, 0.99, 1] : 1 }}
          transition={{ repeat: gameState === "playing" ? Infinity : 0, duration: 0.1 }}
          onPointerDown={handlePointerDown}
          className={`w-full h-80 sm:h-96 rounded-b-3xl border-x-2 border-b-2 flex flex-col items-center justify-center transition-colors relative overflow-hidden ${
            gameState === "finished"
              ? "bg-slate-800 border-slate-700 cursor-default"
              : gameState === "start"
                ? "bg-slate-800/80 border-slate-700 cursor-default"
                : `${getHeatClass()} cursor-crosshair`
          }`}
        >
          {/* Ripple effects */}
          <AnimatePresence>
            {effects.map((effect) => (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0.8, scale: 0 }}
                animate={{ opacity: 0, scale: 4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute w-20 h-20 bg-white/30 rounded-full pointer-events-none origin-center"
                style={{ left: effect.x - 40, top: effect.y - 40 }}
              />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {effects.map((effect) => (
              <motion.div
                key={`text-${effect.id}`}
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -50, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute text-white font-black text-2xl pointer-events-none drop-shadow-md"
                style={{ left: effect.x - 10, top: effect.y - 15 }}
              >
                +1
              </motion.div>
            ))}
          </AnimatePresence>

          {gameState === "start" && (
            <div className="text-center z-20">
              <button
                onPointerDown={startReady}
                className="px-10 py-5 bg-indigo-500 text-white text-xl font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition-all"
              >
                Start Test
              </button>
            </div>
          )}

          {gameState === "ready" && (
            <div className="text-center text-white pointer-events-none z-20 flex flex-col items-center">
              <MousePointerClick size={56} className="mb-4 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
              <h3 className="text-4xl sm:text-5xl font-black drop-shadow-xl">TAP RAPIDLY!</h3>
              <p className="text-white/80 font-bold mt-4 tracking-widest uppercase">Timer starts on first tap</p>
            </div>
          )}

          {gameState === "playing" && (
            <div className="text-center text-white/10 pointer-events-none z-0 text-[180px] leading-none font-black tabular-nums tracking-tighter mix-blend-overlay">
              {clicks}
            </div>
          )}

          {gameState === "finished" && (
            <div className="text-center z-20 bg-slate-900/80 p-8 rounded-3xl backdrop-blur-md border border-slate-700 shadow-2xl">
              <h3 className="text-6xl font-black mb-2 text-white bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">{cps} <span className="text-3xl text-slate-400">CPS</span></h3>
              <p className="text-emerald-400 mb-8 font-bold text-xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                {clicks === 0
                  ? "Pacifist run? 🕊️"
                  : clicks === 69
                    ? "Nice. 😏"
                    : parseFloat(cps) > 13
                      ? "Autoclicker detected! 🚨"
                      : parseFloat(cps) > 10
                        ? "Godlike speed! 🌩️"
                        : parseFloat(cps) > 7
                          ? "Fast! 🐆"
                          : "Average speed 🐢"}
              </p>
              <button
                onPointerDown={reset}
                className="flex items-center gap-2 mx-auto px-8 py-4 bg-white text-slate-900 font-bold uppercase tracking-wider rounded-full hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <RotateCcw size={20} /> Play Again
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
