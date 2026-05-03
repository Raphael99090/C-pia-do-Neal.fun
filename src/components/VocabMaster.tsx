import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { RotateCcw, BookOpen, Trophy, Check, X } from "lucide-react";

type GameState = "start" | "playing" | "gameover";

const VOCAB_DATA = [
  { word: "Inexorável", meaning: "Impossível de deter ou de evitar", wrong: ["Que se move muito devagar", "Fácil de ser modificado", "Que demonstra muita emoção"] },
  { word: "Efêmero", meaning: "Que dura apenas um tempo muito curto", wrong: ["Que brilha no escuro", "Extremamente poderoso", "Encontrado em todo lugar"] },
  { word: "Ubíquo", meaning: "Presente ou encontrado em todo lugar ao mesmo tempo", wrong: ["Raro e valioso", "Extremamente perigoso", "Escondido da vista"] },
  { word: "Quixotesco", meaning: "Excessivamente idealista; irrealista", wrong: ["Irritável", "Altamente inteligente", "Rápido"] },
  { word: "Sicomofanta", meaning: "Pessoa que bajula para obter vantagem", wrong: ["Um músico brilhante", "Um tipo de arma antiga", "Alguém que ama a chuva"] },
  { word: "Cacofonia", meaning: "Mistura áspera e dissonante de sons", wrong: ["Uma canção bonita", "Um tipo de sobremesa doce", "Estado de sono profundo"] },
  { word: "Enigma", meaning: "Algo misterioso e difícil de entender", wrong: ["Um grande inseto voador", "Uma verdade clara e óbvia", "Uma condição médica"] },
  { word: "Zênite", meaning: "O ponto mais alto; o auge", wrong: ["O ponto mais baixo possível", "Um tipo de bússola antiga", "Sentimento de profunda tristeza"] },
  { word: "Letárgico", meaning: "Afetado por lentidão e apatia", wrong: ["Cheio de energia", "Altamente contagioso", "Afiado e cortante"] },
  { word: "Eloquente", meaning: "Fluente ou persuasivo ao falar", wrong: ["Desajeitado e estranho", "Quieto e tímido", "Brilhante e colorido"] },
  { word: "Serendipidade", meaning: "Descoberta afortunada feita por acaso", wrong: ["Sentimento profundo de arrependimento", "Um movimento planejado e calculado", "Uma tempestade severa"] },
  { word: "Pragmático", meaning: "Que lida com as coisas de forma prática e realista", wrong: ["Perdido em devaneios", "Que segue regras estritamente", "Facilmente irritável"] },
  { word: "Paradoxo", meaning: "Declaração aparentemente absurda, mas verdadeira", wrong: ["Um padrão padrão", "Uma longa jornada", "Um tipo de forma geométrica"] },
  { word: "Melancolia", meaning: "Sentimento de tristeza profunda e pensativa", wrong: ["Celebração alegre", "Uma fruta suculenta", "Uma dança de ritmo acelerado"] },
  { word: "Esotérico", meaning: "Compreendido por apenas um pequeno grupo", wrong: ["Amplamente conhecido por todos", "Encontrado no oceano", "Relacionado ao espaço sideral"] },
  { word: "Alacridade", meaning: "Prontidão rápida e alegre", wrong: ["Relutância profunda", "Um tipo de mineral", "Extrema pobreza"] },
  { word: "Pernicioso", meaning: "Que causa danos graves, muitas vezes de forma gradual", wrong: ["Útil e gentil", "Barulhento e irritante", "Com sabor doce"] },
  { word: "Ofuscar", meaning: "Tornar obscuro, confuso ou ininteligível", wrong: ["Tornar perfeitamente claro", "Construir uma base sólida", "Voar em grandes altitudes"] },
  { word: "Iconoclasta", meaning: "Pessoa que ataca crenças ou instituições estabelecidas", wrong: ["Um construtor de monumentos", "Um seguidor devoto", "Um colecionador de moedas raras"] },
  { word: "Pedante", meaning: "Excessivamente preocupado com detalhes menores", wrong: ["Descuidado e desleixado", "Inrivelmente generoso", "Fisicamente forte"] },
  { word: "Ostensivo", meaning: "Feito para impressionar ou atrair a atenção", wrong: ["Escondido e secreto", "Muito quieto e tímido", "Sem qualquer cor"] },
  { word: "Melífluo", meaning: "Doce ou musical; agradável de ouvir", wrong: ["Áspero e arranhado", "Com cheiro de flores", "Com gosto muito amargo"] },
  { word: "Inefável", meaning: "Grande demais para ser expresso em palavras", wrong: ["Esquecido facilmente", "Incapaz de ser apagado", "Muito falante"] },
  { word: "Fastidioso", meaning: "Muito atento e preocupado com a precisão", wrong: ["Correndo sem pensar", "Dormindo muito profundamente", "Comendo muito rápido"] },
  { word: "Defenestrar", meaning: "Atirar alguém ou algo pela janela", wrong: ["Construir uma nova cerca", "Plantar um grande jardim", "Trancar todas as portas"] }
];

