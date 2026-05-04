import React, { useState } from 'react';
import { CPSTest } from './CPSTest';
import { ReactionGame } from './ReactionGame';
import { AimTrainer } from './AimTrainer';
import { SpeedMatch } from './SpeedMatch';
import { SpeedTyper } from './SpeedTyper';
import { PerfectCircle } from './PerfectCircle';
import { MousePointer2, Pointer, Crosshair, Zap, Keyboard, CircleDashed, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSystem } from '../lib/audio';

const miniGames = [
  { id: 'reaction', name: 'Tempo de Reação', desc: 'Teste seus reflexos', icon: <MousePointer2 size={32} />, component: ReactionGame, color: 'bg-red-500', shadow: 'shadow-red-500/20' },
  { id: 'cps', name: 'Teste de Clicks', desc: 'Cliques por segundo', icon: <Pointer size={32} />, component: CPSTest, color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
  { id: 'aim', name: 'Treino de Mira', desc: 'Acerte os alvos', icon: <Crosshair size={32} />, component: AimTrainer, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
  { id: 'speedmatch', name: 'Combinação Veloz', desc: 'Combine rápido', icon: <Zap size={32} />, component: SpeedMatch, color: 'bg-blue-600', shadow: 'shadow-blue-600/20' },
  { id: 'speed', name: 'Digitador Veloz', desc: 'Velocidade ao digitar', icon: <Keyboard size={32} />, component: SpeedTyper, color: 'bg-violet-500', shadow: 'shadow-violet-500/20' },
  { id: 'circle', name: 'Círculo Perfeito', desc: 'Desenhe um círculo', icon: <CircleDashed size={32} />, component: PerfectCircle, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
];

export function MiniGamesHub() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleSelect = (id: string | null) => {
    audioSystem.playSelect();
    setActiveGame(id);
  };

  const ActiveComponent = activeGame ? miniGames.find(g => g.id === activeGame)?.component : null;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="hub-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full p-4 md:p-8 flex items-center justify-center overflow-y-auto"
          >
            <div className="max-w-4xl w-full">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase italic drop-shadow-sm mb-4">
                  Desafios Rápidos
                </h2>
                <p className="text-slate-500 font-medium text-lg">
                  Pequenos jogos para testar seus reflexos, mira e velocidade.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {miniGames.map((game, i) => (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(game.id)}
                    className="flex flex-col items-center p-8 bg-white border-2 border-slate-100 rounded-[32px] shadow-lg hover:shadow-xl hover:border-slate-200 transition-all text-center group relative overflow-hidden"
                  >
                    <div className={`absolute top-0 inset-x-0 h-1.5 ${game.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl ${game.color} ${game.shadow} transform group-hover:rotate-6 transition-transform duration-300`}>
                      {game.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{game.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{game.desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full relative"
          >
            <div className="absolute top-4 left-4 z-50">
              <button
                onClick={() => handleSelect(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full shadow-lg transition-colors font-bold text-sm tracking-wider uppercase"
              >
                <ArrowLeft size={16} />
                Menu
              </button>
            </div>
            {ActiveComponent && <ActiveComponent />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
