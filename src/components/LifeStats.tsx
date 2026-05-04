import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Heart, Wind, Globe, Zap, Calendar, RefreshCw } from "lucide-react";
import { audioSystem } from "../lib/audio";

export function LifeStats() {
  const [birthDate, setBirthDate] = useState<string>("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!birthDate) {
      setStats(null);
      return;
    }

    const timer = setInterval(() => {
      try {
        if (!birthDate) return;
        // Correcting Date parsing to local time
        const [y, m, d] = birthDate.split('-').map(Number);
        const birth = new Date(y, m - 1, d);
        const now = new Date();
        const diffMs = now.getTime() - birth.getTime();
        
        if (diffMs <= 0) {
          setStats(null);
          return;
        }

        const seconds = diffMs / 1000;
        const days = seconds / (60 * 60 * 24);

        // Age components
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let ageDays = now.getDate() - birth.getDate();

        if (ageDays < 0) {
          months--;
          const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          ageDays += lastMonth.getDate();
        }
        if (months < 0) {
          years--;
          months += 12;
        }

        setStats({
          years,
          months,
          days: ageDays,
          totalDays: Math.floor(days),
          heartbeats: Math.floor(seconds * (72 / 60)),
          breaths: Math.floor(seconds * (16 / 60)),
          blinks: Math.floor(seconds * (15 / 60)),
          earthRotations: days.toFixed(6),
          moonOrbits: (days / 27.32).toFixed(6),
          bloodPumped: (seconds * 0.08).toFixed(2),
          nailsGrown: (days * 0.1).toFixed(4),
          hairGrown: (days * 0.4).toFixed(4),
        });
      } catch (err) {
        console.error("LifeStats error:", err);
        setStats(null);
      }
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [birthDate]);

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return "0";
    if (typeof val === 'number') return val.toLocaleString();
    if (typeof val === 'string') {
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        // If it's something like rotations, keep decimals
        if (val.includes('.')) {
            const parts = val.split('.');
            return parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: parts[1].length });
        }
        return num.toLocaleString();
    }
    return String(val);
  };

  const [day, setDay] = useState<string>("1");
  const [month, setMonth] = useState<string>("0"); // 0-indexed
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => (currentYear - i).toString());

  const daysInMonth = (m: number, y: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const handleStart = () => {
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) {
      setBirthDate(date.toISOString().split('T')[0]);
      audioSystem.playSuccess();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center bg-slate-950 p-4 lg:p-8 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        
        <div className="flex flex-col items-center text-center gap-4 mb-8">
            <h2 className="font-display text-5xl font-black italic uppercase tracking-tighter text-white">Sua Vida em Números</h2>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">O Relógio Biológico da sua Existência</p>
            
            {!birthDate && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-8 p-10 glass-card rounded-[50px] border border-white/5 w-full max-w-xl flex flex-col items-center"
                >
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Selecione sua data de nascimento</label>
                    
                    <div className="flex flex-wrap justify-center gap-4 mb-10 w-full">
                        <div className="flex-1 min-w-[80px]">
                            <div className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-2">Dia</div>
                            <select 
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none ring-blue-500 focus:ring-2 appearance-none cursor-pointer"
                            >
                                {Array.from({ length: daysInMonth(parseInt(month), parseInt(year)) }, (_, i) => (i + 1).toString()).map(d => (
                                    <option key={d} value={d} className="bg-slate-900">{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-[2] min-w-[140px]">
                            <div className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-2">Mês</div>
                            <select 
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none ring-blue-500 focus:ring-2 appearance-none cursor-pointer"
                            >
                                {months.map((m, i) => (
                                    <option key={m} value={i.toString()} className="bg-slate-900">{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[100px]">
                            <div className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-2">Ano</div>
                            <select 
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none ring-blue-500 focus:ring-2 appearance-none cursor-pointer"
                            >
                                {years.map(y => (
                                    <option key={y} value={y} className="bg-slate-900">{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleStart}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic tracking-tighter text-sm rounded-2xl transition-all shadow-lg active:scale-95"
                    >
                        Ver Estatísticas
                    </button>
                </motion.div>
            )}
        </div>

        {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-4xl">
                 <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Anos</div>
                    <div className="text-2xl font-black text-white">{stats.years}</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Meses</div>
                    <div className="text-2xl font-black text-white">{stats.months}</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Dias</div>
                    <div className="text-2xl font-black text-white">{stats.days}</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Dias</div>
                    <div className="text-2xl font-black text-white">{stats.totalDays.toLocaleString()}</div>
                 </div>
            </div>
        )}

        {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-32">
                <StatCard 
                    icon={<Heart className="text-rose-500" />} 
                    label="Batimentos Cardíacos" 
                    value={renderValue(stats.heartbeats)} 
                    unit="vezes"
                />
                <StatCard 
                    icon={<Wind className="text-cyan-400" />} 
                    label="Respirações" 
                    value={renderValue(stats.breaths)} 
                    unit="vezes"
                />
                <StatCard 
                    icon={<Zap className="text-amber-400" />} 
                    label="Piscadas de Olho" 
                    value={renderValue(stats.blinks)} 
                    unit="aproximadamente"
                />
                <StatCard 
                    icon={<Globe className="text-emerald-500" />} 
                    label="Rotações da Terra" 
                    value={renderValue(stats.earthRotations)} 
                    unit="voltas"
                />
                <StatCard 
                    icon={<Clock className="text-indigo-400" />} 
                    label="Sangue Bombeado" 
                    value={renderValue(stats.bloodPumped)} 
                    unit="litros"
                />
                <StatCard 
                    icon={<Calendar className="text-white" />} 
                    label="Cabelo Crescido" 
                    value={renderValue(stats.hairGrown)} 
                    unit="milímetros"
                />
            </div>
        )}

        {birthDate && (
            <button 
                onClick={() => setBirthDate("")}
                className="mx-auto flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all backdrop-blur-md font-bold uppercase tracking-widest text-xs"
            >
                <RefreshCw size={16} />
                Reiniciar
            </button>
        )}

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: string, unit: string }) {
    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-8 glass-card rounded-[40px] border border-white/5 flex flex-col gap-4 group hover:glow-indigo transition-all duration-300"
        >
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                {icon}
            </div>
            <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-4xl font-black text-white tracking-tighter mb-1 font-mono">{value}</div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">{unit}</div>
            </div>
        </motion.div>
    );
}