// Fisher-Yates Shuffle
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function VocabMaster() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const [questionList, setQuestionList] = useState<typeof VOCAB_DATA>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("vocabScore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    audioSystem.init();
    audioSystem.playSelect();
    
    const shuffledQuestions = shuffleArray(VOCAB_DATA);
    setQuestionList(shuffledQuestions);
    setCurrentIdx(0);
    setScore(0);
    setLives(3);
    setSelectedAnswer(null);
    setGameState("playing");
    generateOptions(shuffledQuestions[0]);
  };

  const generateOptions = (question: typeof VOCAB_DATA[0]) => {
    const freshOptions = shuffleArray([question.meaning, ...question.wrong]);
    setOptions(freshOptions);
    setSelectedAnswer(null);
  };

  const handleOptionClick = (option: string) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks
    
    setSelectedAnswer(option);
    audioSystem.init();

    const currentQuestion = questionList[currentIdx];
    const isCorrect = option === currentQuestion.meaning;

    if (isCorrect) {
      audioSystem.playPop();
      setScore(prev => prev + 100);
      
      setTimeout(() => {
        nextQuestion();
      }, 1000);
    } else {
      audioSystem.playError();
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives <= 0) {
        setTimeout(() => {
          gameOver();
        }, 1200);
      } else {
        setTimeout(() => {
          nextQuestion();
        }, 1500);
      }
    }
  };

  const nextQuestion = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questionList.length) {
      // Loop around with re-shuffled array
      const shuffledQuestions = shuffleArray(VOCAB_DATA);
      setQuestionList(shuffledQuestions);
      setCurrentIdx(0);
      generateOptions(shuffledQuestions[0]);
    } else {
      setCurrentIdx(nextIdx);
      generateOptions(questionList[nextIdx]);
    }
  };

  const gameOver = () => {
    setGameState("gameover");
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("vocabScore", score.toString());
      audioSystem.playWin();
    }
  };

  const currentQuestion = questionList[currentIdx];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 select-none lg:flex-row lg:items-start lg:pt-24 lg:justify-center lg:gap-12 overflow-hidden">
      
      {/* Side Score HUD for Desktop */}
      <div className="hidden lg:flex w-64 flex-col gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Score</p>
           <p className="text-5xl font-black text-amber-500">{score}</p>
        </div>
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
             <Trophy size={14} /> Melhor Pontuação
           </p>
           <p className="text-3xl font-bold text-slate-300">{highScore}</p>
        </div>
        
        {/* Lives desktop indicator */}
        <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-3xl mt-auto">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">Vidas</p>
          <div className="flex gap-3">
             {[1, 2, 3].map(i => (
               <div 
                 key={i} 
                 className={`w-4 h-4 rounded-full transition-all duration-300 ${
                   i <= lives 
                     ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                     : 'bg-slate-800'
                 }`} 
               />
             ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl relative flex flex-col items-center">
        
        {/* Mobile HUD */}
        <div className="lg:hidden flex justify-between w-full mb-6 items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Score</span>
            <span className="text-3xl font-black text-amber-500">{score}</span>
          </div>
          <div className="flex gap-2">
             {[1, 2, 3].map(i => (
               <div 
                 key={i} 
                 className={`w-3 h-3 rounded-full transition-all duration-300 ${
                   i <= lives ? 'bg-rose-500' : 'bg-slate-800'
                 }`} 
               />
             ))}
          </div>
        </div>

        {/* Main Game Screen */}
        <div className="w-full aspect-[4/5] sm:aspect-square md:aspect-[4/3] bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col p-6 sm:p-8">
          
          <AnimatePresence>
            {gameState === "start" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
              >
                <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <BookOpen size={40} />
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-xl">Mestre das Palavras</h2>
                <p className="text-slate-400 font-medium mb-12 max-w-sm text-lg">
                  Adivinhe o significado exato de palavras difíceis e sofisticadas.
                </p>
                <button
                  onPointerDown={startGame}
                  className="px-10 py-5 bg-amber-500 text-white font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all outline-none text-xl"
                >
                  COMEÇAR A APRENDER
                </button>
              </motion.div>
            )}

            {gameState === "playing" && currentQuestion && (
              <motion.div
                key={currentQuestion.word}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col w-full h-full"
              >
                 <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-8">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-4">O que isso significa?</p>
                    <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight break-all text-center">
                      “{currentQuestion.word}”
                    </h3>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-auto">
                    {options.map((option, idx) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = option === currentQuestion.meaning;
                      const showResult = selectedAnswer !== null;
                      
                      let btnClass = "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300";
                      let icon = null;
                      
                      if (showResult) {
                        if (isCorrect) {
                           btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                           if (isSelected) icon = <Check size={20} className="text-emerald-400" />;
                        } else if (isSelected) {
                           btnClass = "bg-rose-500/20 border-rose-500/50 text-rose-400";
                           icon = <X size={20} className="text-rose-400" />;
                        } else {
                           btnClass = "bg-slate-900 border-slate-800/30 text-slate-600 opacity-50";
                        }
                      }

                      return (
                        <motion.button
                          key={idx}
                          whileHover={showResult ? {} : { scale: 1.02 }}
                          whileTap={showResult ? {} : { scale: 0.98 }}
                          onPointerDown={() => handleOptionClick(option)}
                          className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left font-medium outline-none transition-all duration-300 flex items-center justify-between gap-4 ${btnClass}`}
                        >
                          <span className="text-sm sm:text-base">{option}</span>
                          {icon}
                        </motion.button>
                      );
                    })}
                 </div>
              </motion.div>
            )}

            {gameState === "gameover" && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center"
              >
                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Vocabulário Esgotado</h2>
                <p className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-8">Pontuação Final</p>
                
                <div className="text-7xl sm:text-8xl font-black text-white mb-12 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                  {score}
                </div>

                <button
                  onPointerDown={startGame}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-wider rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all outline-none text-lg"
                >
                  <RotateCcw size={24} /> Jogar Novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
