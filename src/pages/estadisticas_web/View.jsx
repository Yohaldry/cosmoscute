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

    const hoyDate = new Date();
    
    // Función auxiliar para formatear fecha localmente YYYY-MM-DD sin desfase UTC
    const formatearFechaLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const hoyStr = formatearFechaLocal(hoyDate);

    const diarioRef = doc(db, "estadisticas_web", hoyStr);
    const unsubscribeDiario = onSnapshot(diarioRef, (docSnap) => {
      if (docSnap.exists()) {
        setVisitasHoy(docSnap.data().visitas || 0);
      } else {
        setVisitasHoy(0);
      }
      setLoadingVisitas(false);
    });

    // 2. Función optimizada con Promise.all y fechas locales seguras
    const calcularVisitasPeriodos = async () => {
      try {
        const anioActual = hoyDate.getFullYear();
        const mesActual = hoyDate.getMonth(); // 0-indexed (0 = Enero)
        const diaDelMes = hoyDate.getDate();

        // --- A. SEMANAL (Últimos 7 días en paralelo) ---
        const promesasSemana = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(hoyDate.getDate() - i);
          const fechaKey = formatearFechaLocal(d);
          const nombreDia = d.toLocaleDateString("es-ES", { weekday: 'short' });
          const diaNum = d.getDate();

          promesasSemana.push(
            getDoc(doc(db, "estadisticas_web", fechaKey)).then(snap => ({
              label: `${nombreDia} ${diaNum}`,
              visitas: snap.exists() ? snap.data().visitas || 0 : 0,
              fecha: fechaKey
            }))
          );
        }
        const historialSemanal = await Promise.all(promesasSemana);
        const sumaSemana = historialSemanal.reduce((acc, curr) => acc + curr.visitas, 0);
        setVisitasSemanal(sumaSemana);
        setDatosGraficoSemanal(historialSemanal);

        // --- B. MENSUAL (Días del mes actual en paralelo) ---
        const mesStr = String(mesActual + 1).padStart(2, '0');
        const promesasMes = [];
        for (let i = 1; i <= diaDelMes; i++) {
          const dMes = new Date(anioActual, mesActual, i);
          const fechaKey = formatearFechaLocal(dMes);

          promesasMes.push(
            getDoc(doc(db, "estadisticas_web", fechaKey)).then(snap => ({
              label: `${i}`,
              visitas: snap.exists() ? snap.data().visitas || 0 : 0,
              fecha: fechaKey
            }))
          );
        }
        const historialDiasMes = await Promise.all(promesasMes);
        const sumaMes = historialDiasMes.reduce((acc, curr) => acc + curr.visitas, 0);
        setVisitasMensual(sumaMes);
        setDatosGraficoMensual(historialDiasMes);

        // --- C. ANUAL (Meses del año actual) ---
        const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const historialAnual = [];
        let sumaAnioTotal = 0;

        for (let m = 0; m <= mesActual; m++) {
          const ultimoDiaDelMesIndex = new Date(anioActual, m + 1, 0).getDate();
          const diasAProbar = (m === mesActual) ? diaDelMes : ultimoDiaDelMesIndex;
          const promesasMesEspecifico = [];

          for (let day = 1; day <= diasAProbar; day++) {
            const dAnio = new Date(anioActual, m, day);
            const fechaKey = formatearFechaLocal(dAnio);

            promesasMesEspecifico.push(
              getDoc(doc(db, "estadisticas_web", fechaKey)).then(snap => snap.exists() ? snap.data().visitas || 0 : 0)
            );
          }

          const visitasDiasMes = await Promise.all(promesasMesEspecifico);
          const sumaMesEspecifico = visitasDiasMes.reduce((acc, curr) => acc + curr.visitas, 0);
          sumaAnioTotal += sumaMesEspecifico;

          historialAnual.push({
            label: mesesNombres[m],
            visitas: sumaMesEspecifico,
            fecha: `${anioActual}-${m + 1}`
          });
        }
        setVisitasAnual(sumaAnioTotal);
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
  const totalItemsCatalogo = listaInventario.length;
  const productosActivos = listaInventario.filter(item => item.estado === true).length;
  const productosInactivos = totalItemsCatalogo - productosActivos;
  
  // Suma de todas las unidades usando "udisponibles"
  const stockTotalUnidades = listaInventario.reduce((acc, item) => acc + (Number(item.udisponibles) || 0), 0);

  // Inversión Stock: suma de (costo * udisponibles)
  const valorInventarioCosto = listaInventario.reduce((acc, item) => {
    const costo = Number(item.costo) || 0;
    const stock = Number(item.udisponibles) || 0;
    return acc + (costo * stock);
  }, 0);

  // Ganancias Futuras: suma de ((precio - costo) * udisponibles)
  const gananciasFuturas = listaInventario.reduce((acc, item) => {
    const precio = Number(item.precio) || 0;
    const costo = Number(item.costo) || 0;
    const stock = Number(item.udisponibles) || 0;
    return acc + ((precio - costo) * stock);
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
  const chartHeight = 150;
  const chartWidth = 700;

  const puntosCoordenadas = datosActualesGrafico.map((item, index) => {
    const x = (index / (datosActualesGrafico.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((item.visitas - minVisitas) / (maxVisitas - minVisitas || 1)) * (chartHeight - 25) - 10;
    return { x, y, ...item };
  });

  const pathSvgString = puntosCoordenadas.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  const areaSvgString = puntosCoordenadas.length > 0 ? `${pathSvgString} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z` : "";

  // Cálculo de porcentajes para las fuentes de tráfico
  const totalFuentesSuma = Object.values(fuentesTráfico).reduce((a, b) => a + b, 0) || 1;
  const calcularPorcentajeFuente = (valor) => Math.round((valor / totalFuentesSuma) * 100);

  return (
    <div className="h-full overflow-y-auto space-y-2 p-2 w-full text-[10px]">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-100 pb-1.5 gap-1">
        <div>
          <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <span>📊</span> Panel de Rendimiento y Estadísticas
          </h2>
          <p className="text-[9px] text-slate-500 font-medium">Métricas de audiencia e indicadores de inventario en tiempo real.</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            En Línea
          </span>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-1 bg-purple-50/60 p-0.5 rounded-lg border border-purple-100 w-fit">
        <button
          onClick={() => setActiveTab("visitas")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black transition-all duration-300 ease-in-out ${
            activeTab === "visitas"
              ? "bg-[#7C69EF] text-white shadow-2xs scale-[1.02]"
              : "text-slate-600 hover:text-purple-700 hover:bg-white/50"
          }`}
        >
          <span>🌐</span> Rendimiento Web
        </button>
        <button
          onClick={() => setActiveTab("inventario")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black transition-all duration-300 ease-in-out ${
            activeTab === "inventario"
              ? "bg-[#7C69EF] text-white shadow-2xs scale-[1.02]"
              : "text-slate-600 hover:text-purple-700 hover:bg-white/50"
          }`}
        >
          <span>📦</span> Catálogo e Inventario
        </button>
      </div>

      <div className="space-y-2 pb-4">
        
        {activeTab === "visitas" && (
          <div className="space-y-2 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-purple-50/40 p-1.5 rounded-lg border border-purple-100">
              <h3 className="text-[9px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1">
                <span>🌐</span> Rendimiento de Audiencia Web
              </h3>
              
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-extrabold text-slate-500">Período:</span>
                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className="bg-white border border-purple-200 rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-800 focus:outline-none focus:border-[#7C69EF] shadow-2xs cursor-pointer"
                >
                  <option value="hoy">Diaria (Hoy)</option>
                  <option value="semana">Semanal (7 Días)</option>
                  <option value="mes">Mensual (Mes)</option>
                  <option value="anio">Anual (Año)</option>
                </select>
              </div>
            </div>

            {/* Tarjetas compactas en 2 columnas */}
            <div className="grid grid-cols-2 gap-1.5">
              
              <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg border border-purple-100 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition-all">
                <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-purple-100/50 rounded-full blur-xs"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-purple-100 text-purple-700">Histórico</span>
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-[#7C69EF] text-white flex items-center justify-center text-[9px] shadow-2xs">
                    🌐
                  </div>
                </div>
                <div className="relative z-10 mt-1">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider truncate">Visitas Totales</p>
                  <p className="text-xs font-black text-[#7C69EF] mt-0.2 tracking-tight">
                    {loadingVisitas ? "..." : totalVisitas.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg border border-purple-100 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition-all">
                <div className={`absolute -right-2 -bottom-2 w-10 h-10 ${infoFiltro.blob} rounded-full blur-xs`}></div>
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-pink-100 text-pink-700">
                    {infoFiltro.badge}
                  </span>
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${infoFiltro.gradiente} text-white flex items-center justify-center text-[9px] shadow-2xs`}>
                    📈
                  </div>
                </div>
                <div className="relative z-10 mt-1">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider truncate">{infoFiltro.titulo}</p>
                  <p className={`text-xs font-black ${infoFiltro.color} mt-0.2 tracking-tight`}>
                    {loadingVisitas ? "..." : infoFiltro.valor.toLocaleString()}
                  </p>
                </div>
              </div>

            </div>

            {/* Gráfico de Trading Profesional Compacto */}
            <div className="bg-slate-950 p-2 rounded-xl border border-purple-900/50 shadow-md space-y-1 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-200">
                    Terminal XAU / WEB ({filtroPeriodo.toUpperCase()})
                  </h4>
                </div>
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {infoFiltro.subLabel}
                </span>
              </div>

              <div className="relative w-full h-24 md:h-32 bg-slate-900/80 rounded-lg p-1 border border-slate-800 overflow-hidden">
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
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}

                  {puntosCoordenadas.map((p, idx) => (
                    <g key={idx} className="group/node cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="3" 
                        className="fill-[#7C69EF] stroke-white stroke-1 transition-all duration-300 group-hover/node:scale-150" 
                      />
                      <foreignObject x={p.x - 30} y={p.y - 30} width="60" height="24" className="overflow-visible opacity-0 group-hover/node:opacity-100 transition-opacity z-30 pointer-events-none">
                        <div className="bg-slate-900 border border-purple-500 text-white text-[8px] font-bold rounded px-1 py-0.2 text-center shadow-md">
                          {p.label}: {p.visitas}
                        </div>
                      </foreignObject>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="flex justify-between px-1 text-[8px] font-mono font-bold text-slate-400 overflow-x-auto gap-1">
                {datosActualesGrafico.map((item, index) => (
                  <div key={index} className="text-center shrink-0">
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Procedencia de Visitas / Redes Sociales */}
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-lg border border-purple-100 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between border-b border-purple-100 pb-1">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  <span>🎯</span> Procedencia de Visitas
                </h4>
                <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                  Tráfico
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                
                {/* Instagram */}
                <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]">📸</span>
                    <span className="text-[8px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.instagram)}%</span>
                  </div>
                  <div className="my-0.5">
                    <span className="text-[9px] font-black text-slate-700 block truncate">Instagram</span>
                    <span className="text-[8px] font-bold text-slate-500">{fuentesTráfico.instagram} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-0.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.instagram)}%` }}></div>
                  </div>
                </div>

                {/* TikTok */}
                <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]">🎵</span>
                    <span className="text-[8px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.tiktok)}%</span>
                  </div>
                  <div className="my-0.5">
                    <span className="text-[9px] font-black text-slate-700 block truncate">TikTok</span>
                    <span className="text-[8px] font-bold text-slate-500">{fuentesTráfico.tiktok} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-0.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 to-purple-700 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.tiktok)}%` }}></div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]">💬</span>
                    <span className="text-[8px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.whatsapp)}%</span>
                  </div>
                  <div className="my-0.5">
                    <span className="text-[9px] font-black text-slate-700 block truncate">WhatsApp</span>
                    <span className="text-[8px] font-bold text-slate-500">{fuentesTráfico.whatsapp} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-0.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.whatsapp)}%` }}></div>
                  </div>
                </div>

                {/* Facebook */}
                <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]">👥</span>
                    <span className="text-[8px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.facebook)}%</span>
                  </div>
                  <div className="my-0.5">
                    <span className="text-[9px] font-black text-slate-700 block truncate">Facebook</span>
                    <span className="text-[8px] font-bold text-slate-500">{fuentesTráfico.facebook} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-0.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.facebook)}%` }}></div>
                  </div>
                </div>

                {/* Directo / Web */}
                <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]">🔗</span>
                    <span className="text-[8px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.directo)}%</span>
                  </div>
                  <div className="my-0.5">
                    <span className="text-[9px] font-black text-slate-700 block truncate">Directo / URL</span>
                    <span className="text-[8px] font-bold text-slate-500">{fuentesTráfico.directo} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-0.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 to-[#7C69EF] h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.directo)}%` }}></div>
                  </div>
                </div>

                {/* Otros */}
                <div className="bg-purple-50/50 p-1.5 rounded-lg border border-purple-100/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]">🌐</span>
                    <span className="text-[8px] font-black text-purple-700">{calcularPorcentajeFuente(fuentesTráfico.otros)}%</span>
                  </div>
                  <div className="my-0.5">
                    <span className="text-[9px] font-black text-slate-700 block truncate">Otros / Ref</span>
                    <span className="text-[8px] font-bold text-slate-500">{fuentesTráfico.otros} vis.</span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-0.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-400 to-slate-600 h-full rounded-full" style={{ width: `${calcularPorcentajeFuente(fuentesTráfico.otros)}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {activeTab === "inventario" && (
          <div className="space-y-2 animate-fadeIn">
            <h3 className="text-[9px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1">
              <span>📦</span> Estadísticas del Catálogo e Inventario
            </h3>
            
            <div className="grid grid-cols-2 gap-1.5">
              
              <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg border border-purple-100 shadow-2xs space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-wider text-slate-400">Catálogo</span>
                  <span className="w-4 h-4 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-[8px] font-bold">📋</span>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase truncate">Total Productos</p>
                  <p className="text-xs font-black text-slate-800 mt-0.2">{stockTotalUnidades.toLocaleString()} un.</p>
                </div>
                <div className="flex items-center gap-1 pt-0.5 border-t border-purple-50 text-[7px] font-extrabold text-slate-500">
                  <span className="text-emerald-600">🟢 {productosActivos} art.</span>
                  <span>•</span>
                  <span className="text-rose-600">🔴 {productosInactivos} art.</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg border border-purple-100 shadow-2xs space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-wider text-slate-400">Organización</span>
                  <span className="w-4 h-4 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-[8px] font-bold">🏷️️</span>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase truncate">Categorías</p>
                  <p className="text-xs font-black text-slate-800 mt-0.2">{categorias ? categorias.length : 0}</p>
                </div>
                <p className="text-[7px] font-extrabold text-slate-400 pt-0.5 border-t border-purple-50 truncate">
                  Secciones activas
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg border border-purple-100 shadow-2xs space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-wider text-slate-400">Finanzas</span>
                  <span className="w-4 h-4 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-[8px] font-bold">💰</span>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase truncate">Inversión Stock</p>
                  <p className="text-[11px] font-black text-purple-700 mt-0.2">${valorInventarioCosto.toLocaleString()}</p>
                </div>
                <p className="text-[7px] font-extrabold text-slate-400 pt-0.5 border-t border-purple-50 truncate">
                  Valor de mercancía
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg border border-purple-100 shadow-2xs space-y-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-black uppercase tracking-wider text-slate-400">Proyección</span>
                  <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-[8px] font-bold">📈</span>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase truncate">Ganancias Futuras</p>
                  <p className="text-[11px] font-black text-emerald-600 mt-0.2">${gananciasFuturas.toLocaleString()}</p>
                </div>
                <p className="text-[7px] font-extrabold text-emerald-600 pt-0.5 border-t border-purple-50 truncate">
                  Margen bruto estimado
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}