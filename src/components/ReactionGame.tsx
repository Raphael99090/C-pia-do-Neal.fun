import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { Zap } from "lucide-react";

type GameState = "idle" | "waiting" | "ready" | "result";

export function ReactionGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const saved = localStorage.getItem("reactionBestTime");
    return saved ? parseInt(saved) : null;
  });

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setGameState("waiting");
    setReactionTime(null);
    audioSystem.init();

    // Random delay between 2 and 6 seconds
    const delay = 2000 + Math.random() * 4000;

    timeoutRef.current = setTimeout(() => {
      setGameState("ready");
      startTimeRef.current = Date.now();
      audioSystem.playHighTech();
    }, delay);
  };

  const handleClick = (e?: React.PointerEvent) => {
    if (e) e.stopPropagation();
    audioSystem.init();
    
    if (gameState === "idle" || gameState === "result") {
      audioSystem.playPop();
      startGame();
    } else if (gameState === "waiting") {
      // Too early!
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState("result");
      setReactionTime(-1); // Indicator for false start
      audioSystem.playError();
    } else if (gameState === "ready") {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setGameState("result");
      audioSystem.playWin();

      if (bestTime === null || time < bestTime) {
        setBestTime(time);
        localStorage.setItem("reactionBestTime", time.toString());
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 select-none touch-none relative overflow-hidden ${
        gameState === "idle" ? "bg-indigo-950" :
        gameState === "waiting" ? "bg-red-600" :
        gameState === "ready" ? "bg-emerald-500" :
        "bg-slate-900"
      }`}
      onPointerDown={handleClick}
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Grid pattern background */}
      <div 
         className="absolute inset-0 z-0 opacity-20 pointer-events-none"
         style={{
           backgroundImage: `radial-gradient(circle at center, #ffffff 1px, transparent 1px)`,
           backgroundSize: '40px 40px'
         }}
      />

      <div className="absolute top-8 w-full flex justify-between px-8 text-white z-10 pointer-events-none">
        <div className="flex items-center gap-2 font-bold text-lg opacity-80 mix-blend-overlay">
           <Zap size={24} /> REACTION
        </div>
        <div className="text-xl font-mono opacity-80 mix-blend-overlay">
          Best: {bestTime ? <span className="font-bold">{bestTime}ms</span> : "---"}
        </div>
      </div>

      <div className="text-center text-white pointer-events-none z-10">
        <AnimatePresence mode="wait">
          {gameState === "idle" && (
            <motion.div
              key="idle"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="flex flex-col items-center gap-4 max-w-2xl px-4"
            >
              <Zap size={80} className="mb-4 text-indigo-400 drop-shadow-[0_0_30px_rgba(129,140,248,0.5)]" />
              <h2 className="text-5xl sm:text-7xl font-black mb-4 tracking-tighter drop-shadow-lg">
                Reaction Test
              </h2>
              <p className="text-xl sm:text-2xl font-medium opacity-90 text-indigo-200">
                When the screen turns <strong className="text-emerald-400 font-black">GREEN</strong>, <br /> click as quickly as you can.
              </p>
              <div className="mt-12 px-8 py-4 bg-white/10 backdrop-blur rounded-full font-bold uppercase tracking-widest text-sm outline-none shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Click anywhere to start
              </div>
            </motion.div>
          )}

          {gameState === "waiting" && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center max-w-xl px-4"
            >
               <motion.h2 
                 animate={{ scale: [1, 1.02, 1] }} 
                 transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                 className="text-6xl sm:text-8xl font-black mb-4 tracking-tighter text-red-950 drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]"
               >
                Wait...
              </motion.h2>
            </motion.div>
          )}

          {gameState === "ready" && (
            <motion.div
              key="ready"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-8xl sm:text-[150px] leading-none font-black tracking-tighter text-emerald-950 drop-shadow-[0_0_100px_rgba(255,255,255,0.8)]">
                CLICK!
              </h2>
            </motion.div>
          )}

          {gameState === "result" && (
            <motion.div
              key="result"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center max-w-xl px-4"
            >
              {reactionTime === -1 ? (
                <>
                  <h2 className="text-6xl font-black mb-4 text-red-400">Too soon!</h2>
                  <p className="text-xl text-slate-300 font-medium">Wait for the green light.</p>
                </>
              ) : (
                <>
                  <p className="text-xl text-slate-400 font-bold uppercase tracking-widest mb-4">Your Time</p>
                  <h2 className="text-8xl font-black mb-2 tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                    {reactionTime}<span className="text-4xl text-slate-400/50">ms</span>
                  </h2>
                  
                  <div className="h-12 flex items-center justify-center">
                    {bestTime === reactionTime && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="px-4 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full font-bold uppercase text-sm tracking-widest animate-pulse"
                      >
                        New Best Time!
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="w-16 h-1 bg-slate-800 rounded-full my-8"></div>
                  
                  <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-8">
                    {reactionTime && reactionTime < 200
                      ? "Incredible reflexes! 🐆"
                      : reactionTime && reactionTime < 250
                        ? "Elite speed. ⚡"
                        : reactionTime && reactionTime < 300
                          ? "Above average. 🐎"
                          : reactionTime && reactionTime < 400
                            ? "Average. 🚶"
                            : "You can do better! 🐢"}
                  </p>
                  
                  <p className="opacity-50 text-sm font-bold uppercase tracking-widest">
                    Click to keep playing
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
