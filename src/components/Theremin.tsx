import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Power, Volume2 } from "lucide-react";

export function Theremin() {
  const [isActive, setIsActive] = useState(false);
  const [posX, setPosX] = useState(0.5);
  const [posY, setPosY] = useState(0.5);
  const [waveType, setWaveType] = useState<OscillatorType>('sine');
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(()=>{});
      }
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const startAudio = () => {
    initAudio();
    if (!audioCtxRef.current) return;
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    const filter = audioCtxRef.current.createBiquadFilter();

    osc.type = waveType;
    
    // Initial frequencies
    osc.frequency.value = 200;
    
    // Lowpass filter reacting to Y
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    filter.Q.value = 15;

    gain.gain.value = 0.001; // Start silent, ramp up

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.start();
    
    // Ramp up volume
    gain.gain.exponentialRampToValueAtTime(0.5, audioCtxRef.current.currentTime + 0.1);

    oscRef.current = osc;
    gainRef.current = gain;
    filterRef.current = filter;
    
    setIsActive(true);
  };

  const stopAudio = () => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.1);
      setTimeout(() => {
        if (oscRef.current) {
          try { oscRef.current.stop(); } catch(e){}
          oscRef.current = null;
        }
      }, 150);
    }
    setIsActive(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isActive) startAudio();
    updateTones(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    stopAudio();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    updateTones(e);
  };

  const updateTones = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    
    // Clamp
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    setPosX(x);
    setPosY(y);

    if (isActive && oscRef.current && gainRef.current && filterRef.current && audioCtxRef.current) {
      // Frequency maps to X (e.g. 50Hz to 1500Hz)
      const minFreq = 50;
      const maxFreq = 1500;
      const freq = minFreq * Math.pow(maxFreq / minFreq, x); // Exponential mapping
      
      // Filter frequency maps to Y (e.g. 200Hz to 5000Hz)
      const filterFreq = 5000 - (y * 4800);
      
      const now = audioCtxRef.current.currentTime;
      oscRef.current.frequency.setTargetAtTime(freq, now, 0.05); // Glide effect
      filterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.05);
      
      // Subtle volume drop based on Y
      const vol = 0.5 - (y * 0.3);
      gainRef.current.gain.setTargetAtTime(vol, now, 0.05);
    }
  };

  const changeWave = (type: OscillatorType) => {
    setWaveType(type);
    if (oscRef.current) {
       oscRef.current.type = type;
    }
  };

  return (
    <div className="w-full flex flex-col items-center p-4 select-none touch-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl relative">
        
        {/* Theremin Surface */}
        <div 
          ref={containerRef}
          className="w-full h-[60vh] lg:h-[70vh] bg-slate-950 relative cursor-crosshair overflow-hidden group"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
           {/* Background Grid */}
           <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

           {/* Audio Visuals */}
           <AnimatePresence>
             {isActive && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.5 }}
                 transition={{ duration: 0.15 }}
                 className="absolute w-32 h-32 -ml-16 -mt-16 rounded-full mix-blend-screen pointer-events-none"
                 style={{ 
                   left: `${posX * 100}%`, 
                   top: `${posY * 100}%`,
                   background: `radial-gradient(circle, ${waveType === 'sine' ? 'rgba(59,130,246,0.8)' : waveType === 'square' ? 'rgba(239,68,68,0.8)' : waveType === 'sawtooth' ? 'rgba(234,179,8,0.8)' : 'rgba(168,85,247,0.8)'} 0%, transparent 70%)`
                 }}
               />
             )}
             {isActive && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.3 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 pointer-events-none mix-blend-overlay"
                 style={{
                    background: `linear-gradient(to right, transparent, ${posX > 0.5 ? 'white' : 'transparent'})`
                 }}
               />
             )}
           </AnimatePresence>
           
           {!isActive && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-sm animate-pulse flex flex-col items-center gap-4">
                  <Activity size={32} className="opacity-50" />
                  Pressione e segure para tocar
                </p>
             </div>
           )}

           {/* Labels */}
           <div className="absolute bottom-4 left-4 text-[10px] uppercase font-bold tracking-widest text-slate-600 rotate-[-90deg] origin-left">
              Filtro (Y)
           </div>
           <div className="absolute bottom-4 left-8 text-[10px] uppercase font-bold tracking-widest text-slate-600">
              Tom (X)
           </div>
        </div>

        {/* Controls */}
        <div className="border-t border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 absolute bottom-0 w-full opacity-90 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-slate-800 text-slate-400'}`}>
                 <Power size={20} />
              </div>
              <div>
                 <h2 className="text-lg font-black uppercase tracking-widest leading-none">Theremin</h2>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Sintetizador Etéreo</p>
              </div>
           </div>

           <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
             {(['sine', 'triangle', 'sawtooth', 'square'] as OscillatorType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => changeWave(type)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${waveType === type ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                  {type === 'sine' ? 'Senóide' : type === 'sawtooth' ? 'Serra' : type === 'triangle' ? 'Triângulo' : 'Quadrada'}
                </button>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
