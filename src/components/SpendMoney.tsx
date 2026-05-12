import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DollarSign, ShoppingCart, RefreshCw, Trophy, Timer } from "lucide-react";
import { audioSystem } from "../lib/audio";
import { Leaderboard } from "./Leaderboard";
import { unlockAchievement } from "../lib/achievements";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

const PRODUCTS: Product[] = [
  { id: 'candy', name: 'Bala', price: 0.5, image: '🍬' },
  { id: 'water', name: 'Garrafa D\'água', price: 2, image: '🥤' },
  { id: 'soda', name: 'Refrigerante', price: 4, image: '🥫' },
  { id: 'burger', name: 'Hambúrguer', price: 35, image: '🍔' },
  { id: 'coffee', name: 'Café Premium', price: 15, image: '☕' },
  { id: 'book', name: 'Livro', price: 50, image: '📕' },
  { id: 'game', name: 'Jogo Triple-A', price: 350, image: '🎮' },
  { id: 'concert', name: 'Show (VIP)', price: 1500, image: '🎟️' },
  { id: 'shoes', name: 'Tênis de Grife', price: 5000, image: '👟' },
  { id: 'phone', name: 'Smartphone Pro Max', price: 10000, image: '📱' },
  { id: 'pc', name: 'PC Gamer High-End', price: 25000, image: '🖥️' },
  { id: 'designer', name: 'Vestimenta de Grife', price: 45000, image: '👔' },
  { id: 'watch', name: 'Relógio Suíço', price: 150000, image: '⌚' },
  { id: 'car', name: 'Carro Popular', price: 80000, image: '🚘' },
  { id: 'sportscar', name: 'Carro Esportivo', price: 850000, image: '🏎️' },
  { id: 'apartamento', name: 'Cobertura em SP', price: 15000000, image: '🏙️' },
  { id: 'house', name: 'Mansão em LA', price: 45000000, image: '🏡' },
  { id: 'yacht', name: 'Iate de Luxo', price: 100000000, image: '🛥️' },
  { id: 'jet', name: 'Jatinho Particular', price: 250000000, image: '🛩️' },
  { id: 'tank', name: 'Tanque de Guerra', price: 50000000, image: '🚜' },
  { id: 'island', name: 'Ilha Tropical', price: 750000000, image: '🏝️' },
  { id: 'skyscraper', name: 'Arranha-Céu', price: 850000000, image: '🏢' },
  { id: 'stadium', name: 'Estádio', price: 1500000000, image: '🏟️' },
  { id: 'monalisa', name: 'A Mona Lisa', price: 3000000000, image: '🖼️' },
  { id: 'nba', name: 'Time da NBA', price: 3500000000, image: '🏀' },
  { id: 'nfl', name: 'Time da NFL', price: 6000000000, image: '🏈' },
  { id: 'f1', name: 'Equipe de Fórmula 1', price: 1500000000, image: '🏎️' },
  { id: 'superyacht', name: 'Super Iate / Sub', price: 5000000000, image: '🛳️' },
  { id: 'cruise', name: 'Navio de Cruzeiro', price: 6500000000, image: '⛴️' },
  { id: 'spacecenter', name: 'Centro Espacial', price: 8000000000, image: '🚀' },
  { id: 'twitter', name: 'Multinacional Tech', price: 44000000000, image: '🐦' },
];

const INITIAL_MONEY = 200000000000; // 200 Billion

