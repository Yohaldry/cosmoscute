import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Gift, Rocket, ShoppingBag, ChevronRight, 
  ShieldCheck, Truck, RefreshCw, Target, Eye, Compass, 
  Globe, MessageCircle, Scissors, Palette, Layers, Grid 
} from 'lucide-react';
import ModalPedido from '../components/ModalPedido';

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
                  <div key={cat.id || i} onClick={() => setIsOpen(true)} className={`group relative rounded-xl p-[1px] bg-white border-2 ${s.b} shadow-xs transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-md`}>
                    <div className="p-2 flex flex-col justify-between h-full space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border truncate ${s.bg}`}>POPULAR</span>
                        <span className="text-[8px] font-bold text-gray-600 bg-gray-100 px-1 py-0.2 rounded">VER</span>
                      </div>
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                        <img src={cat.image} alt={cat.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute bottom-1 right-1 p-1 rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"><ShoppingBag className="w-2.5 h-2.5" /></div>
                      </div>
                      <div className="space-y-0.2">
                        <h3 className="text-[11px] font-black text-gray-900 group-hover:text-purple-600 transition-colors leading-tight line-clamp-1 uppercase">{cat.nombre}</h3>
                        <p className="text-[9px] text-gray-500 leading-tight line-clamp-1">{cat.subtitle || 'Exclusivo'}</p>
                      </div>
                      <div className={`pt-1 flex items-center justify-between text-[9px] font-bold ${s.text} border-t border-gray-100`}>
                        <span>Ver</span><ChevronRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* TARJETA ESPECIAL: VER MÁS (Redirige a /categorias) */}
              <a 
                href="/categorias" 
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
              </a>

            </div>
          )}
        </section>

        {/* 4. PAPELERÍA CREATIVA */}
        <section className="bg-gradient-to-br from-white via-purple-50/40 to-pink-50/30 rounded-2xl border border-purple-100 p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-purple-100/80 pb-2">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">Servicio Exclusivo ✨</span>
              <h2 className="text-sm sm:text-base font-black text-gray-900 mt-1">PAPELERÍA CREATIVA <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">A TU MEDIDA</span></h2>
            </div>
            <button onClick={() => setIsOpen(true)} className="text-[10px] font-black text-purple-700 bg-purple-100/70 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
              Pedir Diseño <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CREATIVE_SERVICES.map((srv, idx) => (
              <div key={idx} className="bg-white rounded-xl p-2.5 border border-purple-100/60 shadow-2xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${srv.c}`}><srv.icon className="w-3.5 h-3.5" /></div>
                  <h3 className="text-xs font-black text-gray-900 leading-tight">{srv.t}</h3>
                </div>
                <p className="text-[10px] text-gray-500 leading-snug pl-0.5">{srv.d}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/80 rounded-xl p-3 border border-purple-100/80 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">¿Cómo ordenar tu pedido personalizado?</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-0.5"><span className="w-5 h-5 mx-auto rounded-full bg-pink-100 text-pink-600 text-[10px] font-black flex items-center justify-center">1</span><p className="text-[10px] font-bold text-gray-800">Elige la idea</p></div>
              <div className="space-y-0.5"><span className="w-5 h-5 mx-auto rounded-full bg-purple-100 text-purple-600 text-[10px] font-black flex items-center justify-center">2</span><p className="text-[10px] font-bold text-gray-800">Cotizamos</p></div>
              <div className="space-y-0.5"><span className="w-5 h-5 mx-auto rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black flex items-center justify-center">3</span><p className="text-[10px] font-bold text-gray-800">¡Recibes!</p></div>
            </div>
          </div>
        </section>

        {/* 5. NOSOTROS & REDES */}
        <section className="bg-white rounded-2xl border border-purple-100 p-4 space-y-4 shadow-xs">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">Sobre Nosotros 🌌</span>
            <h2 className="text-base font-black text-gray-900">Nuestra Esencia y Conexión</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-[#fcfbfd] rounded-xl p-3 border border-purple-50 space-y-1"><div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs"><Target className="w-3.5 h-3.5 text-pink-600" /><span>Misión</span></div><p className="text-[11px] text-gray-500 leading-relaxed">Experiencias únicas en sorpresas y juegos en vivo.</p></div>
            <div className="bg-[#fcfbfd] rounded-xl p-3 border border-purple-50 space-y-1"><div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs"><Eye className="w-3.5 h-3.5 text-pink-600" /><span>Visión</span></div><p className="text-[11px] text-gray-500 leading-relaxed">Líderes en entretenimiento y comercio kawaii.</p></div>
            <div className="bg-[#fcfbfd] rounded-xl p-3 border border-purple-50 space-y-1"><div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs"><Compass className="w-3.5 h-3.5 text-pink-600" /><span>Objetivo</span></div><p className="text-[11px] text-gray-500 leading-relaxed">Conectar con la comunidad mediante calidad y cercanía.</p></div>
          </div>
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Síguenos en Redes Sociales</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SOCIALS.map((s, idx) => (
                <a key={idx} href={s.href} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-50/80 border border-gray-200/60 text-xs font-bold text-gray-700 transition-all ${s.c}`}>
                  <SocialIcon name={s.name} className="w-4 h-4" /><span>{s.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

      </main>

      <ModalPedido isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}