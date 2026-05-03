import { useState, useCallback, useRef } from "react";
import { Play, Square, RefreshCcw, Hand } from "lucide-react";

const numRows = 30;
const numCols = 40;

const operations = [
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, 0],
  [-1, 0],
];

const generateEmptyGrid = () => {
  return Array.from({ length: numRows }).map(() =>
    Array.from({ length: numCols }).fill(0),
  );
};

export function GameOfLife() {
  const [grid, setGrid] = useState(generateEmptyGrid);
  const [running, setRunning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const runningRef = useRef(running);
  runningRef.current = running;

  const runSimulation = useCallback(() => {
    if (!runningRef.current) {
      return;
    }

    setGrid((g) => {
      // @ts-ignore
      const newGrid = g.map((row) => [...row]);
      for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
          let neighbors = 0;
          operations.forEach(([x, y]) => {
            const newI = i + x;
            const newJ = j + y;
            if (newI >= 0 && newI < numRows && newJ >= 0 && newJ < numCols) {
              neighbors += g[newI][newJ] as number;
            }
          });

          if (neighbors < 2 || neighbors > 3) {
            newGrid[i][j] = 0;
          } else if (g[i][j] === 0 && neighbors === 3) {
            newGrid[i][j] = 1;
          }
        }
      }
      return newGrid;
    });

    setTimeout(runSimulation, 100);
  }, []);

  const toggleCell = (i: number, j: number) => {
    setGrid((g) => {
      // @ts-ignore
      const newGrid = g.map((row) => [...row]);
      newGrid[i][j] = newGrid[i][j] ? 0 : 1;
      return newGrid;
    });
  };

  const handlePointerEnter = (i: number, j: number) => {
    if (isDrawing && !running) {
      setGrid((g) => {
        // @ts-ignore
        const newGrid = g.map((row) => [...row]);
        newGrid[i][j] = 1;
        return newGrid;
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        <button
          onClick={() => {
            setRunning(!running);
            if (!running) {
              runningRef.current = true;
              runSimulation();
            }
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-colors ${
            running
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-emerald-500 hover:bg-emerald-600 text-white"
          }`}
        >
          {running ? (
            <>
              <Square size={18} fill="currentColor" /> Stop
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" /> Start
            </>
          )}
        </button>
        <button
          onClick={() => {
            const rows = [];
            for (let i = 0; i < numRows; i++) {
              rows.push(
                Array.from(Array(numCols), () => (Math.random() > 0.7 ? 1 : 0)),
              );
            }
            setGrid(rows);
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-full font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          <RefreshCcw size={18} />
          Randomize
        </button>
        <button
          onClick={() => setGrid(generateEmptyGrid())}
          className="flex items-center gap-2 px-4 py-3 rounded-full font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          Clear
        </button>
      </div>

      <div
        className="bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden touch-none"
        onPointerDown={() => setIsDrawing(true)}
        onPointerUp={() => setIsDrawing(false)}
        onPointerLeave={() => setIsDrawing(false)}
      >
        <div
          className="grid gap-px bg-slate-800"
          style={{ gridTemplateColumns: `repeat(${numCols}, 16px)` }}
        >
          {grid.map((rows, i) =>
            rows.map((col, j) => (
              <div
                key={`${i}-${j}`}
                onPointerDown={() => toggleCell(i, j)}
                onPointerEnter={() => handlePointerEnter(i, j)}
                className={`w-4 h-4 transition-colors duration-200 ${grid[i][j] ? "bg-blue-400" : "bg-slate-950"}`}
              />
            )),
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
        <Hand size={18} />
        <p>Draw by clicking and dragging when paused</p>
      </div>
    </div>
  );
}
