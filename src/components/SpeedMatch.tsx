import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, Timer, Trophy, RefreshCw } from "lucide-react";
import { audioSystem } from "../lib/audio";

type Shape = 'circle' | 'square' | 'triangle' | 'star';
type Color = 'rose' | 'blue' | 'emerald' | 'amber';

interface Item {
  shape: Shape;
  color: Color;
}

const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'star'];
const COLORS: Color[] = ['rose', 'blue', 'emerald', 'amber'];

export function SpeedMatch() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [previousItem, setPreviousItem] = useState<Item | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [turn, setTurn] = useState(0);

  const generateItem = useCallback((): Item => {
    return {
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    const first = generateItem();
    setCurrentItem(first);
    setPreviousItem(null);
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('ended');
    }
  }, [gameState, timeLeft]);

  const handleMatch = (isMatch: boolean) => {
    if (!currentItem || !previousItem) {
      // First one is always "new", but in Speed Match you compare current with previous
      setPreviousItem(currentItem);
      setCurrentItem(generateItem());
      return;
    }

    const actuallyMatches = currentItem.shape === previousItem.shape && currentItem.color === previousItem.color;

    if (isMatch === actuallyMatches) {
      setScore(s => s + 1);
      setFeedback('correct');
      audioSystem.playSuccess();
    } else {
      setFeedback('wrong');
      audioSystem.playError();
    }

    setTimeout(() => setFeedback(null), 300);
    
    setPreviousItem(currentItem);
    setCurrentItem(generateItem());
    setTurn(t => t + 1);
  };

  const ShapeIcon = ({ item }: { item: Item }) => {
    const colorClass = {
      rose: 'bg-rose-500 shadow-rose-500/50',
      blue: 'bg-blue-500 shadow-blue-500/50',
      emerald: 'bg-emerald-500 shadow-emerald-500/50',
      amber: 'bg-amber-500 shadow-amber-500/50',
    }[item.color];

    switch (item.shape) {
      case 'circle': return <div className={`w-24 h-24 rounded-full ${colorClass} shadow-lg`} />;
      case 'square': return <div className={`w-24 h-24 rounded-2xl ${colorClass} shadow-lg`} />;
      case 'triangle': return (
        <div className="w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-bottom-[86px]" 
             style={{ borderBottomColor: item.color === 'rose' ? '#f43f5e' : item.color === 'blue' ? '#3b82f6' : item.color === 'emerald' ? '#10b881' : '#f59e0b' }} />
      );
      case 'star': return (
        <div className={`w-24 h-24 ${colorClass} shadow-lg`} style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4">
      <AnimatePresence mode="wait">
        {gameState === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h1 className="text-5xl font-black mb-4 text-white uppercase italic tracking-tighter">Speed Match</h1>
            <p className="text-slate-400 mb-8 max-w-sm">Does the current shape match the previous one in both shape AND color?</p>
            <button 
                onClick={startGame}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest"
            >
                Start Mission
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-12">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
                <Timer size={18} className="text-blue-400" />
                <span className="font-mono text-xl font-bold">{timeLeft}s</span>
              </div>
              <div className="text-3xl font-black text-white italic">SCORE: {score}</div>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center bg-slate-900 rounded-[40px] border border-slate-800 shadow-2xl mb-12">
               <AnimatePresence mode="wait">
                 <motion.div 
                    key={turn}
                    initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 1.5, opacity: 0, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                 >
                    {currentItem && <ShapeIcon item={currentItem} />}
                 </motion.div>
               </AnimatePresence>

               {feedback && (
                 <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    className={`absolute inset-0 flex items-center justify-center rounded-[40px] pointer-events-none ${feedback === 'correct' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}
                 >
                    {feedback === 'correct' ? <Check size={80} className="text-emerald-400" /> : <X size={80} className="text-rose-400" />}
                 </motion.div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
               <button 
                 onClick={() => handleMatch(false)}
                 className="py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-[30px] font-black text-2xl uppercase italic tracking-tighter border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all"
               >
                 Different
               </button>
               <button 
                 onClick={() => handleMatch(true)}
                 className="py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[30px] font-black text-2xl uppercase italic tracking-tighter border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
               >
                 Match
               </button>
            </div>
          </motion.div>
        )}

        {gameState === 'ended' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center glass-card p-12 rounded-[50px] border border-white/10"
          >
            <Trophy size={64} className="text-amber-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-2 uppercase italic">Mission Complete</h2>
            <div className="text-6xl font-black text-blue-400 mb-8">{score}</div>
            <p className="text-slate-400 mb-8 font-medium">Your cognitive speed is within optimal parameters.</p>
            <button 
                onClick={startGame}
                className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-950 rounded-2xl font-bold hover:bg-slate-200 transition-colors uppercase tracking-widest"
            >
                <RefreshCw size={20} />
                Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
