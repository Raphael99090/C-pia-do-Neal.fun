import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { RotateCcw, Calculator, Trophy } from "lucide-react";

type GameState = "start" | "playing" | "gameover";

interface Question {
  text: string;
  answer: number;
  options: number[];
}

export function QuickMath() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [question, setQuestion] = useState<Question | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mathScore");
    if (saved) setHighScore(parseInt(saved, 10));
    return () => stopTimer();
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startGame = () => {
    audioSystem.init();
    audioSystem.playSelect();
    setScore(0);
    setTimeLeft(100);
    setGameState("playing");
    generateQuestion(0);
    
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.5) {
          stopTimer();
          endGame();
          return 0;
        }
        return prev - 0.5;
      });
    }, 50); // timer tick
  };

  const generateQuestion = (currentScore: number) => {
    let a, b, op, ans;
    const difficulty = currentScore; // Increases over time

    if (difficulty < 5) {
      // Easy addition / subtraction
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      op = Math.random() > 0.5 ? "+" : "-";
    } else if (difficulty < 15) {
      // Medium
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 20) + 5;
      op = Math.random() > 0.3 ? "+" : "-";
      if (Math.random() > 0.8) op = "*";
    } else {
      // Hard
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 20) + 2;
      op = Math.random() > 0.5 ? "*" : (Math.random() > 0.5 ? "+" : "-");
    }

    if (op === "*") {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      ans = a * b;
    } else if (op === "-") {
      if (b > a) [a, b] = [b, a]; // keep it positive for simplicity
      ans = a - b;
    } else {
      ans = a + b;
    }

    // Generate options
    const options = new Set<number>();
    options.add(ans);
    while(options.size < 4) {
      const offset = (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const wrong = ans + offset;
      if (wrong >= 0) options.add(wrong);
    }

    setQuestion({
      text: `${a} ${op} ${b}`,
      answer: ans,
      options: Array.from(options).sort(() => Math.random() - 0.5)
    });
  };

  const handleSelection = (selectedAns: number) => {
    if (gameState !== "playing" || !question) return;

    if (selectedAns === question.answer) {
      // Correct
      audioSystem.init();
      audioSystem.playPop();
      const newScore = score + 1;
      setScore(newScore);
      setTimeLeft(prev => Math.min(100, prev + 15 + Math.max(0, 10 - newScore))); // diminishing returns
      generateQuestion(newScore);
    } else {
      // Wrong
      stopTimer();
      endGame();
    }
  };

  const endGame = () => {
    setGameState("gameover");
    audioSystem.playError();
    setScore(s => {
      if (s > highScore) {
        setHighScore(s);
        localStorage.setItem("mathScore", s.toString());
      }
      return s;
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 select-none lg:flex-row lg:items-start lg:pt-24 lg:justify-center lg:gap-12 overflow-hidden">
      
      {/* Side Score HUD for Desktop */}
      <div className="hidden lg:flex w-64 flex-col gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Score</p>
           <p className="text-5xl font-black text-cyan-400">{score}</p>
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
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Score</span>
            <span className="text-3xl font-black text-cyan-400">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Trophy size={10} /> Best
            </span>
            <span className="text-xl font-bold text-slate-200">{highScore}</span>
          </div>
        </div>

        {/* Main Game Screen */}
        <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col font-mono">
          
          {gameState === "playing" && (
            <div className="w-full h-2 bg-slate-800">
               <div 
                 className={`h-full transition-all duration-[50ms] linear ${timeLeft > 30 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                 style={{ width: `${timeLeft}%` }}
               />
            </div>
          )}

          <AnimatePresence>
            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-cyan-500/20 text-cyan-400 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  <Calculator size={40} />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">Quick Math</h2>
                <p className="text-slate-400 font-medium mb-10 text-lg">
                  Solve as many equations as you can before time runs out!
                </p>
                <button
                  onPointerDown={startGame}
                  className="px-10 py-5 bg-cyan-500 text-slate-900 font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all outline-none text-xl"
                >
                  START
                </button>
              </motion.div>
            )}

            {gameState === "playing" && question && (
              <motion.div
                key={score}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col w-full h-full p-6"
              >
                 <div className="flex-1 flex items-center justify-center bg-slate-950/50 rounded-2xl mb-6 border border-slate-800">
                    <h3 className="text-6xl sm:text-7xl font-black text-white tracking-widest">
                      {question.text}
                    </h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 mt-auto">
                    {question.options.map((opt, i) => (
                      <button
                        key={i}
                        onPointerDown={() => handleSelection(opt)}
                        className="py-6 rounded-2xl bg-slate-800 border-b-4 border-slate-950 text-3xl text-cyan-400 font-black hover:bg-slate-700 active:translate-y-1 active:border-b-0 transition-all font-mono"
                      >
                        {opt}
                      </button>
                    ))}
                 </div>
              </motion.div>
            )}

            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter text-cyan-500">Out of Time!</h2>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-8">Equations Solved</p>
                
                <div className="text-8xl font-black text-white mb-12 drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]">
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
