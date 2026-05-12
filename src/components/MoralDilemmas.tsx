import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Scale, ShieldAlert, Sparkles, Send, Bot, Check, CheckCheck } from "lucide-react";
import { audioSystem } from "../lib/audio";
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  addDoc,
  collection, 
  query, 
  limit,
  orderBy,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { PREDEFINED_DILEMMAS } from "../lib/dilemmaData";

interface Dilemma {
  id: number;
  title: string;
  description: string;
  optionA: {
    text: string;
    consequence: string;
    impact: string;
  };
  optionB: {
    text: string;
    consequence: string;
    impact: string;
  };
}

export function MoralDilemmas() {
  const [dilemmas, setDilemmas] = useState<Dilemma[]>(() => {
    const shuffled = [...PREDEFINED_DILEMMAS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ dilemmaId: number, choice: 'A' | 'B' }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState({ empathy: 0, justice: 0, utility: 0 });
  const [queue, setQueue] = useState<Dilemma[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }, [currentIndex, history.length, isGenerating]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch(() => { /* ignore auth error if not enabled */ });
      }
    });

    const q = query(collection(db, "moral_dilemmas"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Dilemma[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        fetched.push({ ...data, id: doc.id } as any);
      });
      if (fetched.length > 0) {
        setDilemmas(prev => {
          const existingIds = new Set(prev.map(d => String(d.id)));
          const uniqueNew = fetched.filter(f => !existingIds.has(String(f.id)));
          if (uniqueNew.length === 0) return prev;
          return [...prev, ...uniqueNew];
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const prefetchDilemma = async (titles: string[]) => {
    if (isGenerating || queue.length >= 2) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/dilemmas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Gere um novo dilema moral único e difícil em português.\nEvite estes temas: ${titles.slice(-10).join(", ")}.\nO dilema deve ter uma decisão impossível entre duas escolhas difíceis. Retorne um JSON como especificado no schema do código.`
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const newDilemma = { ...data, id: Date.now() + Math.random() };
      setQueue(prev => [...prev, newDilemma]);

      if (auth.currentUser) {
        try {
          await addDoc(collection(db, "moral_dilemmas"), {
            ...data,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid
          });
        } catch (fErr) {
          console.error("Failed to share dilemma", fErr);
        }
      }
    } catch (err: any) {
      console.error("AI Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (dilemmas.length - currentIndex <= 3 && queue.length < 2) {
      prefetchDilemma(dilemmas.map(d => d.title));
    }
  }, [currentIndex, dilemmas.length, queue.length]);

  const handleChoice = (choice: 'A' | 'B') => {
    audioSystem.playClick();
    const current = dilemmas[currentIndex];
    setHistory(prev => [...prev, { dilemmaId: current.id, choice }]);

    const choiceData = choice === 'A' ? current.optionA : current.optionB;
    const impact = choiceData.impact.toLowerCase();
    const allText = (choiceData.text + " " + choiceData.consequence + " " + impact).toLowerCase();

    setScore(prev => ({
      ...prev,
      empathy: prev.empathy + (impact.includes("empatia") || impact.includes("compaixão") || impact.includes("social") ? 1 : 0),
      justice: prev.justice + (impact.includes("justiça") || impact.includes("ética") || impact.includes("dever") || impact.includes("integridade") ? 1 : 0),
      utility: prev.utility + (impact.includes("utilitaris") || impact.includes("pragmati") || impact.includes("sobrevivência") ? 1 : 0)
    }));

    // Check achievement: "O Peso da Agulha"
    if (allText.includes('sacrificar') || allText.includes('matar') || allText.includes('morte') || allText.includes('deixar morrer')) {
       let consecutive = parseInt(localStorage.getItem('needle-count') || '0', 10) + 1;
       localStorage.setItem('needle-count', consecutive.toString());
       if (consecutive >= 5) {
         import("../lib/achievements").then(m => m.unlockAchievement('needle'));
       }
    } else {
       localStorage.setItem('needle-count', '0');
    }

    if (currentIndex + 1 < dilemmas.length) {
      setCurrentIndex(prev => prev + 1);
    } else if (queue.length > 0) {
      const nextDilemma = queue[0];
      setDilemmas(prev => [...prev, nextDilemma]);
      setQueue(prev => prev.slice(1));
      setCurrentIndex(prev => prev + 1);
    } else {
        setIsGenerating(true);
    }
  };

  const renderPastTurns = () => {
    const turns = [];
    for (let i = 0; i < currentIndex; i++) {
        const d = dilemmas[i];
        const h = history[i];
        if (!h) continue;
        
        // Bot Message
        turns.push(
            <div key={`bot-${i}`} className="flex flex-col gap-1 items-start max-w-[90%] md:max-w-[80%] self-start mt-6">
               <div className="flex items-center gap-2 mb-1 pl-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Arbítrio_IA</span>
               </div>
               <div className="bg-[#141417]/80 backdrop-blur-md px-5 py-5 rounded-r-2xl rounded-bl-2xl shadow-lg border border-white/10 border-l-2 border-l-indigo-500 relative flex flex-col gap-3">
                   <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase flex items-center gap-2">
                       <ShieldAlert size={12} className={h.choice === 'A' ? "text-rose-500" : "text-blue-500"}/> Dilema #{d.id} // {d.title}
                   </span>
                   <p className="text-[14px] leading-relaxed text-[#E4E4E5] font-sans opacity-80">{d.description}</p>
                   <span className="text-[9px] text-[#A1A1AA] self-end mt-1 flex items-center gap-1">PROCESSADO <CheckCheck size={10} className="text-indigo-500"/></span>
               </div>
            </div>
        );

        // User Message
        const choiceData = h.choice === 'A' ? d.optionA : d.optionB;
        turns.push(
            <div key={`user-${i}`} className="flex flex-col gap-1 items-end max-w-[90%] md:max-w-[80%] self-end mt-4">
               <div className="flex items-center gap-2 mb-1 pr-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Usuário_</span>
               </div>
               <div className="bg-emerald-950/30 border border-emerald-500/20 px-5 py-4 rounded-l-2xl rounded-br-2xl shadow-lg flex flex-col gap-2 relative">
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      [{h.choice === 'A' ? 'OPÇÃO A' : 'OPÇÃO B'}]
                   </span>
                   <p className="text-[14px] font-medium leading-snug text-white font-sans">{choiceData.text}</p>
                   <span className="text-[11px] text-[#A1A1AA] font-medium leading-tight mt-1 opacity-90 border-l border-white/20 pl-2">
                       // CONSEQUÊNCIA: {choiceData.consequence}
                   </span>
                   <span className="text-[9px] text-emerald-500 self-end mt-1 flex items-center gap-1 cursor-default">
                       REGISTRADO <Check size={10}/>
                   </span>
               </div>
            </div>
        );
    }
    return turns;
  };

  const currentDilemma = dilemmas[currentIndex];

  return (
    <div className="w-full h-full flex flex-col bg-[#070708] overflow-hidden relative font-mono selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dark Hacker/Tech Header */}
      <header className="h-16 shrink-0 bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-20 shadow-[-0_4px_30px_rgba(0,0,0,0.5)] relative">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Bot size={20} className="text-indigo-400" />
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(52,211,153,1)]"></div>
              </div>
              <div className="flex flex-col">
                  <h2 className="text-[14px] font-bold text-white tracking-widest uppercase">Arbítrio<span className="text-indigo-500">_IA</span></h2>
                  <span className="text-[10px] text-emerald-400 font-medium tracking-widest">SYS.ONLINE</span>
              </div>
          </div>
          
          <div className="flex items-center gap-4 border border-white/10 bg-white/5 rounded-full px-4 py-1.5">
              <div className="flex gap-2 items-center">
                  <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest">Empatia</span>
                  <span className="text-[11px] font-black text-rose-400">{score.empathy}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div className="flex gap-2 items-center">
                  <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest">Justiça</span>
                  <span className="text-[11px] font-black text-blue-400">{score.justice}</span>
              </div>
              <div className="w-px h-3 bg-white/20"></div>
              <div className="flex gap-2 items-center">
                  <span className="text-[9px] text-[#A1A1AA] uppercase tracking-widest">Cálculo</span>
                  <span className="text-[11px] font-black text-amber-400">{score.utility}</span>
              </div>
          </div>
      </header>

      {/* Background Dynamic Detail */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-grain mix-blend-overlay opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-indigo-900/10 blur-[150px]" />
      </div>

      {/* Chat Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 flex flex-col z-10 w-full custom-scrollbar scroll-smooth pb-4">
          <div className="w-full max-w-3xl mx-auto flex flex-col">
              <div className="text-center mb-8">
                  <span className="inline-block bg-white/5 border border-white/10 text-[#A1A1AA] text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest">
                      [ INÍCIO DE SESSÃO_ ]
                  </span>
              </div>

              <AnimatePresence initial={false}>
                  {renderPastTurns()}
                  
                  {/* Current Dilemma Bot Message */}
                  {currentDilemma && !isGenerating && (
                    <motion.div 
                        key={`dilemma-current`}
                        initial={{ opacity: 0, y: 10, scale: 0.95, originX: 0 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex flex-col gap-1 items-start max-w-[90%] md:max-w-[80%] self-start mt-6"
                    >
                        <div className="flex items-center gap-2 mb-1 pl-1">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Arbítrio_IA</span>
                            <span className="text-[10px] text-white/30">v2.4</span>
                         </div>
                         <div className="bg-[#141417]/80 backdrop-blur-md px-5 py-5 rounded-r-2xl rounded-bl-2xl shadow-lg border border-white/10 border-l-2 border-l-indigo-500 relative flex flex-col gap-3">
                             <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase flex items-center gap-2">
                                <ShieldAlert size={12} className="text-rose-500"/> Dilema #{currentDilemma.id} // {currentDilemma.title}
                             </span>
                             <p className="text-[14px] leading-relaxed text-[#E4E4E5] font-sans">{currentDilemma.description}</p>
                         </div>
                    </motion.div>
                  )}

                  {/* Typing Indicator */}
                  {isGenerating && (
                      <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="flex flex-col gap-1 items-start self-start mt-6"
                      >
                          <div className="bg-[#141417]/80 backdrop-blur-md px-4 py-3 rounded-r-2xl rounded-bl-2xl shadow-lg border border-white/10 border-l-2 border-l-indigo-500 flex items-center gap-1.5 h-10">
                              <span className="block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                              <span className="block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                              <span className="block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      </div>

      {/* Input Area (Quick Replies) */}
      <div className="relative w-full shrink-0 bg-[#0C0C0E]/80 backdrop-blur-xl border-t border-white/10 p-4 pb-6 z-20">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4">
              {currentDilemma && !isGenerating ? (
                  <>
                      {/* Option A */}
                      <button 
                          onClick={() => handleChoice('A')}
                          className="flex-1 bg-[#141417] hover:bg-[#1A1A1E] border border-white/10 hover:border-rose-500/50 shadow-md p-4 text-left transition-all active:scale-[0.98] flex flex-col gap-1.5 relative overflow-hidden group rounded-xl"
                      >
                          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50 group-hover:bg-rose-500 transition-colors"></div>
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-3 flex items-center gap-2">
                              [ OPÇÃO A ]
                          </span>
                          <span className="text-[13px] font-bold text-white pl-3 leading-tight font-sans">{currentDilemma.optionA.text}</span>
                          <span className="text-[11px] text-[#A1A1AA] pl-3 line-clamp-2 mt-1">{currentDilemma.optionA.consequence}</span>
                      </button>

                      {/* Option B */}
                      <button 
                          onClick={() => handleChoice('B')}
                          className="flex-1 bg-[#141417] hover:bg-[#1A1A1E] border border-white/10 hover:border-blue-500/50 shadow-md p-4 text-left transition-all active:scale-[0.98] flex flex-col gap-1.5 relative overflow-hidden group rounded-xl"
                      >
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors"></div>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-3 flex items-center gap-2">
                              [ OPÇÃO B ]
                          </span>
                          <span className="text-[13px] font-bold text-white pl-3 leading-tight font-sans">{currentDilemma.optionB.text}</span>
                          <span className="text-[11px] text-[#A1A1AA] pl-3 line-clamp-2 mt-1">{currentDilemma.optionB.consequence}</span>
                      </button>
                  </>
              ) : (
                  <div className="w-full flex justify-center py-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-3">
                          <Bot size={14} className="animate-pulse"/> CALCULANDO VARIÁVEIS MORAIS...
                      </span>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}


