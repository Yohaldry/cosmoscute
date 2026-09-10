import React, { useState, useMemo, useEffect, useRef } from 'react';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, Sparkles, Star, Rocket, Gift, User } from 'lucide-react';

const tarjetonColumns = ['I', 'R', 'S', 'M', 'L'];

const generateRandomMasterCard = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0) {
        return [];
    }

    const totalCells = 20; // 4 filas x 5 columnas
    const specialIcons = ['⭐', '🍪', '❤️'];
    
    // Clonamos y barajamos los productos reales que trajiste de Firebase
    let productsPool = [...products].sort(() => Math.random() - 0.5);

    const specialIndices = new Set();
    while (specialIndices.size < 3 && specialIndices.size < specialIcons.length) {
        specialIndices.add(Math.floor(Math.random() * totalCells));
    }

    const flatCard = [];
    let productIndex = 0;

    for (let i = 0; i < totalCells; i++) {
        if (specialIndices.has(i) && specialIcons.length > 0) {
            flatCard.push({ 
                type: 'icon', 
                value: specialIcons.pop() 
            });
        } else {
            // Si tenemos más celdas que productos, los repetimos cíclicamente de forma segura
            const prod = productsPool[productIndex % productsPool.length];
            flatCard.push({ 
                type: 'product', 
                id: prod.id,          // El código de tu base de datos (ej. "02", "18")
                name: prod.name,      // El nombre del producto
                firebaseId: prod.firebaseId 
            });
            productIndex++;
        }
    }

    // Dividir en 4 filas de 5 elementos cada una
    const card = [];
    for (let i = 0; i < 4; i++) {
        card.push(flatCard.slice(i * 5, (i + 1) * 5));
    }
    
    return card;
};

export default function BingoGalactico() {
    const location = useLocation();
    const useNavigateHook = useNavigate();

const { winningBoxNumber, participantName, participantLastName, participantCategory } = location.state || {};

    const initialBoxesNumber = location.state?.winningBoxNumber ?? 15;

    const [productsData, setProductsData] = useState([]);
   const [bingoMasterCard, setBingoMasterCard] = useState(() => {
    return productsData && productsData.length > 0 ? generateRandomMasterCard(productsData) : [];
});
    const [drawnBalls, setDrawnBalls] = useState([]);
    const [currentBall, setCurrentBall] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [totalBalotas, setTotalBalotas] = useState(initialBoxesNumber);
    const [gameOver, setGameOver] = useState(false);
    const [showBingoAlert, setShowBingoAlert] = useState(false);
    const [hasWonBingo, setHasWonBingo] = useState(false);

    const [lineGlowEffect, setLineGlowEffect] = useState(false);
    
    const [showIntro, setShowIntro] = useState(true); 
    const [animateOut, setAnimateOut] = useState(false);

    const [showNameErrorModal, setShowNameErrorModal] = useState(false);

    const [globeEffect, setGlobeEffect] = useState('');
    const [wonProducts, setWonProducts] = useState([]);

    // Campos iniciados en blanco de manera segura y selector de género predeterminado en 'Niña'
    const [userNameInput, setUserNameInput] = useState('');
    const [userLastNameInput, setUserLastNameInput] = useState('');
    const [userGender, setUserGender] = useState('Niña');

    const [alertCountdown, setAlertCountdown] = useState(5); // <--- Este faltaba


    const [showLineAlert, setShowLineAlert] = useState(false);
const [hasWonLine, setHasWonLine] = useState(false); // Para que la alerta de línea solo salte la primera vez que se completa una

const verificarLineaBingo = (currentDrawn) => {
        if (hasWonLine) return;

        const filas = bingoMasterCard;
        if (!filas || filas.length === 0) return;

        const numFilas = filas.length;
        const numColumnas = filas[0].length;
        let lineCompleted = false;

        const drawnSet = new Set(currentDrawn.map(n => Number(n)));

        // 1. Verificar horizontales
        for (let i = 0; i < numFilas; i++) {
            const productosFila = filas[i].filter(cell => cell && cell.type === 'product');
            if (productosFila.length > 0) {
                const todasMarcadas = productosFila.every(cell => drawnSet.has(Number(cell.id)));
                if (todasMarcadas) {
                    lineCompleted = true;
                    break;
                }
            }
        }

        // 2. Verificar verticales
        if (!lineCompleted) {
            for (let col = 0; col < numColumnas; col++) {
                let columnaProductos = [];
                for (let row = 0; row < numFilas; row++) {
                    const cell = filas[row][col];
                    if (cell && cell.type === 'product') {
                        columnaProductos.push(cell);
                    }
                }
                if (columnaProductos.length > 0) {
                    const todasMarcadasCol = columnaProductos.every(cell => drawnSet.has(Number(cell.id)));
                    if (todasMarcadasCol) {
                        lineCompleted = true;
                        break;
                    }
                }
            }
        }

        // Si se completa una línea, aplicamos el efecto de brillo por 5 segundos sin abrir el modal
        if (lineCompleted && !hasWonLine) {
            setHasWonLine(true);
            setHasWonBingo(true);
            setLineGlowEffect(true); // <--- Enciende el brillo del tarjetón
            playSuccessSound();      // <--- Sonido de acierto especial

        
        }
    };

    const scrollContainerRef = useRef(null);

    const playCasinoSpinSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            let step = 0;
            const maxSteps = 16;
            const intervalTime = 90;

            const timer = setInterval(() => {
                step++;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = step === maxSteps ? 'triangle' : 'square';
                const baseFreq = 400 + (step * 55);
                osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + 0.08);

                if (step >= maxSteps) {
                    clearInterval(timer);
                    setTimeout(() => {
                        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                            const triumphOsc = ctx.createOscillator();
                            const triumphGain = ctx.createGain();
                            triumphOsc.type = 'triangle';
                            triumphOsc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.05));

                            triumphGain.gain.setValueAtTime(0.1, ctx.currentTime + (idx * 0.05));
                            triumphGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * 0.05) + 0.35);

                            triumphOsc.connect(triumphGain);
                            triumphGain.connect(ctx.destination);

                            triumphOsc.start(ctx.currentTime + (idx * 0.05));
                            triumphOsc.stop(ctx.currentTime + (idx * 0.05) + 0.35);
                        });
                    }, 50);
                }
            }, intervalTime);
        } catch (e) {
            console.error("Error al reproducir audio:", e);
        }
    };

    const playSuccessSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            const notes = [
                { freq: 987.77, time: 0 },
                { freq: 1318.51, time: 0.08 }
            ];

            notes.forEach(note => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
                
                gain.gain.setValueAtTime(0.18, ctx.currentTime + note.time);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + 0.35);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + note.time);
                osc.stop(ctx.currentTime + note.time + 0.35);
            });
        } catch (e) {
            console.error("Error al reproducir sonido de éxito:", e);
        }
    };

    const playErrorSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            [220, 185].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.12));
                gain.gain.setValueAtTime(0.15, ctx.currentTime + (idx * 0.12));
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * 0.12) + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + (idx * 0.12));
                osc.stop(ctx.currentTime + (idx * 0.12) + 0.25);
            });
        } catch (e) {
            console.error("Error al reproducir sonido de fallo:", e);
        }
    };

useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "productosBingo"), (querySnapshot) => {
        const items = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                firebaseId: doc.id,
                id: data.codigo,
                name: data.nombre,
            };
        });
        
        setProductsData(items);

        // Alerta y bloqueo si hay menos de 20 productos
        if (items.length < 20) {
            setBingoMasterCard([]);
            return;
        }

        const cardGenerada = generateRandomMasterCard(items);
        setBingoMasterCard(cardGenerada);
    }, (error) => {
        console.error("Error al escuchar productos:", error);
    });
    
    return () => unsubscribe();
}, []);

    useEffect(() => {
        if (currentBall !== null && scrollContainerRef.current && productsData.length > 0) {
            const container = scrollContainerRef.current;
            const productIndex = productsData.findIndex(p => Number(p.id) === currentBall);

            if (productIndex !== -1) {
                const productElement = container.querySelectorAll('.product-item')[productIndex];
                if (productElement) {
                    const targetScrollTop = productElement.offsetTop - (container.clientHeight / 2) + (productElement.offsetHeight / 2);
                    container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
                }
            }
        }
    }, [currentBall, productsData]);

    const allPossibleNumbers = useMemo(() => {
    return productsData.map(p => Number(p.id));
}, [productsData]);

const availableNumbers = useMemo(() => {
    const drawnSet = new Set(drawnBalls);
    return allPossibleNumbers.filter(num => !drawnSet.has(num));
}, [drawnBalls, allPossibleNumbers]);

