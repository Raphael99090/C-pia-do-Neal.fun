import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { RotateCcw, Palette, Trophy, AlertCircle } from "lucide-react";

type GameState = "start" | "playing" | "gameover";

const COLORS = [
  { label: "VERMELHO", value: "red", hex: "#ef4444", textClass: "text-red-500" },
  { label: "AZUL", value: "blue", hex: "#3b82f6", textClass: "text-blue-500" },
  { label: "VERDE", value: "green", hex: "#10b981", textClass: "text-emerald-500" },
  { label: "AMARELO", value: "yellow", hex: "#eab308", textClass: "text-amber-500" },
  { label: "ROXO", value: "purple", hex: "#a855f7", textClass: "text-purple-500" },
  { label: "LARANJA", value: "orange", hex: "#f97316", textClass: "text-orange-500" },
  { label: "ROSA", value: "pink", hex: "#ec4899", textClass: "text-pink-500" },
  { label: "CIANO", value: "cyan", hex: "#06b6d4", textClass: "text-cyan-500" },
];

export function ColorGenius() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [currentColor, setCurrentColor] = useState(COLORS[1]);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("colorScore");
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
    generateQuestion();
    
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.5) {
          stopTimer();
          endGame();
          return 0;
        }
        return prev - 0.5; // Slower drain for better difficulty
      });
    }, 30);
  };

  const generateQuestion = () => {
    const randomWord = COLORS[Math.floor(Math.random() * COLORS.length)];
    let randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // We want a high chance of mismatch for the Stroop effect
    if (Math.random() > 0.3) {
      while (randomColor.value === randomWord.value) {
        randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }
    
    setCurrentWord(randomWord);
    setCurrentColor(randomColor);
  };

  const handleSelection = (selectedColorValue: string) => {
    if (gameState !== "playing") return;

    if (selectedColorValue === currentColor.value) {
      // Correct
      audioSystem.init();
      audioSystem.playPop();
      setScore(s => s + 1);
      setTimeLeft(prev => Math.min(100, prev + 35)); // Give more time back
      generateQuestion();
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
        localStorage.setItem("colorScore", s.toString());
      }
      return s;
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 select-none lg:flex-row lg:items-start lg:pt-24 lg:justify-center lg:gap-12 overflow-hidden">
      
      {/* Side Score HUD for Desktop */}
      <div className="hidden lg:flex w-64 flex-col gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Score</p>
           <p className="text-5xl font-black text-rose-400">{score}</p>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
             <Trophy size={14} /> Melhor Pontuação
           </p>
           <p className="text-3xl font-bold text-slate-300">{highScore}</p>
        </div>
      </div>

      <div className="w-full max-w-md relative flex flex-col items-center">
        
        {/* Mobile HUD */}
        <div className="lg:hidden flex justify-between w-full mb-6 items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Score</span>
            <span className="text-3xl font-black text-rose-400">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Trophy size={10} /> Melhor
            </span>
            <span className="text-xl font-bold text-slate-200">{highScore}</span>
          </div>
        </div>

        {/* Main Game Screen */}
        <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
          
          {gameState === "playing" && (
            <div className="w-full h-2 bg-slate-800">
               <div 
                 className={`h-full transition-all duration-75 ${timeLeft > 30 ? 'bg-emerald-400' : 'bg-rose-500'}`}
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
                <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                  <Palette size={40} />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">Gênio das Cores</h2>
                <div className="flex bg-rose-500/20 text-rose-300 p-3 rounded-lg flex items-center gap-2 mb-8 text-left text-sm">
                   <AlertCircle size={24} className="shrink-0" />
                   <p className="font-medium">Selecione a <b>COR</b> do texto, não a palavra que está escrita!</p>
                </div>
                <button
                  onPointerDown={startGame}
                  className="px-10 py-5 bg-rose-500 text-white font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all outline-none text-xl"
                >
                  JOGAR AGORA
                </button>
              </motion.div>
            )}

            {gameState === "playing" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col w-full h-full p-6"
              >
                 <div className="flex-1 flex items-center justify-center">
                    <h3 className={`text-6xl sm:text-7xl font-black uppercase tracking-tighter ${currentColor.textClass}`}>
                      {currentWord.label}
                    </h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 mt-auto">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onPointerDown={() => handleSelection(c.value)}
                        className="py-5 rounded-2xl bg-slate-800 border-b-4 border-slate-950 text-white font-black uppercase tracking-wider active:translate-y-1 active:border-b-0 hover:bg-slate-700 transition-all"
                      >
                        {c.label}
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
                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter text-rose-500">Cérebro Frito!</h2>
                <p className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-8">Pontuação Final</p>
                
                <div className="text-8xl font-black text-white mb-12 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">
                  {score}
                </div>

                <button
                  onPointerDown={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all outline-none text-lg"
                >
                  <RotateCcw size={24} /> Jogar Novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
