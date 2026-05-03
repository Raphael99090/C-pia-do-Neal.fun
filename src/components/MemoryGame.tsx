import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { Brain, RotateCcw } from "lucide-react";

type GameState = "start" | "showing" | "playing" | "gameover";

export function MemoryGame() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [level, setLevel] = useState(1);
  const [bestLevel, setBestLevel] = useState<number>(() => {
    const saved = localStorage.getItem("memoryBestLevel");
    return saved ? parseInt(saved) : 1;
  });
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeSquare, setActiveSquare] = useState<number | null>(null);

  // Dynamic grid size based on level
  const gridSize = level < 5 ? 3 : level < 10 ? 4 : 5; 

  const startGame = () => {
    audioSystem.init();
    audioSystem.playSelect();
    setLevel(1);
    const newSeq = [Math.floor(Math.random() * 9)]; // initially 3x3
    setSequence(newSeq);
  };

  useEffect(() => {
    if (sequence.length > 0) {
      playSequence();
    }
  }, [sequence]); // Removed playSequence from dependency

  const playSequence = async () => {
    setGameState("showing");
    setPlayerSequence([]);

    // Tiny pause before showing
    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < sequence.length; i++) {
      setActiveSquare(sequence[i]);
      audioSystem.playNote(sequence[i]);
      await new Promise((r) => setTimeout(r, 400));
      setActiveSquare(null);
      await new Promise((r) => setTimeout(r, 200));
    }

    setGameState("playing");
  };

  const handleSquareClick = (index: number) => {
    if (gameState !== "playing") return;

    audioSystem.init();
    audioSystem.playNote(index);
    setActiveSquare(index);
    setTimeout(() => setActiveSquare(null), 150);

    const newPlayerSeq = [...playerSequence, index];
    setPlayerSequence(newPlayerSeq);

    // Check validity
    const currentStepIndex = newPlayerSeq.length - 1;
    if (newPlayerSeq[currentStepIndex] !== sequence[currentStepIndex]) {
      // Wrong!
      audioSystem.playError();
      if (level > bestLevel) {
        setBestLevel(level);
        localStorage.setItem("memoryBestLevel", level.toString());
      }
      setGameState("gameover");
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      // Complete! Next level
      audioSystem.playWin();
      setGameState("showing"); // Prevent clicks
      
      const newGridSize = (level + 1) < 5 ? 3 : (level + 1) < 10 ? 4 : 5;
      
      setTimeout(() => {
        setLevel((l) => l + 1);
        setSequence([
          ...sequence,
          Math.floor(Math.random() * (newGridSize * newGridSize)),
        ]);
      }, 1000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 select-none">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8 text-white">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-xl">
                <Brain size={28} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-white tracking-tight">Memory Matrix</h2>
               <p className="text-sm text-slate-500 font-medium tracking-wide">
                 {gameState === "start" ? "Watch & Repeat" : `Level ${level}`}
               </p>
             </div>
           </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Best</span>
            <span className="text-2xl font-bold text-purple-400">{bestLevel}</span>
          </div>
        </div>

        <div className="relative mx-auto rounded-3xl p-6 md:p-8 bg-slate-900 shadow-2xl border border-slate-800">
          <motion.div
            key={gridSize}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid gap-3 sm:gap-4 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              maxWidth: gridSize === 3 ? "400px" : gridSize === 4 ? "500px" : "600px"
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9, rotateX: 10, rotateY: 10 }}
                onPointerDown={() => handleSquareClick(i)}
                className={`aspect-square rounded-2xl transition-all duration-200 outline-none
                  ${activeSquare === i
                    ? "bg-purple-100 shadow-[0_0_40px_rgba(168,85,247,0.8)] scale-105 z-10"
                    : "bg-slate-800 border-b-4 border-slate-950 shadow-md hover:bg-slate-700"
                  } ${gameState === "playing" ? "cursor-pointer" : "cursor-default"}
                `}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              />
            ))}
          </motion.div>

          <AnimatePresence>
            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 rounded-3xl flex flex-col items-center justify-center border border-slate-800"
              >
                <h3 className="text-4xl font-black text-rose-500 mb-2">SEQUENCE BROKEN</h3>
                <p className="text-slate-300 mb-6 font-medium text-lg">
                  You reached Level <span className="text-white font-bold">{level}</span>
                </p>
                {level > bestLevel && (
                  <motion.p 
                     initial={{ scale: 0.8 }}
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ repeat: Infinity, duration: 1 }}
                     className="text-yellow-400 font-bold mb-8 uppercase tracking-widest text-sm"
                  >
                    New Personal Best!
                  </motion.p>
                )}
                <button
                  onPointerDown={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-purple-500 text-white font-bold rounded-full hover:bg-purple-600 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  <RotateCcw size={20} /> Play Again
                </button>
              </motion.div>
            )}

            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/90 rounded-3xl flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 bg-slate-800 rounded-2xl grid grid-cols-2 gap-2 p-4 mb-8">
                  <div className="bg-purple-500/20 rounded-md"></div>
                  <div className="bg-purple-500/50 rounded-md"></div>
                  <div className="bg-purple-500 rounded-md shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                  <div className="bg-purple-500/20 rounded-md"></div>
                </div>
                
                <h3 className="text-3xl font-black text-white mb-8 tracking-tight">Ready to test?</h3>
                
                <button
                  onPointerDown={startGame}
                  className="px-10 py-5 bg-purple-500 text-white text-xl font-black uppercase tracking-wider rounded-full hover:bg-purple-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                >
                  Start Matrix
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
