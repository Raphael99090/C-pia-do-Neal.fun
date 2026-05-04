import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophey, RotateCcw } from "lucide-react";
import { audioSystem } from "../lib/audio";

const GRID_SIZE = 4;

type Grid = number[][];

const getEmptyGrid = (): Grid => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const getRandomEmptyCell = (grid: Grid) => {
  const emptyCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

const spawnRandom = (grid: Grid): Grid => {
  const newGrid = [...grid.map(row => [...row])];
  const cell = getRandomEmptyCell(newGrid);
  if (cell) {
    newGrid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
  }
  return newGrid;
};

export function Game2048() {
  const [grid, setGrid] = useState<Grid>(getEmptyGrid());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem("2048Score");
    if (saved) setHighScore(parseInt(saved, 10));
    resetGame();
  }, []);

  const resetGame = () => {
    let newGrid = getEmptyGrid();
    newGrid = spawnRandom(newGrid);
    newGrid = spawnRandom(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    audioSystem.init();
    audioSystem.playSelect();
  };

  const moveGrid = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;
    
    let hasMoved = false;
    let newScore = score;
    const newGrid = grid.map(row => [...row]);

    const slide = (row: number[]) => {
      let arr = row.filter(val => val);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          newScore += arr[i];
          arr.splice(i + 1, 1);
        }
      }
      while (arr.length < GRID_SIZE) arr.push(0);
      return arr;
    };

    if (direction === 'LEFT') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const newRow = slide(newGrid[r]);
        if (newGrid[r].join(',') !== newRow.join(',')) hasMoved = true;
        newGrid[r] = newRow;
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const newRow = slide([...newGrid[r]].reverse()).reverse();
        if (newGrid[r].join(',') !== newRow.join(',')) hasMoved = true;
        newGrid[r] = newRow;
      }
    } else if (direction === 'UP') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        const newCol = slide(col);
        for (let r = 0; r < GRID_SIZE; r++) {
          if (newGrid[r][c] !== newCol[r]) hasMoved = true;
          newGrid[r][c] = newCol[r];
        }
      }
    } else if (direction === 'DOWN') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
        const newCol = slide(col).reverse();
        for (let r = 0; r < GRID_SIZE; r++) {
          if (newGrid[r][c] !== newCol[r]) hasMoved = true;
          newGrid[r][c] = newCol[r];
        }
      }
    }

    if (hasMoved) {
      audioSystem.init();
      audioSystem.playPop();
      const finalGrid = spawnRandom(newGrid);
      setGrid(finalGrid);
      setScore(newScore);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem("2048Score", newScore.toString());
      }
      
      checkGameOver(finalGrid);
    }
  }, [grid, score, highScore, gameOver]);

  const checkGameOver = (g: Grid) => {
    // Check for empty cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return;
      }
    }
    // Check for possible merges
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const current = g[r][c];
        if (r < GRID_SIZE - 1 && g[r + 1][c] === current) return;
        if (c < GRID_SIZE - 1 && g[r][c + 1] === current) return;
      }
    }
    setGameOver(true);
    audioSystem.playError();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) moveGrid('UP');
      else if (['ArrowDown', 's', 'S'].includes(e.key)) moveGrid('DOWN');
      else if (['ArrowLeft', 'a', 'A'].includes(e.key)) moveGrid('LEFT');
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) moveGrid('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveGrid]);

  const getColor = (val: number) => {
    const colors: Record<number, string> = {
      2: "bg-slate-200 text-slate-800",
      4: "bg-slate-300 text-slate-800",
      8: "bg-orange-300 text-white",
      16: "bg-orange-500 text-white",
      32: "bg-rose-500 text-white",
      64: "bg-red-600 text-white",
      128: "bg-yellow-400 text-slate-900 shadow-[0_0_10px_#facc15]",
      256: "bg-yellow-500 text-white shadow-[0_0_15px_#eab308]",
      512: "bg-amber-500 text-white shadow-[0_0_20px_#f59e0b]",
      1024: "bg-emerald-500 text-white shadow-[0_0_25px_#10b981]",
      2048: "bg-cyan-500 text-white shadow-[0_0_30px_#06b6d4]",
    };
    return colors[val] || "bg-indigo-600 text-white shadow-[0_0_40px_#4f46e5]";
  };

  // Touch handling
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) moveGrid(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
        if (Math.abs(dy) > 30) moveGrid(dy > 0 ? 'DOWN' : 'UP');
    }
    setTouchStart(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 select-none lg:flex-row lg:items-start lg:pt-24 lg:justify-center lg:gap-12 overflow-hidden touch-none" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* Side Score HUD for Desktop */}
      <div className="hidden lg:flex w-64 flex-col gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Score</p>
           <p className="text-5xl font-black text-white">{score}</p>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
             Melhor Pontuação
           </p>
           <p className="text-3xl font-bold text-slate-300">{highScore}</p>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl flex flex-col gap-2 text-slate-400 text-sm font-medium">
           <p>Use as <span className="text-white">Setas</span> do teclado ou deslize para jogar.</p>
        </div>
      </div>

      <div className="w-full max-w-sm relative flex flex-col items-center">
        
        {/* Mobile HUD */}
        <div className="lg:hidden flex justify-between w-full mb-6 items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Score</span>
            <span className="text-2xl font-black text-white">{score}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Melhor</span>
             <span className="text-xl font-bold text-slate-300">{highScore}</span>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-slate-800 p-3 sm:p-4 rounded-3xl w-full aspect-square relative shadow-2xl">
           <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full">
              {grid.map((row, r) => row.map((val, c) => (
                  <div key={`empty-${r}-${c}`} className="bg-slate-700/50 rounded-xl sm:rounded-2xl w-full h-full" />
              )))}
           </div>

           <div className="absolute inset-3 sm:inset-4 flex flex-col gap-2 sm:gap-3 pointer-events-none">
             {grid.map((row, r) => (
               <div key={`row-${r}`} className="flex gap-2 sm:gap-3 h-full">
                  {row.map((val, c) => (
                      <div key={`cell-${r}-${c}`} className="flex-1 h-full relative">
                         {val > 0 && (
                            <motion.div 
                              layoutId={`tile-${r}-${c}-${val}`} 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className={`absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-2xl sm:text-4xl ${getColor(val)}`}
                            >
                               {val}
                            </motion.div>
                         )}
                      </div>
                  ))}
               </div>
             ))}
           </div>

           {/* Game Over Screen */}
           <AnimatePresence>
             {gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-950/80 rounded-3xl z-10 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                    <h2 className="text-5xl font-black text-white mb-2 uppercase">Fim de Jogo</h2>
                    <p className="text-slate-300 font-medium mb-8">Não há mais movimentos</p>
                    <button 
                        onPointerDown={(e) => { e.stopPropagation(); resetGame(); }}
                        className="px-8 py-4 bg-emerald-500 rounded-full font-black uppercase text-white shadow-lg pointer-events-auto hover:scale-105 active:scale-95 transition-all"
                    >
                       Tentar Novamente
                    </button>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
