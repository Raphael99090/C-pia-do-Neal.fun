import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Download, RefreshCw, Palette, Settings } from "lucide-react";

export function Kaleidoscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3b82f6");
  const [segments, setSegments] = useState(8);
  const [lineWidth, setLineWidth] = useState(3);
  
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Initial black background
    ctx.fillStyle = "#020617"; // slate-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Handle CSS scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX - canvas.width / 2,
      y: (clientY - rect.top) * scaleY - canvas.height / 2
    };
  };

  const drawLine = (fromX: number, fromY: number, toX: number, toY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    for (let i = 0; i < segments; i++) {
        ctx.rotate((Math.PI * 2) / segments);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();

        // reflection
        ctx.scale(1, -1);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.scale(1, -1);
    }
    ctx.restore();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getCoordinates(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();
    const currentPos = getCoordinates(e);
    
    // Smooth drawing
    drawLine(lastPos.current.x, lastPos.current.y, currentPos.x, currentPos.y);
    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadArt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "kaleidoscope-art.png";
    a.click();
  };

  const colors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
    "#ffffff"
  ];

  return (
    <div className="w-full flex flex-col items-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-4xl flex flex-col lg:flex-row gap-6">
        
        {/* Canvas Area */}
        <div className="flex-1 flex justify-center items-center relative aspect-square lg:aspect-auto">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            className="w-full aspect-square border border-slate-800 rounded-2xl bg-slate-950 cursor-crosshair touch-none shadow-[0_0_50px_rgba(59,130,246,0.1)]"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>

        {/* Controls */}
        <div className="w-full lg:w-64 flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
             <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                <Palette size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold">Kaleidoscope</h2>
                <p className="text-xs text-slate-500">Mandalas Art</p>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Cores</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full shadow-inner transition-transform ${color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
                <span>Eixos</span>
                <span className="text-white">{segments}</span>
              </label>
              <input 
                type="range" min="4" max="24" step="2"
                value={segments}
                onChange={(e) => setSegments(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
                <span>Espessura</span>
                <span className="text-white">{lineWidth}px</span>
              </label>
              <input 
                type="range" min="1" max="10" step="1"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2">
            <button
               onClick={clearCanvas}
               className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium text-sm"
            >
               <RefreshCw size={16} /> Limpar
            </button>
            <button
               onClick={downloadArt}
               className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium text-sm"
            >
               <Download size={16} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
