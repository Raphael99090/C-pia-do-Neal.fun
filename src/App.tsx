/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { SandboxGame } from "./components/SandboxGame";
import { AlchemyGame } from "./components/AlchemyGame";
import { GameOfLife } from "./components/GameOfLife";
import { ReactionGame } from "./components/ReactionGame";
import { MemoryGame } from "./components/MemoryGame";
import { CPSTest } from "./components/CPSTest";
import { PerfectCircle } from "./components/PerfectCircle";
import { AimTrainer } from "./components/AimTrainer";
import { TowerStack } from "./components/TowerStack";
import { SynthPad } from "./components/SynthPad";
import { VocabMaster } from "./components/VocabMaster";
import { SpeedTyper } from "./components/SpeedTyper";
import { ColorGenius } from "./components/ColorGenius";
import { QuickMath } from "./components/QuickMath";
import { SequenceMaster } from "./components/SequenceMaster";
import { Kaleidoscope } from "./components/Kaleidoscope";
import { Theremin } from "./components/Theremin";
import { PixelStudio } from "./components/PixelStudio";
import { ParticleFlow } from "./components/ParticleFlow";
import { GravitySandbox } from "./components/GravitySandbox";
import { SpeedMatch } from "./components/SpeedMatch";
import { SpendMoney } from "./components/SpendMoney";
import { LifeStats } from "./components/LifeStats";
import { MoralDilemmas } from "./components/MoralDilemmas";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Beaker,
  Brain,
  ChevronsRight,
  FlaskConical,
  MousePointer2,
  Pointer,
  CircleDashed,
  Crosshair,
  Volume2,
  VolumeX,
  Layers,
  Music4,
  BookOpen,
  Keyboard,
  Palette,
  Calculator,
  LayoutGrid,
  Brush,
  RadioReceiver,
  SquareDashedBottomCode,
  Wind,
  Circle,
  Zap,
  Target,
  DollarSign,
  TrendingDown,
  Clock,
  Scale
} from "lucide-react";
import { audioSystem } from "./lib/audio";