const drawNextBall = () => {
    if (gameOver || totalBalotas <= 0) return;

    playCasinoSpinSound();

    let currentAvailable = availableNumbers;
    let updatedDrawnBalls;

    if (currentAvailable.length === 0) {
        updatedDrawnBalls = [];
        currentAvailable = allPossibleNumbers;
    }

    setIsDrawing(true);
    setGlobeEffect('');
    setCurrentBall(null);

   setTimeout(() => {
        // 🌟 OBTENER NÚMEROS DEL TARJETÓN CORRECTAMENTE (mapeando a Number)
        const masterNumbers = new Set(
            bingoMasterCard.flat()
                .filter(cell => cell && cell.type === 'product' && cell.id != null)
                .map(cell => Number(cell.id))
        );
        
        // Separar entre los que están en el tarjetón (verdes) y los demás (rojas)
        const greenAvailable = currentAvailable.filter(num => masterNumbers.has(Number(num)));
        const redAvailable = currentAvailable.filter(num => !masterNumbers.has(Number(num)));

        let newBall;
        // 70% de probabilidad de forzar una bola verde si quedan disponibles en el tarjetón
        const preferGreen = greenAvailable.length > 0 && Math.random() < 0.70;

        if (preferGreen && greenAvailable.length > 0) {
            const randomIndex = Math.floor(Math.random() * greenAvailable.length);
            newBall = greenAvailable[randomIndex];
        } else if (redAvailable.length > 0) {
            const randomIndex = Math.floor(Math.random() * redAvailable.length);
            newBall = redAvailable[randomIndex];
        } else {
            const randomIndex = Math.floor(Math.random() * currentAvailable.length);
            newBall = currentAvailable[randomIndex];
        }

        updatedDrawnBalls = [newBall, ...(currentAvailable.length === allPossibleNumbers.length ? [] : drawnBalls)];
        
        if (updatedDrawnBalls.length >= 100) {
            updatedDrawnBalls = [newBall];
        }

        setDrawnBalls(updatedDrawnBalls);

        const isInTarjeton = masterNumbers.has(Number(newBall));

        if (isInTarjeton) {
            setGlobeEffect('bg-green-500/50 border-green-300 shadow-[0_0_50px_rgba(34,197,94,0.9)] animate-pulse');
            playSuccessSound();
        } else {
            setGlobeEffect('bg-red-600/50 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.9)] animate-pulse');
            playErrorSound();
        }

        const nuevoTotal = totalBalotas - 1;
        setTotalBalotas(nuevoTotal);

        const matchedProduct = productsData.find(p => Number(p.id) === newBall);
        if (matchedProduct && !wonProducts.some(p => p.id === matchedProduct.id)) {
            setWonProducts(prev => [...prev, matchedProduct]);
        }

        verificarLineaBingo(updatedDrawnBalls);

        if (nuevoTotal === 0) {
            // Ya no disparamos el modal automáticamente aquí, 
            // solo marcamos el fin o dejamos que el botón active el resultado.
            setGameOver(true);
        }

        setIsDrawing(false);
        setCurrentBall(newBall);
        setTimeout(() => {
            setCurrentBall(null);
        }, 1000);

    }, 2000);
};

    const handleFinalizarJuego = () => {
        useNavigateHook('/');
    };

