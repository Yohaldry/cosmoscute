import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

export const PanelDePedidos = ({ triggerSuccessAlert, triggerErrorAlert }) => {
  const [pedidos, setPedidos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("recibido");
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();
  
  // Estado para el Modal de Detalles ("Ver más")
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [isModalDetallesOpen, setIsModalDetallesOpen] = useState(false);

  // Cargar pedidos desde Firestore
  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pedidos"));
      const listaPedidos = querySnapshot.docs.map(document => ({
        firebaseId: document.id,
        ...document.data()
      }));
      setPedidos(listaPedidos);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      triggerErrorAlert("No se pudieron cargar los pedidos");
    }
  };

  // Función para manejar el cambio de estado con la validación solicitada
  const manejarCambioEstado = (pedido, siguienteEstado) => {
    // Validación: Si estamos en la pestaña "pagado" y queremos pasarlo a "enviado"
    if (filtroEstado === "pagado" && siguienteEstado === "enviado") {
      const tieneBingoGalactico = pedido.productos && pedido.productos.some(
        prod => String(prod).trim().toUpperCase() === "BINGO GALACTICO"
      );
      
      if (tieneBingoGalactico) {
        triggerErrorAlert("No olvides jugar bingo para asignar los productos de este cliente");
        return; // Detiene la ejecución y no permite cambiar el estado
      }
    }

    // Si pasa la validación, actualiza en Firestore
    cambiarEstadoPedido(pedido.firebaseId, siguienteEstado);
  };

  const cambiarEstadoPedido = async (firebaseId, nuevoEstado) => {
    try {
      const pedidoRef = doc(db, "pedidos", firebaseId);
      await updateDoc(pedidoRef, { estado: nuevoEstado });
      triggerSuccessAlert("¡Estado actualizado correctamente!");
      fetchPedidos();
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      triggerErrorAlert("Error al actualizar el estado");
    }
  };

  // Abrir modal de detalles
  const abrirDetallesPedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setIsModalDetallesOpen(true);
  };

  // Filtrado de pedidos según los estados exactos solicitados
  const pedidosFiltrados = pedidos.filter(p => {
    const estadoDoc = (p.estado || "recibido").toLowerCase().trim();
    const coincideEstado = estadoDoc === filtroEstado.toLowerCase().trim();
    
    const nombreCompleto = `${p.nombre || ""} ${p.apellido || ""} ${p.correo || ""} ${p.telefono || ""} ${p.barrio || ""}`.toLowerCase();
    const coincideBusqueda = nombreCompleto.includes(busqueda.toLowerCase());

    return coincideEstado && coincideBusqueda;
  });

  // Configuración de pestañas con sus estados correspondientes
  const pestañas = [
    { id: "recibido", label: "Recibidos", icon: "📥", siguienteEstado: "pendiente", textoBoton: "Pasar a Pendiente ⏳" },
    { id: "pendiente", label: "Pendiente de Pago", icon: "⏳", siguienteEstado: "pagado", textoBoton: "Marcar Pagado 💳" },
    { id: "pagado", label: "Pagados", icon: "💳", siguienteEstado: "enviado", textoBoton: "Enviar Pedido 🚀" },
    { id: "enviado", label: "Enviados", icon: "🚀", siguienteEstado: null, textoBoton: null },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 bg-gradient-to-br from-white via-[#FAF8FF] to-[#FFF5F7] text-[#2D3142]">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 pb-3 border-b border-rose-100 shadow-xs px-2 bg-white/80 backdrop-blur-md rounded-2xl">
        <div>
          <h2 className="text-xs font-black text-[#2D3142] flex items-center gap-1.5 uppercase tracking-wider">
            <span className="p-1 rounded-lg bg-rose-100 text-rose-500 shadow-2xs">📦</span> Panel de Pedidos (Firestore)
          </h2>
          <p className="text-[8px] text-[#9EA2B3] ml-1">Gestiona el flujo de estados de tus clientes de forma sincronizada ✨</p>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-rose-400">🔍</span>
          <input 
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo, barrio..."
            className="w-full md:w-64 bg-white border border-rose-200 rounded-xl pl-8 pr-3 py-1.5 text-[9px] font-bold text-[#2D3142] shadow-inner focus:outline-none focus:border-[#7C69EF] focus:ring-2 focus:ring-[#7C69EF]/20 transition-all"
          />
        </div>
      </div>

      {/* Pestañas de Estados */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 px-1">
        {pestañas.map((tab) => {
          const count = pedidos.filter(p => (p.estado || "recibido").toLowerCase().trim() === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[9px] font-bold transition-all shrink-0 shadow-xs ${
                filtroEstado === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-[#7C69EF] text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                  : 'bg-white text-[#6E7387] border border-rose-100 hover:bg-rose-50/50 hover:text-rose-600'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${filtroEstado === tab.id ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenedor de Tarjetas de Pedidos */}
      <div className="flex-1 overflow-y-auto p-1">
        {pedidosFiltrados.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#9EA2B3] border-2 border-dashed border-rose-200 rounded-3xl bg-white/50 shadow-inner gap-2">
            <span className="text-2xl animate-bounce">🛍️</span>
            <p className="text-[10px] font-bold text-rose-400">No hay pedidos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {pedidosFiltrados.map((pedido) => {
              const pestañaActual = pestañas.find(t => t.id === filtroEstado);

              // Verificación si este pedido en la pestaña "pagado" está listo para enviar (no tiene BINGO GALACTICO pendiente)
              const esAptoParaEnviar = filtroEstado === "pagado" && !(
                pedido.productos && pedido.productos.some(
                  prod => String(prod).trim().toUpperCase() === "BINGO GALACTICO"
                )
              );

              // Para la pestaña pendientes o generales, definimos si cumple condición de tarjeta verde
              // (En este ejemplo, si está en 'pagado' y es apto, o si tú deseas que en pendientes también aplique alguna condición verde, aquí se evalúa)
              const esTarjetaVerde = esAptoParaEnviar; 

              return (
                <div 
                  key={pedido.firebaseId} 
                  className={`rounded-3xl p-4 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-3 relative overflow-hidden group ${
                    esTarjetaVerde 
                      ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border-2 border-emerald-300 shadow-emerald-500/10' 
                      : 'bg-white border border-rose-100 hover:border-[#7C69EF]/40'
                  }`}
                >
                  {/* Destello decorativo superior */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    esTarjetaVerde 
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500' 
                      : 'bg-gradient-to-r from-rose-400 via-pink-400 to-[#7C69EF]'
                  }`}></div>

                  {/* Info principal de la tarjeta */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs ${
                        esTarjetaVerde 
                          ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200' 
                          : 'text-rose-600 bg-rose-50 border border-rose-100'
                      }`}>
                        {pedido.categoria || "General"} {esTarjetaVerde && "✨ Listo"}
                      </span>
                      <span className={`text-[9px] font-black text-white px-2.5 py-1 rounded-xl shadow-xs ${
                        esTarjetaVerde 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20' 
                          : 'bg-gradient-to-r from-rose-500 to-pink-500'
                      }`}>
                        ${Number(pedido.precio || 0).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h3 className={`text-[10px] font-black transition-colors line-clamp-1 ${
                        esTarjetaVerde ? 'text-emerald-900 group-hover:text-emerald-600' : 'text-[#2D3142] group-hover:text-[#7C69EF]'
                      }`}>
                        {pedido.nombre} {pedido.apellido}
                      </h3>
                    </div>

                    <div className={`space-y-1 text-[9px] p-2.5 rounded-2xl ${
                      esTarjetaVerde ? 'bg-emerald-50/50 text-emerald-900/80 border border-emerald-100/50' : 'text-[#6E7387] pt-2 border-t border-rose-50 bg-[#FAF8FF]/50'
                    }`}>
                      <p className="flex items-center gap-1.5 truncate">
                        <span className={esTarjetaVerde ? 'text-emerald-500' : 'text-rose-400'}>✉️</span> <span className="truncate">{pedido.correo}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className={esTarjetaVerde ? 'text-emerald-500' : 'text-rose-400'}>📱</span> <span>{pedido.telefono}</span>
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <span className={esTarjetaVerde ? 'text-emerald-500' : 'text-rose-400'}>📍</span> <span className="truncate">{pedido.direccion} ({pedido.barrio || "Sin barrio"})</span>
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción en la tarjeta cuadrada */}
                  <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-1.5 ${esTarjetaVerde ? 'border-emerald-100' : 'border-rose-50'}`}>
                    {/* BOTÓN VER MÁS */}
                    <button
                      onClick={() => abrirDetallesPedido(pedido)}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold px-2 py-1.5 rounded-xl text-[8px] transition-all flex items-center justify-center gap-1 shadow-xs border border-indigo-100"
                      title="Ver todos los detalles del pedido"
                    >
                      <span>👁️</span> Ver más
                    </button>

                    {/* BOTÓN JUGAR BINGO (Visible SOLO SI LA TARJETA NO ES VERDE) */}
                    {!esTarjetaVerde && (
                      <button
                        onClick={() => {
                          const participantData = {
                            participantId: pedido.id || pedido.firebaseId || pedido.uid || 'ID-GENERICO',
                            participantName: pedido.nombre || pedido.nombres || pedido.name || 'Invitado',
                            participantLastName: pedido.apellido || pedido.apellidos || pedido.lastName || ''
                          };

                          localStorage.setItem('cosmos_participant', JSON.stringify(participantData));
                          navigate('/boxgame', { state: participantData });
                        }}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-2 py-1.5 rounded-xl text-[8px] transition-all flex items-center justify-center gap-1 shadow-xs border border-emerald-100"
                        title="Jugar Bingo con los datos de este cliente"
                      >
                        <span>🎮</span> Bingo
                      </button>
                    )}

                    {/* BOTÓN DE CAMBIO DE ESTADO (SOLO SE MUESTRA SI LA TARJETA ES VERDE) */}
                    {esTarjetaVerde && pestañaActual && pestañaActual.siguienteEstado && (
                      <button
                        onClick={() => manejarCambioEstado(pedido, pestañaActual.siguienteEstado)}
                        className="w-full font-black py-1.5 px-2 rounded-xl text-[8px] transition-all text-center shadow-2xs border bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 border-emerald-400"
                      >
                        {pestañaActual.textoBoton}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE DETALLES DEL PEDIDO ("VER MÁS") */}
      {isModalDetallesOpen && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-rose-200 space-y-3 max-h-[90vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs p-1.5 rounded-xl bg-rose-100 text-rose-600 shadow-xs">📋</span>
                <h3 className="text-xs font-black text-[#2D3142]">Detalles del Pedido #{pedidoSeleccionado.id || ""}</h3>
              </div>
              <button 
                onClick={() => setIsModalDetallesOpen(false)} 
                className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 font-bold flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido de los Detalles */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              
              {/* Información del cliente */}
              <div className="bg-[#FAF8FF] p-3.5 rounded-2xl border border-[#7C69EF]/15 shadow-inner space-y-2">
                <p className="text-[8px] font-black uppercase text-[#7C69EF] tracking-wider">Información del Cliente</p>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <span className="text-[#9EA2B3] block">Nombre completo:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.nombre} {pedidoSeleccionado.apellido}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block">Teléfono:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.telefono}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block">Correo Electrónico:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.correo}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block">Dirección:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.direccion}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block">Barrio:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.barrio || "No especificado"}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block">Ciudad:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.ciudad || "No especificada"}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block">Categoría 🧸:</span>
                    <span className="font-bold text-[#D87093]">{pedidoSeleccionado.categoria || "No especificada"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block">¿Quién recibe?:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.quienrecibe || "No especificado"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block">Cantidad de Partidas:</span>
                    <span className="font-bold text-[#7C69EF]">{pedidoSeleccionado.cantidadPartidas || 1} Partida(s)</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block">Fecha de Creación:</span>
                    <span className="font-bold text-[#2D3142]">
                      {pedidoSeleccionado.fechaCreacion?.seconds 
                        ? new Date(pedidoSeleccionado.fechaCreacion.seconds * 1000).toLocaleString('es-CO') 
                        : "Fecha reciente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de productos solicitados */}
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase text-[#7C69EF] tracking-wider px-1">Productos Solicitados ({pedidoSeleccionado.productos ? pedidoSeleccionado.productos.length : 0})</p>
                <div className="border border-rose-100 rounded-2xl overflow-hidden divide-y divide-rose-50 bg-white shadow-xs">
                  {pedidoSeleccionado.productos && pedidoSeleccionado.productos.length > 0 ? (
                    pedidoSeleccionado.productos.map((prodName, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-[9px] hover:bg-rose-50/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center font-black shadow-2xs">📦</span>
                          <span className="font-bold text-[#2D3142]">{prodName}</span>
                        </div>
                        <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Ítem #{idx + 1}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[#9EA2B3]">No hay productos registrados en este pedido.</div>
                  )}
                </div>
              </div>

              {/* Precio Total */}
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                <span className="text-[9px] font-black text-rose-600 uppercase">Precio Registrado:</span>
                <span className="text-xs font-black text-rose-600 bg-white px-3 py-1 rounded-xl shadow-2xs">${Number(pedidoSeleccionado.precio || 0).toLocaleString()} COP</span>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="pt-2 border-t border-rose-100">
              <button 
                type="button" 
                onClick={() => setIsModalDetallesOpen(false)} 
                className="w-full bg-gradient-to-r from-rose-500 to-[#7C69EF] hover:opacity-90 text-white font-black py-2.5 rounded-2xl text-[9px] shadow-lg shadow-rose-500/25 transition-all"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PanelDePedidos;