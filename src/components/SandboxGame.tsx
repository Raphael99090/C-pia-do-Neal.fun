import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Play, Pause, Info, Layers, RotateCcw } from "lucide-react";
import { SandboxEngine } from "../engine/SandboxEngine";
import { ElementType, ELEMENTS } from "../types";
import { audioSystem } from "../lib/audio";

const GRID_SIZE = 2; // Pixel size on canvas
const SIM_WIDTH = 150;
const SIM_HEIGHT = 150;

export const SandboxGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SandboxEngine | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType>(
    ElementType.SAND,
  );
  const [brushSize, setBrushSize] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const animationFrameRef = useRef<number>(0);

  // Initialize engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SandboxEngine(SIM_WIDTH, SIM_HEIGHT);
    }
  }, []);

  // Easter Egg listener
  const secretCodeRef = useRef("");
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      secretCodeRef.current = (secretCodeRef.current + e.key)
        .slice(-6)
        .toLowerCase();

      if (secretCodeRef.current.includes("nuke") && engineRef.current) {
        engineRef.current.triggerNuke();
      } else if (
        secretCodeRef.current.includes("matrix") &&
        engineRef.current
      ) {
        engineRef.current.triggerMatrix();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const draw = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return;

    const ctx = canvasRef.current.getContext("2d", { alpha: false });
    if (!ctx) return;

    if (!isPaused) {
      engineRef.current.update();
    }

    const { grid, width, height } = engineRef.current;

    ctx.fillStyle = "#1A1A1A";
    ctx.fillRect(0, 0, width * GRID_SIZE, height * GRID_SIZE);

    let count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = grid[y * width + x];
        if (type !== ElementType.EMPTY) {
          ctx.fillStyle = ELEMENTS[type].color;
          ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
          count++;
        }
      }
    }
    setParticleCount(count);

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [isPaused]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    handlePaint(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDrawing) {
      handlePaint(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDrawing(false);
  };

  const handlePaint = (e: React.PointerEvent) => {
    if (!canvasRef.current || !engineRef.current) return;

    audioSystem.playElementDrop(selectedElement);

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / GRID_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / GRID_SIZE);

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          engineRef.current.setPixel(x + dx, y + dy, selectedElement);
        }
      }
    }
  };

  const handleClear = () => {
    engineRef.current?.clear();
  };

  const categories = [
    {
      name: "Sólidos",
      color: "brand-red",
      shadow: "brand-shadow-red",
      items: [
        ElementType.SAND,
        ElementType.STONE,
        ElementType.GLASS,
        ElementType.ICE,
        ElementType.WOOD,
        ElementType.PLANT,
        ElementType.CLAY,
        ElementType.METAL,
        ElementType.SALT,
        ElementType.DIRT,
        ElementType.SNOW,
        ElementType.COAL,
        ElementType.ASH,
        ElementType.SEED,
        ElementType.RUST,
      ],
    },
    {
      name: "Líquidos",
      color: "brand-blue",
      shadow: "brand-shadow-blue",
      items: [
        ElementType.WATER,
        ElementType.OIL,
        ElementType.LAVA,
        ElementType.ACID,
        ElementType.NITRO,
        ElementType.SLIME,
        ElementType.HONEY,
        ElementType.BLOOD,
      ],
    },
    {
      name: "Gases",
      color: "brand-green",
      shadow: "brand-shadow-green",
      items: [
        ElementType.GAS,
        ElementType.SMOKE,
        ElementType.STEAM,
        ElementType.NEON,
      ],
    },
    {
      name: "Especiais",
      color: "brand-yellow",
      shadow: "brand-shadow-yellow",
      items: [
        ElementType.FIRE,
        ElementType.GUNPOWDER,
        ElementType.FUNGUS,
        ElementType.SPARK,
        ElementType.WIRE,
        ElementType.SPONGE,
        ElementType.VIRUS,
        ElementType.C4,
        ElementType.THERMITE,
        ElementType.EMPTY,
      ],
    },
  ];

  const elementToEmoji: Record<string, string> = {
    [ElementType.SAND]: "⏳",
    [ElementType.STONE]: "🪨",
    [ElementType.WATER]: "💧",
    [ElementType.FIRE]: "🔥",
    [ElementType.ICE]: "🧊",
    [ElementType.WOOD]: "🪵",
    [ElementType.PLANT]: "🌿",
    [ElementType.OIL]: "🛢️",
    [ElementType.GAS]: "⛽",
    [ElementType.ACID]: "🧪",
    [ElementType.SMOKE]: "💨",
    [ElementType.STEAM]: "🌫️",
    [ElementType.EMPTY]: "🧽",
    [ElementType.LAVA]: "🌋",
    [ElementType.METAL]: "⛓️",
    [ElementType.GUNPOWDER]: "💣",
    [ElementType.NITRO]: "🧨",
    [ElementType.SALT]: "🧂",
    [ElementType.CLAY]: "🧱",
    [ElementType.FUNGUS]: "🍄",
    [ElementType.GLASS]: "🪟",
    [ElementType.DIRT]: "🟤",
    [ElementType.SNOW]: "❄️",
    [ElementType.COAL]: "🌑",
    [ElementType.ASH]: "🔘",
    [ElementType.SEED]: "🌰",
    [ElementType.SLIME]: "🦠",
    [ElementType.HONEY]: "🍯",
    [ElementType.BLOOD]: "🩸",
    [ElementType.SPARK]: "⚡",
    [ElementType.WIRE]: "🔌",
    [ElementType.SPONGE]: "🧽",
    [ElementType.VIRUS]: "☣️",
    [ElementType.NEON]: "💡",
    [ElementType.RUST]: "🟫",
    [ElementType.C4]: "📦",
    [ElementType.THERMITE]: "🧨",
  };

  const [activeCategory, setActiveCategory] = useState(categories[0].name);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col p-4 md:p-6 select-none font-sans overflow-hidden touch-none">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-white font-black text-xl md:text-2xl">S</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-[#1A1A1A]">
              SANDWORLD <span className="text-brand-blue">SANDBOX</span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold text-[#888] uppercase tracking-[0.2em]">
              Simulation Universe v1.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 bg-white p-1.5 md:p-2 rounded-2xl shadow-sm border-2 border-brand-border">
          <div className="hidden xs:flex flex-col items-end px-2 md:px-3">
            <span className="text-[8px] md:text-[10px] font-bold text-[#AAA] uppercase">
              Partículas
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-brand-green rounded-full animate-pulse" />
              <span className="font-mono font-bold text-brand-blue text-xs md:text-sm">
                {particleCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="hidden xs:block h-8 w-[2px] bg-[#EEE]" />
          <button
            onClick={handleClear}
            className="p-2 hover:bg-red-50 rounded-xl text-brand-red transition-colors"
          >
            <Trash2 size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`
              px-4 md:px-6 py-1.5 md:py-2 rounded-xl font-black text-white text-xs md:text-base transition-all
              active:translate-y-[2px] active:shadow-none
              ${isPaused ? "bg-brand-green brand-shadow-green" : "bg-brand-blue shadow-[0_4px_0_#2A75E0]"}
            `}
          >
            {isPaused ? "PLAY" : "STOP"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
        {/* Sidebar - Desktop Layout or Bottom Bar - Mobile */}
        <aside className="w-full md:w-80 flex flex-col gap-4 order-2 md:order-1">
          <div className="bg-white rounded-3xl p-3 md:p-5 shadow-sm border-2 border-brand-border flex-1 flex flex-col overflow-hidden">
            <div className="flex gap-1 md:gap-2 mb-4 overflow-x-auto no-scrollbar-mobile">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    audioSystem.init();
                    audioSystem.playClick();
                    setActiveCategory(cat.name);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-[8px] md:text-[10px] font-black tracking-wider transition-all whitespace-nowrap
                    ${activeCategory === cat.name ? `bg-${cat.color} text-white shadow-[0_3px_0_rgba(0,0,0,0.2)]` : "bg-[#F5F5F5] text-[#888]"}
                  `}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scrollbar no-scrollbar-mobile pr-1">
              <div className="flex md:grid md:grid-cols-3 gap-2 md:gap-3 p-1">
                {categories
                  .find((c) => c.name === activeCategory)
                  ?.items.map((type) => {
                    const isSelected = selectedElement === type;
                    const props = ELEMENTS[type];
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          audioSystem.init();
                          audioSystem.playPop();
                          setSelectedElement(type);
                        }}
                        className={`
                        group relative p-3 md:p-4 rounded-xl md:rounded-2xl flex flex-col items-center gap-1 border-2 transition-all flex-shrink-0 md:flex-shrink
                        min-w-[4.5rem] md:min-w-0
                        ${isSelected ? "border-brand-blue scale-[1.02]" : "border-white hover:border-[#EEE]"}
                        ${isSelected ? "bg-white shadow-[0_4px_0_#2A75E0] md:shadow-[0_6px_0_#2A75E0]" : "bg-[#F9F9F9] shadow-[0_2px_0_#DDD] md:shadow-[0_4px_0_#DDD]"}
                        active:translate-y-1 active:shadow-none
                      `}
                      >
                        <span className="text-xl md:text-2xl transition-transform group-hover:scale-110">
                          {elementToEmoji[type] || "✨"}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-extrabold uppercase tracking-tight text-brand-text/70">
                          {type}
                        </span>
                        <div
                          className="absolute top-1 right-1 md:top-2 md:right-2 w-2 h-2 md:w-3 md:h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: props.color }}
                        />
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="mt-4 md:mt-6">
              <div className="bg-[#F9F9F9] rounded-2xl p-3 md:p-4 border border-dashed border-[#DDD]">
                <div className="flex justify-between items-center mb-1 md:mb-2 text-[8px] md:text-[10px]">
                  <span className="font-black text-[#AAA] uppercase tracking-widest">
                    Pincel
                  </span>
                  <span className="font-black text-brand-blue">
                    {brushSize}px
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="flex-1 accent-brand-blue h-1 md:h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Simulation Canvas Area */}
        <section className="flex-1 flex flex-col gap-4 order-1 md:order-2">
          <div className="flex-1 bg-[#1A1A1A] rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden border-[4px] md:border-[8px] border-white ring-2 ring-brand-border flex items-center justify-center touch-none">
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <canvas
              ref={canvasRef}
              width={SIM_WIDTH * GRID_SIZE}
              height={SIM_HEIGHT * GRID_SIZE}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="image-pixelated bg-[#1A1A1A] transition-transform duration-500 hover:scale-[1.005] touch-none"
              style={{
                width: "min(95%, 95%)",
                aspectRatio: "1/1",
                imageRendering: "pixelated",
              }}
            />

            <div className="absolute top-4 md:top-8 left-4 md:left-8 flex gap-2 md:gap-3 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/20 uppercase tracking-widest">
                60 FPS
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(true);
                }}
                className="bg-brand-blue/80 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/20 uppercase tracking-widest pointer-events-auto active:scale-95 transition-transform"
              >
                INFO
              </button>
            </div>

            {isPaused && (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 p-6 md:p-8 rounded-full shadow-2xl animate-pulse">
                  <Pause
                    size={32}
                    className="md:w-12 md:h-12 text-brand-blue"
                    fill="currentColor"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="h-20 bg-white rounded-3xl shadow-sm border-2 border-brand-border flex items-center px-8 justify-between">
            <div className="flex gap-6">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-3 group"
              >
                <div className="p-2.5 bg-[#F5F5F5] rounded-xl group-hover:bg-brand-blue group-hover:text-white transition-all text-[#888]">
                  <Layers size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#AAA]">
                  Manual de Física
                </span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-3 group"
              >
                <div className="p-2.5 bg-[#F5F5F5] rounded-xl group-hover:bg-brand-red group-hover:text-white transition-all text-[#888]">
                  <RotateCcw size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#AAA]">
                  Resetar Mundo
                </span>
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_8px_rgba(107,203,119,0.5)]"></div>
                <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
                  Motor estável
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#EEE]" />
              <span className="font-mono text-[10px] font-bold bg-[#F5F5F5] px-3 py-1.5 rounded-lg text-[#666]">
                SIMULATION READY
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="fixed inset-0 bg-brand-text/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-white rounded-[40px] shadow-2xl border-4 border-brand-border p-10 z-50 text-center"
            >
              <div className="w-20 h-20 bg-brand-yellow rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6 transform -rotate-6">
                <Info size={40} className="text-white" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-black mb-4 tracking-tighter">
                MANUAL DE FÍSICA
              </h2>
              <div className="space-y-4 text-sm text-[#666] font-medium text-left bg-[#F9F9F9] p-6 rounded-2xl border-2 border-[#EAEAEA]">
                <p>
                  🚀 <span className="font-bold text-brand-red">Fogo:</span>{" "}
                  Reage com inflamáveis e ferve água.
                </p>
                <p>
                  🌊 <span className="font-bold text-brand-blue">Água:</span>{" "}
                  Flui e dissolve ácidos se misturada.
                </p>
                <p>
                  🌋 <span className="font-bold text-[#FF2200]">Lava:</span>{" "}
                  Calor extremo que consome madeira.
                </p>
                <p>
                  🧪 <span className="font-bold text-brand-green">Ácido:</span>{" "}
                  Corrói tudo exceto vidro e pedra.
                </p>
                <p>
                  🧊 <span className="font-bold text-[#aaddff]">Gelo:</span>{" "}
                  Derrete perto de fontes de calor.
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="mt-8 bg-brand-text text-white px-10 py-3 rounded-2xl font-black shadow-[0_6px_0_#000] hover:translate-y-0.5 hover:shadow-[0_4px_0_#000] transition-all"
              >
                ENTENDI!
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #EEE; border-radius: 10px; }
        @media (max-width: 768px) {
          .no-scrollbar-mobile::-webkit-scrollbar { display: none; }
          .no-scrollbar-mobile { -ms-overflow-style: none; scrollbar-width: none; }
        }
      `,
        }}
      />
    </div>
  );
};
