import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, getDocs, query, where, increment, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

export const PanelDePedidos = ({ triggerSuccessAlert, triggerErrorAlert }) => {
  const [pedidos, setPedidos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("recibido");
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();
  
  // Estado para el Modal de Detalles ("Ver más")
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [isModalDetallesOpen, setIsModalDetallesOpen] = useState(false);

  // Estados para la Alerta Visual Central de Confirmación de Cambio de Estado
  const [confirmacionCambioEstado, setConfirmacionCambioEstado] = useState(null);

  // Estados para el Modal de Cancelación de Pedido con Motivo
  const [isModalCancelarOpen, setIsModalCancelarOpen] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  // Estados para el Modal de Edición de Pedido
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    direccion: "",
    barrio: "",
    ciudad: "",
    quienrecibe: "",
    categoria: "",
    productos: [],
    precio: 0
  });

  // Estado auxiliar para seleccionar y agregar un producto nuevo al pedido en edición
  const [productoSeleccionadoInv, setProductoSeleccionadoInv] = useState("");
  const [cantidadNuevoProducto, setCantidadNuevoProducto] = useState(1);

  // Cargar y escuchar pedidos desde Firestore en tiempo real con onSnapshot
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pedidos"),
      (querySnapshot) => {
        const listaPedidos = querySnapshot.docs.map(document => ({
          firebaseId: document.id,
          ...document.data()
        }));

        // Función auxiliar para obtener el timestamp numérico
        const obtenerTiempo = (item) => {
          const f = item.fechaCreacion || item.fecha || item.createdAt;
          if (!f) return 0;
          if (typeof f.toMillis === 'function') return f.toMillis();
          if (f.seconds) return f.seconds * 1000;
          if (f instanceof Date) return f.getTime();
          if (typeof f === 'number') return f;
          const parsed = Date.parse(f);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Ordenar los pedidos en orden de fecha y hora (más reciente primero)
        listaPedidos.sort((a, b) => obtenerTiempo(b) - obtenerTiempo(a));

        setPedidos(listaPedidos);
      },
      (error) => {
        console.error("Error al escuchar pedidos en tiempo real:", error);
        triggerErrorAlert("No se pudieron sincronizar los pedidos en tiempo real");
      }
    );

    return () => unsubscribe();
  }, []);

  // Cargar inventario en tiempo real para opciones de edición
  useEffect(() => {
    const unsubscribeInv = onSnapshot(
      collection(db, "inventario"),
      (snapshot) => {
        const listaInv = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setInventario(listaInv);
      },
      (err) => console.error("Error al cargar inventario:", err)
    );
    return () => unsubscribeInv();
  }, []);

  // Función para manejar el cambio de estado con la validación solicitada y abrir alerta central
  const manejarCambioEstado = (pedido, siguienteEstado) => {
    if (filtroEstado === "pagado" && siguienteEstado === "enviado") {
      const tieneBingoGalactico = pedido.productos && pedido.productos.some(
        prod => {
          const nombreProd = typeof prod === 'object' ? prod.name : prod;
          return String(nombreProd).trim().toUpperCase() === "BINGO GALACTICO";
        }
      );
      
      if (tieneBingoGalactico) {
        triggerErrorAlert("No olvides jugar bingo para asignar los productos de este cliente");
        return;
      }
    }

    const tabSiguiente = pestañas.find(t => t.id === siguienteEstado);
    const nombreAccion = tabSiguiente ? tabSiguiente.label : siguienteEstado;

    setConfirmacionCambioEstado({
      pedido,
      siguienteEstado,
      textoAccion: nombreAccion
    });
  };

  const confirmarCambioEstadoGlobal = async () => {
    if (!confirmacionCambioEstado) return;
    const { pedido, siguienteEstado } = confirmacionCambioEstado;
    setConfirmacionCambioEstado(null);
    await cambiarEstadoPedido(pedido.firebaseId, siguienteEstado, { productos: pedido.productos });
  };

  const cambiarEstadoPedido = async (firebaseId, nuevoEstado, datosExtra = {}) => {
    try {
      const pedidoRef = doc(db, "pedidos", firebaseId);

      // Si el nuevo estado es "pagado", actualizamos el inventario: descontamos de udisponibles y sumamos a uvendidas
      if (nuevoEstado === "pagado") {
        const pedidoSnap = await getDoc(pedidoRef);
        const pedidoData = pedidoSnap.exists() ? pedidoSnap.data() : {};
        const productosPedido = datosExtra.productos || pedidoData.productos || [];

        if (Array.isArray(productosPedido) && productosPedido.length > 0) {
          const inventarioSnapshot = await getDocs(collection(db, "inventario"));

          for (const prod of productosPedido) {
            const nombreProdCrudo = typeof prod === 'object' ? (prod.name || prod.nombre || '') : String(prod);
            const nombreLimpioPedido = String(nombreProdCrudo).trim().toLowerCase();
            const cantidadProd = typeof prod === 'object' ? Number(prod.quantity || prod.cantidad || 1) : 1;

            if (nombreLimpioPedido) {
              for (const invDoc of inventarioSnapshot.docs) {
                const dataInv = invDoc.data();
                const nombreInvLimpio = String(dataInv.nombre || "").trim().toLowerCase();

                if (nombreInvLimpio === nombreLimpioPedido) {
                  const invRef = doc(db, "inventario", invDoc.id);
                  
                  const udisponiblesActual = Number(dataInv.udisponibles ?? 0);
                  const uvendidasActual = Number(dataInv.uvendidas ?? 0);

                  const nuevoDisponible = Math.max(0, udisponiblesActual - cantidadProd);
                  const nuevoVendido = uvendidasActual + cantidadProd;

                  await updateDoc(invRef, {
                    udisponibles: nuevoDisponible,
                    uvendidas: nuevoVendido
                  });
                }
              }
            }
          }
        }
      }

      await updateDoc(pedidoRef, { estado: nuevoEstado, ...datosExtra });
      triggerSuccessAlert("¡Estado actualizado y stock sumado a vendidas correctamente!");
    } catch (error) {
      console.error("Error al actualizar estado e inventario:", error);
      triggerErrorAlert("Error al actualizar el estado o el inventario");
    }
  };

  const abrirModalCancelar = (pedido) => {
    setPedidoACancelar(pedido);
    setMotivoCancelacion("");
    setIsModalCancelarOpen(true);
  };

  const confirmarCancelacionPedido = async () => {
    if (!pedidoACancelar) return;
    if (!motivoCancelacion.trim()) {
      triggerErrorAlert("Por favor escribe el motivo de la cancelación");
      return;
    }

    const firebaseId = pedidoACancelar.firebaseId;
    setIsModalCancelarOpen(false);
    setPedidoACancelar(null);

    await cambiarEstadoPedido(firebaseId, "cancelado", { categoria: motivoCancelacion.trim() });
  };

  const abrirDetallesPedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setIsModalDetallesOpen(true);
  };

  // FUNCIONALIDAD DE EDICIÓN DE PEDIDO
  const abrirModalEditar = (pedido) => {
    setPedidoAEditar(pedido);
    const productosNormalizados = Array.isArray(pedido.productos)
      ? pedido.productos.map(p => typeof p === 'object' ? { ...p } : { name: String(p), cantidad: 1, precio: 0 })
      : [];

    setFormEditar({
      nombre: pedido.nombre || "",
      apellido: pedido.apellido || "",
      telefono: pedido.telefono || "",
      correo: pedido.correo || "",
      direccion: pedido.direccion || "",
      barrio: pedido.barrio || "",
      ciudad: pedido.ciudad || "",
      quienrecibe: pedido.quienrecibe || "",
      categoria: pedido.categoria || "",
      productos: productosNormalizados,
      precio: Number(pedido.precio || 0)
    });

    setProductoSeleccionadoInv("");
    setCantidadNuevoProducto(1);
    setIsModalEditarOpen(true);
  };

  const calcularPrecioTotalEdicion = (listaProds) => {
    return listaProds.reduce((acc, p) => {
      const pr = Number(p.precio || p.price || 0);
      const cant = Number(p.cantidad || p.quantity || 1);
      return acc + (pr * cant);
    }, 0);
  };

  const manejarCambioCantidadProd = (idx, nuevaCant) => {
    const c = Math.max(1, Number(nuevaCant));
    const prodsActualizados = formEditar.productos.map((item, index) => {
      if (index === idx) {
        return { ...item, cantidad: c, quantity: c };
      }
      return item;
    });
    setFormEditar({
      ...formEditar,
      productos: prodsActualizados,
      precio: calcularPrecioTotalEdicion(prodsActualizados)
    });
  };

  const eliminarProductoEdicion = (idx) => {
    const prodsActualizados = formEditar.productos.filter((_, index) => index !== idx);
    setFormEditar({
      ...formEditar,
      productos: prodsActualizados,
      precio: calcularPrecioTotalEdicion(prodsActualizados)
    });
  };

  const agregarProductoDesdeInventario = () => {
    if (!productoSeleccionadoInv) return;
    const prodInv = inventario.find(i => i.id === productoSeleccionadoInv);
    if (!prodInv) return;

    const nuevoProdObj = {
      name: prodInv.nombre || prodInv.name || 'Producto sin nombre',
      nombre: prodInv.nombre || prodInv.name || 'Producto sin nombre',
      precio: Number(prodInv.precio || prodInv.price || 0),
      price: Number(prodInv.precio || prodInv.price || 0),
      cantidad: Number(cantidadNuevoProducto),
      quantity: Number(cantidadNuevoProducto)
    };

    const prodsActualizados = [...formEditar.productos, nuevoProdObj];
    setFormEditar({
      ...formEditar,
      productos: prodsActualizados,
      precio: calcularPrecioTotalEdicion(prodsActualizados)
    });

    setProductoSeleccionadoInv("");
    setCantidadNuevoProducto(1);
  };

  const guardarCambiosPedido = async () => {
    if (!pedidoAEditar) return;
    try {
      const pedidoRef = doc(db, "pedidos", pedidoAEditar.firebaseId);
      await updateDoc(pedidoRef, {
        nombre: formEditar.nombre,
        apellido: formEditar.apellido,
        telefono: formEditar.telefono,
        correo: formEditar.correo,
        direccion: formEditar.direccion,
        barrio: formEditar.barrio,
        ciudad: formEditar.ciudad,
        quienrecibe: formEditar.quienrecibe,
        categoria: formEditar.categoria,
        productos: formEditar.productos,
        precio: Number(formEditar.precio || 0)
      });

      triggerSuccessAlert("¡Pedido actualizado exitosamente!");
      setIsModalEditarOpen(false);
      setPedidoAEditar(null);
    } catch (err) {
      console.error("Error al editar pedido:", err);
      triggerErrorAlert("No se pudieron guardar los cambios del pedido");
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const estadoDoc = (p.estado || "recibido").toLowerCase().trim();
    const coincideEstado = estadoDoc === filtroEstado.toLowerCase().trim();
    
    const textoBusqueda = `${p.firebaseId || ""} ${p.id || ""} ${p.nombre || ""} ${p.apellido || ""} ${p.correo || ""} ${p.telefono || ""} ${p.barrio || ""} ${p.categoria || ""}`.toLowerCase();
    const coincideBusqueda = textoBusqueda.includes(busqueda.toLowerCase().trim());

    return coincideEstado && coincideBusqueda;
  });

  const pestañas = [
    { id: "recibido", label: "Recibidos", icon: "📥", siguienteEstado: "pendiente", textoBoton: "Pasar" },
    { id: "pendiente", label: "Pendiente de Pago", icon: "⏳", siguienteEstado: "pagado", textoBoton: "Pasar a Pagado 💳" },
    { id: "pagado", label: "Pagados", icon: "💳", siguienteEstado: "enviado", textoBoton: "Pasar" },
    { id: "enviado", label: "Enviados", icon: "🚀", siguienteEstado: null, textoBoton: null },
    { id: "cancelado", label: "Cancelados", icon: "❌", siguienteEstado: null, textoBoton: null },
  ];

  const permiteEditar = filtroEstado !== "enviado" && filtroEstado !== "cancelado";

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 bg-gradient-to-br from-white via-[#FAF8FF] to-[#FFF5F7] text-[#2D3142]">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-rose-100 shadow-xs px-3 bg-white/80 backdrop-blur-md rounded-2xl">
        <div>
          <h2 className="text-xs sm:text-sm font-black text-[#2D3142] flex items-center gap-2 uppercase tracking-wider">
            <span className="p-1.5 rounded-xl bg-rose-100 text-rose-500 shadow-2xs text-sm sm:text-base">📦</span> Panel de Pedidos (Firestore - Tiempo Real)
          </h2>
          <p className="text-[10px] sm:text-[11px] text-[#9EA2B3] ml-1">Gestiona el flujo de estados de tus clientes de forma sincronizada ✨</p>
        </div>
        
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-rose-400">🔍</span>
          <input 
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ID, nombre, correo, barrio..."
            className="w-full md:w-72 bg-white border border-rose-200 rounded-xl pl-9 pr-4 py-2 text-[11px] sm:text-xs font-bold text-[#2D3142] shadow-inner focus:outline-none focus:border-[#7C69EF] focus:ring-2 focus:ring-[#7C69EF]/20 transition-all"
          />
        </div>
      </div>

      {/* Pestañas de Estados */}
      <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-3 mb-3 px-1">
        {pestañas.map((tab) => {
          const count = pedidos.filter(p => (p.estado || "recibido").toLowerCase().trim() === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 shadow-xs ${
                filtroEstado === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-[#7C69EF] text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                  : 'bg-white text-[#6E7387] border border-rose-100 hover:bg-rose-50/50 hover:text-rose-600'
              }`}
            >
              <span className="text-xs sm:text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${filtroEstado === tab.id ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenedor de Tarjetas de Pedidos */}
      <div className="flex-1 overflow-y-auto p-1">
        {pedidosFiltrados.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#9EA2B3] border-2 border-dashed border-rose-200 rounded-3xl bg-white/50 shadow-inner gap-3">
            <span className="text-3xl animate-bounce">🛍️</span>
            <p className="text-[11px] sm:text-xs font-bold text-rose-400">No hay pedidos que coincidan con la búsqueda en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {pedidosFiltrados.map((pedido) => {
              const pestañaActual = pestañas.find(t => t.id === filtroEstado);

              const esAptoParaEnviar = filtroEstado === "pagado" && !(
                pedido.productos && pedido.productos.some(
                  prod => {
                    const nombreProd = typeof prod === 'object' ? prod.name : prod;
                    return String(nombreProd).trim().toUpperCase() === "BINGO GALACTICO";
                  }
                )
              );

              const esTarjetaVerde = esAptoParaEnviar; 
              const esCanceladoTab = filtroEstado === "cancelado";
              const esVentaDirecta = String(pedido.estadoventa || "").toLowerCase().trim() === "venta";

              return (
                <div 
                  key={pedido.firebaseId} 
                  className={`rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-2.5 sm:gap-3.5 relative overflow-hidden group ${
                    esCanceladoTab
                      ? 'bg-gradient-to-br from-red-50/90 via-white to-rose-100/60 border-2 border-red-300 shadow-red-500/10'
                      : esVentaDirecta
                        ? 'bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 border-2 border-[#7C69EF]/40 shadow-indigo-500/10'
                        : esTarjetaVerde 
                          ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border-2 border-emerald-300 shadow-emerald-500/10' 
                          : 'bg-white border border-rose-100 hover:border-[#7C69EF]/40'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 sm:h-2 ${
                    esCanceladoTab
                      ? 'bg-gradient-to-r from-red-400 via-rose-500 to-red-600'
                      : esVentaDirecta
                        ? 'bg-gradient-to-r from-[#7C69EF] via-purple-500 to-indigo-600'
                        : esTarjetaVerde 
                          ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500' 
                          : 'bg-gradient-to-r from-rose-400 via-pink-400 to-[#7C69EF]'
                  }`}></div>

                  <div className="space-y-1.5 sm:space-y-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs truncate max-w-[65%] ${
                        esCanceladoTab
                          ? 'text-red-700 bg-red-100/90 border border-red-200'
                          : esVentaDirecta
                            ? 'text-[#7C69EF] bg-indigo-50 border border-indigo-200'
                            : esTarjetaVerde 
                              ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200' 
                              : 'text-rose-600 bg-rose-50 border border-rose-100'
                      }`} title={pedido.categoria || "General"}>
                        {esCanceladoTab ? `Motivo: ${pedido.categoria || "Sin motivo"}` : (pedido.categoria || "General")} {esTarjetaVerde && "✨"}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {permiteEditar && (
                          <button
                            onClick={() => abrirModalEditar(pedido)}
                            className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 text-[10px] sm:text-xs font-bold transition-all shadow-2xs"
                            title="Editar pedido"
                          >
                            ✏️
                          </button>
                        )}
                        <span className="text-[8px] sm:text-[10px] font-mono font-bold bg-indigo-50 text-[#7C69EF] px-1.5 sm:px-2.5 py-0.5 rounded-md border border-indigo-100 shadow-2xs" title="ID del Pedido">
                          ID: {pedido.id || pedido.firebaseId}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
                      <h3 className={`text-[10px] sm:text-xs font-black transition-colors line-clamp-1 ${
                        esCanceladoTab ? 'text-red-900 group-hover:text-red-600' : esVentaDirecta ? 'text-indigo-950 group-hover:text-[#7C69EF]' : esTarjetaVerde ? 'text-emerald-900 group-hover:text-emerald-600' : 'text-[#2D3142] group-hover:text-[#7C69EF]'
                      }`}>
                        {pedido.nombre} {pedido.apellido}
                      </h3>
                      <span className={`text-[10px] sm:text-xs font-black text-white px-2 py-0.5 sm:py-1 rounded-xl shadow-xs self-start sm:self-auto shrink-0 ${
                        esCanceladoTab
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/20'
                          : esVentaDirecta
                            ? 'bg-gradient-to-r from-[#7C69EF] to-purple-600 shadow-indigo-500/20'
                            : esTarjetaVerde 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20' 
                              : 'bg-gradient-to-r from-rose-500 to-pink-500'
                      }`}>
                        ${Number(pedido.precio || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className={`space-y-1 text-[10px] sm:text-xs p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
                      esCanceladoTab ? 'bg-red-50/50 text-red-900/80 border border-red-100/50' : esVentaDirecta ? 'bg-indigo-50/40 text-indigo-950/80 border border-indigo-100/50' : esTarjetaVerde ? 'bg-emerald-50/50 text-emerald-900/80 border border-emerald-100/50' : 'text-[#6E7387] pt-2 sm:pt-2.5 border-t border-rose-50 bg-[#FAF8FF]/50'
                    }`}>
                      <p className="flex items-center gap-1.5 truncate">
                        <span className={esCanceladoTab ? 'text-red-500' : esVentaDirecta ? 'text-[#7C69EF]' : esTarjetaVerde ? 'text-emerald-500' : 'text-rose-400'}>✉</span> <span className="truncate">{pedido.correo}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className={esCanceladoTab ? 'text-red-500' : esVentaDirecta ? 'text-[#7C69EF]' : esTarjetaVerde ? 'text-emerald-500' : 'text-rose-400'}>📱</span> <span className="truncate">{pedido.telefono}</span>
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <span className={esCanceladoTab ? 'text-red-500' : esVentaDirecta ? 'text-[#7C69EF]' : esTarjetaVerde ? 'text-emerald-500' : 'text-rose-400'}>📍</span> <span className="truncate">{pedido.direccion} ({pedido.barrio || "Sin barrio"})</span>
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción en la tarjeta */}
                  <div className={`pt-2 sm:pt-2.5 border-t flex flex-col gap-1.5 ${esCanceladoTab ? 'border-red-100' : esVentaDirecta ? 'border-indigo-100' : esTarjetaVerde ? 'border-emerald-100' : 'border-rose-50'}`}>
                    
                    {filtroEstado === "pagado" ? (
                      <>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirDetallesPedido(pedido)}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold px-2 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs transition-all flex items-center justify-center gap-1 shadow-xs border border-indigo-100"
                            title="Ver todos los detalles del pedido"
                          >
                            <span>👁️</span> <span className="hidden sm:inline">Ver más</span><span className="sm:hidden">Ver</span>
                          </button>

                          {!esTarjetaVerde && !esVentaDirecta && (
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
                              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-2 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs transition-all flex items-center justify-center gap-1 shadow-xs border border-emerald-100"
                              title="Jugar Bingo con los datos de este cliente"
                            >
                              <span>🎮</span> Bingo
                            </button>
                          )}
                        </div>

                        {esTarjetaVerde && pestañaActual && pestañaActual.siguienteEstado && (
                          <button
                            onClick={() => manejarCambioEstado(pedido, pestañaActual.siguienteEstado)}
                            className="w-full font-black py-1.5 sm:py-2 px-2 rounded-xl text-[9px] sm:text-xs transition-all text-center shadow-2xs border bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 border-emerald-400"
                          >
                            {pestañaActual.textoBoton} 🚀
                          </button>
                        )}

                        <button
                          onClick={() => abrirModalCancelar(pedido)}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black py-1.5 px-2 rounded-xl text-[9px] sm:text-xs transition-all text-center shadow-2xs"
                        >
                          Cancelar ❌
                        </button>
                      </>
                    ) : filtroEstado === "enviado" || filtroEstado === "cancelado" ? (
                      <button
                        onClick={() => abrirDetallesPedido(pedido)}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold px-3 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs border border-indigo-100"
                        title="Ver todos los detalles del pedido"
                      >
                        <span>👁️</span> Ver más
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirDetallesPedido(pedido)}
                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold px-2 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs transition-all flex items-center justify-center gap-1 shadow-xs border border-indigo-100"
                            title="Ver todos los detalles del pedido"
                          >
                            <span>👁</span> <span className="hidden sm:inline">Ver más</span><span className="sm:hidden">Ver</span>
                          </button>

                          {pestañaActual && pestañaActual.siguienteEstado && (
                            <button
                              onClick={() => manejarCambioEstado(pedido, pestañaActual.siguienteEstado)}
                              className="flex-1 bg-gradient-to-r from-rose-500 to-[#7C69EF] hover:opacity-90 text-white font-black py-1.5 sm:py-2 px-2 rounded-xl text-[9px] sm:text-xs transition-all text-center shadow-xs truncate"
                            >
                              {pestañaActual.textoBoton} ⏳
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => abrirModalCancelar(pedido)}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black py-1.5 px-2 rounded-xl text-[9px] sm:text-xs transition-all text-center shadow-2xs"
                        >
                          Cancelar ❌
                        </button>
                      </>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ALERTA VISUAL CENTRAL DE CONFIRMACIÓN DE CAMBIO DE ESTADO */}
      {confirmacionCambioEstado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-rose-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner">
              ✨
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-black text-[#2D3142] uppercase tracking-wider">Confirmar Cambio de Estado</h3>
              <p className="text-[11px] sm:text-xs text-[#6E7387] leading-relaxed">
                ¿Estás seguro de pasar el pedido de <strong className="text-[#7C69EF]">{(confirmacionCambioEstado.pedido.nombre || "")}</strong> a la pestaña <strong className="text-rose-500">"{confirmacionCambioEstado.textoAccion}"</strong>?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmacionCambioEstado(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#6E7387] font-black py-2.5 rounded-xl text-[11px] sm:text-xs transition-all shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCambioEstadoGlobal}
                className="flex-1 bg-gradient-to-r from-rose-500 to-[#7C69EF] hover:opacity-90 text-white font-black py-2.5 rounded-xl text-[11px] sm:text-xs transition-all shadow-md shadow-rose-500/25"
              >
                Confirmar 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA SOLICITAR MOTIVO DE CANCELACIÓN */}
      {isModalCancelarOpen && pedidoACancelar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-red-200 space-y-4">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm p-1.5 rounded-xl bg-red-100 text-red-600 shadow-xs">❌</span>
                <h3 className="text-xs sm:text-sm font-black text-[#2D3142]">Cancelar Pedido</h3>
              </div>
              <button 
                onClick={() => setIsModalCancelarOpen(false)} 
                className="w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-100 font-bold flex items-center justify-center text-xs sm:text-sm transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2.5">
              <p className="text-[11px] sm:text-xs text-[#6E7387] leading-relaxed">
                Por favor, escribe el motivo por el cual se cancela el pedido de <strong className="text-[#2D3142]">{pedidoACancelar.nombre} {pedidoACancelar.apellido}</strong>:
              </p>
              <textarea
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Escribe el motivo de la cancelación aquí..."
                rows="3.5"
                className="w-full bg-red-50/40 border border-red-200 rounded-xl p-3 text-[11px] sm:text-xs font-bold text-[#2D3142] shadow-inner focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all resize-none"
              ></textarea>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsModalCancelarOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#6E7387] font-black py-2.5 rounded-xl text-[11px] sm:text-xs transition-all shadow-xs"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacionPedido}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white font-black py-2.5 rounded-xl text-[11px] sm:text-xs transition-all shadow-md shadow-red-500/25"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE PEDIDO */}
      {isModalEditarOpen && pedidoAEditar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border-2 border-amber-200 space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm p-2 rounded-xl bg-amber-100 text-amber-600 shadow-xs">✏️</span>
                <h3 className="text-xs sm:text-sm font-black text-[#2D3142]">Editar Pedido #{pedidoAEditar.id || pedidoAEditar.firebaseId}</h3>
              </div>
              <button 
                onClick={() => setIsModalEditarOpen(false)} 
                className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold flex items-center justify-center text-xs sm:text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-[11px] sm:text-xs">
              
              {/* Sección Datos del Cliente */}
              <div className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100 space-y-2.5">
                <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Datos del Cliente</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">Nombre:</label>
                    <input 
                      type="text" 
                      value={formEditar.nombre} 
                      onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">Apellido:</label>
                    <input 
                      type="text" 
                      value={formEditar.apellido} 
                      onChange={(e) => setFormEditar({ ...formEditar, apellido: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">Teléfono:</label>
                    <input 
                      type="text" 
                      value={formEditar.telefono} 
                      onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">Correo:</label>
                    <input 
                      type="text" 
                      value={formEditar.correo} 
                      onChange={(e) => setFormEditar({ ...formEditar, correo: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">Dirección:</label>
                    <input 
                      type="text" 
                      value={formEditar.direccion} 
                      onChange={(e) => setFormEditar({ ...formEditar, direccion: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">Barrio:</label>
                    <input 
                      type="text" 
                      value={formEditar.barrio} 
                      onChange={(e) => setFormEditar({ ...formEditar, barrio: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">Ciudad:</label>
                    <input 
                      type="text" 
                      value={formEditar.ciudad} 
                      onChange={(e) => setFormEditar({ ...formEditar, ciudad: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#9EA2B3] text-[10px]">¿Quién recibe?:</label>
                    <input 
                      type="text" 
                      value={formEditar.quienrecibe} 
                      onChange={(e) => setFormEditar({ ...formEditar, quienrecibe: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[#9EA2B3] text-[10px]">Categoría / Motivo 🧸:</label>
                    <input 
                      type="text" 
                      value={formEditar.categoria} 
                      onChange={(e) => setFormEditar({ ...formEditar, categoria: e.target.value })}
                      className="w-full bg-white border border-amber-200 rounded-lg p-1.5 font-bold text-[#2D3142]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Gestión de Productos */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Productos del Pedido</p>
                  <span className="font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100 text-xs">
                    Total: ${Number(formEditar.precio || 0).toLocaleString()}
                  </span>
                </div>

                {/* Agregar Nuevo Producto desde Inventario */}
                <div className="bg-white p-2.5 rounded-2xl border border-rose-100 flex flex-col sm:flex-row items-center gap-2">
                  <select 
                    value={productoSeleccionadoInv}
                    onChange={(e) => setProductoSeleccionadoInv(e.target.value)}
                    className="w-full sm:flex-1 bg-amber-50/50 border border-amber-200 rounded-xl p-2 font-bold text-[#2D3142] text-[11px]"
                  >
                    <option value="">-- Seleccionar producto del inventario --</option>
                    {inventario.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.nombre || prod.name} (${Number(prod.precio || prod.price || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <input 
                      type="number"
                      min="1"
                      value={cantidadNuevoProducto}
                      onChange={(e) => setCantidadNuevoProducto(e.target.value)}
                      className="w-16 bg-white border border-amber-200 rounded-xl p-2 font-bold text-[#2D3142] text-center"
                    />
                    <button
                      type="button"
                      onClick={agregarProductoDesdeInventario}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black px-3 py-2 rounded-xl hover:opacity-90 transition-all shadow-xs"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de productos actuales */}
                <div className="border border-rose-100 rounded-2xl overflow-hidden divide-y divide-rose-50 bg-white">
                  {formEditar.productos && formEditar.productos.length > 0 ? (
                    formEditar.productos.map((prod, idx) => {
                      const nombreProd = typeof prod === 'object' ? (prod.name || prod.nombre || 'Producto sin nombre') : prod;
                      const precioProd = typeof prod === 'object' ? Number(prod.precio || prod.price || 0) : 0;
                      const cantProd = typeof prod === 'object' ? Number(prod.cantidad || prod.quantity || 1) : 1;

                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                          <span className="font-bold text-[#2D3142] flex-1 truncate">{nombreProd}</span>

                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min="1"
                              value={cantProd}
                              onChange={(e) => manejarCambioCantidadProd(idx, e.target.value)}
                              className="w-14 bg-amber-50 border border-amber-200 rounded-lg p-1 text-center font-bold text-[#2D3142]"
                            />
                            {precioProd > 0 && (
                              <span className="font-mono font-bold text-[#7C69EF] text-[10px] sm:text-xs">
                                ${(precioProd * cantProd).toLocaleString()}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => eliminarProductoEdicion(idx)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors font-bold"
                              title="Quitar producto"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="p-4 text-center text-[#9EA2B3]">Sin productos en el pedido.</p>
                  )}
                </div>

              </div>

            </div>

            <div className="pt-2 border-t border-amber-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsModalEditarOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-[#6E7387] font-black px-4 py-2 rounded-xl text-[11px] sm:text-xs transition-all shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCambiosPedido}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-black px-5 py-2 rounded-xl text-[11px] sm:text-xs transition-all shadow-md shadow-amber-500/20"
              >
                Guardar Cambios 💾
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DEL PEDIDO ("VER MÁS") */}
      {isModalDetallesOpen && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs sm:text-sm p-2 rounded-xl bg-rose-100 text-rose-600 shadow-xs">📋</span>
                <h3 className="text-xs sm:text-sm font-black text-[#2D3142]">Detalles del Pedido</h3>
              </div>
              <button 
                onClick={() => setIsModalDetallesOpen(false)} 
                className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 font-bold flex items-center justify-center text-xs sm:text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido de los Detalles */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              
              {/* Información del cliente */}
              <div className="bg-[#FAF8FF] p-4 rounded-2xl border border-[#7C69EF]/15 shadow-inner space-y-2.5">
                <p className="text-[10px] font-black uppercase text-[#7C69EF] tracking-wider">Información del Cliente</p>
                <div className="grid grid-cols-2 gap-2.5 text-[11px] sm:text-xs">
                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">ID del Pedido:</span>
                    <span className="font-mono font-bold text-[#7C69EF] bg-indigo-50 px-2.5 py-1 rounded-md inline-block">{pedidoSeleccionado.id || pedidoSeleccionado.firebaseId}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Nombre completo:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.nombre} {pedidoSeleccionado.apellido}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Teléfono:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.telefono}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Correo Electrónico:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.correo}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Dirección:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.direccion}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Barrio:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.barrio || "No especificado"}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Ciudad:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.ciudad || "No especificada"}</span>
                  </div>
                  <div>
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Categoría / Motivo 🧸:</span>
                    <span className="font-bold text-[#D87093]">{pedidoSeleccionado.categoria || "No especificada"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">¿Quién recibe?:</span>
                    <span className="font-bold text-[#2D3142]">{pedidoSeleccionado.quienrecibe || "No especificado"}</span>
                  </div>

                  <div className="col-span-2">
                    {pedidoSeleccionado.estadoventa === 'bingo' ? (
                      <div>
                        <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Cantidad de Partidas:</span>
                        <span className="font-bold text-[#7C69EF]">{pedidoSeleccionado.cantidadPartidas || 1} Partida(s)</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Total de Productos:</span>
                        <span className="font-bold text-[#7C69EF]">
                          {pedidoSeleccionado.productos ? pedidoSeleccionado.productos.length : (pedidoSeleccionado.cantidadPartidas || 1)} Producto(s)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <span className="text-[#9EA2B3] block text-[10px] sm:text-[11px]">Fecha de Creación:</span>
                    <span className="font-bold text-[#2D3142]">
                      {pedidoSeleccionado.fechaCreacion?.seconds 
                        ? new Date(pedidoSeleccionado.fechaCreacion.seconds * 1000).toLocaleString('es-CO') 
                        : "Fecha reciente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de productos solicitados con cantidad y cálculo de precio total */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black uppercase text-[#7C69EF] tracking-wider">
                    {pedidoSeleccionado.estadoventa === 'bingo' ? 'Partidas del Bingo' : 'Productos Solicitados'} ({pedidoSeleccionado.productos ? pedidoSeleccionado.productos.length : 0})
                  </p>
                  <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                    Total: ${Number(
                      pedidoSeleccionado.precio || 
                      (pedidoSeleccionado.productos && pedidoSeleccionado.productos.reduce((acc, p) => acc + (Number(p.precio || p.price || 0) * Number(p.quantity || p.cantidad || 1)), 0)) || 0
                    ).toLocaleString()}
                  </span>
                </div>
                
                <div className="border border-rose-100 rounded-2xl overflow-hidden divide-y divide-rose-50 bg-white shadow-xs">
                  {pedidoSeleccionado.productos && pedidoSeleccionado.productos.length > 0 ? (
                    pedidoSeleccionado.productos.map((prod, idx) => {
                      const nombreProd = typeof prod === 'object' ? (prod.name || prod.nombre || 'Producto sin nombre') : prod;
                      const precioProd = typeof prod === 'object' ? Number(prod.precio || prod.price || 0) : 0;
                      const cantidadProd = typeof prod === 'object' ? Number(prod.quantity || prod.cantidad || 1) : 1;
                      
                      return (
                        <div key={idx} className="p-2.5 sm:p-3 flex items-center justify-between text-[11px] sm:text-xs">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-[#7C69EF] font-black px-2 py-0.5 rounded-md text-[10px] border border-indigo-100">
                              {cantidadProd}x
                            </span>
                            <span className="font-bold text-[#2D3142]">{nombreProd}</span>
                          </div>
                          {precioProd > 0 && (
                            <span className="font-mono font-bold text-[#7C69EF]">${(precioProd * cantidadProd).toLocaleString()}</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="p-4 text-center text-[11px] text-[#9EA2B3]">No hay productos registrados en este pedido.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="pt-2 border-t border-rose-100 flex justify-end">
              <button
                onClick={() => setIsModalDetallesOpen(false)}
                className="bg-gradient-to-r from-rose-500 to-[#7C69EF] text-white font-black px-5 py-2.5 rounded-xl text-[11px] sm:text-xs shadow-md shadow-rose-500/20 hover:opacity-90 transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};