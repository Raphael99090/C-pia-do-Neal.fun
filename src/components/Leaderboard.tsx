import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  setDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Trophy, Medal, User, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  updatedAt: any;
}

interface LeaderboardProps {
  gameId: string;
  gameName: string;
  currentScore?: number;
  onClose?: () => void;
  unit?: string;
  highScoreFirst?: boolean; // true for high scores, false for low scores (time)
}

export function Leaderboard({ gameId, gameName, currentScore, onClose, unit = '', highScoreFirst = true }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const scoresRef = collection(db, 'leaderboards', gameId, 'scores');
    const q = query(
      scoresRef, 
      orderBy('score', highScoreFirst ? 'desc' : 'asc'), 
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
      setEntries(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, highScoreFirst]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !username.trim() || currentScore === undefined) return;

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'leaderboards', gameId, 'scores', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        username: username.trim(),
        score: currentScore,
        gameId,
        updatedAt: serverTimestamp()
      });
      setHasSubmitted(true);
    } catch (error) {
      console.error("Error submitting score:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-400" size={20} />;
    if (index === 1) return <Medal className="text-slate-300" size={20} />;
    if (index === 2) return <Medal className="text-amber-600" size={20} />;
    return <span className="text-slate-500 font-bold text-sm w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="flex flex-col w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Rank Global</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{gameName}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <Loader2 className="animate-spin text-slate-800" size={20} />
          </button>
        )}
      </div>

      <div className="p-6">
        {currentScore !== undefined && !hasSubmitted && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-indigo-600 rounded-2xl shadow-lg relative overflow-hidden"
          >
            <div className="relative z-10">
              <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px] mb-1">Seu Score Atual</p>
              <h4 className="text-3xl font-black text-white mb-4 italic">
                {currentScore.toLocaleString()} {unit}
              </h4>
              
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Seu nome"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={16}
                  className="flex-1 bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/50 outline-none focus:bg-white/30 transition-all font-bold"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-white text-indigo-600 px-4 rounded-xl font-bold flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </form>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </motion.div>
        )}

        <div className="space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm font-bold uppercase tracking-widest">Carregando Rank...</p>
            </div>
          ) : entries.length > 0 ? (
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div 
                  key={entry.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    auth.currentUser?.uid === entry.userId 
                    ? 'bg-indigo-500/10 border-indigo-500/50' 
                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(i)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{entry.username}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                        {entry.updatedAt?.toDate ? new Date(entry.updatedAt.toDate()).toLocaleDateString() : 'Agora'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black italic ${i < 3 ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1 font-bold">{unit}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 text-slate-600">
              <User className="mx-auto mb-3 opacity-20" size={48} />
              <p className="text-sm font-bold uppercase tracking-widest">Nenhum score ainda</p>
              <p className="text-xs">Seja o primeiro a rankear!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
