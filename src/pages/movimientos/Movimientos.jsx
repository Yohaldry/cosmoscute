import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Sparkles, FileText, X } from 'lucide-react';

export default function Movimientos({ productoSeleccionado, onLimpiarFiltroProducto }) {
  const [movimientos, setMovimientos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    const q = query(collection(db, "historial_movimientos"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMovimientos(snapshot.docs.map(d => ({ idFirebase: d.id, ...d.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Error al cargar movimientos:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const nombreProductoActual = useMemo(() => {
    if (!productoSeleccionado) return '';
    return String(
      productoSeleccionado.nombre || 
      productoSeleccionado.productos || 
      productoSeleccionado.titulo || 
      productoSeleccionado.nombreProducto || ''
    ).toLowerCase().trim();
  }, [productoSeleccionado]);

  const idProductoActual = useMemo(() => {
    if (!productoSeleccionado) return '';
    return String(
      productoSeleccionado.id || 
      productoSeleccionado._id || 
      productoSeleccionado.idProducto || 
      productoSeleccionado.productoId || ''
    ).trim();
  }, [productoSeleccionado]);

  const movimientosDelProducto = useMemo(() => {
    if (!productoSeleccionado) return movimientos;

    return movimientos.filter(m => {
      const movimientoId = String(
        m.productoId || 
        m.idProducto || 
        m.id || 
        m._id || 
        m.producto_id || ''
      ).trim();

      const movimientoNombre = String(
        m.productoNombre || 
        m.nombreProducto || 
        m.nombre || 
        m.producto || ''
      ).toLowerCase().trim();

      const coincideId = idProductoActual !== '' && movimientoId !== '' && movimientoId === idProductoActual;
      const coincideNombre = nombreProductoActual !== '' && movimientoNombre !== '' && movimientoNombre === nombreProductoActual;

      return coincideId || coincideNombre;
    });
  }, [movimientos, productoSeleccionado, idProductoActual, nombreProductoActual]);

  const movimientosFiltrados = useMemo(() => {
    return movimientosDelProducto.filter(m => {
      const matchesSearch = (m.productoNombre || m.nombre || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                            (m.categoria || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
      
      return matchesSearch && matchesTipo;
    });
  }, [movimientosDelProducto, searchQuery, filtroTipo]);

  const formatearFecha = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Reciente';
    return timestamp.toDate().toLocaleString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full min-h-[300px] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Cargando...</p>
        </div>
      </div>
    );
  }

  const nombreVisual = productoSeleccionado ? (productoSeleccionado.nombre || productoSeleccionado.productos || productoSeleccionado.titulo || 'Producto') : '';

  return (
    <div className="w-full h-[calc(100vh-140px)] min-h-[500px] flex flex-col bg-slate-50/60 font-sans overflow-hidden m-0 p-0">
      
      {/* BARRA SUPERIOR FIJA */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 z-10 w-full shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar movimiento..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2.5 py-1 text-[11px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition-all"
            />
          </div>

          {productoSeleccionado && onLimpiarFiltroProducto && (
            <button
              onClick={onLimpiarFiltroProducto}
              className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 flex-shrink-0"
              title={`Filtro activo: ${nombreVisual}`}
            >
              <X className="w-3 h-3" /> <span className="hidden md:inline">Quitar filtro</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-0.5 sm:pb-0">
          {[
            { id: 'todos', label: `Todos (${movimientosDelProducto.length})`, active: 'bg-purple-600 text-white shadow-xs', def: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
            { id: 'carga', label: 'Cargas (+)', active: 'bg-emerald-600 text-white shadow-xs', def: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
            { id: 'descargo', label: 'Descargos (-)', active: 'bg-amber-600 text-white shadow-xs', def: 'bg-slate-100 text-slate-600 hover:bg-slate-200' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroTipo(f.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${filtroTipo === f.id ? f.active : f.def}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENEDOR CON SCROLL Y 2 COLUMNAS EN MÓVIL / 3 EN PC */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-2.5">
        {productoSeleccionado && movimientosDelProducto.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white border border-slate-200 rounded-xl text-center shadow-2xs w-full">
            <Sparkles className="w-5 h-5 text-purple-400 mb-1.5 animate-bounce" />
            <p className="text-xs font-bold text-slate-800 mb-0.5">Sin registros</p>
            <p className="text-[10px] text-slate-500">No hay movimientos asociados a este producto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full">
            {movimientosFiltrados.map((mov) => {
              const esCarga = mov.tipo === 'carga';
              return (
                <div 
                  key={mov.idFirebase} 
                  className="group bg-white hover:bg-purple-50/20 border border-slate-200 hover:border-purple-300 rounded-lg p-1.5 transition-all duration-200 hover:shadow-2xs relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Barra lateral indicadora */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${esCarga ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                  <div>
                    {/* Cabecera ultra compacta */}
                    <div className="flex items-center justify-between gap-1 mb-0.5 pl-1">
                      <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded truncate ${
                        esCarga ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {esCarga ? '+ Carga' : '- Descargo'}
                      </span>
                      <span className="text-[7.5px] text-slate-400 font-medium truncate">{formatearFecha(mov.fecha)}</span>
                    </div>

                    {/* Nombre y datos */}
                    <div className="pl-1 mb-1">
                      <h3 className="font-bold text-[10px] text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                        {mov.productoNombre || mov.nombre || 'Producto sin nombre'}
                      </h3>
                      <div className="flex items-center justify-between text-[8.5px] text-slate-500 mt-0.2 gap-1">
                        <span className="truncate">Cat: <strong className="text-slate-700">{mov.categoria || 'General'}</strong></span>
                        <span className="text-slate-600 font-semibold flex-shrink-0">
                          {mov.stockAnterior ?? 0} ➔ <strong className="text-purple-600">{mov.stockNuevo ?? 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center justify-between mt-0.5 pl-1 pt-0.5 border-t border-slate-100">
                    <span className="text-[8.5px] text-slate-400 font-medium">Cant:</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                      esCarga ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {esCarga ? `+${mov.cantidad}` : `-${mov.cantidad}`} un.
                    </span>
                  </div>

                  {/* Justificación ultra compacta */}
                  {mov.justificacion && (
                    <div className="bg-slate-50 border border-slate-100 rounded p-1 flex items-start gap-1 mt-1 ml-1">
                      <FileText className="w-2.5 h-2.5 text-purple-600 flex-shrink-0 mt-0.2" />
                      <p className="text-[8px] text-slate-600 leading-tight line-clamp-1">
                        <strong className="text-slate-700 uppercase text-[7px] mr-0.5">Motivo:</strong>
                        {mov.justificacion}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {productoSeleccionado && movimientosDelProducto.length > 0 && movimientosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 bg-white border border-slate-200 rounded-xl text-center shadow-2xs w-full">
            <Sparkles className="w-4 h-4 text-purple-400 mb-1 animate-bounce" />
            <p className="text-[11px] font-bold text-slate-700">No se encontraron movimientos con los filtros actuales.</p>
          </div>
        )}
      </div>

    </div>
  );
}