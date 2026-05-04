import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { audioSystem } from "../lib/audio";
import { Download, Eraser, Palette, PaintBucket, RefreshCw } from "lucide-react";

const GRID_SIZE = 16;
const DEFAULT_COLORS = [
  "#000000", "#1a1c2c", "#5d275d", "#b13e53", "#ef7d57", "#ffcd75", "#a7f070", "#38b764",
  "#257179", "#29366f", "#3b5dc9", "#41a6f6", "#73eff7", "#f4f4f4", "#94b0c2", "#566c86",
  "#333c57"
]; // Sweetie16 palette

export function PixelStudio() {
  const [pixels, setPixels] = useState<string[]>(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
  const [color, setColor] = useState(DEFAULT_COLORS[13]); // f4f4f4
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen'|'eraser'|'fill'>('pen');
  const containerRef = useRef<HTMLDivElement>(null);

  const getIndex = (x: number, y: number) => y * GRID_SIZE + x;
  const getXY = (index: number) => ({ x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) });

  const fillArea = (startIndex: number, targetColor: string, replacementColor: string) => {
    if (targetColor === replacementColor) return;
    
    setPixels(prev => {
       const newPixels = [...prev];
       const stack = [startIndex];

       while (stack.length > 0) {
          const idx = stack.pop()!;
          if (newPixels[idx] === targetColor) {
             newPixels[idx] = replacementColor;
             
             const { x, y } = getXY(idx);
             if (x > 0) stack.push(getIndex(x - 1, y));
             if (x < GRID_SIZE - 1) stack.push(getIndex(x + 1, y));
             if (y > 0) stack.push(getIndex(x, y - 1));
             if (y < GRID_SIZE - 1) stack.push(getIndex(x, y + 1));
          }
       }
       return newPixels;
    });
  };

  const drawPixel = (index: number) => {
    const currentColor = tool === 'eraser' ? 'transparent' : color;
    
    if (tool === 'fill') {
       const targetColor = pixels[index];
       fillArea(index, targetColor, currentColor);
       audioSystem.playPop(); // play fill sound
       return;
    }

    setPixels(prev => {
      const next = [...prev];
      if (next[index] !== currentColor) {
         next[index] = currentColor;
         // Slight throttle for sound
         if (Math.random() > 0.8) audioSystem.playClick();
      }
      return next;
    });
  };

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    drawPixel(index);
  };

  const handlePointerEnter = (index: number, e: React.PointerEvent) => {
    if (isDrawing) {
      drawPixel(index);
    }
  };

  const handleGlobalUp = () => {
    setIsDrawing(false);
  };

  const clearGrid = () => {
    setPixels(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
    audioSystem.playError(); // reset sound
  };

  const downloadArt = () => {
     // Create a temporary canvas
     const canvas = document.createElement("canvas");
     const scale = 20; // 20x scale 
     canvas.width = GRID_SIZE * scale;
     canvas.height = GRID_SIZE * scale;
     const ctx = canvas.getContext("2d");
     if (!ctx) return;
     
     // Draw pixels
     pixels.forEach((pColor, i) => {
        if (pColor !== 'transparent') {
           const { x, y } = getXY(i);
           ctx.fillStyle = pColor;
           ctx.fillRect(x * scale, y * scale, scale, scale);
        }
     });

     const dataUrl = canvas.toDataURL("image/png");
     const a = document.createElement("a");
     a.href = dataUrl;
     a.download = "pixel-art.png";
     a.click();
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 lg:p-8 touch-none select-none overflow-y-auto"
      onPointerUp={handleGlobalUp}
      onPointerLeave={handleGlobalUp}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-5xl flex flex-col lg:flex-row gap-8">
        
        {/* Canvas */}
        <div className="flex-1 flex justify-center items-center">
           <div 
             ref={containerRef}
             className="bg-slate-800 border-4 border-slate-700 rounded-xl overflow-hidden aspect-square w-full max-w-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
             style={{ 
               display: 'grid', 
               gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
               gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
               backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b), linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 75%, #1e293b 75%, #1e293b)',
               backgroundSize: '20px 20px',
               backgroundPosition: '0 0, 10px 10px'
             }}
           >
              {pixels.map((pColor, i) => (
                 <div 
                   key={i}
                   className="w-full h-full cursor-crosshair box-border hover:brightness-110"
                   style={{ backgroundColor: pColor, border: '1px solid rgba(255,255,255,0.02)' }}
                   onPointerDown={(e) => handlePointerDown(i, e)}
                   onPointerEnter={(e) => handlePointerEnter(i, e)}
                 />
              ))}
           </div>
        </div>

        {/* Tools */}
        <div className="w-full lg:w-72 flex flex-col gap-6 lg:border-l lg:border-slate-800 lg:pl-8">
           <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">Pixel Studio</h2>
              <p className="text-sm text-slate-500 font-mono mt-1">16x16 Canvas</p>
           </div>
           
           {/* Tool Selection */}
           <div className="flex gap-2">
              <button 
                 onClick={() => setTool('pen')}
                 className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition-all ${tool === 'pen' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                 <Palette size={20} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Pincel</span>
              </button>
              <button 
                 onClick={() => setTool('fill')}
                 className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition-all ${tool === 'fill' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                 <PaintBucket size={20} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Balde</span>
              </button>
              <button 
                 onClick={() => setTool('eraser')}
                 className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition-all ${tool === 'eraser' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                 <Eraser size={20} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Apagar</span>
              </button>
           </div>

           {/* Color Palette */}
           <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Paleta Sweetie16</label>
              <div className="grid grid-cols-4 gap-2">
                 {DEFAULT_COLORS.map(c => (
                    <button
                       key={c}
                       onClick={() => { setColor(c); setTool(tool === 'eraser' ? 'pen' : tool); }}
                       className={`aspect-square rounded-lg transition-transform shadow-inner ${color === c && tool !== 'eraser' ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900 border border-slate-800' : 'hover:scale-105 border border-slate-800'}`}
                       style={{ backgroundColor: c }}
                    />
                 ))}
              </div>
           </div>

           {/* Actions */}
           <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
              <button
                 onClick={clearGrid}
                 className="flex flex-col items-center justify-center gap-1 py-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors font-medium text-sm"
              >
                 <RefreshCw size={16} /> <span className="text-[10px] font-bold uppercase">Limpar</span>
              </button>
              <button
                 onClick={downloadArt}
                 className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-500/10 text- emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors font-medium text-sm text-emerald-500"
              >
                 <Download size={16} /> <span className="text-[10px] font-bold uppercase">Salvar</span>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
