import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

export default function View({ categorias, inventario, setIsAddModalOpen, setIsEditModalOpen, setEditingItemData }) {
  const [totalVisitas, setTotalVisitas] = useState(0);
  const [visitasHoy, setVisitasHoy] = useState(0);
  const [visitasSemanal, setVisitasSemanal] = useState(0);
  const [visitasMensual, setVisitasMensual] = useState(0);
  const [visitasAnual, setVisitasAnual] = useState(0);
  const [loadingVisitas, setLoadingVisitas] = useState(true);
  
  // Estados para datos de fuentes de tráfico (Redes Sociales)
  const [fuentesTráfico, setFuentesTráfico] = useState({
    instagram: 0,
    tiktok: 0,
    whatsapp: 0,
    facebook: 0,
    directo: 0,
    otros: 0
  });

  const [datosGraficoSemanal, setDatosGraficoSemanal] = useState([]);
  const [datosGraficoMensual, setDatosGraficoMensual] = useState([]);
  const [datosGraficoAnual, setDatosGraficoAnual] = useState([]);

  const [activeTab, setActiveTab] = useState("visitas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("hoy");

  useEffect(() => {
    // 1. Obtener estadísticas generales y fuentes de tráfico globales
    const generalRef = doc(db, "estadisticas_web", "general");
    const unsubscribeGeneral = onSnapshot(generalRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTotalVisitas(data.totalVisitas || 0);
        if (data.fuentes) {
          setFuentesTráfico({
            instagram: data.fuentes.instagram || 0,
            tiktok: data.fuentes.tiktok || 0,
            whatsapp: data.fuentes.whatsapp || 0,
            facebook: data.fuentes.facebook || 0,
            directo: data.fuentes.directo || 0,
            otros: data.fuentes.otros || 0,
          });
        }
      }
    });

    const hoyStr = new Date().toISOString().split("T")[0];
    const hoyDate = new Date();

    const diarioRef = doc(db, "estadisticas_web", hoyStr);
    const unsubscribeDiario = onSnapshot(diarioRef, (docSnap) => {
      if (docSnap.exists()) {
        setVisitasHoy(docSnap.data().visitas || 0);
      } else {
        setVisitasHoy(0);
      }
      setLoadingVisitas(false);
    });

    const calcularVisitasPeriodos = async () => {
      try {
        let sumaSemana = 0;
        let sumaMes = 0;
        let sumaAnio = 0;

        const historialSemanal = [];
        const historialMensual = [];
        const historialAnual = [];

        const anioActual = hoyDate.getFullYear();
        const mesActual = hoyDate.getMonth();

        // SEMANAL (Últimos 7 días)
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(hoyDate.getDate() - i);
          const fechaKey = d.toISOString().split("T")[0];
          
          const nombreDia = d.toLocaleDateString("es-ES", { weekday: 'short' });
          const diaNum = d.getDate();

          const snap = await getDoc(doc(db, "estadisticas_web", fechaKey));
          const visitasDia = snap.exists() ? snap.data().visitas || 0 : 0;

          sumaSemana += visitasDia;
          historialSemanal.push({
            label: `${nombreDia} ${diaNum}`,
            visitas: visitasDia,
            fecha: fechaKey
          });
        }
        setVisitasSemanal(sumaSemana);
        setDatosGraficoSemanal(historialSemanal);

        // MENSUAL (Días del mes actual)
        const diaDelMes = hoyDate.getDate();
        const historialDiasMes = [];
        for (let i = 1; i <= diaDelMes; i++) {
          const d = new Date(anioActual, mesActual, i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const fechaKey = `${year}-${month}-${day}`;

          const snap = await getDoc(doc(db, "estadisticas_web", fechaKey));
          const visitasDia = snap.exists() ? snap.data().visitas || 0 : 0;
          sumaMes += visitasDia;

          historialDiasMes.push({
            label: `${i}`,
            visitas: visitasDia,
            fecha: fechaKey
          });
        }
        setVisitasMensual(sumaMes);
        setDatosGraficoMensual(historialDiasMes);

        // ANUAL (Meses del año actual)
        const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        for (let m = 0; m <= mesActual; m++) {
          let sumaMesEspecifico = 0;
          const ultimoDiaMes = new Date(anioActual, m + 1, 0).getDate();
          const diasAProbar = (m === mesActual) ? diaDelMes : ultimoDiaMes;

          for (let day = 1; day <= diasAProbar; day++) {
            const yearStr = anioActual;
            const monthStr = String(m + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const fechaKey = `${yearStr}-${monthStr}-${dayStr}`;

            const snap = await getDoc(doc(db, "estadisticas_web", fechaKey));
            if (snap.exists()) {
              sumaMesEspecifico += snap.data().visitas || 0;
            }
          }

          sumaAnio += sumaMesEspecifico;
          historialAnual.push({
            label: mesesNombres[m],
            visitas: sumaMesEspecifico,
            fecha: `${anioActual}-${m + 1}`
          });
        }
        setVisitasAnual(sumaAnio);
        setDatosGraficoAnual(historialAnual);

      } catch (error) {
        console.error("Error calculando estadísticas detalladas:", error);
      }
    };

    calcularVisitasPeriodos();

    return () => {
      unsubscribeGeneral();
      unsubscribeDiario();
    };
  }, []);

  const listaInventario = inventario || [];
  const totalProductos = listaInventario.length;
  const productosActivos = listaInventario.filter(item => item.estado === true).length;
  const productosInactivos = totalProductos - productosActivos;
  const stockTotalUnidades = listaInventario.reduce((acc, item) => acc + (Number(item.udisponibles) || 0), 0);

  const valorInventarioCosto = listaInventario.reduce((acc, item) => {
    const costo = Number(item.costo) || 0;
    const stock = Number(item.udisponibles) || 0;
    return acc + (costo * stock);
  }, 0);

  const obtenerDatosVisitasFiltro = () => {
    switch (filtroPeriodo) {
      case "semana":
        return { 
          titulo: "Visitas de los Últimos 7 Días", 
          badge: "Actividad Semanal", 
          valor: visitasSemanal, 
          color: "text-purple-600", 
          gradiente: "from-purple-500 to-indigo-600", 
          blob: "bg-purple-100/50",
          datosGrafico: datosGraficoSemanal,
          subLabel: "M1 • ÚLTIMOS 7 DÍAS"
        };
      case "mes":
        return { 
          titulo: "Visitas del Mes Actual", 
          badge: "Actividad Mensual", 
          valor: visitasMensual, 
          color: "text-indigo-600", 
          gradiente: "from-indigo-500 to-purple-600", 
          blob: "bg-indigo-100/50",
          datosGrafico: datosGraficoMensual,
          subLabel: "H1 • DÍAS DEL MES ACTUAL"
        };
      case "anio":
        return { 
          titulo: "Visitas del Año Actual", 
          badge: "Actividad Anual", 
          valor: visitasAnual, 
          color: "text-emerald-600", 
          gradiente: "from-emerald-500 to-teal-600", 
          blob: "bg-emerald-100/50",
          datosGrafico: datosGraficoAnual,
          subLabel: "D1 • RENDIMIENTO MENSUAL (AÑO)"
        };
      case "hoy":
      default:
        return { 
          titulo: "Visitas del Día (Hoy)", 
          badge: "Actividad Diaria", 
          valor: visitasHoy, 
          color: "text-pink-600", 
          gradiente: "from-pink-500 to-purple-600", 
          blob: "bg-pink-100/50",
          datosGrafico: [{ label: "Hoy", visitas: visitasHoy }],
          subLabel: "M1 • TIEMPO REAL HOY"
        };
    }
  };

  const infoFiltro = obtenerDatosVisitasFiltro();
  const datosActualesGrafico = infoFiltro.datosGrafico.length > 0 ? infoFiltro.datosGrafico : [{ label: "Sin datos", visitas: 0 }];

  // Coordenadas para el Gráfico SVG de Trading
  const maxVisitas = Math.max(...datosActualesGrafico.map(d => d.visitas), 5);
  const minVisitas = 0;
  const chartHeight = 180;
  const chartWidth = 700;

  const puntosCoordenadas = datosActualesGrafico.map((item, index) => {
    const x = (index / (datosActualesGrafico.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((item.visitas - minVisitas) / (maxVisitas - minVisitas || 1)) * (chartHeight - 30) - 15;
    return { x, y, ...item };
  });

  const pathSvgString = puntosCoordenadas.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  const areaSvgString = puntosCoordenadas.length > 0 ? `${pathSvgString} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : "";

  // Cálculo de porcentajes para las fuentes de tráfico
  const totalFuentesSuma = Object.values(fuentesTráfico).reduce((a, b) => a + b, 0) || 1;
  const calcularPorcentajeFuente = (valor) => Math.round((valor / totalFuentesSuma) * 100);

  return (
    <div className="h-full overflow-y-auto space-y-3 p-2.5 md:p-4 w-full">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-100 pb-2.5 gap-2">
        <div>
          <h2 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>📊</span> Panel de Rendimiento y Estadísticas
          </h2>
          <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">Métricas de audiencia e indicadores de inventario en tiempo real para CosmosCute.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistema en Línea
          </span>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-1.5 bg-purple-50/60 p-1 rounded-xl border border-purple-100 w-fit">
        <button
          onClick={() => setActiveTab("visitas")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all duration-300 ease-in-out ${
            activeTab === "visitas"
              ? "bg-[#7C69EF] text-white shadow-sm shadow-purple-500/20 scale-[1.02]"
              : "text-slate-600 hover:text-purple-700 hover:bg-white/50"
          }`}
        >
          <span>🌐</span> Rendimiento Web
        </button>
        <button
          onClick={() => setActiveTab("inventario")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all duration-300 ease-in-out ${
            activeTab === "inventario"
              ? "bg-[#7C69EF] text-white shadow-sm shadow-purple-500/20 scale-[1.02]"
              : "text-slate-600 hover:text-purple-700 hover:bg-white/50"
          }`}
        >
          <span>📦</span> Catálogo e Inventario
        </button>
      </div>

      <div className="space-y-3 pb-6">
        
        {activeTab === "visitas" && (
          <div className="space-y-3 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50/40 p-2.5 rounded-xl border border-purple-100">
              <h3 className="text-[11px] md:text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🌐</span> Rendimiento de Audiencia Web
              </h3>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-500">Período:</span>
                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className="bg-white border border-purple-200 rounded-lg px-2 py-0.5 text-[10px] md:text-xs font-bold text-slate-800 focus:outline-none focus:border-[#7C69EF] shadow-2xs cursor-pointer"
                >
                  <option value="hoy">Diaria (Hoy)</option>
                  <option value="semana">Semanal (7 Días)</option>
                  <option value="mes">Mensual (Mes Actual)</option>
                  <option value="anio">Anual (Año Actual)</option>
                </select>
              </div>
            </div>

            {/* 1. PRIMERO: RENDIMIENTO DE AUDIENCIA (Tarjetas compactas en 2 columnas) */}
            <div className="grid grid-cols-2 gap-2">
              
              <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition-all">
                <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-purple-100/50 rounded-full blur-md"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Histórico</span>
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-[#7C69EF] text-white flex items-center justify-center text-xs shadow-sm">
                    🌐
                  </div>
                </div>
                <div className="relative z-10 mt-1.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">Visitas Totales</p>
                  <p className="text-base font-black text-[#7C69EF] mt-0.5 tracking-tight">
                    {loadingVisitas ? "..." : totalVisitas.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition-all">
                <div className={`absolute -right-3 -bottom-3 w-12 h-12 ${infoFiltro.blob} rounded-full blur-md`}></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">
                    {infoFiltro.badge}
                  </span>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${infoFiltro.gradiente} text-white flex items-center justify-center text-xs shadow-sm`}>
                    📈
                  </div>
                </div>
                <div className="relative z-10 mt-1.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{infoFiltro.titulo}</p>
                  <p className={`text-base font-black ${infoFiltro.color} mt-0.5 tracking-tight`}>
                    {loadingVisitas ? "..." : infoFiltro.valor.toLocaleString()}
                  </p>
                </div>
              </div>

            </div>

            {/* 2. SEGUNDO: GRÁFICO DE TRADING PROFESIONAL DINÁMICO */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-purple-900/50 shadow-xl space-y-2 text-white">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                    Terminal XAU / WEB ({filtroPeriodo.toUpperCase()})
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {infoFiltro.subLabel}
                  </span>
                </div>
              </div>

              <div className="relative w-full h-32 md:h-40 bg-slate-900/80 rounded-xl p-1.5 border border-slate-800 overflow-hidden">
                
                <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-10">
                  <div className="border-b border-r border-white"></div>
                  <div className="border-b border-r border-white"></div>
                  <div className="border-b border-r border-white"></div>
                  <div className="border-b border-r border-white"></div>
                  <div className="border-b border-r border-white"></div>
                  <div className="border-b border-white"></div>
                </div>

                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="tradingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C69EF" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#7C69EF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {areaSvgString && (
                    <path d={areaSvgString} fill="url(#tradingGradient)" />
                  )}

                  {pathSvgString && (
                    <path 
                      d={pathSvgString} 
                      fill="none" 
                      stroke="#A855F7" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}

                  {puntosCoordenadas.map((p, idx) => (
                    <g key={idx} className="group/node cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="3.5" 
                        className="fill-[#7C69EF] stroke-white stroke-2 transition-all duration-300 group-hover/node:scale-150" 
                      />
                      <foreignObject x={p.x - 40} y={p.y - 40} width="80" height="30" className="overflow-visible opacity-0 group-hover/node:opacity-100 transition-opacity z-30 pointer-events-none">
                        <div className="bg-slate-900 border border-purple-500 text-white text-[9px] font-bold rounded px-1.5 py-0.5 text-center shadow-lg">
                          {p.label}: {p.visitas} vis.
                        </div>
                      </foreignObject>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Eje X Dinámico */}
              <div className="flex justify-between px-1 text-[9px] font-mono font-bold text-slate-400 overflow-x-auto gap-1.5">
                {datosActualesGrafico.map((item, index) => (
                  <div key={index} className="text-center shrink-0">
                    {item.label}
                  </div>
                ))}
              </div>

            </div>

            {/* 3. TERCERO: PROCEDENCIA DE VISITAS / REDES SOCIALES (Compactos y Cuadrados) */}
            <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>🎯</span> Procedencia de Visitas
                </h4>
                <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                  Tráfico
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                
                {/* Instagram */}
                <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">📸</span>
                    <span className="text-[9px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.instagram)}%</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[10px] font-black text-slate-700 block truncate">Instagram</span>
                    <span className="text-[9px] font-bold text-slate-500">{fuentesTráfico.instagram} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.instagram)}%` }}></div>
                  </div>
                </div>

                {/* TikTok */}
                <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">🎵</span>
                    <span className="text-[9px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.tiktok)}%</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[10px] font-black text-slate-700 block truncate">TikTok</span>
                    <span className="text-[9px] font-bold text-slate-500">{fuentesTráfico.tiktok} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 to-purple-700 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.tiktok)}%` }}></div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">💬</span>
                    <span className="text-[9px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.whatsapp)}%</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[10px] font-black text-slate-700 block truncate">WhatsApp</span>
                    <span className="text-[9px] font-bold text-slate-500">{fuentesTráfico.whatsapp} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.whatsapp)}%` }}></div>
                  </div>
                </div>

                {/* Facebook */}
                <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">👥</span>
                    <span className="text-[9px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.facebook)}%</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[10px] font-black text-slate-700 block truncate">Facebook</span>
                    <span className="text-[9px] font-bold text-slate-500">{fuentesTráfico.facebook} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.facebook)}%` }}></div>
                  </div>
                </div>

                {/* Directo / Web */}
                <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">🔗</span>
                    <span className="text-[9px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.directo)}%</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[10px] font-black text-slate-700 block truncate">Directo / URL</span>
                    <span className="text-[9px] font-bold text-slate-500">{fuentesTráfico.directo} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 to-[#7C69EF] h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.directo)}%` }}></div>
                  </div>
                </div>

                {/* Otros */}
                <div className="bg-purple-50/50 p-2 rounded-xl border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">🌐</span>
                    <span className="text-[9px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.otros)}%</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[10px] font-black text-slate-700 block truncate">Otros / Ref</span>
                    <span className="text-[9px] font-bold text-slate-500">{fuentesTráfico.otros} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-400 to-slate-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.otros)}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {activeTab === "inventario" && (
          <div className="space-y-3 animate-fadeIn">
            <h3 className="text-[11px] md:text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>📦</span> Estadísticas del Catálogo e Inventario
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              
              <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Catálogo</span>
                  <span className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-[9px] font-bold">📋</span>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase truncate">Total Productos</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{totalProductos}</p>
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-purple-50 text-[8px] font-extrabold text-slate-500">
                  <span className="text-emerald-600">🟢 {productosActivos}</span>
                  <span>•</span>
                  <span className="text-rose-600">🔴 {productosInactivos}</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Logística</span>
                  <span className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-[9px] font-bold">📊</span>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase truncate">Stock Disponible</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{stockTotalUnidades.toLocaleString()} un.</p>
                </div>
                <p className="text-[8px] font-extrabold text-purple-600 pt-1 border-t border-purple-50 truncate">
                  Unidades en bodega
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Organización</span>
                  <span className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-[9px] font-bold">🏷️</span>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase truncate">Categorías</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{categorias ? categorias.length : 0}</p>
                </div>
                <p className="text-[8px] font-extrabold text-slate-400 pt-1 border-t border-purple-50 truncate">
                  Secciones activas
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl border border-purple-100 shadow-sm space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Finanzas</span>
                  <span className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-[9px] font-bold">💰</span>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase truncate">Inversión Stock</p>
                  <p className="text-sm font-black text-purple-700 mt-0.5">${valorInventarioCosto.toLocaleString()}</p>
                </div>
                <p className="text-[8px] font-extrabold text-slate-400 pt-1 border-t border-purple-50 truncate">
                  Valor de mercancía
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}