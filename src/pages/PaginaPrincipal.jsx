import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Gift, Rocket, ShoppingBag, ChevronRight, 
  ShieldCheck, Truck, RefreshCw, Target, Eye, Compass, 
  Globe, MessageCircle, Scissors, Palette, Layers, Grid 
} from 'lucide-react';
import ModalPedido from '../components/ModalPedido';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';

const PALETTES = [
  { b: 'border-pink-300 hover:border-pink-500', bg: 'bg-pink-50 text-pink-700 border-pink-200', text: 'text-pink-600' },
  { b: 'border-purple-300 hover:border-purple-500', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600' },
  { b: 'border-amber-300 hover:border-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' },
  { b: 'border-fuchsia-300 hover:border-fuchsia-500', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', text: 'text-fuchsia-600' },
  { b: 'border-cyan-300 hover:border-cyan-500', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', text: 'text-cyan-600' }
];

const CREATIVE_SERVICES = [
  { t: 'Party & Cake Toppers', d: 'Decoraciones 3D para tortas y fiestas.', icon: Scissors, c: 'bg-pink-50 text-pink-600 border-pink-100' },
  { t: 'Empaques a Medida', d: 'Cajitas y etiquetas personalizadas.', icon: Layers, c: 'bg-purple-50 text-purple-600 border-purple-100' },
  { t: 'Diseños Exclusivos', d: 'Creamos el arte según tu temática.', icon: Palette, c: 'bg-amber-50 text-amber-600 border-amber-100' }
];

const BENEFITS = [
  { icon: Truck, t: 'Envíos rápidos' },
  { icon: ShieldCheck, t: 'Compra segura' },
  { icon: Gift, t: 'Regalos sorpresa' },
  { icon: RefreshCw, t: 'En vivo y transparente' }
];

const SocialIcon = ({ name, ...props }) => {
  if (name === 'Instagram') return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
  if (name === 'TikTok') return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
  return name === 'WhatsApp' ? <MessageCircle {...props} /> : <Globe {...props} />;
};

const SOCIALS = [
  { name: 'Instagram', c: 'hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200', href: '#' },
  { name: 'TikTok', c: 'hover:bg-gray-50 hover:text-black hover:border-gray-300', href: '#' },
  { name: 'WhatsApp', c: 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200', href: '#' },
  { name: 'Sitio Web', c: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200', href: '#' }
];

export default function PaginaPrincipal() {
  const [isOpen, setIsOpen] = useState(false);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const querySnapshot = await getDocs(collection(db, 'categorias'));
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCats(lista);
      } catch (error) {
        console.error("Error cargando categorías de Firebase:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategorias();
  }, []);

  // Limitamos a un máximo de 7 categorías en la vista principal
  const displayedCats = cats.slice(0, 7);

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-gray-800 font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden">
      
      {/* 1. TICKER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 text-white py-1.5 overflow-hidden">
        <div className="flex justify-around items-center max-w-6xl mx-auto px-3 text-[10px] md:text-xs font-medium gap-4 overflow-x-auto no-scrollbar">
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              <b.icon className="w-3.5 h-3.5 text-pink-400" />
              <span>{b.t}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 space-y-4 py-4">

        {/* 2. INTRODUCCIÓN */}
        <section className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" /> CosmosCute 🪐
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900">
                Tienda Galáctica & <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Juegos en Vivo</span>
              </h1>
              <p className="text-gray-500 text-xs max-w-md leading-relaxed">
                Colecciones exclusivas y dinámicas en vivo para ganar premios al instante.
              </p>
            </div>
            <button onClick={() => setIsOpen(true)} className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> COMPRAR PARTIDA 🚀
            </button>
          </div>
        </section>

        {/* 3. CATEGORÍAS (MÁXIMO 7 + TARJETA VER MÁS) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
            <div>
              <div className="inline-flex items-center gap-1 text-pink-600 text-[10px] font-bold tracking-widest uppercase">
                <Rocket className="w-3 h-3" /> Catálogo
              </div>
              <h2 className="text-sm sm:text-base font-black text-gray-900">
                EXPLORA POR <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">CATEGORÍAS</span>
              </h2>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">3 en móvil / 5 en PC</span>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-gray-400">Cargando categorías de la base de datos...</div>
          ) : cats.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">No se encontraron categorías registradas.</div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-2.5">
              {displayedCats.map((cat, i) => {
                const s = PALETTES[i % PALETTES.length];
                return (
                  <div 
                    key={cat.id || i} 
                    onClick={() => navigate(`/categoria/${encodeURIComponent(cat.nombre)}`)} 
                    className={`group relative rounded-xl p-[1px] bg-white border-2 ${s.b} shadow-xs transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-md`}
                  >
                    <div className="p-2 flex flex-col justify-between h-full space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border truncate ${s.bg}`}>POPULAR</span>
                        <span className="text-[8px] font-bold text-gray-600 bg-gray-100 px-1 py-0.2 rounded">VER</span>
                      </div>
                      
                      {/* Foto de la Categoría traída desde Firebase */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={cat.image || 'https://res.cloudinary.com/dtkirmtfq/image/upload/v1788650769/CosmosCute/bek3cv3wam7jcdo6itnj.jpg'} 
                          alt={cat.nombre} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute bottom-1 right-1 p-1 rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                          <ShoppingBag className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      <div className="space-y-0.2">
                        <h3 className="text-[11px] font-black text-gray-900 group-hover:text-purple-600 transition-colors leading-tight line-clamp-1 uppercase">
                          {cat.nombre}
                        </h3>
                        <p className="text-[9px] text-gray-500 leading-tight line-clamp-1">
                          {cat.subtitle || 'Exclusivo'}
                        </p>
                      </div>

                      <div className={`pt-1 flex items-center justify-between text-[9px] font-bold ${s.text} border-t border-gray-100`}>
                        <span>Ver productos</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* TARJETA ESPECIAL: VER MÁS (Redirige a /categorias con Link) */}
              <Link 
                to="/categorias" 
                className="group relative rounded-xl p-[1px] bg-gradient-to-br from-pink-500 to-purple-600 border-2 border-transparent shadow-xs transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-md"
              >
                <div className="p-3 bg-white rounded-[10px] flex flex-col items-center justify-center text-center h-full space-y-2">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black text-gray-900 group-hover:text-purple-600 transition-colors uppercase">Ver Más</h3>
                    <p className="text-[9px] text-gray-400">Explora todo el catálogo</p>
                  </div>
                  <span className="text-[9px] font-bold text-pink-600 flex items-center gap-1 pt-1">
                    Ver todas <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </Link>

            </div>
          )}
        </section>

        {/* 4. PAPELERÍA CREATIVA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-100/80 via-purple-100/60 to-pink-50 rounded-3xl border-2 border-pink-300/80 p-5 sm:p-6 space-y-4 shadow-xl shadow-pink-500/10 backdrop-blur-md">
        {/* Elemento decorativo flotante de fondo */}
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-pink-300/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-36 h-36 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />

        {/* Cabecera */}
        <div className="relative z-10 flex items-center justify-between border-b-2 border-pink-200/60 pb-3">
          <div className="space-y-0.5">
            <span className="inline-block text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 rounded-full shadow-md shadow-pink-500/20">
              ✨ Servicio Exclusivo
            </span>
            <h2 className="text-sm sm:text-base font-black text-purple-950 tracking-tight mt-1">
              PAPELERÍA CREATIVA <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">A TU MEDIDA</span>
            </h2>
          </div>
          <a 
            href="https://wa.me/573026158662?text=¡Hola!%20Me%20interesa%20cotizar%20un%20diseño%20de%20papelería%20creativa.%20✨" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl shadow-lg shadow-pink-500/25 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer no-underline"
          >
            Cotizar <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Tarjetas de servicios con tonos pasteles vibrantes y efectos */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CREATIVE_SERVICES.map((srv, idx) => (
            <div key={idx} className="group bg-white/90 hover:bg-white rounded-2xl p-3.5 border-2 border-pink-100 hover:border-pink-300 shadow-sm hover:shadow-md transition-all duration-300 space-y-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl shadow-inner border ${srv.c} group-hover:scale-110 transition-transform`}>
                  <srv.icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold text-purple-950 leading-tight uppercase">{srv.t}</h3>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed font-medium pl-0.5">{srv.d}</p>
            </div>
          ))}
        </div>

        {/* Sección de pasos minimalista y ultra colorida */}
        <div className="relative z-10 bg-white/90 rounded-2xl p-3.5 border-2 border-purple-200/60 shadow-sm space-y-2.5">
          <p className="text-[10px] font-black text-purple-800 uppercase tracking-widest text-center flex items-center justify-center gap-1">
            <span>🌸</span> ¿Cómo ordenar tu pedido personalizado? <span>🌸</span>
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1 bg-pink-50/60 p-2 rounded-xl border border-pink-200/50">
              <span className="w-6 h-6 mx-auto rounded-xl bg-gradient-to-tr from-pink-500 to-pink-400 text-white text-[11px] font-black flex items-center justify-center shadow-md shadow-pink-500/20">1</span>
              <p className="text-[11px] font-black text-purple-950">Elige la idea</p>
            </div>
            <div className="space-y-1 bg-purple-50/60 p-2 rounded-xl border border-purple-200/50">
              <span className="w-6 h-6 mx-auto rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white text-[11px] font-black flex items-center justify-center shadow-md shadow-purple-500/20">2</span>
              <p className="text-[11px] font-black text-purple-950">Cotizamos</p>
            </div>
            <div className="space-y-1 bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/50">
              <span className="w-6 h-6 mx-auto rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white text-[11px] font-black flex items-center justify-center shadow-md shadow-emerald-500/20">3</span>
              <p className="text-[11px] font-black text-purple-950">¡Recibes!</p>
            </div>
          </div>
        </div>
      </section>

        {/* 5. NOSOTROS & REDES */}
      <section className="bg-gradient-to-br from-white via-purple-50/40 to-pink-50/30 rounded-3xl border-2 border-pink-200/80 p-5 sm:p-6 space-y-4 shadow-xl shadow-pink-500/5 backdrop-blur-md">
        <div className="text-center space-y-1.5">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 rounded-full shadow-md shadow-pink-500/20">
            🌌 Sobre Nosotros & Conexión
          </span>
          <h2 className="text-base sm:text-lg font-black text-purple-950 tracking-tight">
            Nuestra Esencia y <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Comunidad</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/90 rounded-2xl p-3.5 border border-pink-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-xs">
              <div className="p-1.5 rounded-xl bg-pink-100/60 text-pink-600 border border-pink-200">
                <Target className="w-4 h-4" />
              </div>
              <span>Misión</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">Experiencias únicas en sorpresas y juegos en vivo.</p>
          </div>

          <div className="bg-white/90 rounded-2xl p-3.5 border border-purple-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-xs">
              <div className="p-1.5 rounded-xl bg-purple-100/60 text-purple-600 border border-purple-200">
                <Eye className="w-4 h-4" />
              </div>
              <span>Visión</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">Líderes en entretenimiento y comercio kawaii.</p>
          </div>

          <div className="bg-white/90 rounded-2xl p-3.5 border border-indigo-100 shadow-sm space-y-1 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-xs">
              <div className="p-1.5 rounded-xl bg-indigo-100/60 text-indigo-600 border border-indigo-200">
                <Compass className="w-4 h-4" />
              </div>
              <span>Objetivo</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">Conectar con la comunidad mediante calidad y cercanía.</p>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-pink-100/60 space-y-2.5">
          <p className="text-center text-[10px] font-black text-purple-800 uppercase tracking-widest">
            🌸 ¡Conéctate con Nosotros y Síguenos! 🌸
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <a 
              href="https://tiktok.com/@tiendascomoscute" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-pink-50 border-2 border-pink-200/70 text-xs font-black text-purple-950 shadow-sm transition-all transform hover:scale-105 cursor-pointer no-underline"
            >
              <span className="text-sm">🎵</span> <span>TikTok</span>
            </a>

            <a 
              href="https://instagram.com/tiendacosmoscute" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-pink-50 border-2 border-pink-200/70 text-xs font-black text-purple-950 shadow-sm transition-all transform hover:scale-105 cursor-pointer no-underline"
            >
              <span className="text-sm">📸</span> <span>Instagram</span>
            </a>

            <a 
              href="mailto:cosmoscute.info@gmail.com" 
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-purple-50 border-2 border-purple-200/70 text-xs font-black text-purple-950 shadow-sm transition-all transform hover:scale-105 cursor-pointer no-underline"
            >
              <span className="text-sm">💌</span> <span>Correo</span>
            </a>

            <a 
              href="https://wa.me/573026158662?text=¡Hola!%20Me%20gustaría%20más%20información%20sobre%20Cosmos%20Cute%20✨" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/90 hover:bg-emerald-50 border-2 border-emerald-200/70 text-xs font-black text-purple-950 shadow-sm transition-all transform hover:scale-105 cursor-pointer no-underline"
            >
              <span className="text-sm">💬</span> <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      </main>

      <ModalPedido isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}