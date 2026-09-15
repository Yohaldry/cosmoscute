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
    <div className="flex-1 flex flex-col overflow-hidden p-3 bg-white text-[#2D3142]">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 pb-3 border-b border-[#E4E8F0]">
        <div>
          <h2 className="text-xs font-black text-[#2D3142] flex items-center gap-1.5 uppercase tracking-wider">
            <span>📦</span> Panel de Pedidos (Firestore)
          </h2>
          <p className="text-[8px] text-[#9EA2B3]">Gestiona el flujo de estados de tus clientes de forma sincronizada ✨</p>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#9EA2B3]">🔍</span>
          <input 
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo, barrio..."
            className="w-full md:w-56 bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl pl-7 pr-3 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          />
        </div>
      </div>

      {/* Pestañas de Estados */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
        {pestañas.map((tab) => {
          const count = pedidos.filter(p => (p.estado || "recibido").toLowerCase().trim() === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold transition-all shrink-0 ${
                filtroEstado === tab.id
                  ? 'bg-rose-100 text-rose-600 border border-rose-200 shadow-2xs'
                  : 'bg-[#F4F5FB] text-[#9EA2B3] hover:bg-[#E4E8F0]/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white text-[8px] font-black">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tabla de Pedidos */}
      <div className="flex-1 overflow-y-auto border border-[#E4E8F0] rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-rose-50/70 border-b border-[#E4E8F0] text-[8px] font-extrabold uppercase text-rose-500 tracking-wider">
              <th className="p-2.5">Cliente</th>
              <th className="p-2.5">Correo</th>
              <th className="p-2.5">Teléfono</th>
              <th className="p-2.5">Dirección / Barrio</th>
              <th className="p-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8F0] text-[9px]">
            {pedidosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-[#9EA2B3]">
                  No hay pedidos en esta categoría.
                </td>
              </tr>
            ) : (
              pedidosFiltrados.map((pedido) => {
                const pestañaActual = pestañas.find(t => t.id === filtroEstado);
                return (
                  <tr key={pedido.firebaseId} className="hover:bg-[#F4F5FB]/50 transition-colors">
                    <td className="p-2.5 font-bold text-[#2D3142]">{pedido.nombre} {pedido.apellido}</td>
                    <td className="p-2.5 text-[#6E7387]">✉️ {pedido.correo}</td>
                    <td className="p-2.5 text-[#6E7387]">📱 {pedido.telefono}</td>
                    <td className="p-2.5 text-[#6E7387]">📍 {pedido.direccion} ({pedido.barrio || "Sin barrio"})</td>
                    <td className="p-2.5 text-center flex items-center justify-center gap-1.5">
                      {/* BOTÓN VER MÁS */}
                      <button
                        onClick={() => abrirDetallesPedido(pedido)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold px-2.5 py-1 rounded-lg text-[8px] transition-all flex items-center gap-1 shadow-2xs"
                        title="Ver todos los detalles del pedido"
                      >
                        <span>👁️</span> Ver más
                      </button>

                      {/* BOTÓN JUGAR BINGO (Solo visible en la pestaña Pagados) */}
                      {filtroEstado === "pagado" && (
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
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-2.5 py-1 rounded-lg text-[8px] transition-all flex items-center gap-1 shadow-2xs"
                          title="Jugar Bingo con los datos de este cliente"
                        >
                          <span>🎮</span> Jugar Bingo
                        </button>
                      )}

                      {/* BOTÓN DINÁMICO CON VALIDACIÓN */}
                      {pestañaActual && pestañaActual.siguienteEstado && (
                        <button
                          onClick={() => manejarCambioEstado(pedido, pestañaActual.siguienteEstado)}
                          className="bg-[#7C69EF]/10 hover:bg-[#7C69EF]/20 text-[#7C69EF] font-bold px-2.5 py-1 rounded-lg text-[8px] transition-all"
                        >
                          {pestañaActual.textoBoton}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALLES DEL PEDIDO ("VER MÁS") */}
      {isModalDetallesOpen && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl border border-[#E4E8F0] space-y-3 max-h-[90vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📋</span>
                <h3 className="text-xs font-black text-[#2D3142]">Detalles del Pedido #{pedidoSeleccionado.id || ""}</h3>
              </div>
              <button 
                onClick={() => setIsModalDetallesOpen(false)} 
                className="text-[#9EA2B3] hover:text-[#2D3142] text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Contenido de los Detalles */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              
              {/* Información del cliente */}
              <div className="bg-[#F4F5FB] p-3 rounded-xl border border-[#E4E8F0] space-y-1.5">
                <p className="text-[8px] font-extrabold uppercase text-[#7C69EF] tracking-wider">Información del Cliente</p>
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
                <p className="text-[8px] font-extrabold uppercase text-[#7C69EF] tracking-wider px-1">Productos Solicitados ({pedidoSeleccionado.productos ? pedidoSeleccionado.productos.length : 0})</p>
                <div className="border border-[#E4E8F0] rounded-xl overflow-hidden divide-y divide-[#E4E8F0]">
                  {pedidoSeleccionado.productos && pedidoSeleccionado.productos.length > 0 ? (
                    pedidoSeleccionado.productos.map((prodName, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-[9px]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#7C69EF]/10 text-[#7C69EF] flex items-center justify-center font-black">📦</span>
                          <span className="font-bold text-[#2D3142]">{prodName}</span>
                        </div>
                        <span className="text-[8px] font-bold text-[#9EA2B3] bg-[#F4F5FB] px-2 py-1 rounded-md">Ítem #{idx + 1}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[#9EA2B3]">No hay productos registrados en este pedido.</div>
                  )}
                </div>
              </div>

              {/* Precio Total */}
              <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-rose-600 uppercase">Precio Registrado:</span>
                <span className="text-xs font-black text-rose-600">${Number(pedidoSeleccionado.precio || 0).toLocaleString()} COP</span>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="pt-2 border-t border-[#E4E8F0]">
              <button 
                type="button" 
                onClick={() => setIsModalDetallesOpen(false)} 
                className="w-full bg-[#7C69EF] hover:bg-[#6c59db] text-white font-extrabold py-2 rounded-xl text-[9px] shadow-md shadow-[#7C69EF]/20 transition-all"
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