import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Trophy, RotateCcw, Star, Clock, ArrowRight, Play, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const boxesConfig = [
  { id: 1, number: 12, description: 'Caja Estelar', color: 'amarillo', bg: 'from-amber-200 via-yellow-200 to-amber-300', text: 'text-amber-900', ribbon: 'bg-rose-400', glow: 'shadow-[0_0_20px_rgba(252,211,77,0.4)]' },
  { id: 6, number: 13, description: 'Caja Nebulosa', color: 'azul', bg: 'from-sky-200 via-blue-200 to-indigo-300', text: 'text-indigo-900', ribbon: 'bg-amber-300', glow: 'shadow-[0_0_20px_rgba(147,197,253,0.4)]' },
  { id: 11, number: 14, description: 'Caja Galaxia', color: 'verde', bg: 'from-emerald-200 via-teal-200 to-green-300', text: 'text-emerald-900', ribbon: 'bg-purple-400', glow: 'shadow-[0_0_20px_rgba(110,231,183,0.4)]' },
  { id: 16, number: 15, description: 'Caja Cometa', color: 'rojo', bg: 'from-rose-200 via-pink-200 to-red-300', text: 'text-rose-900', ribbon: 'bg-amber-300', glow: 'shadow-[0_0_20px_rgba(253,164,175,0.4)]' },
];

class NativeSoundFX {
  constructor() {
    this.audioCtx = null;
    this.casinoInterval = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  startCasinoMusic() {
    this.initContext();
    if (this.casinoInterval) return;

    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    let step = 0;

    const playNote = () => {
      if (!this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = step % 4 === 0 ? 'square' : 'triangle';
        const freq = scale[Math.floor(Math.random() * scale.length)];
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.12);

        step++;
      } catch (e) {}
    };

    playNote();
    this.casinoInterval = setInterval(playNote, 130);
  }

  stopCasinoMusic() {
    if (this.casinoInterval) {
      clearInterval(this.casinoInterval);
      this.casinoInterval = null;
    }
  }

  playVictoryFanfare() {
    this.initContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const arpeggioNotes = [
      { freq: 523.25, time: 0.0, duration: 0.12 },
      { freq: 659.25, time: 0.08, duration: 0.12 },
      { freq: 783.99, time: 0.16, duration: 0.12 },
      { freq: 1046.50, time: 0.24, duration: 0.15 },
      { freq: 1318.51, time: 0.35, duration: 0.3 },
    ];

    arpeggioNotes.forEach((note) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.2, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });

    const finalChord = [523.25, 659.25, 783.99, 1046.50];
    finalChord.forEach((freq) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.5);

      gain.gain.setValueAtTime(0.25, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + 0.5);
      osc.stop(now + 0.5 + 1.2);
    });
  }
}

const soundFX = new NativeSoundFX();

