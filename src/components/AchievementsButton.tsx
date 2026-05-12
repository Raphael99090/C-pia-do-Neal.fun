import React, { useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAchievements } from '../lib/achievements';

export const AchievementsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unlockedIds, achievements } = useAchievements();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 md:top-8 md:right-8 z-[90] w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-white to-stone-100 rounded-full border-[2px] md:border-[3px] border-[#00d2ff] shadow flex items-center justify-center hover:scale-105 transition-transform outline-none focus-visible:ring-4 focus-visible:ring-sky-400 group"
      >
        <Trophy size={20} className="text-stone-300 md:w-7 md:h-7 group-hover:text-[#00d2ff] transition-colors" fill="currentColor" />
        {unlockedIds.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white">
            {unlockedIds.length}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[95]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border-[3px] border-stone-200 rounded-3xl shadow-xl z-[100] flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-100 rounded-full text-sky-500 shadow-inner">
                    <Trophy size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-stone-700 tracking-tight uppercase">Conquistas</h2>
                    <p className="text-xs text-stone-500 font-bold tracking-widest mt-1 uppercase">
                      {unlockedIds.length} / {achievements.length} Desbloqueadas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-full transition-colors border-2 border-transparent hover:border-stone-300"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#fcfcfc]">
                <div className="grid gap-3">
                  {achievements.map((achievement) => {
                    const isUnlocked = unlockedIds.includes(achievement.id);
                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-colors ${
                          isUnlocked 
                            ? 'bg-white border-sky-200 shadow-sm' 
                            : 'bg-stone-50 border-stone-200 opacity-60 grayscale'
                        }`}
                      >
                        <div className="text-3xl drop-shadow-sm flex-shrink-0 bg-stone-100 w-12 h-12 flex items-center justify-center rounded-full">
                          {isUnlocked ? achievement.icon : '🔒'}
                        </div>
                        <div>
                          <h3 className={`font-bold uppercase text-sm ${isUnlocked ? 'text-stone-700' : 'text-stone-500'}`}>
                            {achievement.title}
                          </h3>
                          <p className={`text-xs mt-1 font-medium leading-relaxed ${isUnlocked ? 'text-stone-600' : 'text-stone-400'}`}>
                            {isUnlocked ? achievement.description : '???'}
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
    </>
  );
};
