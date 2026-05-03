import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DollarSign, ShoppingCart, RefreshCw, Sparkles, TrendingDown } from "lucide-react";
import { audioSystem } from "../lib/audio";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

const PRODUCTS: Product[] = [
  { id: 'burger', name: 'Big Burger', price: 5, image: '🍔' },
  { id: 'coffee', name: 'Premium Coffee', price: 7, image: '☕' },
  { id: 'concert', name: 'Concert Ticket', price: 150, image: '🎟️' },
  { id: 'phone', name: 'Smartphone Pro', price: 1200, image: '📱' },
  { id: 'designer', name: 'Designer Suit', price: 3500, image: '👔' },
  { id: 'car', name: 'Electric Car', price: 85000, image: '🚗' },
  { id: 'house', name: 'Silicon Valley Mansion', price: 12000000, image: '🏡' },
  { id: 'jet', name: 'Private Jet', price: 65000000, image: '🛩️' },
  { id: 'island', name: 'Tropical Island', price: 250000000, image: '🏝️' },
  { id: 'nba', name: 'NBA Team', price: 3500000000, image: '🏀' },
  { id: 'nfl', name: 'NFL Team', price: 6000000000, image: '🏈' },
];

const INITIAL_MONEY = 200000000000; // 200 Billion

export function SpendMoney() {
  const [money, setMoney] = useState(INITIAL_MONEY);
  const [cart, setCart] = useState<{ [id: string]: number }>({});

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const buyProduct = (product: Product) => {
    if (money >= product.price) {
      setMoney(prev => prev - product.price);
      setCart(prev => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + 1
      }));
      audioSystem.playClick();
    } else {
      audioSystem.playError();
    }
  };

  const sellProduct = (product: Product) => {
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
    audioSystem.playSuccess();
  };

  const percentageSpent = ((INITIAL_MONEY - money) / INITIAL_MONEY) * 100;

  return (
    <div className="w-full h-full flex flex-col items-center bg-white overflow-y-auto">
      <div className="w-full max-w-6xl flex flex-col items-center px-4 py-12 md:py-20 gap-12 sm:gap-16">
        
        {/* Header Section */}
        <div className="w-full flex flex-col items-center text-center gap-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
                    <DollarSign size={40} className="stroke-[3]" />
                </div>
                <h2 className="font-display text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900">Spend Bill Gates' Money</h2>
                <div className="h-px w-24 bg-slate-200" />
            </div>

            <div className="w-full py-10 sticky top-0 md:top-4 z-40 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[32px] md:rounded-[48px] shadow-2xl shadow-emerald-500/20 backdrop-blur-md">
                <motion.div 
                    key={money}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="text-3xl sm:text-7xl font-black tracking-tighter font-mono"
                >
                    {formatMoney(money)}
                </motion.div>
            </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            {PRODUCTS.map(product => (
                <div 
                    key={product.id}
                    className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-white group"
                >
                    <div className="h-64 flex items-center justify-center bg-slate-50 text-8xl transition-all duration-500 group-hover:bg-white">
                        <span className="transform group-hover:scale-110 transition-transform duration-500">{product.image}</span>
                    </div>
                    
                    <div className="p-8 flex flex-col items-center bg-white">
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{product.name}</h3>
                        <div className="text-emerald-600 font-bold mb-8 text-xl">{formatMoney(product.price)}</div>
                        
                        <div className="flex w-full gap-3 items-center">
                            <button 
                                disabled={!cart[product.id]}
                                onClick={() => sellProduct(product)}
                                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-bold transition-all text-xs uppercase"
                            >
                                Vender
                            </button>
                            <div className="w-10 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg font-bold text-slate-900 text-sm">
                                {cart[product.id] || 0}
                            </div>
                            <button 
                                onClick={() => buyProduct(product)}
                                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all text-xs uppercase"
                            >
                                Comprar
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Inventory Summary */}
        <div className="w-full max-w-4xl p-12 bg-slate-50 rounded-[48px] border border-slate-100 mb-32 flex flex-col items-center">
             <div className="flex items-center gap-3 mb-8">
                 <ShoppingCart size={24} className="text-blue-500" />
                 <h2 className="text-2xl font-black text-slate-900 uppercase italic">Seu Inventário</h2>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens</div>
                    <div className="text-3xl font-black text-slate-900">{Object.values(cart).reduce((a, b) => (a as number) + (b as number), 0)}</div>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gasto</div>
                    <div className="text-3xl font-black text-rose-500">{percentageSpent.toFixed(4)}%</div>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Restante</div>
                    <div className="text-3xl font-black text-emerald-500">{(100 - percentageSpent).toFixed(2)}%</div>
                </div>
                <button 
                    onClick={reset}
                    className="p-6 bg-slate-900 hover:bg-slate-800 rounded-3xl text-white transition-all flex flex-col items-center justify-center gap-2 shadow-xl"
                >
                    <RefreshCw size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reiniciar</span>
                </button>
             </div>
        </div>

      </div>
    </div>
  );
}
