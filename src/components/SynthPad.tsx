import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioSystem } from "../lib/audio";
import { Settings2, Music2, Target, Circle, Square, FastForward, Play, Square as SquareIcon, Pause, CircleDashed } from "lucide-react";

// Types
type PadConfig = { id: string, label: string, type: 'kick'|'snare'|'hihat'|'clap'|'synth'|'chord', freq?: number, osc?: OscillatorType, color: string };

const PADS: PadConfig[] = [
  { id: 'p1', label: 'Kick', type: 'kick', color: 'bg-rose-500' },
  { id: 'p2', label: 'Snare', type: 'snare', color: 'bg-orange-500' },
  { id: 'p3', label: 'Hi-Hat', type: 'hihat', color: 'bg-amber-400' },
  { id: 'p4', label: 'Clap', type: 'clap', color: 'bg-yellow-400' },
  
  { id: 'p5', label: 'C2 BASS', type: 'synth', freq: 65.41, osc: 'sawtooth', color: 'bg-emerald-500' },
  { id: 'p6', label: 'F2 BASS', type: 'synth', freq: 87.31, osc: 'sawtooth', color: 'bg-teal-500' },
  { id: 'p7', label: 'G2 BASS', type: 'synth', freq: 98.00, osc: 'sawtooth', color: 'bg-cyan-500' },
  { id: 'p8', label: 'A2 BASS', type: 'synth', freq: 110.00, osc: 'sawtooth', color: 'bg-sky-500' },

  { id: 'p9', label: 'C4 CH', type: 'chord', freq: 261.63, osc: 'triangle', color: 'bg-blue-500' },
  { id: 'p10', label: 'F4 CH', type: 'chord', freq: 349.23, osc: 'triangle', color: 'bg-indigo-500' },
  { id: 'p11', label: 'G4 CH', type: 'chord', freq: 392.00, osc: 'triangle', color: 'bg-violet-500' },
  { id: 'p12', label: 'A4 CH', type: 'chord', freq: 440.00, osc: 'triangle', color: 'bg-purple-500' },

  { id: 'p13', label: 'C5 L', type: 'synth', freq: 523.25, osc: 'square', color: 'bg-fuchsia-500' },
  { id: 'p14', label: 'D5 L', type: 'synth', freq: 587.33, osc: 'square', color: 'bg-pink-500' },
  { id: 'p15', label: 'E5 L', type: 'synth', freq: 659.25, osc: 'square', color: 'bg-rose-400' },
  { id: 'p16', label: 'G5 L', type: 'synth', freq: 783.99, osc: 'square', color: 'bg-orange-400' },
];