const GameCoverAsset = ({ id, icon }: { id: string, icon: React.ReactNode }) => {
  switch (id) {
    case "kaleidoscope":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="relative z-20 w-24 h-24 transform group-hover:rotate-180 group-hover:scale-110 transition-all duration-1000 flex-shrink-0">
             {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="absolute inset-0 border-2 border-white/50 rounded-full" style={{ transform: `rotate(${i * 45}deg) scaleY(0.3)` }} />
             ))}
             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md animate-pulse" />
           </div>
        </div>
      );
    case "theremin":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
           <div className="relative z-20 w-32 h-16 flex items-center justify-center gap-1 group-hover:scale-110 transition-transform duration-500 overflow-hidden flex-shrink-0">
              {Array.from({length: 10}).map((_, i) => (
                 <motion.div key={i} animate={{ top: ['20%', '80%', '20%'] }} transition={{ duration: 1 + Math.random(), repeat: Infinity }} className="relative w-2 h-1/2 bg-red-500/80 rounded-full" />
              ))}
           </div>
        </div>
      );
    case "pixel":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="relative z-20 grid grid-cols-4 grid-rows-4 gap-0.5 group-hover:scale-125 transition-transform duration-500 flex-shrink-0">
              {Array.from({length: 16}).map((_, i) => (
                 <div key={i} className={`w-4 h-4 rounded-sm ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-rose-400'}`} style={{ opacity: Math.random() > 0.5 ? 1 : 0.2 }} />
              ))}
           </div>
        </div>
      );
    case "particle":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-cyan-900 to-blue-900" />
           <div className="relative z-20 w-32 h-32 flex items-center justify-center flex-shrink-0">
              {Array.from({length: 20}).map((_, i) => (
                 <motion.div 
                    key={i} 
                    animate={{ 
                        x: [Math.random() * 40 - 20, Math.random() * 40 - 20], 
                        y: [Math.random() * 40 - 20, Math.random() * 40 - 20],
                        opacity: [0.2, 0.8, 0.2]
                    }} 
                    transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
                    className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[1px]" 
                 />
              ))}
              <div className="w-12 h-12 border border-cyan-400/50 rounded-full animate-ping" />
           </div>
        </div>
      );
    case "gravity":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="relative z-20 w-32 h-32 flex-shrink-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,1)]" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
              </motion.div>
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4"
              >
                <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-2 h-2 bg-rose-400 rounded-full" />
              </motion.div>
           </div>
        </div>
      );
    case "speedmatch":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="relative z-20 flex gap-4 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl animate-pulse" />
              <div className="w-16 h-16 bg-blue-500 rounded-2xl opacity-40" />
           </div>
           <div className="absolute top-4 right-4 text-white/20 font-black text-2xl group-hover:text-white/40 transition-colors">MATCH?</div>
        </div>
      );
    case "spend":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 bg-emerald-950 opacity-20" />
           <div className="relative z-20 flex flex-col items-center group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
              <div className="text-5xl mb-2">💰</div>
              <div className="h-2 w-32 bg-emerald-500/20 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ x: ['-100%', '100%'] }} 
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/3 bg-emerald-400" 
                />
              </div>
           </div>
        </div>
      );
    case "lifestats":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 bg-blue-950 opacity-10" />
           <div className="relative z-20 flex flex-col items-center group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
              <div className="flex items-end gap-1 mb-2">
                 <div className="w-2 h-8 bg-blue-500 rounded-full animate-pulse" />
                 <div className="w-2 h-12 bg-blue-400 rounded-full" />
                 <div className="w-2 h-6 bg-blue-600 rounded-full animate-pulse" />
              </div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Life Clock</div>
           </div>
        </div>
      );
    case "moral":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-white to-indigo-400 opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
           <div className="relative z-20 flex flex-col items-center group-hover:scale-110 transition-transform duration-700 flex-shrink-0">
              <div className="relative">
                <Scale size={70} className="text-slate-900 drop-shadow-xl relative z-10" />
                <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-150" 
                />
              </div>
              <div className="mt-6 flex gap-3">
                 <div className="w-10 h-2.5 bg-rose-500 rounded-full shadow-sm shadow-rose-200" />
                 <div className="w-10 h-2.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-200" />
              </div>
           </div>
        </div>
      );
    case "colors":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 bg-slate-50">
             <div className="absolute top-0 right-0 w-48 h-48 bg-rose-400/30 blur-3xl rounded-full animate-pulse" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/30 blur-3xl rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
           </div>
           <div className="relative z-20 flex text-5xl font-black group-hover:scale-125 transition-transform duration-500 flex-shrink-0 tracking-tighter italic">
             <span className="text-rose-500 uppercase">H</span>
             <span className="text-emerald-500 uppercase">U</span>
             <span className="text-blue-500 uppercase">E</span>
           </div>
        </div>
      );
    case "math":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>
           <div className="relative z-20 w-24 h-24 bg-cyan-900 border border-cyan-500/50 rounded-2xl shadow-xl flex items-center justify-center p-3 group-hover:-rotate-3 group-hover:scale-110 transition-transform duration-500 font-mono flex-shrink-0">
             <div className="text-cyan-400 text-3xl font-black">7*8</div>
           </div>
           <div className="absolute top-4 right-4 animate-bounce text-white font-black text-xl">56</div>
        </div>
      );
    case "sequence":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="relative z-20 w-24 h-24 grid grid-cols-2 grid-rows-2 gap-1.5 transform rotate-45 group-hover:rotate-90 group-hover:scale-110 transition-all duration-700 flex-shrink-0">
             <div className="bg-rose-500 rounded-sm shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse" />
             <div className="bg-emerald-500/30 rounded-sm" />
             <div className="bg-blue-500/30 rounded-sm" />
             <div className="bg-amber-400/30 rounded-sm" />
           </div>
        </div>
      );
    case "speed":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group p-6">
           <div className="absolute inset-0 bg-violet-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <div className="relative z-20 w-32 h-16 bg-white/20 backdrop-blur-md rounded-xl border border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex flex-wrap gap-1 p-2 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
             {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="flex-1 min-w-[20%] h-1/3 bg-white/40 rounded-sm" />
             ))}
           </div>
           <div className="absolute bottom-4 right-4 text-white/50 font-mono font-bold italic group-hover:drop-shadow-[0_0_10px_white] transition-all">WPM</div>
        </div>
      );
    case "aim":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden mix-blend-overlay">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.8))] z-10 pointer-events-none"></div>
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-[150%] h-[150%] border-[2px] border-white/10 rounded-full border-dashed"
          />
          <div className="absolute w-24 h-24 border-4 border-white/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="relative z-20 flex flex-col items-center justify-center drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
            <div className="w-20 h-20 bg-white shadow-[0_0_50px_rgba(255,255,255,1)] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
               <Crosshair size={40} className="text-blue-600 shrink-0" />
            </div>
            <div className="mt-4 flex gap-1.5 opacity-60">
              <div className="w-2 h-2 rounded bg-white" />
              <div className="w-6 h-2 rounded-full bg-white" />
              <div className="w-2 h-2 rounded bg-white" />
            </div>
          </div>
        </div>
      );
    case "reaction":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <div className="absolute -left-10 top-1/2 w-40 h-10 bg-white/20 blur-xl rotate-12" />
          <div className="absolute -right-10 top-[40%] w-40 h-10 bg-white/20 blur-xl -rotate-12" />
          
          <div className="relative z-20 w-24 h-24 bg-white/10 backdrop-blur-md border-[3px] border-white rounded-3xl rotate-12 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] group-hover:rotate-0 transition-all duration-500 flex-shrink-0">
             <MousePointer2 size={48} className="text-white drop-shadow-md shrink-0" />
             <div className="absolute -right-4 -bottom-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                <div className="w-3 h-3 bg-white rounded-full flex-shrink-0"></div>
             </div>
          </div>
        </div>
      );
    case "cps":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/20 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-30 gap-1 mt-10">
            {Array.from({length: 15}).map((_, i) => (
               <div key={i} className="w-1 h-32 bg-white rounded-t-full flex-shrink-0" style={{ opacity: Math.random() }}></div>
            ))}
          </div>
          
          <div className="relative z-20 w-32 h-20 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.5)] group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
             <Pointer size={40} className="text-indigo-600 animate-bounce shrink-0" style={{ animationDuration: '0.8s' }} />
          </div>
        </div>
      );
    case "memory":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-6">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-2 p-4 opacity-20 transform -rotate-6 scale-125">
             {Array.from({length: 16}).map((_, i) => (
                <div key={i} className="bg-white rounded-lg"></div>
             ))}
          </div>
          <div className="relative z-20 w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.6)] transform rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 flex-shrink-0">
             <Brain size={48} className="text-purple-600 shrink-0" />
          </div>
        </div>
      );
    case "vocab":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute inset-0 flex items-center justify-center opacity-10">
             <BookOpen size={200} className="text-white shrink-0" />
           </div>
           
           <div className="relative z-20 w-28 h-20 bg-white/10 backdrop-blur-lg border border-white/50 rounded-xl overflow-hidden flex shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 flex-shrink-0">
             <div className="w-1/3 bg-amber-500 border-r border-yellow-400"></div>
             <div className="w-2/3 bg-white flex items-center justify-center p-2">
                 <div className="w-full flex justify-between items-end h-full flex-col gap-1">
                    <div className="w-full h-1 bg-slate-200 rounded"></div>
                    <div className="w-3/4 h-1 bg-slate-200 rounded"></div>
                    <div className="w-full h-1 bg-slate-200 rounded"></div>
                    <div className="w-1/2 h-1 bg-slate-200 rounded"></div>
                 </div>
             </div>
           </div>
        </div>
      );
    case "circle":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute w-40 h-40 border-[8px] border-white/20 rounded-full border-dashed animate-spin-slow"></div>
           <div className="absolute w-32 h-32 border-[4px] border-emerald-300 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
           
           <div className="relative z-20 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.8)] group-hover:scale-125 transition-transform duration-500 flex-shrink-0">
             <CircleDashed size={32} className="text-emerald-500 animate-[spin_5s_linear_infinite] shrink-0" />
           </div>
        </div>
      );
    case "tower":
      return (
        <div className="relative w-full h-full flex items-end justify-center overflow-hidden pb-4 group">
           <div className="flex flex-col items-center justify-end relative z-20 gap-1.5 transform translate-y-4 group-hover:translate-y-2 transition-transform duration-500 flex-shrink-0">
              <div className="w-10 h-6 bg-white/80 rounded border-2 border-white translate-x-2"></div>
              <div className="w-12 h-6 bg-pink-300 rounded border-2 border-white -translate-x-3"></div>
              <div className="w-16 h-6 bg-rose-400 rounded border-2 border-white translate-x-1"></div>
              <div className="w-20 h-6 bg-rose-500 rounded border-2 border-white shadow-[0_-20px_40px_rgba(244,63,94,0.8)]"></div>
              <div className="w-24 h-6 bg-rose-600 rounded border-2 border-white"></div>
           </div>
        </div>
      );
    case "synth":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="relative z-20 w-28 h-28 bg-slate-900 rounded-3xl border-4 border-white shadow-[0_0_30px_rgba(217,70,239,0.4)] p-3 grid grid-cols-2 grid-rows-2 gap-2 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500 flex-shrink-0">
             <div className="bg-pink-500 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-pulse"></div>
             <div className="bg-fuchsia-400 rounded-xl shadow-[0_0_10px_rgba(232,121,249,0.5)]"></div>
             <div className="bg-purple-500 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.5)] bg-opacity-80"></div>
             <div className="bg-rose-400 rounded-xl shadow-[0_0_10px_rgba(251,113,133,0.5)] bg-opacity-80"></div>
           </div>
        </div>
      );
    case "sandbox":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="relative z-20 w-20 h-28 border-4 border-white rounded-b-[2rem] rounded-t-sm bg-orange-200/20 backdrop-blur-sm shadow-[0_0_40px_rgba(249,115,22,0.4)] flex flex-col justify-end overflow-hidden group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
              <div className="w-full h-[60%] bg-gradient-to-t from-orange-400 to-amber-300 opacity-90 rounded-b-[1.7rem] relative overflow-hidden">
                 <div className="absolute top-0 w-full h-2 bg-yellow-200 rounded-full opacity-80" />
                 <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '8px 8px' }}></div>
              </div>
           </div>
        </div>
      );
    case "alchemy":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden group">
           <div className="absolute w-40 h-40 border border-white/20 rounded-full opacity-50 border-dashed animate-[spin_10s_linear_infinite]" />
           
           <div className="relative z-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <div className="absolute w-12 h-12 bg-white rounded-full translate-x-[-20px] translate-y-[-10px] shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center z-10 hover:z-30 transition-all">
                 <div className="w-6 h-6 rounded bg-teal-400" />
              </div>
              <div className="absolute text-white font-black text-3xl z-40 drop-shadow-md">+</div>
              <div className="absolute w-12 h-12 bg-white rounded-full translate-x-[20px] translate-y-[10px] shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center z-20">
                 <div className="w-6 h-6 rounded-full bg-teal-600" />
              </div>
           </div>
        </div>
      );
    case "life":
      return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-6 group">
           <div className="relative z-20 grid grid-cols-5 grid-rows-5 gap-1.5 transform scale-125 rotate-12 group-hover:scale-[1.4] transition-transform duration-700 flex-shrink-0">
              {Array.from({length: 25}).map((_, i) => {
                 const isAlive = [7,8,11,12,13,17].includes(i);
                 return (
                   <div 
                     key={i} 
                     className={`w-4 h-4 rounded-sm transition-all duration-1000 ${isAlive ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,1)] animate-pulse' : 'bg-cyan-900/50'}`}
                   />
                 )
              })}
           </div>
        </div>
      );
    default:
      return (
        <div className="relative z-10 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 ease-out flex-shrink-0">
          {React.cloneElement(icon as React.ReactElement, { size: 72, strokeWidth: 1.5 })}
        </div>
      );
  }
};

