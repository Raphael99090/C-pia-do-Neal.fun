import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { RotateCcw, LayoutGrid, Trophy } from "lucide-react";

type GameState = "start" | "watching" | "playing" | "gameover";

const PADS = [
  { id: 0, color: "bg-rose-500", activeClass: "bg-rose-400 shadow-[0_0_50px_rgba(244,63,94,0.8)] scale-95" },
  { id: 1, color: "bg-emerald-500", activeClass: "bg-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.8)] scale-95" },
  { id: 2, color: "bg-blue-500", activeClass: "bg-blue-400 shadow-[0_0_50px_rgba(59,130,246,0.8)] scale-95" },
  { id: 3, color: "bg-amber-400", activeClass: "bg-amber-300 shadow-[0_0_50px_rgba(251,191,36,0.8)] scale-95" },
];

export function SequenceMaster() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [activePad, setActivePad] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sequenceScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    setScore(0);
    setSequence([]);
    nextRound([]);
  };

  const nextRound = (currentSeq: number[]) => {
    const newSeq = [...currentSeq, Math.floor(Math.random() * 4)];
    setSequence(newSeq);
    setPlayerStep(0);
    setGameState("watching");

    // Play sequence
    setTimeout(() => {
      playSequence(newSeq);
    }, 1000);
  };

  const playSequence = async (seq: number[]) => {
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); // gap between pads
      activatePad(seq[i], 400);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    setGameState("playing");
  };

  const activatePad = (id: number, duration: number) => {
    setActivePad(id);
    audioSystem.init();
    // Play slightly different pitch based on id
    if (id === 0) audioSystem.playSynthNote(330, 'sine', 0.05, 0.3); // E4
    if (id === 1) audioSystem.playSynthNote(440, 'sine', 0.05, 0.3); // A4
    if (id === 2) audioSystem.playSynthNote(554, 'sine', 0.05, 0.3); // C#5
    if (id === 3) audioSystem.playSynthNote(659, 'sine', 0.05, 0.3); // E5
    
    setTimeout(() => {
      setActivePad(null);
    }, duration);
  };

  const handlePadPress = (id: number) => {
    if (gameState !== "playing") return;

    activatePad(id, 200);

    if (id === sequence[playerStep]) {
      // Correct step
      const nextStep = playerStep + 1;
      if (nextStep === sequence.length) {
        // Round Complete!
        setGameState("watching"); // Block input
        const newScore = score + 1;
        setScore(newScore);
        setTimeout(() => audioSystem.playWin(), 300);
        setTimeout(() => {
          nextRound(sequence);
        }, 1000);
      } else {
        setPlayerStep(nextStep);
      }
    } else {
      // Wrong!
      audioSystem.init();
      audioSystem.playError();
      setGameState("gameover");
      setScore(s => {
        if (s > highScore) {
          setHighScore(s);
          localStorage.setItem("sequenceScore", s.toString());
        }
        return s;
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 select-none lg:flex-row lg:items-start lg:pt-24 lg:justify-center lg:gap-12 overflow-hidden">
      
      {/* Side Score HUD for Desktop */}
      <div className="hidden lg:flex w-64 flex-col gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Sequence</p>
           <p className="text-5xl font-black text-amber-400">{score}</p>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
             <Trophy size={14} /> Best Score
           </p>
           <p className="text-3xl font-bold text-slate-300">{highScore}</p>
        </div>
      </div>

      <div className="w-full max-w-md relative flex flex-col items-center">
        
        {/* Mobile HUD */}
        <div className="lg:hidden flex justify-between w-full mb-6 items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sequence</span>
            <span className="text-3xl font-black text-amber-400">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Trophy size={10} /> Best
            </span>
            <span className="text-xl font-bold text-slate-200">{highScore}</span>
          </div>
        </div>

        {/* Main Game Screen */}
        <div className="w-full aspect-square bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] relative flex flex-col p-6">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center z-10 w-full">
            {gameState === "watching" && <p className="text-amber-400 font-bold animate-pulse tracking-widest uppercase">Watch Carefully</p>}
            {gameState === "playing" && <p className="text-emerald-400 font-bold tracking-widest uppercase">Your Turn</p>}
          </div>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 mt-6">
             {PADS.map(pad => (
               <button
                 key={pad.id}
                 onPointerDown={() => handlePadPress(pad.id)}
                 className={`w-full h-full rounded-2xl border-4 border-slate-950 transition-all duration-150 outline-none ${
                   activePad === pad.id ? pad.activeClass : `bg-slate-800 hover:brightness-125 ${pad.color.replace('bg-', 'border-').replace('500', '900/50')}`
                 }`}
               />
             ))}
          </div>

          <AnimatePresence>
            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                  <LayoutGrid size={40} />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">Sequence Master</h2>
                <p className="text-slate-400 font-medium mb-10 text-lg">
                  Watch the pattern, then repeat it back!
                </p>
                <button
                  onPointerDown={startGame}
                  className="px-10 py-5 bg-amber-500 text-slate-900 font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:scale-105 active:scale-95 transition-all outline-none text-xl"
                >
                  START
                </button>
              </motion.div>
            )}

            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter text-amber-500">Pattern Lost!</h2>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-8">Length Reached</p>
                
                <div className="text-8xl font-black text-white mb-12 drop-shadow-[0_0_40px_rgba(251,191,36,0.4)]">
                  {score}
                </div>

                <button
                  onPointerDown={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all outline-none text-lg"
                >
                  <RotateCcw size={24} /> Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
