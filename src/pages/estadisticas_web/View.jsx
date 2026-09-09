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

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-base font-black text-[#2D3142] uppercase tracking-wider">Estadísticas y Panel General</h2>
          <p className="text-xs text-slate-500 font-medium">Métricas de visitas e inventario en tiempo real para CosmosCute.</p>
        </div>
      </div>

      {/* Tarjetas de Estadísticas de Visitas Web */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tarjeta de Visitas Totales */}
        <div className="bg-white p-5 rounded-3xl border border-[#E4E8F0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Visitas Totales Web</p>
            <p className="text-2xl font-black text-[#7C69EF] mt-1">
              {loadingVisitas ? "..." : totalVisitas.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#7C69EF]/10 flex items-center justify-center text-xl">
            🌐
          </div>
        </div>

        {/* Tarjeta de Visitas de Hoy */}
        <div className="bg-white p-5 rounded-3xl border border-[#E4E8F0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Visitas de Hoy</p>
            <p className="text-2xl font-black text-[#7C69EF] mt-1">
              {loadingVisitas ? "..." : visitasHoy.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#7C69EF]/10 flex items-center justify-center text-xl">
            📈
          </div>
        </div>
      </div>

      {/* Resumen adicional de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E4E8F0] shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Total Productos</p>
          <p className="text-lg font-black text-[#2D3142] mt-1">{inventario ? inventario.length : 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E8F0] shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Categorías Registradas</p>
          <p className="text-lg font-black text-[#2D3142] mt-1">{categorias ? categorias.length : 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E8F0] shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Estado del Sistema</p>
          <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> En Línea / Sincronizado
          </p>
        </div>
      </div>
    </div>
  );
}