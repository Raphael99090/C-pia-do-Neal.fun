/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { SandboxGame } from "./components/SandboxGame";
import { AlchemyGame } from "./components/AlchemyGame";
import { SynthPad } from "./components/SynthPad";
import { Kaleidoscope } from "./components/Kaleidoscope";
import { Theremin } from "./components/Theremin";
import { PixelStudio } from "./components/PixelStudio";
import { ParticleFlow } from "./components/ParticleFlow";
import { GravitySandbox } from "./components/GravitySandbox";
import { SpendMoney } from "./components/SpendMoney";
import { LifeStats } from "./components/LifeStats";
import { MoralDilemmas } from "./components/MoralDilemmas";
import { CellStage } from "./components/CellStage";
import { AchievementsButton } from "./components/AchievementsButton";
import { PokemonBattle } from "./components/PokemonBattle";
import { motion, AnimatePresence } from "motion/react";
import { useAchievements } from "./lib/achievements";
import {
  ArrowLeft,
  Beaker,
  FlaskConical,
  Volume2,
  VolumeX,
  Music4,
  Palette,
  Brush,
  RadioReceiver,
  SquareDashedBottomCode,
  Wind,
  Circle,
  DollarSign,
  Clock,
  Scale,
  Activity,
  Swords,
  Gamepad2,
  Mail,
} from "lucide-react";
import { audioSystem } from "./lib/audio";