export default function BoxGame() {
  const navigate = useNavigate();
  const location = useLocation();

const savedData = JSON.parse(localStorage.getItem('cosmos_participant') || '{}');
const locationState = location.state || {};

// Unificamos para que tome los datos reales sin fallar
const currentParticipant = {
    participantId: locationState.participantId || savedData.participantId || 'SIN-ID',
    participantName: locationState.participantName || savedData.participantName || 'Invitado',
    participantLastName: locationState.participantLastName || savedData.participantLastName || ''
};

console.log ("datos listos", currentParticipant )

  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState('idle');
  const [countdown, setCountdown] = useState(5);
  const [winningBox, setWinningBox] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [participantCategory, setParticipantCategory] = useState('NIÑO');

  const containerRef = useRef(null);
  const winningBoxRef = useRef(null);
  const animFrameRef = useRef(null);
  const winAnimRef = useRef(null);
  const physicsRef = useRef([]);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    setGameState('idle');
    setWinningBox(null);
    setCountdown(5);
    setAttempts(0);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 900);

    return () => {
      clearTimeout(timer);
      soundFX.stopCasinoMusic();
    };
  }, []);

  const resetGame = () => {
    soundFX.stopCasinoMusic();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (winAnimRef.current) cancelAnimationFrame(winAnimRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setGameState('idle');
    setWinningBox(null);
    setCountdown(5);
  };

  const startChaosGame = () => {
    if (gameState === 'chaotic') return; 

    soundFX.initContext();
    soundFX.startCasinoMusic();

    setAttempts((prev) => prev + 1);
    setGameState('chaotic');
    setCountdown(5);
    setWinningBox(null);

    const isMobile = window.innerWidth < 768;
    const spreadScale = isMobile ? 0.08 : 1; 

    physicsRef.current = boxesConfig.map(() => ({
      x: (Math.random() - 0.5) * 60 * spreadScale,
      y: isMobile ? 0 : 110,
      vx: (Math.random() - 0.5) * 4 * spreadScale,
      vy: (-4 - Math.random() * 4) * (isMobile ? 0.3 : 1),
      rotX: Math.random() * 360,
      rotY: Math.random() * 360,
      rotZ: Math.random() * 360,
      vRotX: (Math.random() - 0.5) * 10,
      vRotY: (Math.random() - 0.5) * 10,
      vRotZ: (Math.random() - 0.5) * 10
    }));

    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          clearInterval(intervalRef.current);
          return 0;
        }
      });
    }, 1000);
  };

  useEffect(() => {
    if (gameState === 'chaotic' && countdown === 0) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      soundFX.stopCasinoMusic();

      if (containerRef.current) {
        const containerH = containerRef.current.clientHeight;
        const maxY = (containerH / 2) - 45;
        const children = containerRef.current.children;
        
        physicsRef.current.forEach((p, i) => {
          if (children[i]) {
            p.y = maxY;
            p.vy = 0;
            p.vx = 0;
            p.vRotX = 0;
            p.vRotY = 0;
            p.vRotZ = 0;
            p.rotX = 0;
            p.rotY = 0;
            p.rotZ = 0;
            children[i].style.transform = `translate3d(${p.x}px, ${p.y}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
          }
        });
      }

      timeoutRef.current = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * boxesConfig.length);
        const selectedBox = boxesConfig[randomIndex];
        setWinningBox(selectedBox);
        setGameState('won');
        soundFX.playVictoryFanfare();
      }, 400);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [countdown, gameState]);

  useEffect(() => {
    if (gameState !== 'chaotic') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const updatePhysics = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;

      const isMobile = window.innerWidth < 768;
      const boxSize = isMobile ? 64 : 80;
      const maxX = Math.max(10, (containerW / 2) - (boxSize / 2) - 10);
      const maxY = Math.max(10, (containerH / 2) - (boxSize / 2) - 10);

      const children = containerRef.current.children;

      for (let i = 0; i < children.length; i++) {
        const el = children[i];
        let p = physicsRef.current[i];
        if (!p) continue;

        const gravity = isMobile ? 0.35 : 0.55;
        p.vy += gravity;

        if (Math.random() < 0.12) {
          p.vy -= (isMobile ? 3 : 6) + Math.random() * (isMobile ? 4 : 8);
          p.vx += (Math.random() - 0.5) * (isMobile ? 2 : 5);
        }

        p.x += p.vx;
        p.y += p.vy;
        
        p.rotX += p.vRotX;
        p.rotY += p.vRotY;
        p.rotZ += p.vRotZ;

        p.vx *= 0.98;
        p.vy *= 0.98;

        if (p.x > maxX) { p.x = maxX; p.vx = -Math.abs(p.vx) * 0.8; p.vRotY = -p.vRotY; }
        if (p.x < -maxX) { p.x = -maxX; p.vx = Math.abs(p.vx) * 0.8; p.vRotY = -p.vRotY; }
        
        if (p.y > maxY) { 
          p.y = maxY; 
          p.vy = -Math.abs(p.vy) * 0.9 - ((isMobile ? 4 : 8) + Math.random() * (isMobile ? 5 : 10));
          p.vRotX = -p.vRotX; 
        }
        
        if (p.y < -maxY) { 
          p.y = -maxY; 
          p.vy = Math.abs(p.vy) * 0.8; 
          p.vRotX = -p.vRotX; 
        }

        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0px) rotateX(${p.rotX}deg) rotateY(${p.rotY}deg) rotateZ(${p.rotZ}deg)`;
      }

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'won' || !winningBox) {
      if (winAnimRef.current) cancelAnimationFrame(winAnimRef.current);
      return;
    }

    let angleY = 0;
    let angleX = 20;

    const rotateWinningBox = () => {
      angleY += 0.8; 
      angleX = 20 + Math.sin(angleY * 0.05) * 10; 

      if (winningBoxRef.current) {
        winningBoxRef.current.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) rotateZ(5deg)`;
      }

      winAnimRef.current = requestAnimationFrame(rotateWinningBox);
    };

    winAnimRef.current = requestAnimationFrame(rotateWinningBox);

    return () => {
      if (winAnimRef.current) cancelAnimationFrame(winAnimRef.current);
    };
  }, [gameState, winningBox]);

const handleGoToBingo = () => {
    if (!winningBox) return;

    // Obtenemos los datos actuales del participante
    const baseData = JSON.parse(localStorage.getItem('cosmos_participant') || '{}');

    // Armamos el objeto final completo para el Bingo
    const finalData = {
        participantId: baseData.participantId || 'SIN-ID',
        participantName: baseData.participantName || 'Invitado',
        participantLastName: baseData.participantLastName || '',
        participantCategory: typeof participantCategory !== 'undefined' ? participantCategory : 'NIÑO', // O la variable de estado de tus botones NIÑO/NIÑA
        winningBoxNumber: winningBox.number
    };

    // Actualizamos el storage para que Bingo lo lea sin problemas
    localStorage.setItem('cosmos_participant', JSON.stringify(finalData));
console.log("🚀 DATOS EXACTOS ENVIADOS AL BINGO:", finalData);
    // Navegamos hacia el bingo enviando el state completo
    navigate('/bingo', { state: finalData });
};
  return (
    <div className="min-h-screen w-full bg-[#2d1b4e] flex flex-col items-center justify-between p-3 md:p-6 text-purple-950 transition-all duration-500 overflow-x-hidden relative">
      
      {isLoading ? (
        <div className="absolute inset-0 z-50 bg-[#ede9fe]/90 backdrop-blur-2xl flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Cargando Juego Cósmico...
            </h3>
            <p className="text-xs text-purple-700 font-medium">Sincronizando música de casino 🎰</p>
          </div>
        </div>
      ) : null}

      <div className="w-full max-w-4xl flex items-center justify-between bg-gradient-to-r from-purple-200/90 via-fuchsia-100/90 to-purple-300/90 px-4 md:px-6 py-3 rounded-2xl border-2 border-purple-300 shadow-[0_0_25px_rgba(216,180,254,0.5)]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-ping"></div>
          <h3 className="font-black text-xs md:text-lg text-purple-900 tracking-wider flex items-center gap-2">
            ✨ CAJAS MISTERIOSAS COSMOS CUTE ✨
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {winningBox && (
            <button 
              onClick={handleGoToBingo}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs px-3 md:px-4 py-2 rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-1.5 border border-white/40 animate-pulse"
            >
              <span>Ir al Bingo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => navigate('/')}
            className="bg-purple-200 hover:bg-purple-300 p-2 rounded-full cursor-pointer transition-colors border border-purple-300 shadow-sm text-purple-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-2xl flex-grow my-3 rounded-3xl bg-gradient-to-b from-[#f5f3ff] via-[#ede9fe] to-[#f3e8ff] border-2 border-purple-300 flex flex-col items-center justify-center p-3 md:p-4 gap-4 overflow-hidden shadow-[inset_0_0_30px_rgba(216,180,254,0.4)]">
        
       <div className="relative w-full h-[350px] md:h-96 rounded-2xl bg-gradient-to-b from-slate-950 via-purple-950/60 to-slate-950 border-2 border-purple-500/30 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(147,51,235,0.15)] [perspective:1000px]">
         
         {gameState === 'chaotic' && (
           <div className="absolute top-3 left-4 z-30 bg-purple-900/80 text-purple-200 font-black px-3 py-1 rounded-xl border border-purple-500/40 shadow-md flex items-center gap-1.5 animate-bounce backdrop-blur-md">
             <Clock className="w-4 h-4 animate-spin text-purple-400" />
             <span className="text-xs">Quedan {countdown}s</span>
           </div>
         )}

       

         <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-purple-500/20 to-transparent flex justify-around items-end pb-1 pointer-events-none opacity-80">
           <div className="w-12 h-2 bg-purple-400/60 rounded-full animate-pulse shadow-[0_0_10px_rgba(192,132,252,0.8)]"></div>
           <div className="w-12 h-2 bg-fuchsia-400/60 rounded-full animate-pulse delay-75 shadow-[0_0_10px_rgba(232,121,249,0.8)]"></div>
           <div className="w-12 h-2 bg-indigo-400/60 rounded-full animate-pulse delay-150 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>
           <div className="w-12 h-2 bg-purple-400/60 rounded-full animate-pulse shadow-[0_0_10px_rgba(192,132,252,0.8)]"></div>
         </div>

         {gameState === 'idle' && (
           <div className="text-center z-10 px-4 space-y-4">
             <div className="w-16 h-16 bg-purple-900/50 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border-2 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse">
               <Sparkles className="w-8 h-8 text-purple-300" />
             </div>
             
             <div className="space-y-1">
               <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">Participante:</p>
               <p className="text-sm md:text-base text-pink-300 font-black drop-shadow-md">
                <span>PARTICIPANTE: {savedData.participantName || participantName}</span>
               </p>
             </div>

             <div className="w-full max-w-xs mx-auto space-y-1">
               <label className="text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1">
                 <Users className="w-3.5 h-3.5" /> Selecciona categoría:
               </label>
               <div className="grid grid-cols-2 gap-2">
                 <button
                   type="button"
                   onClick={() => setParticipantCategory('NIÑO')}
                   className={`py-2 rounded-xl font-black text-xs border-2 transition-all cursor-pointer ${
                     participantCategory === 'NIÑO' 
                       ? 'bg-sky-500/30 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.4)]' 
                       : 'bg-purple-950/50 border-purple-500/30 text-purple-400 hover:border-purple-500/60'
                   }`}
                 >
                   👦 NIÑO
                 </button>
                 <button
                   type="button"
                   onClick={() => setParticipantCategory('NIÑA')}
                   className={`py-2 rounded-xl font-black text-xs border-2 transition-all cursor-pointer ${
                     participantCategory === 'NIÑA' 
                       ? 'bg-pink-500/30 border-pink-400 text-pink-200 shadow-[0_0_15px_rgba(244,114,182,0.4)]' 
                       : 'bg-purple-950/50 border-purple-500/30 text-purple-400 hover:border-purple-500/60'
                   }`}
                 >
                   👧 NIÑA
                 </button>
               </div>
             </div>

             <button
               onClick={startChaosGame}
               className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs md:text-sm px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer transition-all transform hover:scale-105 border-2 border-white/20 flex items-center gap-2 mx-auto mt-2"
             >
               <Play className="w-5 h-5 fill-current" /> {attempts === 0 ? 'INICIAR JUEGO DE CAJAS' : '1 TIRO MÁS'}
             </button>
           </div>
         )}

         <div 
           ref={containerRef} 
           className={`absolute inset-0 overflow-hidden [transform-style:preserve-3d] ${gameState === 'idle' || gameState === 'won' ? 'hidden' : 'block'}`}
         >
           {boxesConfig.map((box) => (
             <div
               key={box.id}
               className="absolute top-1/2 left-1/2 -ml-8 -mt-8 md:-ml-10 md:-mt-10 w-16 h-16 md:w-20 md:h-20 transition-transform duration-75 [transform-style:preserve-3d]"
               style={{ transform: 'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)' }}
             >
               <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${box.bg} border-2 border-white/90 ${box.glow} flex flex-col items-center justify-center font-black shadow-[0_10px_25px_rgba(0,0,0,0.5)] [transform:translateZ(32px)] md:[transform:translateZ(36px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 md:h-3.5 ${box.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 md:w-3.5 ${box.ribbon} shadow-sm`}></div>
                 <div className="absolute -top-2.5 w-4 h-4 rounded-full bg-white border border-purple-300 flex items-center justify-center shadow-md">
                   <Star className="w-3 h-3 text-purple-600 fill-purple-400" />
                 </div>
                 <span className={`relative z-10 ${box.text} text-xs md:text-sm font-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
                   #{box.number} 
                 </span>
               </div>

               <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${box.bg} border-2 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateY(180deg)_translateZ(32px)] md:[transform:rotateY(180deg)_translateZ(36px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 md:h-3.5 ${box.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 md:w-3.5 ${box.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${box.text} text-xs md:text-sm font-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
                   #{box.number}
                 </span>
               </div>

               <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${box.bg} border-2 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateY(-90deg)_translateZ(32px)] md:[transform:rotateY(-90deg)_translateZ(36px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 md:h-3.5 ${box.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 md:w-3.5 ${box.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${box.text} text-xs md:text-sm font-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
                   #{box.number}
                 </span>
               </div>

               <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${box.bg} border-2 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateY(90deg)_translateZ(32px)] md:[transform:rotateY(90deg)_translateZ(36px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 md:h-3.5 ${box.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 md:w-3.5 ${box.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${box.text} text-xs md:text-sm font-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
                   #{box.number}
                 </span>
               </div>

               <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${box.bg} border-2 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateX(90deg)_translateZ(32px)] md:[transform:rotateX(90deg)_translateZ(36px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 md:h-3.5 ${box.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 md:w-3.5 ${box.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${box.text} text-xs md:text-sm font-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
                   #{box.number}
                 </span>
               </div>

               <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${box.bg} border-2 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateX(-90deg)_translateZ(32px)] md:[transform:rotateX(-90deg)_translateZ(36px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 md:h-3.5 ${box.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 md:w-3.5 ${box.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${box.text} text-xs md:text-sm font-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]`}>
                   #{box.number}
                 </span>
               </div>
             </div>
           ))}
         </div>

         {gameState === 'won' && winningBox && (
           <div className="flex flex-col items-center justify-center space-y-4 z-25 animate-fadeIn [perspective:1000px]">
             
             <div className="absolute -inset-10 bg-gradient-to-r from-amber-400/20 via-fuchsia-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse pointer-events-none"></div>

             <div 
               ref={winningBoxRef}
               className="relative w-28 h-28 md:w-32 md:h-32 [transform-style:preserve-3d]"
               style={{ transform: 'rotateX(20deg) rotateY(0deg) rotateZ(5deg)' }}
             >
               <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${winningBox.bg} border-4 border-white ${winningBox.glow} flex flex-col items-center justify-center font-black shadow-[0_15px_40px_rgba(0,0,0,0.6)] [transform:translateZ(54px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <div className="absolute -top-3 w-6 h-6 rounded-full bg-white border-2 border-purple-300 flex items-center justify-center shadow-lg">
                   <Trophy className="w-3.5 h-3.5 text-amber-500" />
                 </div>
                 <span className={`relative z-10 ${winningBox.text} text-base md:text-xl font-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]`}>
                   #{winningBox.number}
                 </span>
                 <span className={`relative z-10 ${winningBox.text} text-[10px] uppercase font-extrabold tracking-wider mt-0.5`}>
                   {winningBox.description}
                 </span>
               </div>

               <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${winningBox.bg} border-4 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateY(180deg)_translateZ(54px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${winningBox.text} text-base md:text-xl font-black`}>#{winningBox.number}</span>
               </div>

               <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${winningBox.bg} border-4 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateY(-90deg)_translateZ(54px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${winningBox.text} text-base md:text-xl font-black`}>#{winningBox.number}</span>
               </div>

               <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${winningBox.bg} border-4 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateY(90deg)_translateZ(54px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${winningBox.text} text-base md:text-xl font-black`}>#{winningBox.number}</span>
               </div>

               <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${winningBox.bg} border-4 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateX(90deg)_translateZ(54px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${winningBox.text} text-base md:text-xl font-black`}>#{winningBox.number}</span>
               </div>

               <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${winningBox.bg} border-4 border-white/80 flex flex-col items-center justify-center font-black [transform:rotateX(-90deg)_translateZ(54px)]`}>
                 <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 ${winningBox.ribbon} shadow-sm`}></div>
                 <span className={`relative z-10 ${winningBox.text} text-base md:text-xl font-black`}>#{winningBox.number}</span>
               </div>
             </div>

             <div className="text-center space-y-1">
               <h3 className="text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-fuchsia-300 animate-pulse">
                 ¡CAJA GANADORA: #{winningBox.number}!
               </h3>
          <p className="text-xs text-purple-200 font-bold">
  {winningBox.description} - ¡Felicidades {JSON.parse(localStorage.getItem('cosmos_participant') || '{}').participantName || 'Invitado'}! 🎉
</p>
             </div>

             <div className="flex items-center gap-3 pt-2">
               {attempts < 2 && (
                 <button
                   onClick={resetGame}
                   className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
                 >
                   <RotateCcw className="w-4 h-4" />
                   <span>Intentar de nuevo</span>
                 </button>
               )}
               <button
                 onClick={handleGoToBingo}
                 className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer transition-all transform hover:scale-105 flex items-center gap-2 border border-white/40 animate-bounce"
               >
                 <span>Ir al Bingo</span>
                 <ArrowRight className="w-4 h-4" />
               </button>
             </div>
           </div>
         )}

       </div>

       <div className="w-full flex items-center justify-between text-xs text-purple-800 font-bold px-2">
         <span className="flex items-center gap-1">
           <Trophy className="w-3.5 h-3.5 text-purple-600" />
           Intento {attempts} de 2
         </span>
         <span>Cosmos Cute Sistema 🚀</span>
       </div>

     </div>

    </div>
  );
}