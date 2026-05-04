import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Heart, Scale, Users, ShieldAlert, Zap, Loader2, Sparkles } from "lucide-react";
import { audioSystem } from "../lib/audio";
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  addDoc,
  setDoc, 
  getDoc, 
  doc, 
  collection, 
  getDocs, 
  query, 
  where,
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
    return [...PREDEFINED_DILEMMAS].sort(() => Math.random() - 0.5);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ dilemmaId: number, choice: 'A' | 'B' }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState({ empathy: 0, justice: 0, utility: 0 });
  const [queue, setQueue] = useState<Dilemma[]>([]);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch(console.error);
      }
    });

    // Listen for new dilemmas globally
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
          // Randomly insert the fetched items at the end to keep the initial predefined mix
          return [...prev, ...uniqueNew];
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Pre-fetch a dilemma into the queue
  const prefetchDilemma = async (titles: string[]) => {
    if (isGenerating || queue.length >= 2) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-8b",
        contents: `Gere um novo dilema moral único e difícil em português. 
        Evite estes temas: ${titles.slice(-10).join(", ")}.
        O dilema deve ter uma decisão impossível entre duas escolhas difíceis.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              optionA: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  consequence: { type: Type.STRING },
                  impact: { type: Type.STRING }
                },
                required: ["text", "consequence", "impact"]
              },
              optionB: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  consequence: { type: Type.STRING },
                  impact: { type: Type.STRING }
                },
                required: ["text", "consequence", "impact"]
              }
            },
            required: ["title", "description", "optionA", "optionB"]
          }
        }
      });

      const data = JSON.parse(response.text.trim());
      const newDilemma = { ...data, id: Date.now() + Math.random() };
      setQueue(prev => [...prev, newDilemma]);

      // Share to Firebase
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
      if (err.message?.includes("429") || err.message?.includes("quota")) {
         // Show a subtle toast or message if needed
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Only prefetch if we're near the end of our dilemmas array AND queue is empty
    if (dilemmas.length - currentIndex <= 3 && queue.length < 2) {
      prefetchDilemma(dilemmas.map(d => d.title));
    }
  }, [currentIndex, dilemmas.length, queue.length]);

  const handleChoice = (choice: 'A' | 'B') => {
    audioSystem.playClick();
    const current = dilemmas[currentIndex];
    setHistory(prev => [...prev, { dilemmaId: current.id, choice }]);

    const impact = (choice === 'A' ? current.optionA.impact : current.optionB.impact).toLowerCase();
    setScore(prev => ({
      ...prev,
      empathy: prev.empathy + (impact.includes("empatia") || impact.includes("compaixão") || impact.includes("social") ? 1 : 0),
      justice: prev.justice + (impact.includes("justiça") || impact.includes("ética") || impact.includes("dever") || impact.includes("integridade") ? 1 : 0),
      utility: prev.utility + (impact.includes("utilitaris") || impact.includes("pragmati") || impact.includes("sobrevivência") ? 1 : 0)
    }));

    if (currentIndex + 1 < dilemmas.length) {
      setCurrentIndex(prev => prev + 1);
    } else if (queue.length > 0) {
      const nextDilemma = queue[0];
      setDilemmas(prev => [...prev, nextDilemma]);
      setQueue(prev => prev.slice(1));
      setCurrentIndex(prev => prev + 1);
    } else {
        // Fallback if queue is empty
        setIsGenerating(true);
    }
  };

  const dilemma = dilemmas[currentIndex];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50 via-white to-blue-50 overflow-hidden relative">
      {/* Dynamic colorful blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-20 -left-20 w-80 h-80 bg-rose-300 rounded-full blur-[80px]" 
         />
         <motion.div 
            animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-300 rounded-full blur-[100px]" 
         />
      </div>

      <AnimatePresence mode="wait">
        {isGenerating && dilemmas.length <= currentIndex ? (
            <motion.div 
               key="generating"
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 1.1, opacity: 0 }}
               className="flex flex-col items-center gap-4 relative z-20"
            >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-rose-500">
                    <Loader2 size={32} className="text-rose-500 animate-spin" />
                </div>
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-black text-slate-800 italic uppercase">Pensando...</h3>
                </div>
            </motion.div>
        ) : (
            <motion.div 
                key={currentIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="w-full max-w-4xl flex flex-col items-stretch relative z-10 gap-6"
            >
                {/* Main Card - Compact */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[40px] shadow-xl p-8 border-2 border-white flex flex-col items-start overflow-hidden relative">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md">
                            <Scale size={20} />
                        </div>
                        <div className="px-3 py-1 bg-slate-100 rounded-full text-[8px] font-black uppercase text-slate-500 tracking-widest">Dilema #{dilemma.id}</div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-900 mb-4 italic uppercase tracking-tighter leading-none">{dilemma.title}</h2>
                    <p className="text-lg text-slate-700 leading-relaxed font-semibold mb-6">{dilemma.description}</p>
                </div>

                {/* Options - More compact buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isGenerating && dilemmas.length <= currentIndex}
                        onClick={() => handleChoice('A')}
                        className="bg-white hover:bg-rose-500 group rounded-[32px] p-6 border-2 border-white shadow-lg transition-all text-left flex flex-col justify-center relative overflow-hidden"
                    >
                        <div className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 group-hover:text-white transition-colors">Opção A</div>
                        <div className="text-xl font-black text-slate-900 mb-2 group-hover:text-white transition-colors tracking-tight italic uppercase">{dilemma.optionA.text}</div>
                        <div className="text-xs text-slate-500 group-hover:text-rose-50 transition-colors leading-relaxed font-bold">{dilemma.optionA.consequence}</div>
                    </motion.button>

                    <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isGenerating && dilemmas.length <= currentIndex}
                        onClick={() => handleChoice('B')}
                        className="bg-white hover:bg-blue-600 group rounded-[32px] p-6 border-2 border-white shadow-lg transition-all text-left flex flex-col justify-center relative overflow-hidden"
                    >
                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 group-hover:text-white transition-colors">Opção B</div>
                        <div className="text-xl font-black text-slate-900 mb-2 group-hover:text-white transition-colors tracking-tight italic uppercase">{dilemma.optionB.text}</div>
                        <div className="text-xs text-slate-500 group-hover:text-blue-50 transition-colors leading-relaxed font-bold">{dilemma.optionB.consequence}</div>
                    </motion.button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Progress Footer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
         <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-white shadow-lg flex items-center gap-6">
            <div className="flex flex-col items-center">
                <div className="text-[8px] font-black text-slate-400 uppercase">Empatia</div>
                <div className="text-xs font-black text-rose-500">{score.empathy}</div>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex flex-col items-center">
                <div className="text-[8px] font-black text-slate-400 uppercase">Justiça</div>
                <div className="text-xs font-black text-blue-500">{score.justice}</div>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex flex-col items-center">
                <div className="text-[8px] font-black text-slate-400 uppercase">Utilidade</div>
                <div className="text-xs font-black text-amber-500">{score.utility}</div>
            </div>
         </div>
      </div>
    </div>
  );
}