const closeIntro = () => {
    // Si el nombre está vacío, mostramos el modal cute en lugar de un alert plano
    if (!userNameInput || userNameInput.trim() === '') {
        setShowNameErrorModal(true);
        return; 
    }

    if (userNameInput.trim()) {
        localStorage.setItem('bingo_user_name', userNameInput.trim());
    }
    if (userLastNameInput && userLastNameInput.trim()) {
        localStorage.setItem('bingo_user_lastname', userLastNameInput.trim());
    }
    localStorage.setItem('bingo_user_gender', userGender);

    setAnimateOut(true);
    setTimeout(() => {
        setShowIntro(false);
    }, 600); 
};

    const renderTarjetonCell = (content) => {
        if (content === 'star') return <span className="text-xl sm:text-2xl animate-spin">⭐</span>;
        if (content === 'cookie') return <span className="text-xl sm:text-2xl">🍪</span>;
        if (content === 'heart') return <span className="text-xl sm:text-2xl animate-pulse">❤️</span>;
        if (typeof content === 'number') {
            return <span className="font-mono font-black text-xs sm:text-sm">{String(content).padStart(2, '0')}</span>;
        }
        return null;
    };

    return (
        <div className="h-screen w-screen bg-slate-900 font-sans flex items-center justify-center p-2 sm:p-4 overflow-hidden box-border select-none">
            
            <style>{`
                button, a, [role="button"], .cursor-pointer {
                    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 32 32'%3E%3Cdefs%3E%3Cfilter id='shadow' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeDropShadow dx='1' dy='2' stdDeviation='1' flood-color='%236b21a8' flood-opacity='0.3'/%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M16 27.5 C15.5 27.5 4 19 4 11 C4 7 7 4 11 4 C13.5 4 15.5 5.5 16 7 C16.5 5.5 18.5 4 21 4 C25 4 28 7 28 11 C28 19 16.5 27.5 16 27.5 Z' fill='%23f472b6' stroke='%23db2777' stroke-width='1.5' stroke-linejoin='round' filter='url(%23shadow)'/%3E%3C/svg%3E") 12 12, pointer !important;
                }
                
                @keyframes floatBall {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(15px, -20px) rotate(180deg); }
                    100% { transform: translate(-10px, 15px) rotate(360deg); }
                }
                .ball-floating {
                    animation: floatBall var(--random-duration, 1s) ease-in-out infinite alternate;
                    animation-delay: var(--random-delay, 0s);
                }

                @keyframes temuBgIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes temuBgOut { from { opacity: 1; } to { opacity: 0; } }
                
                @keyframes temuPanelIn { 
                    0% { transform: scale(0.3) translateY(-80px) rotate(-5deg); opacity: 0; } 
                    70% { transform: scale(1.08) translateY(10px) rotate(1.5deg); opacity: 1; } 
                    100% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; } 
                }
                @keyframes temuPanelOut { 
                    0% { transform: scale(1) translateY(0); opacity: 1; } 
                    100% { transform: scale(0.4) translateY(100px); opacity: 0; } 
                }

                @keyframes temuPop { 
                    0% { transform: scale(0); opacity: 0; } 
                    80% { transform: scale(1.12); opacity: 1; } 
                    100% { transform: scale(1); opacity: 1; } 
                }

                @keyframes temuBounceScale {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }

                @keyframes lightRay {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .anim-bg-in { animation: temuBgIn 0.3s ease-out forwards; }
                .anim-bg-out { animation: temuBgOut 0.3s ease-in forwards; }
                .anim-panel-in { animation: temuPanelIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .anim-panel-out { animation: temuPanelOut 0.5s ease-in forwards; }
                .anim-pop-1 { animation: temuPop 0.4s 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; }
                .anim-pop-2 { animation: temuPop 0.4s 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; }
                .anim-pop-3 { animation: temuPop 0.4s 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards; }
                .anim-bounce-pulse { animation: temuBounceScale 2s infinite ease-in-out; }
                .anim-ray { animation: lightRay 15s linear infinite; }
            `}</style>

       
{/* Modal Cute de Alerta: Nombre Requerido (Versión suave y fluida) */}
{showNameErrorModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
    {/* Cambiamos animate-bounce por una animación de zoom y fade mucho más limpia */}
    <div className="relative bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-900 p-1 rounded-[32px] shadow-[0_0_50px_rgba(236,72,153,0.7)] max-w-xs w-full transition-all transform animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-[#120421] rounded-[30px] p-6 text-center flex flex-col items-center space-y-3 relative overflow-hidden border border-pink-500/30">
        
        {/* Destellos de luz de fondo */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>

        {/* Icono tierno con brillo (Cambiamos animate-pulse fuerte por un rebote más sutil o estático) */}
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.8)] border-2 border-white/80">
          <span className="text-2xl">✨</span>
        </div>

        {/* Título */}
        <div className="space-y-1 relative z-10">
          <h3 className="text-lg font-black text-white tracking-wide uppercase drop-shadow-md">
            ¡Falta tu nombre! 🚀
          </h3>
        </div>

        {/* Mensaje cute */}
        <p className="text-xs text-purple-200/90 leading-relaxed font-medium relative z-10">
          Para iniciar esta misión estelar y registrar tus premios, por favor escribe el <span className="text-pink-300 font-bold">nombre del participante</span>.
        </p>

        {/* Botón de aceptación estilizado */}
        <button
          onClick={() => setShowNameErrorModal(false)}
          className="w-full mt-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-black text-xs py-3 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all transform active:scale-95 cursor-pointer border border-white/40 uppercase tracking-wider"
        >
          ¡Entendido, allá voy! 💫
        </button>
      </div>
    </div>
  </div>
)}
            {showBingoAlert && (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    {/* Rayo de luz de fondo giratorio y partículas estelares */}
    <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/20 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse"></div>
    
    <div className="bg-gradient-to-b from-[#3b1d59] via-[#1c0a33] to-[#0d031b] border-4 border-amber-400/90 rounded-[30px] max-w-md w-full p-4 sm:p-6 shadow-[0_0_90px_rgba(251,191,36,0.5)] flex flex-col items-center text-center space-y-3 relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Brillo superior estético */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/15 to-transparent pointer-events-none"></div>

        {/* Icono de Trofeo con efecto de pulso y resplandor */}
        <div className="relative mt-1 shrink-0">
            <div className="absolute -inset-3 bg-amber-500 rounded-full blur-lg opacity-60 animate-ping"></div>
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 border-2 border-white flex items-center justify-center shadow-[0_0_35px_rgba(251,191,36,0.9)] animate-bounce">
                <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-md" />
            </div>
        </div>

        

        {/* Título de Victoria con destellos */}
        <div className="space-y-0.5 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-inner">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" /> ¡Misión Galáctica Cumplida! <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide drop-shadow-lg uppercase leading-tight pt-1">
                ¡Felicidades, {String(participantName, participantLastName || '')}! ✨  
            </h3>
            <p className="text-[10px] sm:text-[11px] font-bold text-amber-300/90 tracking-wider uppercase">
                Categoría: {String(userGender || '')}
            </p>

            <p className="text-[11px] sm:text-xm text-purple-500/90 max-w-xs leading-relaxed shrink-0">{hasWonBingo ? '🎉 ¡GANó BINGO (LÍNEA)! 🎉' : '❌ NO COMPLETÓ BINGO LÍNEA'}</p>
        </div>

        <p className="text-[11px] sm:text-xs text-purple-200/90 max-w-xs leading-relaxed shrink-0">
            Has completado todas las balotas de la sesión estelar. Estos son los tesoros obtenidos:
        </p>

        {/* Lista de productos ganados con diseño espacial y scroll estilizado */}
        <div className="w-full max-h-36 sm:max-h-40 overflow-y-auto space-y-2 bg-purple-950/70 p-3 rounded-2xl border-2 border-amber-400/40 text-left shadow-inner custom-scrollbar shrink-0">
            {wonProducts.length > 0 ? (
                wonProducts.map((prod, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-purple-900/40 border border-amber-500/20 hover:border-amber-400/60 transition-all shadow-sm"
                    >
                        <span className="font-mono text-amber-400 font-black tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                            #{prod.id}
                        </span>
                        <span className="text-white font-semibold px-2 truncate">
                            {prod.name}
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse shrink-0" />
                    </div>
                ))
            ) : (
                <p className="text-center text-xs text-purple-300 py-3 font-medium">No se registraron productos en esta sesión.</p>
            )}
        </div>

        {/* Botón de acción con animación y brillo intenso */}
        <button
            onClick={handleFinalizarJuego}
            className="w-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 hover:brightness-110 text-white font-black text-xs sm:text-sm py-3 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.6)] transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-white/65 shrink-0 mt-1"
        >
            <span className="tracking-wider uppercase">Finalizar y Reclamar Misión</span>
            <ArrowRight className="w-4 h-4" />
        </button>
    </div>
</div>
            )}

            <div className="w-full max-w-7xl h-full max-h-[96vh] bg-slate-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-800 gap-2 p-3 sm:p-5">
                
                {/* Columna 1: Lista completa de Productos */}
                <div className="w-full lg:w-1/4 bg-slate-900/80 rounded-2xl border border-slate-800 p-3 flex flex-col h-1/3 lg:h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-black uppercase tracking-wider text-purple-400">TODOS LOS PRODUCTOS</h2>
                    </div>
                    <div className="grid grid-cols-2 text-[10px] font-bold text-slate-400 pb-1 border-b border-slate-800 uppercase px-1">
                        <span>ID</span>
                        <span>PRODUCTO</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-full space-y-2 pt-2 pr-1" ref={scrollContainerRef}>
                        {productsData.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-4">No hay productos registrados.</p>
                        ) : (
                            productsData.map((product, index) => {
                                const prodId = product.id ?? index;
                                const isCurrentWinner = currentBall === Number(prodId);
                                const isAlreadyDrawn = Array.isArray(drawnBalls) && drawnBalls.includes(Number(prodId));
                                
                                return (
                                    <div 
                                        key={product.firebaseId || `${prodId}-${index}`} 
                                        className={`product-item flex items-center justify-between p-2 rounded-xl text-xs transition-all border ${
                                            isCurrentWinner 
                                                ? 'bg-purple-600/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-[1.02]' 
                                                : isAlreadyDrawn 
                                                    ? 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 line-through' 
                                                    : 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="font-mono font-bold text-purple-300 w-8">{String(prodId).padStart(2, '0')}</span>
                                        <span className="flex-1 truncate px-2 font-medium">{product.name}</span>
                                        <span className="text-sm">🛍️</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Columna 2: Tómbola y Sorteo */}
                <div className="w-full lg:w-2/5 bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-between h-1/3 lg:h-full overflow-y-auto">
                    <div className="text-center">
                        <h1 className="text-base sm:text-lg font-black text-white tracking-widest">BINGO GALÁCTICO</h1>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-950/60 px-3 py-0.5 rounded-full border border-purple-800/50">
                            SORTEO GENERAL
                        </span>
                    </div>

                    <div className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-purple-500/50 bg-gradient-to-br from-purple-950 via-slate-900 to-black flex items-center justify-center shadow-2xl overflow-hidden my-2 transition-all duration-500 ${globeEffect}`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/20 pointer-events-none rounded-full"></div>
                        
                        <div className="z-10 flex items-center justify-center">
                            {isDrawing ? (
                                <div className="text-3xl animate-spin">🌀</div>
                            ) : currentBall !== null ? (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center font-mono font-black text-2xl sm:text-3xl shadow-[0_0_20px_rgba(236,72,153,0.8)] border-2 border-white/40 animate-pulse">
                                    {String(currentBall).padStart(2, '0')}
                                </div>
                            ) : (
                                <div className="text-xs font-black tracking-widest text-purple-300 bg-purple-900/50 px-4 py-1.5 rounded-full border border-purple-500/30">
                                    {totalBalotas === 0 ? 'FINALIZADO' : 'LISTO'}
                                </div>
                            )}
                        </div>

                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {availableNumbers.slice(0, 15).map((num, index) => {
                                const randomDelay = (index * 0.15) % 1.5;
                                const randomDuration = 0.8 + ((index * 0.2) % 1.2);
                                return (
                                    <div 
                                        key={index}
                                        className="absolute ball-floating w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/40 text-[9px] font-mono text-purple-200 flex items-center justify-center"
                                        style={{
                                            top: `${(index * 25) % 80}%`,
                                            left: `${(index * 35) % 80}%`,
                                            '--random-delay': `${randomDelay}s`,
                                            '--random-duration': `${randomDuration}s`
                                        }}
                                    >
                                        {String(num).padStart(2, '0')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full bg-slate-950/80 rounded-xl p-2 border border-slate-800 flex items-center justify-center gap-1.5 overflow-x-auto">
                        {drawnBalls.slice(0, 6).map((ball, index) => (
                            <div key={index} className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-white/20 shadow-md">
                                {String(ball).padStart(2, '0')}
                            </div>
                        ))}
                    </div>

                   {/* 1. Botón original de Girar/Sortear (Se deshabilita cuando totalBalotas === 0) */}
<button
    onClick={drawNextBall}
    disabled={isDrawing || totalBalotas === 0}
    className={`relative group overflow-hidden w-full text-white font-black text-xs sm:text-sm py-4 px-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] transition-all transform active:scale-95 uppercase tracking-wider flex items-center justify-between border-2 ${
        totalBalotas === 0 
            ? 'bg-gradient-to-b from-slate-800 via-slate-900 to-purple-950 border-purple-500/40 opacity-50 cursor-not-allowed filter grayscale' 
            : isDrawing 
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 via-indigo-500 via-amber-400 to-pink-500 bg-[length:400%_400%] animate-[gradient_2s_linear_infinite] border-white shadow-[0_0_30px_rgba(236,72,153,0.8)] cursor-wait' 
                : 'bg-gradient-to-b from-slate-800 via-slate-900 to-purple-950 border-purple-500/40 hover:border-pink-500 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] cursor-pointer'
    }`}
>
    {/* Patrones de destellos estelares (estrellitas flotantes al girar) */}
    {isDrawing && (
        <div className="absolute inset-0 flex items-center justify-around opacity-75 pointer-events-none overflow-hidden">
            <span className="animate-ping text-xs">✨</span>
            <span className="animate-bounce text-xs">💖</span>
            <span className="animate-pulse text-xs">⭐</span>
            <span className="animate-ping text-xs">🌟</span>
        </div>
    )}

    {/* Texto y Estado */}
    <div className="flex items-center gap-3 relative z-10">
        <div className={`w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/50 flex items-center justify-center shadow-inner ${isDrawing ? 'animate-spin' : ''}`}>
            <span className="text-base">{totalBalotas === 0 ? '🚀' : isDrawing ? '✨' : '🎰'}</span>
        </div>
        <div className="flex flex-col text-left">
            <span className="text-[9px] text-pink-300 font-bold tracking-widest uppercase">
                {isDrawing ? '✨ Mágico & Galáctico ✨' : 'Palanca Galáctica'}
            </span>
            <span className="text-xs sm:text-sm text-white drop-shadow-md">
                {isDrawing ? '¡Girando Balota...' : totalBalotas === 0 ? 'Misión Finalizada' : 'Accionar Tómbola'}
            </span>
        </div>
    </div>

    {/* Simulación visual de la perilla de la palanca arcade */}
    <div className="relative flex items-center z-10">
        <div className="w-8 h-2 bg-gradient-to-r from-slate-600 to-slate-400 rounded-l-full border-y border-slate-300"></div>
        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr from-pink-600 via-purple-500 to-amber-400 border-2 border-white shadow-[0_0_12px_rgba(236,72,153,0.9)] flex items-center justify-center transform group-hover:translate-x-1 transition-transform ${isDrawing ? 'animate-bounce' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-white/80"></span>
        </div>
    </div>
</button>

{/* 2. Nuevo Botón que aparece únicamente cuando las balotas llegan a 0 */}
{totalBalotas === 0 && (
    <button
        onClick={() => {
            setGameOver(true);
            setShowBingoAlert(true);
        }}
        className="w-full mt-3 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:brightness-110 text-white font-black text-xs sm:text-sm py-3.5 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.6)] transition-all transform active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2 animate-bounce cursor-pointer"
    >
        <span>🏆</span> Ver Resultado Final
    </button>
)}
                </div>

                {/* Columna 3: Tarjetón */}
<div className={`w-full lg:w-2/5 rounded-2xl border p-4 flex flex-col h-1/3 lg:h-full transition-all duration-500 ${
                lineGlowEffect 
                    ? 'border-amber-300 shadow-[0_0_50px_rgba(253,230,138,0.7)] bg-[#fef9c3] text-slate-900' 
                    : 'border-slate-800 bg-slate-900/80 text-white'
            }`}>
   <div>
     <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <h2 className={`text-xs font-black uppercase tracking-wider ${lineGlowEffect ? 'text-amber-900' : 'text-purple-400'}`}>TARJETÓN ESTELAR</h2>
                            {lineGlowEffect && (
                                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-bounce">
                                    ¡BINGO! 🎉
                                </span>
                            )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            lineGlowEffect 
                                ? 'text-amber-900 bg-amber-200 border-amber-400' 
                                : 'text-purple-300 bg-purple-950 border-purple-800'
                        }`}>
                            {participantName ? `${participantName} ${participantLastName || ''}` : 'Participante'}
                        </span>
                    </div>
        
        {/* PARRILLA DE CELDAS DINÁMICA */}
        <div className="grid grid-cols-5 gap-1.5">
            {tarjetonColumns && tarjetonColumns.map((col, idx) => (
                <div key={`${col}-${idx}`} className={`text-center font-black text-xs py-1 rounded-lg border ${
                    lineGlowEffect 
                        ? 'bg-amber-200 text-amber-900 border-amber-300' 
                        : 'bg-purple-950 text-purple-300 border-purple-800/50'
                }`}>
                    {col}
                </div>
            ))}
            
          {Array.isArray(bingoMasterCard) && bingoMasterCard.length > 0 && (() => {
              // 1. Identificamos exactamente cuáles índices de fila o columna completaron línea
              const drawnSet = new Set(drawnBalls.map(n => Number(n)));
              let winningRow = -1;
              let winningCol = -1;

              for (let r = 0; r < bingoMasterCard.length; r++) {
                  const prods = bingoMasterCard[r].filter(c => c && c.type === 'product');
                  if (prods.length > 0 && prods.every(c => drawnSet.has(Number(c.id)))) {
                      winningRow = r;
                      break;
                  }
              }

              if (winningRow === -1) {
                  for (let c = 0; c < bingoMasterCard[0].length; c++) {
                      let colProds = [];
                      for (let r = 0; r < bingoMasterCard.length; r++) {
                          const cell = bingoMasterCard[r][c];
                          if (cell && cell.type === 'product') colProds.push(cell);
                      }
                      if (colProds.length > 0 && colProds.every(cell => drawnSet.has(Number(cell.id)))) {
                          winningCol = c;
                          break;
                      }
                  }
              }

              // 2. Renderizamos las celdas evaluando si pertenecen a la línea ganadora
              return bingoMasterCard.flat().map((cell, index) => {
                  const rowIndex = Math.floor(index / 5);
                  const colIndex = index % 5;
                  const isSpecial = cell && cell.type === 'icon';
                  const isMatch = cell && cell.type === 'product' && drawnSet.has(Number(cell.id));
                  const isWinningLineCell = (winningRow !== -1 && rowIndex === winningRow) || (winningCol !== -1 && colIndex === winningCol);
                  
                  return (
                      <div 
                          key={index} 
                          className={`h-14 sm:h-16 rounded-xl p-1.5 flex flex-col items-center justify-center border transition-all duration-300 ${
                              isWinningLineCell && lineGlowEffect
                                  ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-105 font-black ring-2 ring-white animate-pulse'
                                  : isMatch 
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.8)] scale-105 font-bold animate-pulse' 
                                  : isSpecial
                                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-pink-400 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)] scale-105 font-bold'
                                  : lineGlowEffect 
                                  ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200' 
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                      >
                          {isSpecial ? (
                              <span className="text-base text-center">{cell.value}</span>
                          ) : cell && cell.type === 'product' ? (
                              <span className={`text-sm font-black tracking-wider drop-shadow ${
                                  isWinningLineCell && lineGlowEffect ? 'text-slate-950' : isMatch ? 'text-white' : lineGlowEffect ? 'text-amber-950' : 'text-white'
                              }`}>
                                  {cell.id}
                              </span>
                          ) : (
                              <span className={`text-[10px] ${lineGlowEffect ? 'text-amber-700/60' : 'text-slate-500'}`}>--</span>
                          )}
                      </div>
                  );
              });
          })()}
        </div>

        {/* 🔴 SECCIÓN: Balotas Rojas (Fallidas / Fuera del tarjetón) */}
        <div className={`mt-3 p-2.5 rounded-xl border ${
            lineGlowEffect ? 'bg-amber-200/50 border-amber-300' : 'bg-slate-950/70 border-red-500/20'
        }`}>
            <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    lineGlowEffect ? 'text-amber-900' : 'text-red-400'
                }`}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Balotas Rojas (Fuera del Tarjetón)
                </span>
                <span className={`text-[10px] font-mono ${lineGlowEffect ? 'text-amber-800' : 'text-slate-400'}`}>
                    {drawnBalls.filter(ball => {
                        const masterNumbers = new Set(bingoMasterCard.flat().filter(item => item && item.type === 'product').map(item => Number(item.id)));
                        return !masterNumbers.has(Number(ball));
                    }).length}
                </span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1">
                {(() => {
                    const masterNumbers = new Set(bingoMasterCard.flat().filter(item => item && item.type === 'product').map(item => Number(item.id)));
                    const redBalls = drawnBalls.filter(ball => !masterNumbers.has(Number(ball)));

                    if (redBalls.length === 0) {
                        return <p className={`text-[10px] italic w-full text-center py-1 ${lineGlowEffect ? 'text-amber-800/70' : 'text-slate-500'}`}>Aún no hay balotas rojas registradas.</p>;
                    }

                    return redBalls.map((ballNum, idx) => (
                        <div 
                            key={idx}
                            className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-rose-900 border border-red-400/80 text-white text-[11px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-fade-in"
                        >
                            {ballNum}
                        </div>
                    ));
                })()}
            </div>
        </div>
    </div>

    {/* Alerta Temporal de Línea Completa */}
   {showLineAlert && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md pointer-events-auto"></div>

        <div className="relative bg-gradient-to-br from-amber-500 via-pink-600 to-purple-900 p-1 rounded-[32px] shadow-[0_0_80px_rgba(251,191,36,0.8)] max-w-sm w-full mx-4 animate-bounce pointer-events-auto">
          <div className="bg-[#120421] rounded-[30px] p-6 text-center flex flex-col items-center space-y-3 relative overflow-hidden">
            
            <div className="absolute top-3 right-3 bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>Cerrando en:</span>
              <span className="text-white font-black">{alertCountdown}s</span>
            </div>

            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-400/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/30 rounded-full blur-2xl animate-pulse"></div>

            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.9)] border-2 border-white">
              <span className="text-3xl">🎁</span>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                ✨ ¡LÍNEA COMPLETADA! ✨
              </div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-lg">
                ¡BINGO ESTELAR!
              </h2>
            </div>

            <p className="text-xs text-purple-200 leading-relaxed font-medium relative z-10">
              ¡Felicidades <span className="text-amber-400 font-bold">{userNameInput || 'Participante'}</span>! Completaste una línea y ganaste <span className="text-pink-300 font-bold underline">un producto totalmente gratis</span>. 🚀
            </p>

            <div className="w-full bg-purple-950/80 h-1.5 rounded-full overflow-hidden mt-1 border border-purple-800/50">
              <div className="bg-gradient-to-r from-amber-400 to-pink-500 h-full w-full animate-[shrink_5s_linear_forwards]"></div>
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="grid grid-cols-2 gap-2 my-2">
        <div className={`rounded-xl p-2 border flex flex-col items-center justify-center ${
            lineGlowEffect ? 'bg-amber-200/60 border-amber-300' : 'bg-slate-950/80 border-slate-800'
        }`}>
            <span className={`text-[9px] font-bold uppercase ${lineGlowEffect ? 'text-amber-900' : 'text-slate-400'}`}>ESTADO</span>
            <span className={`text-xs font-black ${lineGlowEffect ? 'text-amber-950' : 'text-pink-400'}`}>
                {totalBalotas === 0 ? 'FINALIZADO' : 'ACTIVO'}
            </span>
            
        </div>
        <div className={`rounded-xl p-2 border flex flex-col items-center justify-center ${
            lineGlowEffect ? 'bg-amber-200/60 border-amber-300' : 'bg-slate-950/80 border-slate-800'
        }`}>
            <span className={`text-[9px] font-bold uppercase ${lineGlowEffect ? 'text-amber-900' : 'text-slate-400'}`}>BALOTAS RESTANTES</span>
            <span className={`text-sm font-mono font-black ${lineGlowEffect ? 'text-amber-950' : 'text-purple-400'}`}>{totalBalotas}</span>
        </div>
    </div>
</div>

            </div>
        </div>
    );
}

