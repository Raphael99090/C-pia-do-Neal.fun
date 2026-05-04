/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { SandboxGame } from "./components/SandboxGame";
import { AlchemyGame } from "./components/AlchemyGame";
import { GameOfLife } from "./components/GameOfLife";
import { MemoryGame } from "./components/MemoryGame";
import { TowerStack } from "./components/TowerStack";
import { SynthPad } from "./components/SynthPad";
import { VocabMaster } from "./components/VocabMaster";
import { ColorGenius } from "./components/ColorGenius";
import { QuickMath } from "./components/QuickMath";
import { SequenceMaster } from "./components/SequenceMaster";
import { Kaleidoscope } from "./components/Kaleidoscope";
import { Theremin } from "./components/Theremin";
import { PixelStudio } from "./components/PixelStudio";
import { ParticleFlow } from "./components/ParticleFlow";
import { GravitySandbox } from "./components/GravitySandbox";
import { SpendMoney } from "./components/SpendMoney";
import { LifeStats } from "./components/LifeStats";
import { MoralDilemmas } from "./components/MoralDilemmas";
import { Game2048 } from "./components/Game2048";
import { CellStage } from "./components/CellStage";
import { MiniGamesHub } from "./components/MiniGamesHub";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Beaker,
  Brain,
  ChevronsRight,
  FlaskConical,
  Volume2,
  VolumeX,
  Layers,
  Music4,
  BookOpen,
  Palette,
  Calculator,
  LayoutGrid,
  Brush,
  RadioReceiver,
  SquareDashedBottomCode,
  Wind,
  Circle,
  DollarSign,
  Clock,
  Scale,
  Grid3X3,
  Activity,
  Zap
} from "lucide-react";
import { audioSystem } from "./lib/audio";

const GameCoverAsset = ({ id, icon, color }: { id: string, icon: React.ReactNode, color: string }) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full rounded-2xl overflow-hidden transition-all duration-500 ease-out group-hover:scale-105">
      {/* Background Gradient */ }
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.15] group-hover:opacity-[0.3] transition-all duration-500`} />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
      
      {/* Icon Layer */}
      <div className="relative z-10 transition-transform duration-500 transform group-hover:scale-110 drop-shadow-sm text-slate-800">
        {React.cloneElement(icon as React.ReactElement, { size: 64, strokeWidth: 1.5, className: "group-hover:drop-shadow-xl transition-all duration-300" })}
      </div>
      
      {/* Hover Ring */}
      <div className={`absolute inset-0 border border-current rounded-2xl opacity-0 group-hover:opacity-[0.15] transition-opacity duration-300 ${color.split(' ')[0].replace('from-', 'text-')}`}></div>
    </div>
  );
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
      id: "minihub",
      name: "Desafios Rápidos",
      category: "Reflexos",
      description: "Coleção de testes de agilidade e reflexos",
      icon: <Zap size={32} />,
      color: "from-blue-600 to-indigo-500",
      buttonColor: "bg-blue-500",
      component: MiniGamesHub,
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
    {
      id: "2048",
      name: "2048",
      category: "Lógica",
      description: "Junte os blocos até formar o número 2048",
      icon: <Grid3X3 size={32} />,
      color: "from-orange-500 to-amber-400",
      buttonColor: "bg-orange-500",
      component: Game2048,
    },
    {
      id: "cellstage",
      name: "Evolução Celular",
      category: "Ação",
      description: "Coma os menores, fuja dos maiores. Estágio celular de Spore.",
      icon: <Activity size={32} />,
      color: "from-sky-500 to-blue-400",
      buttonColor: "bg-sky-500",
      component: CellStage,
    },
  ];

  const ActiveComponent = activeGame
    ? games.find((g) => g.id === activeGame)?.component
    : null;

  return (
    <div className="w-full min-h-screen bg-[#fafaf9] text-slate-900 font-sans flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Colorful Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <motion.div 
          animate={{ rotate: 360, x: [0, 80, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-br from-indigo-300/30 to-purple-400/30 blur-[120px]"
        />
        <motion.div 
          animate={{ rotate: -360, x: [0, -60, 0], y: [0, -80, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-cyan-300/30 to-emerald-400/30 blur-[150px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-gradient-to-t from-rose-300/20 to-orange-400/20 blur-[100px]"
        />
      </div>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col relative w-full"
          >
            {/* Minimalist Header */}
            <header className="w-full py-6 px-4 md:px-8 flex items-center justify-between">
              <div className="font-bold text-2xl tracking-tighter cursor-pointer transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-pink-500 hover:via-red-500 hover:to-yellow-500 hover:-rotate-1 hover:scale-105 inline-block origin-left">
                Playground.fun
              </div>
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Toggle Sound"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </header>

             <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pb-32">
              <div className="text-center mt-16 mb-16">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                  className="inline-block relative"
                >
                  <h1 className="font-bold text-6xl md:text-[90px] leading-[0.9] tracking-tighter text-slate-900 drop-shadow-sm">
                    Play.<br />Challenge.
                  </h1>
                </motion.div>
                <div className="flex flex-col items-center gap-6 mt-8">
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base md:text-lg text-slate-600 max-w-lg mx-auto font-medium leading-relaxed"
                  >
                    Uma curadoria de minigames interativos criados para a web. Experimentos de física, agilidade e lógica direto no navegador.
                  </motion.p>
                  
                  <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        20+ EXPERIMENTOS
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        VERSÃO 2.2
                     </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
                {games.map((game, i) => (
                  <motion.button
                    key={`${game.id}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleGameSelect(game.id)}
                    className="neal-card group relative flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="w-full aspect-square mb-4 flex items-center justify-center relative">
                       <GameCoverAsset id={game.id} icon={game.icon} color={game.color} />
                    </div>
                    <h2 className="font-semibold text-[15px] leading-tight tracking-tight text-slate-800 break-words w-full group-hover:text-black transition-colors relative z-20">
                      {game.name}
                    </h2>
                  </motion.button>
                ))}
              </div>
            </main>

            {/* Simple Footer */}
            <footer className="w-full py-8 text-center text-sm text-slate-500">
              <p>Playground Web &copy; 2026</p>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex flex-col bg-white"
          >
            <div className="h-12 border-b border-[#eaeaea] bg-white flex items-center px-4 shrink-0 justify-between sticky top-0 z-50">
              <button
                onClick={() => handleGameSelect(null)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline font-semibold text-[13px] uppercase tracking-wide">Voltar</span>
              </button>
              
              <div className="font-bold text-[13px] uppercase tracking-widest text-black">
                {games.find((g) => g.id === activeGame)?.name}
              </div>
              
              <button
                onClick={toggleMute}
                className="p-2 text-slate-500 hover:text-black transition-colors"
                aria-label="Toggle Sound"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
            <div className="flex-1 relative overflow-hidden bg-[#fafafa]">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