export default function App() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

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
      id: "aim",
      name: "Treino de Mira",
      category: "Reflexos",
      description: "Acerte os alvos o mais rápido possível",
      icon: <Crosshair size={32} />,
      color: "from-blue-600 to-blue-400",
      buttonColor: "bg-blue-500",
      component: AimTrainer,
    },
    {
      id: "reaction",
      name: "Tempo de Reação",
      category: "Reflexos",
      description: "Teste seus reflexos",
      icon: <MousePointer2 size={32} />,
      color: "from-red-600 to-red-400",
      buttonColor: "bg-red-500",
      component: ReactionGame,
    },
    {
      id: "cps",
      name: "Teste de Clicks",
      category: "Velocidade",
      description: "Teste de cliques por segundo",
      icon: <Pointer size={32} />,
      color: "from-indigo-600 to-indigo-400",
      buttonColor: "bg-indigo-500",
      component: CPSTest,
    },
    {
      id: "speed",
      name: "Digitador Veloz",
      category: "Velocidade",
      description: "Teste sua velocidade e precisão ao digitar",
      icon: <Keyboard size={32} />,
      color: "from-violet-600 to-violet-400",
      buttonColor: "bg-violet-500",
      component: SpeedTyper,
    },
    {
      id: "memory",
      name: "Matriz de Memória",
      category: "Cérebro",
      description: "Teste sua memória de trabalho",
      icon: <Brain size={32} />,
      color: "from-purple-600 to-purple-400",
      buttonColor: "bg-purple-500",
      component: MemoryGame,
    },
    {
      id: "colors",
      name: "Gênio das Cores",
      category: "Cérebro",
      description: "Teste de Efeito Stroop - escolha a cor, não a palavra",
      icon: <Palette size={32} />,
      color: "from-rose-600 to-pink-500",
      buttonColor: "bg-rose-500",
      component: ColorGenius,
    },
    {
      id: "math",
      name: "Matemática Rápida",
      category: "Cérebro",
      description: "Resolva expressões matemáticas simples rapidamente",
      icon: <Calculator size={32} />,
      color: "from-cyan-600 to-teal-500",
      buttonColor: "bg-cyan-500",
      component: QuickMath,
    },
    {
      id: "sequence",
      name: "Mestre da Sequência",
      category: "Memória",
      description: "Repita o padrão de luz e som que cresce a cada rodada",
      icon: <LayoutGrid size={32} />,
      color: "from-amber-600 to-yellow-500",
      buttonColor: "bg-amber-500",
      component: SequenceMaster,
    },
    {
      id: "vocab",
      name: "Mestre das Palavras",
      category: "Cérebro",
      description: "Adivinhe o significado de palavras difíceis",
      icon: <BookOpen size={32} />,
      color: "from-amber-600 to-yellow-500",
      buttonColor: "bg-amber-500",
      component: VocabMaster,
    },
    {
      id: "circle",
      name: "Círculo Perfeito",
      category: "Habilidade",
      description: "Desenhe o círculo perfeito",
      icon: <CircleDashed size={32} />,
      color: "from-emerald-600 to-emerald-400",
      buttonColor: "bg-emerald-500",
      component: PerfectCircle,
    },
    {
      id: "tower",
      name: "Empilhador de Torre",
      category: "Precisão",
      description: "Empilhe blocos neon o mais alto possível",
      icon: <Layers size={32} />,
      color: "from-pink-600 to-rose-500",
      buttonColor: "bg-rose-500",
      component: TowerStack,
    },
    {
      id: "synth",
      name: "Synth Pad",
      category: "Música",
      description: "Toque bateria e sintetizadores",
      icon: <Music4 size={32} />,
      color: "from-fuchsia-600 to-pink-500",
      buttonColor: "bg-pink-500",
      component: SynthPad,
    },
    {
      id: "kaleidoscope",
      name: "Caleidoscópio",
      category: "Criativo",
      description: "Desenhe arte de mandala simétrica",
      icon: <Brush size={32} />,
      color: "from-pink-600 to-rose-400",
      buttonColor: "bg-pink-500",
      component: Kaleidoscope,
    },
    {
      id: "theremin",
      name: "Theremin Digital",
      category: "Criativo",
      description: "Toque um sintetizador digital etéreo",
      icon: <RadioReceiver size={32} />,
      color: "from-cyan-600 to-teal-400",
      buttonColor: "bg-cyan-500",
      component: Theremin,
    },
    {
      id: "pixel",
      name: "Pixel Studio",
      category: "Criativo",
      description: "Desenhe pixel art retrô 16x16",
      icon: <SquareDashedBottomCode size={32} />,
      color: "from-slate-700 to-slate-500",
      buttonColor: "bg-slate-600",
      component: PixelStudio,
    },
    {
      id: "sandbox",
      name: "Mundo de Areia",
      category: "Física",
      description: "Simulação física de areia caindo",
      icon: <FlaskConical size={32} />,
      color: "from-orange-600 to-amber-500",
      buttonColor: "bg-orange-500",
      component: SandboxGame,
    },
    {
      id: "alchemy",
      name: "Alquimia Infinita",
      category: "Lógica",
      description: "Combine elementos usando Inteligência Artificial",
      icon: <Beaker size={32} />,
      color: "from-teal-600 to-teal-400",
      buttonColor: "bg-teal-500",
      component: AlchemyGame,
    },
    {
      id: "life",
      name: "Jogo da Vida",
      category: "Simulação",
      description: "Autômato celular de Conway",
      icon: <ChevronsRight size={32} />,
      color: "from-sky-600 to-cyan-400",
      buttonColor: "bg-cyan-500",
      component: GameOfLife,
    },
    {
      id: "particle",
      name: "Fluxo de Partículas",
      category: "Visual",
      description: "Simulação física de partículas atmosféricas",
      icon: <Wind size={32} />,
      color: "from-cyan-900 to-blue-800",
      buttonColor: "bg-cyan-600",
      component: ParticleFlow,
    },
    {
      id: "gravity",
      name: "Órbitas",
      category: "Física",
      description: "Simule gravidade e corpos orbitais",
      icon: <Circle size={32} />,
      color: "from-slate-800 to-slate-900",
      buttonColor: "bg-amber-600",
      component: GravitySandbox,
    },
    {
      id: "speedmatch",
      name: "Combinação Veloz",
      category: "Cérebro",
      description: "Combine formas e cores o mais rápido que puder",
      icon: <Zap size={32} />,
      color: "from-blue-700 to-indigo-600",
      buttonColor: "bg-blue-600",
      component: SpeedMatch,
    },
    {
      id: "spend",
      name: "Gaste o Bilhão",
      category: "Diversão",
      description: "Desafio de gastar 200 bilhões de dólares",
      icon: <DollarSign size={32} />,
      color: "from-emerald-900 to-slate-900",
      buttonColor: "bg-emerald-600",
      component: SpendMoney,
    },
    {
      id: "lifestats",
      name: "Vida em Números",
      category: "Informação",
      description: "Descubra o quanto você já viveu de forma detalhada",
      icon: <Clock size={32} />,
      color: "from-blue-900 to-indigo-950",
      buttonColor: "bg-indigo-600",
      component: LifeStats,
    },
    {
      id: "moral",
      name: "Dilemas Éticos",
      category: "Moral",
      description: "O que você faria para salvar quem ama? Decisões difíceis.",
      icon: <Scale size={32} />,
      color: "from-slate-100 to-slate-200",
      buttonColor: "bg-slate-900",
      component: MoralDilemmas,
    },
  ];

  const ActiveComponent = activeGame
    ? games.find((g) => g.id === activeGame)?.component
    : null;

  return (
    <div className="w-full min-h-screen bg-[#fafaf9] text-slate-900 font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col relative">
      
      {/* Global Animated Background Effect */}
      <div className="fixed inset-0 z-0 bg-[#fafaf9] overflow-hidden pointer-events-none">
        {/* Base grid */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Animated glowing orbs - Colorful and vibrant */}
        <motion.div 
          animate={{ x: [0, 80, -40, 0], y: [0, -80, 60, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-rose-300/20 rounded-full blur-[140px]"
        />
        <motion.div 
          animate={{ x: [0, -100, 50, 0], y: [0, 100, -80, 0], scale: [1, 0.8, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] max-w-[1000px] max-h-[1000px] bg-blue-300/20 rounded-full blur-[160px]"
        />
        <motion.div 
          animate={{ x: [0, 150, -100, 0], y: [0, -50, 100, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-emerald-300/15 rounded-full blur-[180px]"
        />
        <motion.div 
          animate={{ x: [0, -200, 200, 0], y: [0, 200, -200, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-3/4 w-[40vw] h-[40vw] bg-amber-300/15 rounded-full blur-[150px]"
        />
      </div>

      <div className="scanline opacity-[0.02]"></div>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.015] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col relative z-10 w-full"
          >
            {/* Website Navigation */}
            <header className="w-full border-b border-black/[0.03] bg-white/40 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                    <Layers size={18} className="stroke-[2.5]" />
                  </div>
                  <span className="font-display font-black tracking-tight text-xl text-slate-900">Playground</span>
                </div>
                
                <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  <a href="#" className="hover:text-slate-900 transition-colors">Arcade</a>
                  <a href="#" className="hover:text-slate-900 transition-colors">Jogos</a>
                  <a href="#" className="hover:text-slate-900 transition-colors">Sobre</a>
                </nav>
                
                <button
                  onClick={toggleMute}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all font-bold text-xs uppercase tracking-wider shadow-sm"
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span className="hidden sm:inline">{isMuted ? "Sound Off" : "Sound On"}</span>
                </button>
              </div>
            </header>

             <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-32">
              <div className="text-center mb-20 md:mb-32">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.4 }}
                  className="inline-block relative"
                >
                  <div className="absolute inset-0 bg-blue-600 blur-[120px] opacity-20"></div>
                  <h1 className="font-display text-7xl md:text-[130px] font-black leading-[0.8] mb-10 tracking-tighter text-slate-900 drop-shadow-sm">
                    Play.<br />Challenge.
                  </h1>
                </motion.div>
                <div className="flex flex-col items-center gap-8 mt-12 mb-20 md:mb-32">
                  <div className="h-px w-24 bg-blue-500/50"></div>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-base md:text-xl text-slate-500 max-w-lg mx-auto font-medium leading-relaxed"
                  >
                    Uma curadoria de minigames interativos criados para a web. Experimentos de física, agilidade e lógica direto no navegador.
                  </motion.p>
                  
                  <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 py-2 bg-white/[0.03] rounded-full border border-white/[0.05]">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        23 MINI JOGOS
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 py-2 bg-white/[0.03] rounded-full border border-white/[0.05]">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        VERSÃO 2.1
                     </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {games.map((game, i) => (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGameSelect(game.id)}
                    className="group relative flex flex-col p-2.5 bg-white rounded-[28px] overflow-hidden text-left shadow-lg hover:shadow-xl hover:border-slate-200 border border-slate-100 transition-all duration-300"
                  >
                    <div className="relative w-full aspect-square mb-3 rounded-[20px] overflow-hidden relative shadow-inner bg-slate-50 flex items-center justify-center border border-slate-100">
                       <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-700`} />
                       <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                       
                       <GameCoverAsset id={game.id} icon={game.icon} />
                    </div>
                    
                    <div className="flex flex-col flex-1 pb-1 px-1">
                      <div className="flex justify-between items-start mb-1 gap-1">
                        <h2 className="font-display text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase italic truncate">{game.name}</h2>
                      </div>
                      <p className="text-[8px] text-slate-400 line-clamp-1 font-black uppercase tracking-wider leading-none">
                        {game.category}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </main>

            {/* Website Footer */}
            <footer className="w-full border-t border-white/5 bg-slate-950/80 mt-12 py-12 relative z-10 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  
                  {/* Brand & Purpose */}
                  <div className="max-w-sm">
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100 mb-4">
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Layers size={14} className="stroke-[3]" />
                      </div>
                      <span className="font-bold tracking-tight text-white">Playground Web</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      O propósito deste site é servir como um laboratório criativo de minigames para exercitar a memória, a agilidade mental, a coordenação e proporcionar entretenimento rápido.
                    </p>
                  </div>

                  {/* Copyright & Info */}
                  <div className="flex flex-col items-start md:items-end gap-2 text-sm text-slate-500 font-medium">
                    <p>&copy; 2026 Playground Web.</p>
                    <p>Todos os direitos reservados.</p>
                    <p>Data de criação: <span className="text-slate-400">Maio de 2026</span></p>
                  </div>

                </div>
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 z-20 flex flex-col bg-slate-950"
          >
            <div className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center px-4 shrink-0 justify-between sticky top-0 z-50">
              <button
                onClick={() => handleGameSelect(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline font-bold text-sm tracking-wide">BACK</span>
              </button>
              
              <div className="font-bold tracking-widest uppercase text-sm text-slate-300">
                {games.find((g) => g.id === activeGame)?.name}
              </div>
              
              <button
                onClick={toggleMute}
                className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
            <div className="flex-1 relative overflow-hidden bg-slate-950">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
