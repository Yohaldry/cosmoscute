import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { History, Search, ArrowUpRight, ArrowDownRight, Sparkles, FileText } from 'lucide-react';

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    const q = query(collection(db, "historial_movimientos"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMovimientos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Error al cargar movimientos:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      const matchesSearch = (m.productoNombre || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                            (m.categoria || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
      return matchesSearch && matchesTipo;
    });
  }, [movimientos, searchQuery, filtroTipo]);

  const formatearFecha = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Fecha reciente';
    return timestamp.toDate().toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-pink-600 uppercase">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full m-0 p-0 text-slate-800 font-sans flex-1 overflow-y-auto space-y-2">
      
      {/* ENCABEZADO */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-white/25 backdrop-blur-md rounded-xl">
            <History className="w-4 h-4 text-yellow-300" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-pink-100">
            Logística & Trazabilidad 🌸
          </span>
        </div>
        <h1 className="text-base sm:text-lg font-black tracking-tight mb-0.5">Historial de Movimientos ✨</h1>
        <p className="text-[10px] text-pink-100">Visualiza todas las entradas y salidas de stock registradas en tiempo real.</p>
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-pink-100 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por producto..."
            className="w-full bg-pink-50/40 border border-pink-100 rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'todos', label: `Todos (${movimientos.length})`, active: 'bg-purple-600 text-white', def: 'bg-slate-100 text-slate-600' },
            { id: 'carga', label: 'Cargas (+)', active: 'bg-emerald-600 text-white', def: 'bg-emerald-50 text-emerald-700' },
            { id: 'descargo', label: 'Descargos (-)', active: 'bg-amber-600 text-white', def: 'bg-amber-50 text-amber-700' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroTipo(f.id)}
              className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all ${filtroTipo === f.id ? f.active : f.def}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE MOVIMIENTOS */}
      <div className="space-y-2">
        {movimientosFiltrados.map((mov) => {
          const esCarga = mov.tipo === 'carga';
          return (
            <div 
              key={mov.id} 
              className="bg-white border border-pink-100 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    esCarga ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {esCarga ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                        esCarga ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {esCarga ? '✨ Carga' : '🌸 Descargo'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">{formatearFecha(mov.fecha)}</span>
                    </div>

                    <h3 className="font-black text-[11px] text-slate-900 truncate">{mov.productoNombre}</h3>
                    <p className="text-[9px] font-bold text-slate-500">Categoría: <span className="text-pink-600">{mov.categoria}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-1.5 sm:pt-0 border-pink-50">
                  <div className="text-right">
                    <div className={`text-[11px] font-black ${esCarga ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {esCarga ? `+${mov.cantidad}` : `-${mov.cantidad}`} un.
                    </div>
                    <div className="text-[8px] font-bold text-slate-400">
                      Ant: {mov.stockAnterior} ➔ <strong className="text-slate-700">Nuevo: {mov.stockNuevo}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {mov.justificacion && (
                <div className="bg-pink-50/50 border border-pink-100 rounded-lg px-2 py-1 flex items-start gap-1.5">
                  <FileText className="w-3 h-3 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-700 flex-1">
                    <span className="font-black text-slate-900 uppercase tracking-wider text-[8px] mr-1">
                      {esCarga ? 'Justificación:' : 'Motivo:'}
                    </span>
                    <span className="font-bold text-slate-600">{mov.justificacion}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {movimientosFiltrados.length === 0 && (
          <div className="text-center py-8 bg-white rounded-xl border border-pink-100 shadow-xs">
            <Sparkles className="w-6 h-6 text-pink-300 mx-auto mb-1 animate-bounce" />
            <p className="text-[10px] font-bold text-slate-700">No se encontraron movimientos con esos filtros.</p>
          </div>
        )}
      </div>

    </div>
  );
}