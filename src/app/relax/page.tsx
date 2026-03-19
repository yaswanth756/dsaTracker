'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_OPTIONS = [
  { name: 'Blue', class: 'bg-blue-500/80' },
  { name: 'Purple', class: 'bg-purple-500/80' },
  { name: 'Pink', class: 'bg-pink-500/80' },
  { name: 'Emerald', class: 'bg-emerald-500/80' },
  { name: 'Amber', class: 'bg-amber-500/80' },
  { name: 'Red', class: 'bg-red-500/80' }
];

interface Bubble {
  id: number;
  createdAt: number;
  x: number;
  size: number;
  colorObj: typeof COLOR_OPTIONS[0];
  speed: number;
  wiggle: number;
}

export default function ColorCatchGame() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [colorTimeLeft, setColorTimeLeft] = useState(30); // 30s per color
  const [targetColor, setTargetColor] = useState(COLOR_OPTIONS[0]);
  const [mounted, setMounted] = useState(false);

  // Refs for logic loop without stale closures
  const targetColorRef = useRef(targetColor);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => { targetColorRef.current = targetColor; }, [targetColor]);

  // Main game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });

      setColorTimeLeft((prev) => {
        if (prev <= 1) {
          // Change color
          const newColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
          setTargetColor(newColor);
          return 30; // reset color timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Bubble spawner
  const spawnBubble = useCallback(() => {
    if (!gameActive) return;

    const size = Math.random() * 35 + 35; // 35px to 70px (smaller & harder)
    const x = Math.random() * 85 + 5; 
    
    // 35% chance to force the target color to ensure enough playability
    const isTarget = Math.random() < 0.35;
    const colorObj = isTarget 
       ? targetColorRef.current 
       : COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];

    const speed = Math.random() * 3 + 2.5; // 2.5 to 5.5 seconds (much faster!)
    const wiggle = (Math.random() - 0.5) * 200; // More erratic horizontal wave

    setBubbles((prev) => {
      let current = prev;
      if (current.length > 50) current = current.slice(current.length - 50);
      return [...current, { id: Date.now() + Math.random(), createdAt: Date.now(), x, size, colorObj, speed, wiggle }];
    });
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(spawnBubble, 250); // Fast spawning
    return () => clearInterval(interval);
  }, [spawnBubble, gameActive]);

  // Cleanup escaped bubbles and penalize misses
  useEffect(() => {
    if (!gameActive) return;
    
    const interval = setInterval(() => {
      setBubbles((prev) => {
        const now = Date.now();
        let penalty = 0;
        
        const remaining = prev.filter(b => {
          const ageSecs = (now - b.createdAt) / 1000;
          if (ageSecs > b.speed + 0.3) {
            // It timed out off screen!
            if (b.colorObj.name === targetColorRef.current.name) {
              penalty += 1; // Missed target
            }
            return false;
          }
          return true;
        });

        if (penalty > 0) {
          setScore(s => s - penalty);
        }
        
        return remaining.length === prev.length ? prev : remaining;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameActive]);

  const popBubble = (id: number) => {
    setBubbles((prev) => {
      const bubble = prev.find(b => b.id === id);
      if (!bubble) return prev; // already gone

      // Check if correct
      if (bubble.colorObj.name === targetColorRef.current.name) {
        setScore((s) => s + 1);
      } else {
        setScore((s) => s - 1);
      }

      return prev.filter((b) => b.id !== id);
    });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(300); // 5 mins
    setColorTimeLeft(30); // 30s
    setTargetColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    setBubbles([]);
    setGameActive(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] md:h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 bg-slate-950 font-sans select-none">
      
      {/* Background radial gradient */}
      <div 
         className="absolute inset-0 pointer-events-none opacity-40"
         style={{ background: 'radial-gradient(circle at center, rgba(30,30,50,1) 0%, rgba(10,10,20,1) 100%)' }}
      />

      {/* Game HUD */}
      <div className="z-10 absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start pointer-events-none">
        {gameActive && (
          <>
            <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 md:px-6 md:py-4 border border-white/10 shadow-2xl pointer-events-auto shrink-0">
              <span className="text-slate-400 text-xs uppercase font-extrabold tracking-widest mb-1">Time</span>
              <span className={`text-2xl md:text-3xl font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 md:px-10 md:py-4 border border-white/10 shadow-2xl pointer-events-auto transition-transform scale-100 hover:scale-105 mx-2">
              <span className="text-slate-300 text-[10px] md:text-xs uppercase font-extrabold tracking-widest mb-2 flex items-center gap-2">
                Target 
                <span className="bg-slate-800 text-white px-2 py-0.5 rounded-md">{colorTimeLeft}s</span>
              </span>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className={`w-8 h-8 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_0_15px_rgba(255,255,255,0.2)] border border-white/40 ${targetColor.class}`} />
                <span className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-md">
                  {targetColor.name}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 md:px-6 md:py-4 border border-white/10 shadow-2xl pointer-events-auto shrink-0">
              <span className="text-slate-400 text-xs uppercase font-extrabold tracking-widest mb-1">Score</span>
              <motion.span 
                 key={score}
                 initial={{ scale: 1.5 }}
                 animate={{ scale: 1 }}
                 className={`text-2xl md:text-3xl font-black ${score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {score}
              </motion.span>
            </div>
          </>
        )}
      </div>

      {/* Start / Game Over Screen */}
      {!gameActive && (
         <div className="z-20 text-center flex flex-col items-center max-w-2xl bg-white/5 backdrop-blur-3xl p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-[0_0_80px_-20px_rgba(255,255,255,0.1)] pointer-events-auto">
           <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight bg-gradient-to-br from-cyan-300 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-sm">
             Color Ninja
           </h1>
           
           {timeLeft === 0 && score !== 0 ? (
             <div className="my-8 flex flex-col items-center">
               <span className="block text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Final Score</span>
               <span className="text-7xl font-black text-white drop-shadow-lg">{score}</span>
             </div>
           ) : (
             <div className="text-slate-300 text-sm md:text-base space-y-4 mb-8 font-medium mt-4">
               <p className="text-lg font-bold text-amber-300">Just HOVER your mouse over them! No tapping needed.</p>
               <ul className="text-left bg-black/20 p-6 rounded-3xl space-y-3 border border-white/5 mt-4">
                 <li className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                   <span>Hover ONLY over bubbles matching the <b>Target Color</b>. <span className="text-emerald-400 font-bold ml-1">(+1)</span></span>
                 </li>
                 <li className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
                   <span>Hovering over the WRONG color hurts. <span className="text-rose-400 font-bold ml-1">(-1)</span></span>
                 </li>
                 <li className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
                   <span>Letting a TARGET color escape hurts. <span className="text-rose-400 font-bold ml-1">(-1)</span></span>
                 </li>
                 <li className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                   <span>Target color changes every <b>30 seconds</b>. Survive for 5 mins!</span>
                 </li>
               </ul>
             </div>
           )}

           <button 
             onClick={startGame}
             className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold rounded-full text-lg md:text-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-xl active:scale-95 border border-white/20 uppercase tracking-widest"
           >
             {timeLeft === 0 && score !== 0 ? 'Play Again' : 'Start Focus Game'}
           </button>
         </div>
      )}

      {/* Bubbles Area */}
      <div className="absolute inset-x-0 bottom-0 top-[120px] pointer-events-none overflow-hidden">
        <AnimatePresence>
          {bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              initial={{ top: '110%', marginLeft: 0, scale: 0, opacity: 0 }}
              animate={{ 
                top: '-20%', 
                marginLeft: bubble.wiggle,
                scale: 1, 
                opacity: 0.9 
              }}
              exit={{ 
                scale: 1.8, 
                opacity: 0, 
                filter: "blur(12px)", 
                transition: { duration: 0.25, ease: "easeOut" } 
              }}
              transition={{ 
                top: { duration: bubble.speed, ease: "linear" },
                marginLeft: { duration: bubble.speed * 0.8, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" },
                scale: { duration: 0.5 },
                opacity: { duration: 0.5 }
              }}
              className={`absolute rounded-full cursor-pointer pointer-events-auto backdrop-blur-md ${bubble.colorObj.class} border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)]`}
              style={{
                left: `${bubble.x}%`,
                width: bubble.size,
                height: bubble.size,
                boxShadow: 'inset -10px -10px 30px rgba(0,0,0,0.4), inset 10px 10px 30px rgba(255,255,255,0.6)'
              }}
              onPointerDown={(e) => {
                e.preventDefault(); 
                popBubble(bubble.id);
              }}
              onMouseEnter={() => {
                // Instantly pop on pure hover! No clicking required.
                popBubble(bubble.id);
              }}
            >
              {/* Bubble specular highlight */}
              <div className="absolute top-[15%] left-[20%] w-[35%] h-[35%] bg-gradient-to-br from-white/90 to-transparent rounded-full blur-[2px] rotate-[-25deg]" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