export function SpendMoney() {
  const [money, setMoney] = useState(INITIAL_MONEY);
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timePassed, setTimePassed] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !isFinished) {
      interval = setInterval(() => {
        setTimePassed(Date.now() - startTime);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const msRemainder = Math.floor((ms % 1000) / 10);
    return `${s}.${msRemainder.toString().padStart(2, '0')}s`;
  };

  const buyProduct = (product: Product) => {
    if (money >= product.price) {
      if (!startTime) setStartTime(Date.now());
      
      const newMoney = money - product.price;
      setMoney(newMoney);
      
      setCart(prev => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + 1
      }));
      audioSystem.playClick();
      
      if (newMoney === 0) {
        setIsFinished(true);
        audioSystem.playSuccess();
        unlockAchievement('capitalist');
        setTimeout(() => setShowLeaderboard(true), 1500);
      }
    } else {
      audioSystem.playError();
    }
  };

  const sellProduct = (product: Product) => {
    if (isFinished) return;
    if (cart[product.id] && cart[product.id] > 0) {
      setMoney(prev => prev + product.price);
      setCart(prev => ({
        ...prev,
        [product.id]: prev[product.id] - 1
      }));
      audioSystem.playPop();
    }
  };

  const reset = () => {
    setMoney(INITIAL_MONEY);
    setCart({});
    setStartTime(null);
    setTimePassed(0);
    setIsFinished(false);
    setShowLeaderboard(false);
    audioSystem.playSuccess();
  };

  const percentageSpent = ((INITIAL_MONEY - money) / INITIAL_MONEY) * 100;

  return (
    <div className="w-full h-full flex flex-col items-center bg-[#070708] overflow-y-auto selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grain mix-blend-overlay opacity-30"></div>
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-emerald-900/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-6xl flex flex-col items-center px-4 py-12 md:py-20 gap-12 sm:gap-16 z-10 relative">
        
        {/* Header Section */}
        <div className="w-full flex flex-col items-center text-center gap-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center text-[#070708] shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                    <DollarSign size={40} className="stroke-[2.5]" />
                </div>
                <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-2">SPEND BILL GATES' MONEY</h2>
                <div className="flex items-center gap-4 text-emerald-500 font-mono text-sm uppercase tracking-widest font-bold">
                    <span>Speedrun Timer</span>
                    <span className="text-white bg-white/10 px-3 py-1 rounded-sm border border-emerald-500/20">{formatTime(timePassed)}</span>
                </div>
            </div>

            <div className="w-full py-8 md:py-10 sticky top-0 md:top-4 z-40 bg-[#0C0C0E]/80 border border-white/10 text-white rounded-3xl md:rounded-[40px] shadow-2xl backdrop-blur-xl mt-4">
                <motion.div 
                    key={money}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className={`text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter font-mono ${money === 0 ? 'text-emerald-400' : 'text-white'}`}
                >
                    {formatMoney(money)}
                </motion.div>
                <div className="w-full max-w-sm mx-auto mt-6 bg-white/5 h-2 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${percentageSpent}%` }}></div>
                </div>
            </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-6xl mt-4">
            {PRODUCTS.map(product => (
                <div 
                    key={product.id}
                    className="flex flex-col bg-[#141417]/90 backdrop-blur-md rounded-[20px] shadow-lg border border-white/5 hover:border-emerald-500/30 overflow-hidden group transition-all duration-300"
                >
                    <div className="h-48 flex items-center justify-center bg-[#070708] border-b border-white/5 text-7xl transition-all duration-500">
                        <span className="transform group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500 drop-shadow-2xl">{product.image}</span>
                    </div>
                    
                    <div className="p-6 flex flex-col items-center flex-1">
                        <h3 className="text-lg font-display font-medium text-white mb-1 text-center leading-tight">{product.name}</h3>
                        <div className="text-emerald-400 font-mono font-bold mb-6 text-sm">{formatMoney(product.price)}</div>
                        
                        <div className="flex w-full gap-2 items-center mt-auto">
                            <button 
                                disabled={!cart[product.id] || isFinished}
                                onClick={() => sellProduct(product)}
                                className="w-12 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:bg-white/5 text-rose-500 disabled:text-white/20 rounded-xl font-bold transition-all flex items-center justify-center border border-rose-500/20 disabled:border-transparent"
                            >
                                -
                            </button>
                            <div className="flex-1 h-10 flex items-center justify-center bg-black/40 border border-white/10 rounded-xl font-mono text-white text-sm">
                                {cart[product.id] || 0}
                            </div>
                            <button 
                                disabled={isFinished || money < product.price}
                                onClick={() => buyProduct(product)}
                                className="w-12 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-white/5 text-emerald-400 disabled:text-white/20 rounded-xl font-bold transition-all flex items-center justify-center border border-emerald-500/20 disabled:border-transparent"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Inventory Summary */}
        <div className="w-full max-w-5xl p-8 md:p-12 bg-emerald-950/20 rounded-[32px] border border-emerald-900/30 mb-32 flex flex-col items-center">
             <div className="flex items-center gap-3 mb-8 text-emerald-500">
                 <ShoppingCart size={24} />
                 <h2 className="text-xl font-display font-medium uppercase tracking-widest text-emerald-400">Inventory Status</h2>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="p-6 bg-[#070708] rounded-2xl border border-white/5 text-center">
                    <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-2">Total Items</div>
                    <div className="text-3xl font-display font-bold text-white">{Object.values(cart).reduce((a, b) => (a as number) + (b as number), 0)}</div>
                </div>
                <div className="p-6 bg-[#070708] rounded-2xl border border-white/5 text-center">
                    <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-2">Spent %</div>
                    <div className="text-3xl font-display font-bold text-rose-400">{percentageSpent.toFixed(2)}%</div>
                </div>
                <div className="p-6 bg-[#070708] rounded-2xl border border-white/5 text-center">
                    <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-2">Time</div>
                    <div className="text-3xl font-mono tracking-tighter font-bold text-emerald-400">{formatTime(timePassed)}</div>
                </div>
                <button 
                    onClick={reset}
                    className="p-6 bg-emerald-500 hover:bg-emerald-400 text-[#070708] rounded-2xl transition-all flex flex-col items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)]"
                >
                    <RefreshCw size={24} className="stroke-[2.5]" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Restart All</span>
                </button>
             </div>
        </div>

      </div>

      {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#070708]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 z-50 overflow-y-auto"
          >
             <div className="mb-6 flex flex-col items-center">
                 <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                     <Timer size={32} />
                 </div>
                 <h2 className="text-3xl font-display font-medium text-white mb-2">Bankrupt Speedrun</h2>
                 <p className="text-emerald-500 font-mono">Time: {formatTime(timePassed)}</p>
             </div>
             <Leaderboard 
                gameId="spend-billion"
                gameName="Billionaire Speedrun"
                currentScore={parseFloat((timePassed / 1000).toFixed(3))}
                unit="Seconds"
                highScoreFirst={false} // smaller = better
                onClose={() => setShowLeaderboard(false)}
             />
          </motion.div>
      )}
    </div>
  );
}
