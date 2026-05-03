import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { RotateCcw, Keyboard, Trophy, Zap } from "lucide-react";

type GameState = "start" | "playing" | "gameover";

const TEXTS = [
  "The quick brown fox jumps over the lazy dog.",
  "In the middle of difficulty lies opportunity.",
  "Life is what happens when you're busy making other plans.",
  "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only limit to our realization of tomorrow will be our doubts of today.",
  "Do not go where the path may lead, go instead where there is no path and leave a trail."
];

export function SpeedTyper() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [targetText, setTargetText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [highScore, setHighScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("typerScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    audioSystem.init();
    audioSystem.playSelect();
    const randomText = TEXTS[Math.floor(Math.random() * TEXTS.length)];
    setTargetText(randomText);
    setUserInput("");
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setGameState("playing");
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (gameState !== "playing") return;

    if (!startTime) {
      setStartTime(performance.now());
    }

    // Play subtle typing sound
    audioSystem.init();
    audioSystem.playClick();

    setUserInput(val);

    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < val.length; i++) {
        if (val[i] === targetText[i]) correctChars++;
    }
    const currentAccuracy = val.length > 0 ? Math.round((correctChars / val.length) * 100) : 100;
    setAccuracy(currentAccuracy);

    // Calculate current WPM
    if (startTime) {
        const timeElapsed = (performance.now() - startTime) / 60000; // in minutes
        const wordsTyped = val.length / 5; // standard word length is 5 chars
        setWpm(Math.round(wordsTyped / timeElapsed));
    }

    // Check completion
    if (val === targetText) {
       endGame();
    }
  };

  const endGame = () => {
    setGameState("gameover");
    audioSystem.playWin();
    
    if (wpm > highScore) {
       setHighScore(wpm);
       localStorage.setItem("typerScore", wpm.toString());
    }
  };

  const renderText = () => {
    return targetText.split("").map((char, index) => {
      let colorClass = "text-slate-500"; // default un-typed
      
      if (index < userInput.length) {
        if (userInput[index] === char) {
          colorClass = "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"; // Correct
        } else {
          colorClass = "text-rose-500 bg-rose-500/20"; // Incorrect
        }
      } else if (index === userInput.length) {
         colorClass = "text-slate-300 border-b-2 border-indigo-500 animate-pulse"; // Current cursor position
      }

      return (
        <span key={index} className={`transition-colors duration-100 ${colorClass}`}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 select-none lg:flex-row lg:items-start lg:pt-24 lg:justify-center lg:gap-12 overflow-hidden">
      
      {/* Side Score HUD for Desktop */}
      <div className="hidden lg:flex w-64 flex-col gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl border-t-indigo-500">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Current WPM</p>
           <p className="text-6xl font-black text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">{wpm}</p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Accuracy</p>
           <p className="text-4xl font-black text-slate-200">{accuracy}%</p>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl mt-auto">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
             <Trophy size={14} /> Best WPM
           </p>
           <p className="text-3xl font-bold text-emerald-400">{highScore}</p>
        </div>
      </div>

      <div className="w-full max-w-2xl relative flex flex-col items-center">
        
        {/* Mobile HUD */}
        <div className="lg:hidden flex justify-between w-full mb-6 items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">WPM</span>
            <span className="text-3xl font-black text-indigo-500">{wpm}</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-700 px-4">
             <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Accuracy</span>
             <span className="text-xl font-black text-white">{accuracy}%</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Trophy size={10}/> Best
            </span>
            <span className="text-xl font-bold text-emerald-400">{highScore}</span>
          </div>
        </div>

        {/* Main Game Screen */}
        <div 
          className="w-full aspect-[4/5] sm:aspect-video bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col p-6 sm:p-8 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Subtle background texture */}
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          <AnimatePresence>
            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-indigo-500/20 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <Keyboard size={40} />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-xl">Speed Typer</h2>
                <p className="text-slate-400 font-medium mb-12 max-w-sm text-lg">
                  Test your keyboard skills. Type the text as fast and accurately as possible.
                </p>
                <button
                  onPointerDown={startGame}
                  className="px-10 py-5 bg-indigo-500 text-white font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all outline-none text-xl"
                >
                  START TYPING
                </button>
              </motion.div>
            )}

            {gameState === "playing" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col w-full h-full relative z-10"
              >
                 <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-8"><Zap size={16} className="inline mr-2 text-indigo-400" />Type this text</p>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-relaxed text-left font-mono">
                      {renderText()}
                    </div>
                 </div>
                 
                 {/* Hidden Input field to capture typing */}
                 <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleInput}
                    onBlur={() => { if(gameState === 'playing') inputRef.current?.focus(); }}
                    className="absolute opacity-0 -z-10"
                    spellCheck={false}
                    autoComplete="off"
                 />
              </motion.div>
            )}

            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Test Complete</h2>
                <p className="text-indigo-400 font-bold tracking-widest uppercase text-sm mb-8">Performance</p>
                
                <div className="flex items-center justify-center gap-12 mb-12">
                   <div className="flex flex-col items-center">
                     <span className="text-8xl font-black text-white drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]">{wpm}</span>
                     <span className="text-indigo-500 font-bold uppercase tracking-widest">WPM</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="text-6xl font-black text-white opacity-80">{accuracy}<span className="text-3xl">%</span></span>
                     <span className="text-slate-500 font-bold uppercase tracking-widest mt-2">Accuracy</span>
                   </div>
                </div>

                <button
                  onPointerDown={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all outline-none text-lg"
                >
                  <RotateCcw size={24} /> Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