export function SynthPad() {
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  
  // Looper State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopEvents, setLoopEvents] = useState<{padId: string, timeStamp: number}[]>([]);
  const [loopStartTime, setLoopStartTime] = useState<number>(0);
  const [bpm, setBpm] = useState(120);
  
  // Animation/Visualizer state
  const [visualHits, setVisualHits] = useState<{id: number, padId: string}[]>([]);
  const [progress, setProgress] = useState(0);
  let hitIdCounter = useRef(0);

  const loopDuration = (60 / bpm) * 4 * 1000; // 4 beats loop in milliseconds
  const playbackRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const triggerPad = (pad: PadConfig) => {
    audioSystem.init();
    
    setActivePads(prev => {
      const next = new Set(prev);
      next.add(pad.id);
      return next;
    });

    // Add visual Hit
    const hitId = hitIdCounter.current++;
    setVisualHits(prev => [...prev, { id: hitId, padId: pad.id }]);
    setTimeout(() => {
       setVisualHits(prev => prev.filter(h => h.id !== hitId));
       setActivePads(prev => {
          const next = new Set(prev);
          next.delete(pad.id);
          return next;
       });
    }, 150);

    // Play Audio
    if (pad.type === 'kick' || pad.type === 'snare' || pad.type === 'hihat' || pad.type === 'clap') {
      audioSystem.playDrum(pad.type);
    } else if (pad.type === 'synth') {
      audioSystem.playSynthNote(pad.freq!, pad.osc, 0.01, 0.2, 0.08);
    } else if (pad.type === 'chord') {
      const isMinor = pad.label.includes('A4');
      const thirdRatio = isMinor ? 1.1892 : 1.2599; 
      const fifthRatio = 1.4983; 
      
      audioSystem.playSynthNote(pad.freq!, pad.osc, 0.05, 0.4, 0.04);
      audioSystem.playSynthNote(pad.freq! * thirdRatio, pad.osc, 0.05, 0.4, 0.04);
      audioSystem.playSynthNote(pad.freq! * fifthRatio, pad.osc, 0.05, 0.4, 0.04);
    }
  };

  const handlePadDown = (e: React.PointerEvent | MouseEvent, pad: PadConfig) => {
    e.preventDefault();
    triggerPad(pad);
    
    if (isRecording) {
      setLoopEvents(prev => [...prev, { padId: pad.id, timeStamp: Math.max(0, (Date.now() - loopStartTime) % loopDuration) }]);
    }
  };

  // Playback Loop Engine
  useEffect(() => {
    if (!isPlaying) {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
      return;
    }

    let cycleStart = performance.now();
    let playedIndices = new Set<number>();

    const checkLoop = (now: number) => {
      let offset = now - cycleStart;
      
      if (offset >= loopDuration) {
         cycleStart = now;
         offset = 0;
         playedIndices.clear();
      }
      
      setProgress(offset / loopDuration);

      loopEvents.forEach((ev, idx) => {
         // within a 20ms window to trigger
         if (!playedIndices.has(idx) && offset >= ev.timeStamp && offset < ev.timeStamp + 50) {
            const pad = PADS.find(p => p.id === ev.padId);
            if (pad) triggerPad(pad);
            playedIndices.add(idx);
         }
      });

      playbackRef.current = requestAnimationFrame(checkLoop);
    };

    playbackRef.current = requestAnimationFrame(checkLoop);
    return () => {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
    }
  }, [isPlaying, loopEvents, loopDuration]);


  const toggleRecording = () => {
     if (!isRecording) {
        setLoopStartTime(Date.now());
        if (loopEvents.length === 0) {
           // Fresh record
           setIsPlaying(true);
        }
     } else {
        // Stop recording
     }
     setIsRecording(!isRecording);
  };

  const togglePlayback = () => {
     if (isPlaying) {
        setIsPlaying(false);
        setIsRecording(false);
     } else {
        setIsPlaying(true);
     }
  };

  const clearLoop = () => {
     setLoopEvents([]);
     setIsRecording(false);
     setIsPlaying(false);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-950 lg:pt-20 select-none touch-none">
      
      {/* Visualizer Display Above */}
      <div className="w-full max-w-2xl h-24 sm:h-32 mb-6 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden flex items-center shadow-lg shadow-indigo-900/10">
         <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10% 100%' }}></div>
         
         {/* Progress Sweep Line */}
         {isPlaying && (
           <div 
             className="absolute top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_#fff] z-20"
             style={{ left: `${progress * 100}%` }}
           />
         )}

         {/* Recorded Events Timeline */}
         {loopEvents.map((ev, i) => {
            const pad = PADS.find(p => p.id === ev.padId);
            const leftPct = (ev.timeStamp / loopDuration) * 100;
            return (
               <div 
                 key={i} 
                 className={`absolute bottom-0 w-1.5 h-full opacity-30 ${pad?.color || 'bg-white'}`}
                 style={{ left: `${leftPct}%` }}
               />
            );
         })}

         <AnimatePresence>
            {visualHits.map(hit => {
               const pad = PADS.find(p => p.id === hit.padId);
               if (!pad) return null;
               // random horizontal position based on pad ID so they don't all stack
               const xPos = 10 + (parseInt(hit.padId.replace('p', '')) * 5) % 80;
               return (
                  <motion.div
                    key={hit.id}
                    initial={{ opacity: 1, scale: 0.1, y: 0 }}
                    animate={{ opacity: 0, scale: 5, y: -20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`absolute w-10 h-10 ${pad.color} rounded-full mix-blend-screen blur-md`}
                    style={{ left: `${xPos}%`, top: '40%' }}
                  />
               )
            })}
         </AnimatePresence>
         
         {!isPlaying && loopEvents.length === 0 && (
            <div className="w-full text-center text-slate-700 font-bold uppercase tracking-[0.3em] z-10 text-xs sm:text-sm">
               Hit a pad or Start Loop
            </div>
         )}
      </div>

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-4 sm:p-6 lg:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* Hardware details top bar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center rounded-xl shadow-inner">
                <Music2 size={24} />
             </div>
             <div>
               <h2 className="text-xl font-black text-white tracking-widest uppercase">Loop Machine</h2>
               <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5 uppercase">Model: Nexus-16</p>
             </div>
           </div>
           
           {/* Transport Controls */}
           <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 relative z-20">
              <button 
                onClick={clearLoop} 
                className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="Clear Loop"
              >
                 <SquareIcon size={16} fill="currentColor" />
              </button>
              <button 
                onClick={togglePlayback} 
                className={`p-3 rounded-xl transition-all ${isPlaying ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                title={isPlaying ? "Stop" : "Play"}
              >
                 {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
              </button>
              <div className="w-px h-8 bg-slate-800 mx-1"></div>
              <button 
                onClick={toggleRecording} 
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${isRecording ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
              >
                 <Circle size={16} fill="currentColor" className={isRecording ? 'animate-pulse' : ''} />
                 <span className="text-xs font-black uppercase tracking-wider pr-1 hidden sm:block">Rec</span>
              </button>
           </div>
        </div>

        {/* Status Indicators */}
        <div className="flex justify-between items-center mb-6 pl-2 pr-2">
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse' : 'bg-slate-800'}`} />
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">REC</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-800'}`} />
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">PLAY</span>
              </div>
              {loopEvents.length > 0 && (
                <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
                   <CircleDashed size={12} className="text-indigo-400" />
                   <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">{loopEvents.length} Events</span>
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">BPM</span>
              <input 
                type="number" 
                value={bpm} 
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-14 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono text-center py-1 outline-none focus:border-indigo-500"
                min={60} max={200}
              />
           </div>
        </div>

        {/* 4x4 Grid */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-5 relative z-10">
          {PADS.map((pad) => (
            <button
              key={pad.id}
              onPointerDown={(e) => handlePadDown(e, pad)}
              className={`
                 relative aspect-square rounded-[20px] flex flex-col items-start justify-end p-2 sm:p-4 overflow-hidden
                 transition-all outline-none duration-75 border-b-4 border-slate-950 hover:brightness-110 active:border-b-0 active:translate-y-1
                 ${activePads.has(pad.id) 
                    ? `${pad.color} border-b-0 translate-y-1 shadow-[0_0_40px_rgba(255,255,255,0.4)_inset]` 
                    : `bg-slate-800 shadow-xl`}
              `}
            >
              <div 
                 className={`absolute top-0 inset-x-0 h-1 sm:h-2 opacity-80 ${pad.color} ${activePads.has(pad.id) ? 'hidden' : ''}`} 
              />
              <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest
                 ${activePads.has(pad.id) ? 'text-black/70' : 'text-slate-400'}
                 transition-colors
              `}>
                {pad.label}
              </span>
              
              {/* Fake light bulb in corner */}
              <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-1.5 h-1.5 rounded-full 
                 ${activePads.has(pad.id) ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-700'}
              `} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

