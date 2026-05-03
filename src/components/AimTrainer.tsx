import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { Target, RotateCcw, Crosshair } from "lucide-react";

type GameState = "start" | "playing" | "gameover";
type HitMarker = { id: number; x: number; y: number; time: number };

export function AimTrainer() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [targetsLeft, setTargetsLeft] = useState(30);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [avgTime, setAvgTime] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [hits, setHits] = useState<HitMarker[]>([]);
  
  const hitIdRef = useRef(0);

  const spawnTarget = () => {
    const x = 10 + Math.random() * 80;
    const y = 15 + Math.random() * 70;
    setTargetPos({ x, y });
  };

  const startGame = () => {
    audioSystem.init();
    audioSystem.playSelect();
    setGameState("playing");
    setTargetsLeft(30);
    setAvgTime(0);
    setHits([]);
    const now = performance.now();
    setLastClickTime(now);
    spawnTarget();
  };

  const handleTargetClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (gameState !== "playing") return;

    audioSystem.init();
    audioSystem.playPop();

    const now = performance.now();
    const timeTaken = now - lastClickTime;
    
    const clicksDone = 30 - targetsLeft;
    const newAvg = (avgTime * clicksDone + timeTaken) / (clicksDone + 1);
    setAvgTime(newAvg);
    setLastClickTime(now);

    // Save hit for visual remnant
    setHits((prev) => [...prev.slice(-10), { 
      id: hitIdRef.current++, 
      x: targetPos.x, 
      y: targetPos.y, 
      time: timeTaken 
    }]);

    if (targetsLeft <= 1) {
      setGameState("gameover");
      audioSystem.playWin();
    } else {
      setTargetsLeft((prev) => prev - 1);
      spawnTarget();
    }
  };

  const handleMiss = () => {
    if (gameState === "playing") {
      audioSystem.playError();
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-slate-950 select-none cursor-crosshair touch-none"
      onPointerDown={handleMiss}
    >
      {/* Radar / Grid Background */}
      <div 
         className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
         style={{
           backgroundImage: `
             linear-gradient(to right, #ffffff 1px, transparent 1px),
             linear-gradient(to bottom, #ffffff 1px, transparent 1px)
           `,
           backgroundSize: '40px 40px'
         }}
      />
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
         <div className="w-[800px] h-[800px] border border-blue-500/10 rounded-full"></div>
         <div className="absolute w-[600px] h-[600px] border border-blue-500/10 rounded-full"></div>
         <div className="absolute w-[400px] h-[400px] border border-blue-500/10 rounded-full"></div>
         <div className="absolute w-[200px] h-[200px] border border-blue-500/10 rounded-full"></div>
      </div>

      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-slate-950 to-transparent z-10 pointer-events-none" />

      <div className="absolute top-6 w-full flex justify-between px-8 text-white z-10 pointer-events-none font-mono">
        <div className="flex flex-col">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Targets</span>
          <span className="text-2xl font-bold">{targetsLeft}</span>
        </div>
        
        {gameState === "playing" && (
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Average</span>
            <span className="text-2xl font-bold text-blue-400">{Math.round(avgTime)}ms</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {gameState === "start" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20"
          >
            <div className="w-24 h-24 bg-blue-500/20 text-blue-400 flex items-center justify-center rounded-2xl mb-8">
               <Crosshair size={48} />
            </div>
            <h2 className="text-5xl font-black mb-4 tracking-tight drop-shadow-lg text-white">Focus & Aim</h2>
            <p className="text-slate-400 mb-12 max-w-sm text-center font-medium">
              Hit 30 targets as quickly as you can. Click the target below to begin.
            </p>
            <button
               onPointerDown={(e) => { e.stopPropagation(); startGame(); }}
               className="relative w-28 h-28 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:bg-blue-400 hover:scale-105 active:scale-95 transition-all outline-none"
            >
              <div className="absolute inset-0 border-2 border-white rounded-full scale-[1.2] opacity-20 animate-ping" />
              <Target size={40} className="text-white" />
            </button>
          </motion.div>
        )}

        {/* Hit remnants */}
        {gameState === "playing" && hits.map((hit) => (
          <motion.div
            key={hit.id}
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-full border border-blue-400 pointer-events-none flex items-center justify-center"
            style={{ 
              left: `calc(${hit.x}% - 40px)`, 
              top: `calc(${hit.y}% - 40px)`,
              width: '80px', height: '80px'
            }}
          >
            <span className="text-[10px] font-mono text-blue-300 font-bold -mt-10">{Math.round(hit.time)}</span>
          </motion.div>
        ))}

        {gameState === "playing" && (
          <div
            className="absolute w-20 h-20 -pr-10 -pb-10 flex items-center justify-center cursor-crosshair group"
            style={{ 
              left: `calc(${targetPos.x}% - 40px)`, 
              top: `calc(${targetPos.y}% - 40px)`,
            }}
            onPointerDown={handleTargetClick}
          >
            <motion.div
              key={targetsLeft}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.8)] group-active:scale-90 transition-transform"
            >
               <div className="w-10 h-10 border-4 border-white/30 rounded-full flex items-center justify-center">
                 <div className="w-4 h-4 bg-white rounded-full"></div>
               </div>
            </motion.div>
          </div>
        )}

        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20"
          >
            <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tight">Mission Complete</h2>
            <p className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-8">Average Reaction Time</p>
            
            <div className="text-8xl font-black text-white mb-12 tracking-tighter drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              {Math.round(avgTime)}<span className="text-4xl text-blue-500">ms</span>
            </div>

            <button
               onPointerDown={(e) => { e.stopPropagation(); startGame(); }}
               className="flex items-center gap-2 px-10 py-5 bg-blue-500 text-white text-xl font-bold rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:bg-blue-400 hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCcw size={24} />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
