import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Droplet,
  Wind,
  Mountain,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { audioSystem } from "../lib/audio";
import { PREDEFINED_ELEMENTS, PREDEFINED_RECIPES } from "../lib/alchemyData";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  setDoc, 
  getDoc, 
  doc, 
  collection, 
  getDocs, 
  query, 
  where,
  limit,
  orderBy,
  onSnapshot 
} from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type ElementDef = {
  id: string;
  name: string;
  icon: string | React.ReactNode;
  color: string;
};

const INITIAL_UNLOCKED = ["water", "fire", "earth", "air"];

export function AlchemyGame() {
  const [allElements, setAllElements] = useState<Record<string, ElementDef>>(
    () => {
      const saved = localStorage.getItem("alchemyElements");
      if (saved) return JSON.parse(saved);
      return PREDEFINED_ELEMENTS;
    },
  );

  const [unlocked, setUnlocked] = useState<string[]>(() => {
    const saved = localStorage.getItem("alchemyUnlocked");
    if (saved) return JSON.parse(saved);
    return INITIAL_UNLOCKED;
  });

  const [recipes, setRecipes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("alchemyRecipes");
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [lastDiscovered, setLastDiscovered] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCombining, setIsCombining] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch(console.error);
      }
    });

    // Listen for new elements globally
    const qElements = query(collection(db, "alchemy_elements"), orderBy("name"), limit(100));
    const unsubscribeElements = onSnapshot(qElements, (snapshot) => {
      const newElements: Record<string, ElementDef> = { ...PREDEFINED_ELEMENTS };
      snapshot.forEach(doc => {
        const data = doc.data() as ElementDef;
        newElements[data.id] = data;
      });
      setAllElements(prev => ({ ...prev, ...newElements }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "alchemy_elements"));

    return () => unsubscribeElements();
  }, []);

  useEffect(() => {
    localStorage.setItem("alchemyElements", JSON.stringify(allElements));
    localStorage.setItem("alchemyUnlocked", JSON.stringify(unlocked));
    localStorage.setItem("alchemyRecipes", JSON.stringify(recipes));
  }, [allElements, unlocked, recipes]);

  const generateCombination = async (el1Id: string, el2Id: string) => {
    const el1 = allElements[el1Id].name;
    const el2 = allElements[el2Id].name;

    const prompt = `Você é um mestre alquimista. Combine estes dois elementos para criar um novo elemento, como no jogo Infinite Craft.
Elementos para combinar: "${el1}" e "${el2}"
Seja criativo, engraçado ou lógico. O resultado deve ser em PORTUGUÊS.
Retorne APENAS um objeto JSON válido com os campos:
- name: (uma string curta, título capitalizado)
- icon: (um único emoji representando-o)
- color: (uma classe Tailwind CSS de cor de fundo e cor de texto, ex: "bg-emerald-500 text-white". Garanta que o texto seja legível contra o fundo.)`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-8b",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              icon: { type: Type.STRING },
              color: { type: Type.STRING },
            },
            required: ["name", "icon", "color"],
          },
        },
      });

      const text = response.text?.trim();
      if (!text) return null;
      
      // Clean potential markdown artifacts just in case
      const jsonStr = text.startsWith("```") ? text.replace(/^```json\n?/, "").replace(/\n?```$/, "") : text;
      
      return JSON.parse(jsonStr) as { name: string; icon: string; color: string };
    } catch (err: any) {
      console.error("Erro na Alquimia:", err);
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        throw new Error("QUOTA_EXCEEDED");
      }
      return null;
    }
  };

  const handleSelect = async (id: string) => {
    if (isCombining) return;
    audioSystem.init();
    audioSystem.playPop();
    setErrorMsg(null);
    setLastDiscovered(null);

    const newSelected = [...selected, id];

    if (newSelected.length === 2) {
      setSelected(newSelected);
      setIsCombining(true);

      const recipeKey = [...newSelected].sort().join(",");
      const existingResultId = recipes[recipeKey];

      if (existingResultId) {
        if (!unlocked.includes(existingResultId)) {
          setUnlocked((prev) => [...prev, existingResultId]);
          audioSystem.playSuccess();
        } else {
          audioSystem.playSelect();
        }
        setLastDiscovered(existingResultId);
        setSelected([]);
        setIsCombining(false);
      } else if (PREDEFINED_RECIPES[recipeKey]) {
        // Predefined combination
        const predefinedId = PREDEFINED_RECIPES[recipeKey];
        if (!unlocked.includes(predefinedId)) {
          setUnlocked((prev) => [...prev, predefinedId]);
          audioSystem.playSuccess();
        } else {
          audioSystem.playSelect();
        }
        setLastDiscovered(predefinedId);
        setSelected([]);
        setIsCombining(false);
        // Save to discovered recipes
        setRecipes((prev) => ({ ...prev, [recipeKey]: predefinedId }));
      } else {
        // Check Firebase for global recipe
        try {
          const recipeDoc = await getDoc(doc(db, "alchemy_recipes", recipeKey));
          if (recipeDoc.exists()) {
            const data = recipeDoc.data();
            const resultId = data.resultId;
            
            // Check if we have the element definition
            const elementDoc = await getDoc(doc(db, "alchemy_elements", resultId));
            if (elementDoc.exists()) {
              const elData = elementDoc.data() as ElementDef;
              setAllElements(prev => ({ ...prev, [resultId]: elData }));
              setRecipes(prev => ({ ...prev, [recipeKey]: resultId }));
              
              if (!unlocked.includes(resultId)) {
                setUnlocked((prev) => [...prev, resultId]);
                audioSystem.playSuccess();
              } else {
                audioSystem.playSelect();
              }
              setLastDiscovered(resultId);
              setSelected([]);
              setIsCombining(false);
              return;
            }
          }
        } catch (err) {
          console.error("Firebase recipe check failed", err);
        }

        // Ask Gemini
        try {
          const result = await generateCombination(
            newSelected[0],
            newSelected[1],
          );
          if (result) {
            audioSystem.playSuccess();
            const resultId = result.name.toLowerCase().replace(/\s+/g, "_");

            const newElement: ElementDef = {
              id: resultId,
              name: result.name,
              icon: result.icon,
              color: result.color,
            };

            setAllElements((prev) => ({
              ...prev,
              [resultId]: newElement,
            }));

            setRecipes((prev) => ({
              ...prev,
              [recipeKey]: resultId,
            }));

            if (!unlocked.includes(resultId)) {
              setUnlocked((prev) => [...prev, resultId]);
            }

            setLastDiscovered(resultId);

            // Save to Firebase for everyone
            if (auth.currentUser) {
              try {
                await setDoc(doc(db, "alchemy_elements", resultId), newElement);
                await setDoc(doc(db, "alchemy_recipes", recipeKey), {
                  elements: [...newSelected].sort(),
                  resultId: resultId,
                  discoveredBy: auth.currentUser.uid
                });
              } catch (fErr) {
                console.error("Failed to share element/recipe", fErr);
              }
            }
          } else {
            audioSystem.playError();
            setErrorMsg("O universo não encontrou uma resposta lógica para isso.");
          }
        } catch (err: any) {
          audioSystem.playError();
          if (err.message === "QUOTA_EXCEEDED") {
            setErrorMsg("Limite do Google atingido! Aguarde um minuto para a energia alquímica recarregar.");
          } else {
            setErrorMsg("Ocorreu um erro na fusão dos elementos.");
          }
        }
        setSelected([]);
        setIsCombining(false);
      }
    } else {
      setSelected(newSelected);
    }
  };

  const clearSelection = () => {
    audioSystem.init();
    audioSystem.playPop();
    setSelected([]);
    setErrorMsg(null);
    setLastDiscovered(null);
  };

  const totalPossible = "Infinito";

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-950 text-white">
      {/* Playground Area */}
      <div className="flex-1 p-8 flex flex-col items-center justify-center relative border-r border-slate-800">
        <div className="absolute top-8 left-8 text-slate-400">
          <p className="font-medium text-lg">
            Descobertos:{" "}
            <span className="text-emerald-400">
              {unlocked.length} / {totalPossible}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-center max-w-sm w-full">
          <div className="bg-slate-900 rounded-3xl p-8 w-full border border-slate-800 shadow-2xl relative min-h-[300px] flex flex-col items-center justify-center">
            <AnimatePresence mode="popLayout">
              {selected.length === 0 && !lastDiscovered && !errorMsg && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-slate-500 absolute text-center"
                >
                  Selecione dois elementos
                  <br />
                  do painel
                  <br />
                  para combiná-los.
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-4 h-24">
              <AnimatePresence>
                {selected.map((id, index) => {
                  const el = allElements[id];
                  if (!el) return null;
                  return (
                    <motion.div
                      key={`${id}-${index}`}
                      initial={{ scale: 0, x: -20 }}
                      animate={{ scale: 1, x: 0 }}
                      exit={{ scale: 0 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-lg ${el.color}`}
                    >
                      {el.icon} {el.name}
                    </motion.div>
                  );
                })}
                {isCombining && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-lg bg-indigo-600 text-white"
                  >
                    <Loader2 className="animate-spin" size={18} /> Pensando...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-24 mt-4 flex items-center justify-center">
              <AnimatePresence>
                {lastDiscovered && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                      <CheckCircle2 size={18} /> Sucesso!
                    </div>
                    <div
                      className={`flex items-center gap-3 px-6 py-3 text-lg rounded-full font-bold shadow-xl ${allElements[lastDiscovered].color}`}
                    >
                      {allElements[lastDiscovered].icon}{" "}
                      {allElements[lastDiscovered].name}
                    </div>
                  </motion.div>
                )}
                {errorMsg && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-red-400 font-bold bg-red-400/10 px-6 py-3 rounded-xl border border-red-400/20"
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={clearSelection}
            disabled={selected.length === 0}
            className="mt-8 px-6 py-2 rounded-full font-semibold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
          >
            Limpar Seleção
          </button>
        </div>
      </div>

      {/* Elements Panel */}
      <div className="w-full md:w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-start overflow-y-auto max-h-[50vh] md:max-h-none">
        <h3 className="text-xl font-bold mb-6 text-slate-300">Seus Elementos</h3>
        <div className="flex flex-wrap gap-3">
          {unlocked.map((id) => {
            const el = allElements[id];
            if (!el) return null;
            return (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={id}
                onClick={() => handleSelect(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${el.color}`}
              >
                {el.icon} {el.name}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
