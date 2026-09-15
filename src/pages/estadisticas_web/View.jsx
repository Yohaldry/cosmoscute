import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase"; // Ajusta la ruta a tu archivo firebaseConfig según tu estructura

export default function View({ categorias, inventario, setIsAddModalOpen, setIsEditModalOpen, setEditingItemData }) {
  const [totalVisitas, setTotalVisitas] = useState(0);
  const [visitasHoy, setVisitasHoy] = useState(0);
  const [loadingVisitas, setLoadingVisitas] = useState(true);

  useEffect(() => {
    // 1. Obtener el total general de visitas en tiempo real desde Firestore
    const generalRef = doc(db, "estadisticas_web", "general");
    const unsubscribeGeneral = onSnapshot(generalRef, (docSnap) => {
      if (docSnap.exists()) {
        setTotalVisitas(docSnap.data().totalVisitas || 0);
      }
    });

    // 2. Obtener las visitas del día actual en tiempo real
    const hoy = new Date().toISOString().split("T")[0];
    const diarioRef = doc(db, "estadisticas_web", hoy);
    const unsubscribeDiario = onSnapshot(diarioRef, (docSnap) => {
      if (docSnap.exists()) {
        setVisitasHoy(docSnap.data().visitas || 0);
      } else {
        setVisitasHoy(0);
      }
      setLoadingVisitas(false);
    });

    // Limpiar las suscripciones al desmontar el componente
    return () => {
      unsubscribeGeneral();
      unsubscribeDiario();
    };
  }, []);

  // --- CÁLCULOS ESTADÍSTICOS TIPO META / FACEBOOK ANALYTICS ---
  const listaInventario = inventario || [];
  const totalProductos = listaInventario.length;
  
  // Productos activos vs inactivos
  const productosActivos = listaInventario.filter(item => item.estado === true).length;
  const productosInactivos = totalProductos - productosActivos;
  
  // Stock total de unidades disponibles
  const stockTotalUnidades = listaInventario.reduce((acc, item) => acc + (Number(item.udisponibles) || 0), 0);

  // Valor total estimado del inventario (Costo * Unidades o Precio * Unidades)
  const valorInventarioCosto = listaInventario.reduce((acc, item) => {
    const costo = Number(item.costo) || 0;
    const stock = Number(item.udisponibles) || 0;
    return acc + (costo * stock);
  }, 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-100 pb-4 gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>📊</span> Panel de Rendimiento y Estadísticas
          </h2>
          <p className="text-xs text-slate-500 font-medium">Métricas de audiencia e indicadores de inventario en tiempo real para CosmosCute.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistema en Línea
          </span>
        </div>
      </div>

      {/* SECCIÓN 1: AUDIENCIA Y TRÁFICO WEB (Estilo Tarjetas Meta) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
          <span>🌐</span> Rendimiento de Audiencia Web
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Visitas Totales */}
          <div className="bg-white/9onta backdrop-blur-md p-5 rounded-3xl border border-purple-100 shadow-xl shadow-purple-900/5 flex items-center justify-between relative overflow-hidden group hover:border-purple-300 transition-all">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-100/50 rounded-full blur-xl group-hover:bg-purple-200/50 transition-all"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700">Alcance Histórico</span>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Visitas Totales Web</p>
              <p className="text-3xl font-black text-[#7C69EF] mt-1 tracking-tight">
                {loadingVisitas ? "..." : totalVisitas.toLocaleString()}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-[#7C69EF] text-white flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30 relative z-10">
              🌐
            </div>
          </div>

          {/* Visitas de Hoy */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-purple-100 shadow-xl shadow-purple-900/5 flex items-center justify-between relative overflow-hidden group hover:border-purple-300 transition-all">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-pink-100/50 rounded-full blur-xl group-hover:bg-pink-200/50 transition-all"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-pink-100 text-pink-700">Actividad Diaria</span>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Visitas de Hoy</p>
              <p className="text-3xl font-black text-pink-600 mt-1 tracking-tight">
                {loadingVisitas ? "..." : visitasHoy.toLocaleString()}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-pink-500/30 relative z-10">
              📈
            </div>
          </div>

        </div>
      </div>

      {/* SECCIÓN 2: MÉTRICAS DE INVENTARIO Y NEGOCIO */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
          <span>📦</span> Estadísticas del Catálogo e Inventario
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Productos */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-purple-100 shadow-lg shadow-purple-900/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Catálogo</span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">📋</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total Productos</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{totalProductos}</p>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-purple-50 text-[10px] font-extrabold text-slate-500">
              <span className="text-emerald-600">🟢 {productosActivos} Activos</span>
              <span>•</span>
              <span className="text-rose-600">🔴 {productosInactivos} Inactivos</span>
            </div>
          </div>

          {/* Unidades Totales en Stock */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-purple-100 shadow-lg shadow-purple-900/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Logística</span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">📊</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Stock Disponible</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{stockTotalUnidades.toLocaleString()} un.</p>
            </div>
            <p className="text-[10px] font-extrabold text-purple-600 pt-1 border-t border-purple-50">
              Suma de unidades en bodega
            </p>
          </div>

          {/* Categorías Registradas */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-purple-100 shadow-lg shadow-purple-900/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Organización</span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">🏷️</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Categorías</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{categorias ? categorias.length : 0}</p>
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 pt-1 border-t border-purple-50">
              Secciones activas en tienda
            </p>
          </div>

          {/* Valor Estimado en Costo */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-purple-100 shadow-lg shadow-purple-900/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Finanzas</span>
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">💰</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Inversión en Stock</p>
              <p className="text-xl font-black text-purple-700 mt-0.5">${valorInventarioCosto.toLocaleString()}</p>
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 pt-1 border-t border-purple-50">
              Valor base de mercancía
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}