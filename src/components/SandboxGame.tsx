import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Play, Pause, Info, Layers, RotateCcw, X, Trophy } from "lucide-react";
import { SandboxEngine } from "../engine/SandboxEngine";
import { ElementType, ELEMENTS } from "../types";
import { audioSystem } from "../lib/audio";
import { useAchievements } from "../lib/achievements";

const GRID_SIZE = 5; // Pixel size on canvas
const SIM_WIDTH = 100;
const SIM_HEIGHT = 100;

export const SandboxGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SandboxEngine | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementType>(
    ElementType.SAND,
  );
  const [brushSize, setBrushSize] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const [brushDensity, setBrushDensity] = useState(100);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (particleCount >= 10000) {
      import("../lib/achievements").then(m => m.unlockAchievement('overpopulation'));
    }
  }, [particleCount]);

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
    
    // First pass for regular elements
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
    
    // Second pass for glowing elements (Fire, Lava, Neon, Spark, Plasma, Electricity)
    ctx.globalCompositeOperation = "screen";
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = grid[y * width + x];
        if (type === ElementType.FIRE || type === ElementType.LAVA || type === ElementType.NEON || type === ElementType.SPARK || type === ElementType.PLASMA || type === ElementType.ELECTRICITY || type === ElementType.LIGHTBULB) {
            ctx.fillStyle = ELEMENTS[type].color + "80"; // 50% opacity hex
            // Just draw a bigger rectangle instead of using expensive shadowBlur 
            ctx.fillRect((x - 1) * GRID_SIZE, (y - 1) * GRID_SIZE, GRID_SIZE * 3, GRID_SIZE * 3);
        }
      }
    }
    ctx.globalCompositeOperation = "source-over";

    if (!document.documentElement.dataset.lastUpdate || Date.now() - Number(document.documentElement.dataset.lastUpdate) > 500) {
      setParticleCount(count);
      document.documentElement.dataset.lastUpdate = Date.now().toString();
    }

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

    if (selectedElement === ElementType.NUKE || selectedElement === ElementType.ANTIMATTER) {
      import("../lib/achievements").then(m => m.unlockAchievement('oppenheimer'));
    }
    if (selectedElement === ElementType.FIRE) {
      import("../lib/achievements").then(m => m.unlockAchievement('pyromaniac'));
    }
    if (selectedElement === ElementType.VIRUS || selectedElement === ElementType.BACTERIA) {
      import("../lib/achievements").then(m => m.unlockAchievement('virus_outbreak'));
    }
    if (selectedElement === ElementType.PLANT || selectedElement === ElementType.VINE || selectedElement === ElementType.SEED) {
      import("../lib/achievements").then(m => m.unlockAchievement('let_it_grow'));
    }
    if (selectedElement === ElementType.BLACK_HOLE) {
      import("../lib/achievements").then(m => m.unlockAchievement('black_hole_event'));
    }
    if (selectedElement === ElementType.ELECTRICITY || selectedElement === ElementType.PLASMA) {
      import("../lib/achievements").then(m => m.unlockAchievement('electrician'));
    }
    if (selectedElement === ElementType.ACID) {
      import("../lib/achievements").then(m => m.unlockAchievement('acid_bath'));
    }
    if (selectedElement === ElementType.LIQUID_NITROGEN) {
      import("../lib/achievements").then(m => m.unlockAchievement('absolute_zero'));
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / GRID_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / GRID_SIZE);

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          if (Math.random() < brushDensity / 100) {
            let typeToPlace = selectedElement;
            if (typeToPlace === ElementType.RANDOM) {
               const allowedTypes = Object.values(ElementType).filter(t => t !== ElementType.EMPTY && t !== ElementType.RANDOM);
               typeToPlace = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
            }
            engineRef.current.setPixel(x + dx, y + dy, typeToPlace);
          }
        }
      }
    }
  };

  const handleClear = () => {
    engineRef.current?.clear();
    import("../lib/achievements").then(m => m.unlockAchievement('god_complex'));
  };

  const categories = [
    {
      name: "Sólidos",
      color: "brand-red",
      shadow: "brand-shadow-red",
      items: [
        ElementType.SAND, ElementType.STONE, ElementType.GLASS, ElementType.ICE,
        ElementType.WOOD, ElementType.METAL, ElementType.CLAY,
        ElementType.SALT, ElementType.DIRT, ElementType.SNOW,
        ElementType.COAL, ElementType.GRAVEL, ElementType.OBSIDIAN,
        ElementType.DIAMOND, ElementType.PAPER, ElementType.WAX,
      ],
    },
    {
      name: "Líquidos",
      color: "brand-blue",
      shadow: "brand-shadow-blue",
      items: [
        ElementType.WATER, ElementType.OIL, ElementType.LAVA, ElementType.ACID,
        ElementType.SLIME, ElementType.HONEY, ElementType.BLOOD, ElementType.ALCOHOL,
        ElementType.LIQUID_NITROGEN,
      ],
    },
    {
      name: "Vida & Naturais",
      color: "brand-green",
      shadow: "brand-shadow-green",
      items: [
        ElementType.PLANT, ElementType.SEED, ElementType.FUNGUS, ElementType.VIRUS,
        ElementType.VINE, ElementType.SPORE, ElementType.BACTERIA,
        ElementType.ANT, ElementType.TERMITE, ElementType.MEAT, ElementType.BONE,
      ],
    },
    {
      name: "Gases",
      color: "brand-blue",
      shadow: "brand-shadow-green",
      items: [
        ElementType.GAS, ElementType.SMOKE, ElementType.STEAM,
        ElementType.NEON, ElementType.CLOUD, ElementType.OXYGEN,
        ElementType.HYDROGEN, ElementType.HELIUM, ElementType.POISON,
      ],
    },
    {
      name: "Especiais & Armas",
      color: "brand-yellow",
      shadow: "brand-shadow-yellow",
      items: [
        ElementType.FIRE, ElementType.C4, ElementType.GUNPOWDER, ElementType.THERMITE, ElementType.NITRO, ElementType.NUKE,
        ElementType.SPARK, ElementType.WIRE, ElementType.ELECTRICITY, ElementType.PLASMA,
        ElementType.URANIUM, ElementType.ANTIMATTER, ElementType.BLACK_HOLE, ElementType.VOID,
        ElementType.SPONGE, ElementType.EMPTY, ElementType.RANDOM,
      ],
    },
  ];

  const elementToEmoji: Record<string, string> = {
    [ElementType.SAND]: "⏳", [ElementType.STONE]: "🪨", [ElementType.WATER]: "💧",
    [ElementType.FIRE]: "🔥", [ElementType.ICE]: "🧊", [ElementType.WOOD]: "🪵",
    [ElementType.PLANT]: "🌿", [ElementType.OIL]: "🛢️", [ElementType.GAS]: "⛽",
    [ElementType.ACID]: "🧪", [ElementType.SMOKE]: "💨", [ElementType.STEAM]: "🌫️",
    [ElementType.EMPTY]: "🧽", [ElementType.LAVA]: "🌋", [ElementType.METAL]: "⛓️",
    [ElementType.GUNPOWDER]: "💣", [ElementType.NITRO]: "🧨", [ElementType.SALT]: "🧂",
    [ElementType.CLAY]: "🧱", [ElementType.FUNGUS]: "🍄", [ElementType.GLASS]: "🪟",
    [ElementType.DIRT]: "🟤", [ElementType.SNOW]: "❄️", [ElementType.COAL]: "🌑",
    [ElementType.ASH]: "🔘", [ElementType.SEED]: "🌰", [ElementType.SLIME]: "🦠",
    [ElementType.HONEY]: "🍯", [ElementType.BLOOD]: "🩸", [ElementType.SPARK]: "⚡",
    [ElementType.WIRE]: "🔌", [ElementType.SPONGE]: "🧽", [ElementType.VIRUS]: "☣️",
    [ElementType.NEON]: "💡", [ElementType.RUST]: "🟫", [ElementType.C4]: "📦",
    [ElementType.THERMITE]: "🧨", [ElementType.RANDOM]: "🎲",
    
    [ElementType.GRAVEL]: "🪨", [ElementType.OBSIDIAN]: "⬛", [ElementType.DIAMOND]: "💎",
    [ElementType.PAPER]: "📄", [ElementType.WAX]: "🕯️", [ElementType.ALCOHOL]: "🍸",
    [ElementType.LIQUID_NITROGEN]: "🥶", [ElementType.VINE]: "🌿", [ElementType.SPORE]: "🦠",
    [ElementType.BACTERIA]: "🦠", [ElementType.ANT]: "🐜", [ElementType.TERMITE]: "🐜",
    [ElementType.MEAT]: "🥩", [ElementType.BONE]: "🦴", [ElementType.CLOUD]: "☁️",
    [ElementType.OXYGEN]: "💨", [ElementType.HYDROGEN]: "💨", [ElementType.HELIUM]: "🎈",
    [ElementType.POISON]: "☠️", [ElementType.NUKE]: "☢️", [ElementType.ELECTRICITY]: "⚡",
    [ElementType.PLASMA]: "🟣", [ElementType.URANIUM]: "🟢", [ElementType.ANTIMATTER]: "🌌",
    [ElementType.BLACK_HOLE]: "🕳️", [ElementType.VOID]: "⬛",
  };

  const [activeCategory, setActiveCategory] = useState(categories[0].name);
  const { achievements, unlockedIds } = useAchievements();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col p-4 md:p-6 select-none font-sans overflow-hidden touch-none selection:bg-rose-200">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-stone-200 transform rotate-3">
            <span className="text-stone-800 font-extrabold text-xl md:text-2xl">S</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-stone-900">
              SANDWORLD <span className="text-rose-500">SANDBOX</span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em]">
              Simulation Universe v1.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 bg-white p-1.5 md:p-2 rounded-2xl shadow-sm border border-stone-200">
          <button
            onClick={() => setShowAchievements(true)}
            className="p-2 hover:bg-amber-50 rounded-xl text-amber-500 transition-colors relative"
            title="Conquistas"
          >
            <Trophy size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {unlockedIds.length}
            </span>
          </button>
          
          <div className="hidden xs:flex flex-col items-end px-2 md:px-3 border-l border-stone-100 pl-3">
            <span className="text-[8px] md:text-[10px] font-bold text-stone-400 uppercase">
              Partículas
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="font-mono font-bold text-emerald-600 text-xs md:text-sm">
                {particleCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="hidden xs:block h-8 w-[2px] bg-stone-100" />
          <button
            onClick={handleClear}
            className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-colors"
          >
            <Trash2 size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`
              px-4 md:px-6 py-1.5 md:py-2 rounded-xl font-bold text-white text-xs md:text-base transition-all
              active:translate-y-[2px] active:shadow-none
              ${isPaused ? "bg-emerald-500 shadow-[0_4px_0_#059669]" : "bg-rose-500 shadow-[0_4px_0_#e11d48]"}
            `}
          >
            {isPaused ? "PLAY" : "STOP"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
        {/* Sidebar - Desktop Layout or Bottom Bar - Mobile */}
        <aside className="w-full md:w-80 flex flex-col gap-4 order-2 md:order-1">
          <div className="bg-white rounded-xl p-2 md:p-3 shadow-sm border border-stone-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex bg-stone-50 p-1 md:p-1.5 rounded-lg gap-2 mb-3 overflow-x-auto no-scrollbar-mobile custom-scrollbar border border-stone-100">
              {categories.map((cat, i) => {
                const colorMap = ["bg-rose-100 text-rose-700 border-rose-200", "bg-blue-100 text-blue-700 border-blue-200", "bg-emerald-100 text-emerald-700 border-emerald-200", "bg-amber-100 text-amber-700 border-amber-200", "bg-lime-100 text-lime-700 border-lime-200", "bg-purple-100 text-purple-700 border-purple-200"];
                const activeColor = colorMap[i % colorMap.length];
                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      audioSystem.init();
                      audioSystem.playClick();
                      setActiveCategory(cat.name);
                    }}
                    className={`flex-1 py-1 px-3 rounded-md text-[10px] md:text-xs font-bold tracking-wider transition-all whitespace-nowrap active:translate-y-[2px]
                      ${activeCategory === cat.name ? activeColor + " border-b-2" : "bg-white text-stone-500 border-b-[2px] border-stone-200 hover:bg-stone-50"}
                    `}
                  >
                    <span>{cat.name.toUpperCase()}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar bg-white p-1 md:p-2 rounded-lg border border-stone-100">
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2">
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
                        relative px-1 py-2 md:py-3 flex flex-col items-center justify-center rounded-lg transition-all border
                        active:translate-y-[1px]
                        ${isSelected ? "bg-stone-100 border-stone-300 shadow-inner" : "bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300"}
                      `}
                      >
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded mb-1.5 shadow-sm border border-stone-200/50 flex items-center justify-center text-xs md:text-sm" style={{ backgroundColor: props.color }}>
                          {elementToEmoji[type] && <span className="opacity-90">{elementToEmoji[type]}</span>}
                        </div>
                        <span 
                          className={`text-[8px] md:text-[9px] font-bold uppercase tracking-tight text-center w-full truncate px-0.5 ${isSelected ? 'text-stone-800' : 'text-stone-500'}`}
                        >
                          {type}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="mt-4 md:mt-5">
              <div className="bg-stone-50 rounded-xl p-3 md:p-4 border border-stone-200 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2 text-[10px]">
                    <span className="font-bold text-stone-500 uppercase tracking-widest">
                      Pincel
                    </span>
                    <span className="font-bold font-mono text-stone-700 bg-white px-2 py-0.5 rounded shadow-sm border border-stone-200">
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
                      className="flex-1 accent-rose-500 h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 text-[10px]">
                    <span className="font-bold text-stone-500 uppercase tracking-widest">
                      Densidade
                    </span>
                    <span className="font-bold font-mono text-stone-700 bg-white px-2 py-0.5 rounded shadow-sm border border-stone-200">
                      {brushDensity}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={brushDensity}
                      onChange={(e) => setBrushDensity(parseInt(e.target.value))}
                      className="flex-1 accent-amber-500 h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Simulation Canvas Area */}
        <section className="flex-1 flex flex-col gap-3 md:gap-4 order-1 md:order-2">
          <div className="flex-1 bg-white rounded-[20px] relative overflow-hidden border border-stone-200 flex items-center justify-center touch-none shadow-sm">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
              style={{
                backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
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
              className="image-pixelated bg-stone-100 transition-transform duration-500 hover:scale-[1.005] touch-none shadow-inner rounded-xl"
              style={{
                width: "min(95%, 95%)",
                aspectRatio: "1/1",
                imageRendering: "pixelated",
              }}
            />

            <div className="absolute top-4 md:top-6 left-4 md:left-6 flex gap-2 md:gap-3 pointer-events-none z-10">
              <div className="bg-white/80 backdrop-blur-md text-stone-700 text-[9px] md:text-[10px] font-bold px-3 py-1.5 rounded-full border border-stone-200 uppercase tracking-widest shadow-sm">
                60 FPS
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(true);
                }}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[9px] md:text-[10px] font-bold px-3 py-1.5 rounded-full border border-amber-200 uppercase tracking-widest shadow-sm pointer-events-auto active:scale-95 transition-all"
              >
                INFO
              </button>
            </div>

            {isPaused && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10">
                <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-full shadow-lg text-stone-400">
                  <Pause size={32} className="md:w-10 md:h-10" fill="currentColor" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="h-16 md:h-20 bg-white rounded-[20px] shadow-sm border border-stone-200 flex items-center px-6 md:px-8 justify-between overflow-x-auto no-scrollbar-mobile">
            <div className="flex gap-4 md:gap-6 shrink-0">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 md:gap-3 group"
              >
                <div className="p-2.5 bg-stone-50 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-600 transition-all text-stone-400 border border-stone-200">
                  <Info size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500 group-hover:text-stone-800 hidden md:block">
                  Detalhes
                </span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-2 md:gap-3 group"
              >
                <div className="p-2.5 bg-stone-50 rounded-xl group-hover:bg-rose-50 group-hover:text-rose-500 transition-all text-stone-400 border border-stone-200">
                  <RotateCcw size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-stone-500 group-hover:text-stone-800 hidden md:block">
                  Resetar
                </span>
              </button>
            </div>

            <div className="flex gap-4 items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider hidden sm:block">
                  Motor estável
                </span>
              </div>
              <div className="h-4 w-[1px] bg-stone-200" />
              <span className="font-mono text-[10px] font-bold bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-stone-600 shadow-sm">
                {particleCount} PX
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Element Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] bg-white rounded-[24px] shadow-2xl border border-stone-200 p-0 z-[110] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center bg-stone-50 p-4 border-b border-stone-200">
                <h2 className="text-lg font-black tracking-widest text-stone-800 uppercase flex-1 text-center font-display">
                  {selectedElement}
                </h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="bg-white hover:bg-stone-100 text-stone-500 w-8 h-8 rounded-full flex items-center justify-center font-bold border border-stone-200 transition-colors"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              <div className="flex-1 p-6 bg-white overflow-y-auto custom-scrollbar text-sm leading-relaxed text-stone-600 font-medium">
                <div className="flex items-center gap-3 mb-6 p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-500 font-bold uppercase text-[10px] tracking-wider">Cor:</span>
                  <div 
                    className="w-10 h-10 rounded-full border border-stone-200 shadow-sm" 
                    style={{ backgroundColor: ELEMENTS[selectedElement].color }} 
                  />
                  <span className="font-mono text-stone-400 text-xs ml-auto bg-white px-2 py-1 rounded shadow-sm border border-stone-200">
                    {ELEMENTS[selectedElement].color}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Categoria</span>
                    <span className="text-stone-700 font-bold uppercase">
                      {ELEMENTS[selectedElement].state === 'solid' ? 'TERRA' : 
                       ELEMENTS[selectedElement].state === 'liquid' ? 'LÍQUIDO' : 
                       ELEMENTS[selectedElement].state === 'gas' ? 'GÁS' : 
                       ELEMENTS[selectedElement].state === 'energy' ? 'ENERGIA' : 'ESPECIAL'}
                    </span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Densidade</span>
                    <span className="text-stone-700 font-bold">
                      {ELEMENTS[selectedElement].density > 0 ? (ELEMENTS[selectedElement].density * 100).toFixed(0) : 0} kg/m³
                    </span>
                  </div>
                </div>

                {ELEMENTS[selectedElement].flammable && (
                  <div className="flex items-center gap-2 text-rose-500 mb-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    <span className="font-bold uppercase text-[10px] tracking-widest">Inflamável:</span>
                    <span className="text-sm">Sim (Taxa: {ELEMENTS[selectedElement].burnRate})</span>
                  </div>
                )}

                {ELEMENTS[selectedElement].explosive && (
                  <div className="flex items-center gap-2 text-rose-600 mb-4 p-3 bg-rose-100 rounded-xl border border-rose-200 font-bold uppercase text-[10px] tracking-widest">
                    <span>☢️ Altamente Explosivo</span>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-stone-100">
                  <span className="block mb-3 font-bold text-stone-800">Características e Comportamento:</span>
                  <p className="text-stone-500 text-[13px] leading-relaxed">
                    {selectedElement === ElementType.SAND && "Areia cai e se acumula. Se for aquecida por LAVA, derrete e vira VIDRO (GLASS)."}
                    {selectedElement === ElementType.WATER && "Água flui horizontalmente. Apaga o fogo (FIRE) gerando vapor (CLOUD). Transforma-se em GELO (ICE) se tocar em nitrogênio líquido. Mistura-se com Ácido."}
                    {selectedElement === ElementType.FIRE && "Sobe e desaparece. Queima elementos inflamáveis como MADEIRA (WOOD), PLANTA (PLANT) e CARNE (MEAT), transformando-os em fumaça (SMOKE). Derrete GELO. Vira PEDRA se esfriado por Água."}
                    {selectedElement === ElementType.ACID && "Líquido altamente corrosivo. Dissolve quase qualquer coisa que toque, menos VIDRO (GLASS) e OBSIDIANA (OBSIDIAN). Libera hidrogênio ao derreter metal e veneno ao dissolver matéria orgânica."}
                    {selectedElement === ElementType.C4 && "Explode violentamente ao ser inflamado (por fogo, lava, etc)."}
                    {selectedElement === ElementType.VIRUS && "Contagia e destrói materiais orgânicos próximos, transformando-os em mais vírus."}
                    {selectedElement === ElementType.LAVA && "Líquido quente que derrete METAIS, AREIA (vira Vidro), e queima matérias orgânicas, emitindo fumaça. Vira pedra ao encostar em água."}
                    {selectedElement === ElementType.ANTIMATTER && "Aniquila quase tudo em que toca. Extremamente destrutivo."}
                    {selectedElement === ElementType.ELECTRICITY && "Energia pura que viaja rápido através do METAL, ÁGUA e FIO."}
                    {selectedElement === ElementType.PLANT && "Planta frágil que queima facilmente."}
                    {selectedElement === ElementType.WOOD && "E material forte que bóia na água e serve de alimento para cupins."}
                    {selectedElement === ElementType.METAL && "Conduz eletricidade. Pode derreter e virar LAVA sob calor imenso."}
                    {selectedElement === ElementType.GLASS && "Sólido transparente resistente a ácido."}
                    {selectedElement === ElementType.BLACK_HOLE && "Sugador cósmico. Puxa elementos próximos em sua direção com uma força gravitacional gigantesca e os apaga da existência."}
                    {selectedElement === ElementType.BACTERIA && "Microrganismo que se alimenta de matéria orgânica. Ataca os vírus!"}
                    {selectedElement === ElementType.VINE && "Planta curiosa que cresce sozinha, preenchendo os espaços vazios e indo para baixo."}
                    {selectedElement === ElementType.ICE && "Água congelada. Muito quebradiço."}
                    {selectedElement === ElementType.LIQUID_NITROGEN && "Frio absoluto. Congela água, vidro, etc."}
                    {!['sand', 'water', 'fire', 'acid', 'c4', 'virus', 'lava', 'antimatter', 'electricity', 'plant', 'wood', 'metal', 'glass', 'black_hole', 'bacteria', 'vine', 'ice', 'liquid_nitrogen'].includes(selectedElement) && "Simulada fisicamente de forma dinâmica consoante aos arredores."}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-stone-50 border-t border-stone-200">
                <div className="flex bg-white text-stone-700 py-2 px-3 rounded-lg border border-stone-200 font-mono shadow-sm">
                  <span className="font-bold text-rose-500 mr-2">{'>'}</span>
                  <input 
                    type="text" 
                    value={selectedElement.toUpperCase()} 
                    readOnly
                    className="bg-transparent text-stone-700 outline-none w-full uppercase"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Achievements Modal */}
      <AnimatePresence>
        {showAchievements && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAchievements(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] max-h-[80vh] bg-white rounded-[24px] shadow-2xl border border-stone-200 p-0 z-[110] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center bg-amber-50 p-6 border-b border-amber-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200">
                    <Trophy className="text-amber-500 w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-amber-900">
                      Conquistas
                    </h2>
                    <p className="text-amber-600/80 text-sm font-medium">
                      Desbloqueadas: {unlockedIds.length} / {achievements.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAchievements(false)}
                  className="bg-white hover:bg-amber-100 text-amber-600/60 hover:text-amber-600 w-10 h-10 rounded-full flex items-center justify-center font-bold border border-amber-200 transition-colors shadow-sm"
                >
                  <X />
                </button>
              </div>

              <div className="flex-1 p-6 bg-stone-50 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {achievements.map((ach) => {
                    const isUnlocked = unlockedIds.includes(ach.id);
                    return (
                      <div 
                        key={ach.id} 
                        className={`flex gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${isUnlocked ? 'bg-white border-amber-200 shadow-sm' : 'bg-stone-100 border-stone-200 opacity-60 grayscale'}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl ${isUnlocked ? 'bg-amber-100 shadow-inner' : 'bg-stone-200'}`}>
                          {ach.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold mb-1 ${isUnlocked ? 'text-amber-900' : 'text-stone-500'}`}>
                            {ach.title}
                          </h3>
                          <p className="text-xs text-stone-500 leading-relaxed font-medium">
                            {ach.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
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