const GameCoverAsset = ({ id, icon, color }: { id: string, icon: React.ReactNode, color: string }) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full rounded-[20px] overflow-hidden transition-all duration-500 ease-out z-10">
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.1] group-hover:opacity-[0.25] transition-all duration-500 rounded-[20px]`} />
      
      {/* Light inner layer */}
      <div className="absolute inset-[1px] bg-white rounded-[19px] opacity-100 group-hover:opacity-0 transition-opacity duration-300 shadow-sm" />
      
      {/* Pattern Overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.15] transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black via-black/20 to-transparent" />
      
      {/* Icon Layer */}
      <div className="relative z-20 transition-transform duration-500 transform group-hover:scale-[1.15] text-stone-600 group-hover:text-stone-900 group-hover:drop-shadow-[0_0_15px_rgba(0,0,0,0.1)]">
        {React.cloneElement(icon as React.ReactElement, { size: 42, strokeWidth: 2, className: "transition-all duration-300" })}
      </div>
      
      {/* Refraction effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-black/5 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
    </div>
  );
};

export default function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { toast } = useAchievements();

  useEffect(() => {
    setIsMuted(audioSystem.getMuted());
  }, []);

  const toggleMute = () => {
    setIsMuted(audioSystem.toggleMute());
  };

  const handleGameSelect = (id: string | null) => {
    audioSystem.init();
    audioSystem.playSelect();
    setActiveGame(id);
  };

  const games = [
    {
      id: "pokemon-battle",
      name: "Batalha Elemental",
      description: "Combate estratégico em turnos com monstrinhos fofos.",
      icon: <Swords size={32} />,
      color: "from-rose-500 via-red-500 to-amber-600",
      buttonColor: "bg-rose-500",
      component: PokemonBattle,
    },
    {
      id: "synth",
      name: "Synth Pad",
      description: "Toque bateria e sintetizadores",
      icon: <Music4 size={32} />,
      color: "from-pink-500 via-fuchsia-600 to-purple-800",
      buttonColor: "bg-pink-500",
      component: SynthPad,
    },
    {
      id: "kaleidoscope",
      name: "Caleidoscópio",
      description: "Desenhe arte de mandala simétrica",
      icon: <Brush size={32} />,
      color: "from-rose-500 via-pink-600 to-fuchsia-800",
      buttonColor: "bg-pink-500",
      component: Kaleidoscope,
    },
    {
      id: "theremin",
      name: "Theremin Digital",
      description: "Toque sintetizador digital etéreo",
      icon: <RadioReceiver size={32} />,
      color: "from-cyan-400 via-teal-500 to-emerald-800",
      buttonColor: "bg-cyan-500",
      component: Theremin,
    },
    {
      id: "pixel",
      name: "Pixel Studio",
      description: "Desenhe pixel art retrô 16x16",
      icon: <SquareDashedBottomCode size={32} />,
      color: "from-slate-400 via-slate-600 to-slate-800",
      buttonColor: "bg-slate-600",
      component: PixelStudio,
    },
    {
      id: "sandbox",
      name: "Mundo de Areia",
      description: "Areia caindo (Powder Game)",
      icon: <FlaskConical size={32} />,
      color: "from-amber-400 via-orange-500 to-rose-700",
      buttonColor: "bg-orange-500",
      component: SandboxGame,
    },
    {
      id: "alchemy",
      name: "Alquimia Infinita",
      description: "Combine usando IA (Infinite Craft)",
      icon: <Beaker size={32} />,
      color: "from-teal-300 via-emerald-500 to-green-800",
      buttonColor: "bg-teal-500",
      component: AlchemyGame,
    },
    {
      id: "particle",
      name: "Partículas",
      description: "Física de partículas fluída",
      icon: <Wind size={32} />,
      color: "from-blue-400 via-indigo-600 to-violet-800",
      buttonColor: "bg-cyan-600",
      component: ParticleFlow,
    },
    {
      id: "gravity",
      name: "Órbitas",
      description: "Simule atração gravitacional",
      icon: <Circle size={32} />,
      color: "from-amber-600 via-orange-700 to-red-900",
      buttonColor: "bg-amber-600",
      component: GravitySandbox,
    },
    {
      id: "spend",
      name: "Gaste o Bilhão",
      description: "Compre coisas absurdas",
      icon: <DollarSign size={32} />,
      color: "from-lime-400 via-green-600 to-emerald-900",
      buttonColor: "bg-emerald-600",
      component: SpendMoney,
    },
    {
      id: "lifestats",
      name: "Sua Vida",
      description: "Quanto você já viveu",
      icon: <Clock size={32} />,
      color: "from-indigo-400 via-violet-600 to-purple-900",
      buttonColor: "bg-indigo-600",
      component: LifeStats,
    },
    {
      id: "moral",
      name: "Arbítrio IA",
      description: "Dilemas éticos profundos e impossíveis",
      icon: <Scale size={32} />,
      color: "from-slate-200 via-slate-400 to-slate-700",
      buttonColor: "bg-slate-900",
      component: MoralDilemmas,
    },
    {
      id: "cellstage",
      name: "Evolução",
      description: "Coma e cresça como Spore",
      icon: <Activity size={32} />,
      color: "from-sky-300 via-blue-500 to-indigo-800",
      buttonColor: "bg-sky-500",
      component: CellStage,
    },
  ];

  const ActiveComponent = activeGame
    ? games.find((g) => g.id === activeGame)?.component
    : null;

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-screen font-sans flex flex-col relative overflow-hidden">
      <AchievementsButton />
      
      {/* Achievement Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-4 bg-white/95 backdrop-blur-xl border border-rose-200/50 px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(251,113,133,0.15)]"
          >
            <div className="text-4xl drop-shadow-[0_0_10px_rgba(251,113,133,0.2)]">{toast.icon}</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-none mb-1">Conquista Desbloqueada</span>
              <span className="text-stone-800 font-bold">{toast.title}</span>
              <span className="text-xs text-stone-500">{toast.description}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col relative w-full h-full z-10"
          >
            {/* Main Channel Grid */}
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex items-center justify-center -mt-8">
              <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
                {games.map((game, i) => (
                  <button
                    key={`${game.id}-${i}`}
                    onClick={() => handleGameSelect(game.id)}
                    className="wii-channel aspect-[2/1] flex flex-col items-center justify-center p-2 relative overflow-hidden group outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className="flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-300 z-10">
                      <div className={`mb-1 md:mb-2 ${game.buttonColor.replace('bg-', 'text-')}`}>
                        {React.cloneElement(game.icon as React.ReactElement, { size: 28, strokeWidth: 2.5 })}
                      </div>
                      <h2 className={`font-bold text-[11px] md:text-sm text-center leading-tight ${game.buttonColor.replace('bg-', 'text-')}`}>
                        {game.name}
                      </h2>
                    </div>
                  </button>
                ))}
                
                {/* Empty Slots to fill Wii style grid */}
                {Array.from({ length: Math.max(0, 9 - games.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="wii-channel-empty aspect-[2/1]" />
                ))}
              </div>
            </main>

            {/* Wii Style Footer */}
            <footer className="h-24 md:h-[120px] wii-footer flex justify-between items-center px-6 md:px-16 w-full relative shrink-0 z-50">
              <button 
                className="wii-button-circle w-16 h-16 md:w-[84px] md:h-[84px] rounded-full flex items-center justify-center text-[#555] font-sans font-bold text-lg md:text-xl md:tracking-wider outline-none focus-visible:ring-4 focus-visible:ring-sky-400 cursor-pointer"
                onClick={toggleMute}
                title="Toggle Mute"
              >
                {isMuted ? 'Mute' : 'Wii'}
              </button>
              
              <div className="flex flex-col items-center justify-center text-[#9c9c9c]">
                <div className="font-digital text-5xl md:text-7xl font-bold tracking-widest leading-none drop-shadow-sm opacity-90 text-[#b4b4b4]">
                  {time.getHours().toString().padStart(2, '0')}
                  <span className="animate-[pulse_1.5s_ease-in-out_infinite] opacity-60 mx-[-2px] pb-1">:</span>
                  {time.getMinutes().toString().padStart(2, '0')}
                </div>
              </div>

              <button className="wii-button-circle w-16 h-16 md:w-[84px] md:h-[84px] rounded-full flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-sky-400 cursor-pointer">
                 <div className="w-8 h-6 md:w-10 md:h-7 rounded bg-stone-400 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-0 w-full h-full border-t-[14px] md:border-t-[18px] border-l-[16px] md:border-l-[20px] border-r-[16px] md:border-r-[20px] border-b-0 border-stone-300 border-l-transparent border-r-transparent"></div>
                 </div>
              </button>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 flex flex-col bg-white"
          >
            {/* Minimal Wii in-game bar (optional, could just be a back button) */}
            <div className="h-16 bg-white flex items-center px-6 shrink-0 justify-between sticky top-0 z-[100] border-b border-stone-100 shadow-sm">
              <button
                onClick={() => handleGameSelect(null)}
                className="h-10 px-4 rounded-full text-stone-600 font-bold tracking-wider text-sm flex items-center gap-2 hover:bg-stone-100 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
              >
                <ArrowLeft size={18} /> INÍCIO
              </button>
              
              <div className="font-bold text-sm md:text-lg text-stone-400 uppercase tracking-widest">
                {games.find((g) => g.id === activeGame)?.name}
              </div>
              
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full text-stone-500 flex items-center justify-center hover:bg-stone-100 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
                aria-label="Toggle Sound"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-white">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
