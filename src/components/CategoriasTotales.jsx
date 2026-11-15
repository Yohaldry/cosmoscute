import React, { useState, useEffect } from 'react';
import { Rocket, ShoppingBag, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import { db } from '../firebase'; 
import { collection, getDocs } from 'firebase/firestore';

const PALETTES = [
  { b: 'border-pink-300 hover:border-pink-500', bg: 'bg-pink-50 text-pink-700 border-pink-200', text: 'text-pink-600' },
  { b: 'border-purple-300 hover:border-purple-500', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600' },
  { b: 'border-amber-300 hover:border-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600' },
  { b: 'border-fuchsia-300 hover:border-fuchsia-500', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', text: 'text-fuchsia-600' },
  { b: 'border-cyan-300 hover:border-cyan-500', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', text: 'text-cyan-600' }
];

export default function CategoriasTotales() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

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

  // Filtrar categorías en tiempo real según el buscador por nombre
  const categoriasFiltradas = cats.filter(cat => 
    (cat.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-gray-800 font-sans selection:bg-pink-500 selection:text-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Cabecera con Botón de Regreso y Título */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1 text-pink-600 text-[10px] font-bold tracking-widest uppercase">
              <Rocket className="w-3 h-3" /> Catálogo Completo
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              TODAS LAS <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">CATEGORÍAS</span>
            </h1>
          </div>

          <a 
            href="/" 
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio
          </a>
        </div>

        {/* Barra de Búsqueda Minimalista */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar categoría por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-purple-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-500 shadow-xs transition-colors"
          />
        </div>

        {/* Listado de Categorías */}
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-400">Cargando todas las categorías...</div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
            No se encontraron categorías con el nombre "<span className="font-bold text-gray-600">{busqueda}</span>".
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2.5">
            {categoriasFiltradas.map((cat, i) => {
              const s = PALETTES[i % PALETTES.length];
              return (
                <div 
                  key={cat.id || i} 
                  className={`group relative rounded-xl p-[1px] bg-white border-2 ${s.b} shadow-xs transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 hover:shadow-md`}
                >
                  <div className="p-2 flex flex-col justify-between h-full space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border truncate ${s.bg}`}>DISPONIBLE</span>
                    </div>
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
                      <span>Ver</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}