import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { PackagePlus, PackageMinus, Search, CheckCircle2, AlertCircle, Layers, Sparkles, ShieldAlert, X, History, Truck, Eye } from 'lucide-react';
import Movimientos from '../movimientos/Movimientos';

export default function CargoyDescargo({ productoSeleccionadoProp }) {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [pedidosEnviados, setPedidosEnviados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMov, setSearchMov] = useState('');
  const [searchPedidos, setSearchPedidos] = useState('');
  const [activeTab, setActiveTab] = useState('gestion'); // 'gestion' | 'movimientos' | 'pedidos_descargados'
  const [selectedProductId, setSelectedProductId] = useState(productoSeleccionadoProp?.id || null);
  const [cantidadInput, setCantidadInput] = useState('');
  const [tipoOperacion, setTipoOperacion] = useState('carga');
  const [justificacionCarga, setJustificacionCarga] = useState('');
  const [motivoDescargo, setMotivoDescargo] = useState('');
  const [autorizadoPor, setAutorizadoPor] = useState('');
  const [claveAdmin, setClaveAdmin] = useState('');
  const [justificacionOtro, setJustificacionOtro] = useState('');
  const [mensajeFeedback, setMensajeFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [errorClaveModalOpen, setErrorClaveModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  
  const [pedidoSeleccionadoDetalle, setPedidoSeleccionadoDetalle] = useState(null);
  const productRefs = useRef({});

  useEffect(() => {
    const unsubInv = onSnapshot(collection(db, "inventario"), (snap) => {
      setProductos(snap.docs.map(d => ({ id: d.id, ...d.data(), udisponibles: Number(d.data().udisponibles ?? d.data().stock ?? d.data().cantidad ?? 0), img: d.data().img || d.data().img1 || '' })));
      setIsLoading(false);
    });
    const unsubMov = onSnapshot(collection(db, "historial_movimientos"), (snap) => {
      setMovimientos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubPedidos = onSnapshot(collection(db, "pedidos"), (snap) => {
      const todosPedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtrados = todosPedidos.filter(p => {
        const estado = (p.estado || '').toLowerCase().trim();
        return estado === 'pagado' || estado === 'enviado' || estado === 'entregado';
      });
      setPedidosEnviados(filtrados);
    });
    return () => { unsubInv(); unsubMov(); unsubPedidos(); };
  }, []);

  useEffect(() => {
    if (!productoSeleccionadoProp) return;
    if (productoSeleccionadoProp.id) {
      setSelectedProductId(productoSeleccionadoProp.id);
      if (window.innerWidth < 1024) setIsMobileModalOpen(true);
    }
    if (productos.length > 0) {
      const encontrado = productos.find(p => p.id === productoSeleccionadoProp.id || (productoSeleccionadoProp.nombre && p.nombre?.toLowerCase().trim() === productoSeleccionadoProp.nombre.toLowerCase().trim()));
      if (encontrado) {
        setSelectedProductId(encontrado.id);
        setTimeout(() => productRefs.current[encontrado.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
        if (window.innerWidth < 1024) setIsMobileModalOpen(true);
      }
    }
  }, [productoSeleccionadoProp, productos]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return productos.find(p => p.id === selectedProductId) || (productoSeleccionadoProp?.id === selectedProductId ? { ...productoSeleccionadoProp, udisponibles: Number(productoSeleccionadoProp.udisponibles ?? productoSeleccionadoProp.stock ?? 0) } : null);
  }, [productos, selectedProductId, productoSeleccionadoProp]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return !q ? productos : productos.filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q));
  }, [productos, searchQuery]);

  const filteredMovimientos = useMemo(() => {
    const q = searchMov.toLowerCase().trim();
    const sorted = [...movimientos].sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
    return !q ? sorted : sorted.filter(m => (m.productoNombre || '').toLowerCase().includes(q) || (m.categoria || '').toLowerCase().includes(q) || (m.justificacion || '').toLowerCase().includes(q));
  }, [movimientos, searchMov]);

  const filteredPedidosEnviados = useMemo(() => {
    const q = searchPedidos.toLowerCase().trim();
    const sorted = [...pedidosEnviados].sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0));
    return !q ? sorted : sorted.filter(p => {
      const nombreCliente = (p.nombre || '').toLowerCase();
      const telefono = (p.telefono || '').toLowerCase();
      const direccion = (p.direccion || '').toLowerCase();
      const estado = (p.estado || '').toLowerCase();
      const productosMatch = p.productos?.some(prod => (prod.name || prod.nombre || '').toLowerCase().includes(q));
      return nombreCliente.includes(q) || telefono.includes(q) || direccion.includes(q) || estado.includes(q) || productosMatch;
    });
  }, [pedidosEnviados, searchPedidos]);

  const handlePreparaMovimiento = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const cantidad = parseInt(cantidadInput, 10);
    if (isNaN(cantidad) || cantidad <= 0) return alert("Ingresa una cantidad válida mayor a 0 ✨.");
    if (tipoOperacion === 'descargo' && Number(selectedProduct.udisponibles || 0) - cantidad < 0) return alert("¡Cuidado! No puedes descargar más unidades de las disponibles 🌸.");
    if (tipoOperacion === 'carga' && !justificacionCarga.trim()) return alert("Por favor escribe la justificación de la carga ✨.");
    if (tipoOperacion === 'descargo') {
      if (!motivoDescargo) return alert("Por favor selecciona un motivo para el descargo 🌸.");
      if (motivoDescargo === 'USO INTERNO' && !autorizadoPor.trim()) return alert("Indica quién autoriza el uso interno 🔒.");
      if (motivoDescargo === 'ERROR DE INGRESO' && !claveAdmin.trim()) return alert("Ingresa la clave del administrador para continuar 🔑.");
      if (motivoDescargo === 'OTRO' && !justificacionOtro.trim()) return alert("Escribe el detalle del motivo 'OTRO' 📝.");
      if (motivoDescargo === 'ERROR DE INGRESO' && claveAdmin !== '270523') { setErrorClaveModalOpen(true); return; }
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmarMovimiento = async () => {
    if (!selectedProduct) return;
    const cantidad = parseInt(cantidadInput, 10);
    const cambioReal = cantidad * (tipoOperacion === 'carga' ? 1 : -1);
    const stockAnterior = Number(selectedProduct.udisponibles || 0);
    
    let detalleJust = tipoOperacion === 'carga' ? justificacionCarga : motivoDescargo;
    if (motivoDescargo === 'USO INTERNO') detalleJust += ` (Autorizado por: ${autorizadoPor})`;
    if (motivoDescargo === 'OTRO') detalleJust += ` (${justificacionOtro})`;

    setIsSubmitting(true);
    setIsConfirmModalOpen(false);

    try {
      const updateData = { udisponibles: increment(cambioReal) };
      if (tipoOperacion === 'carga') {
        updateData.uingresadas = increment(cantidad);
      }

      await updateDoc(doc(db, "inventario", selectedProduct.id), updateData);
      
      await addDoc(collection(db, "historial_movimientos"), {
        productoId: selectedProduct.id, productoNombre: selectedProduct.nombre || "Sin nombre",
        categoria: selectedProduct.categoria || "General", imagen: selectedProduct.img || "",
        tipo: tipoOperacion, cantidad, stockAnterior, stockNuevo: stockAnterior + cambioReal,
        justificacion: detalleJust, fecha: serverTimestamp()
      });
      setMensajeFeedback({ tipo: tipoOperacion, texto: `✨ ¡Se ${tipoOperacion === 'carga' ? 'agregaron' : 'descontaron'} ${cantidad} unidades con éxito!` });
      setCantidadInput(''); setJustificacionCarga(''); setMotivoDescargo(''); setAutorizadoPor(''); setClaveAdmin(''); setJustificacionOtro('');
      setIsMobileModalOpen(false);
      setTimeout(() => setMensajeFeedback(null), 4000);
    } catch (error) {
      console.error(error); alert("Hubo un error al actualizar el stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const renderFormularioMovimiento = () => (
    <form onSubmit={handlePreparaMovimiento} id="form-movimiento-modal" className="space-y-2">
      <div className="bg-pink-50/50 p-2 rounded-xl border border-pink-100">
        <div className="text-[7px] font-black text-pink-600 uppercase tracking-wider mb-0.5">Seleccionado</div>
        <div className="font-black text-[11px] text-slate-900 truncate">{selectedProduct?.nombre || 'Producto seleccionado'}</div>
        <div className="text-[9px] font-bold text-slate-600 mt-0.5">Stock bodega: <span className="text-emerald-600 font-black">{selectedProduct?.udisponibles ?? 0} un.</span></div>
      </div>
      <div>
        <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-1">Operación</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={() => { setTipoOperacion('carga'); setMotivoDescargo(''); }} className={`py-1 rounded-lg font-extrabold text-[10px] flex items-center justify-center gap-1 ${tipoOperacion === 'carga' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}><PackagePlus className="w-3 h-3" /> Carga (+)</button>
          <button type="button" onClick={() => { setTipoOperacion('descargo'); setJustificacionCarga(''); }} className={`py-1 rounded-lg font-extrabold text-[10px] flex items-center justify-center gap-1 ${tipoOperacion === 'descargo' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}><PackageMinus className="w-3 h-3" /> Descargo (-)</button>
        </div>
      </div>
      <div>
        <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-0.5">Cantidad</label>
        <input type="number" min="1" value={cantidadInput} onChange={(e) => setCantidadInput(e.target.value)} placeholder="Ej. 10" required className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-[11px] font-black text-slate-900 focus:outline-none focus:border-pink-500" />
      </div>
      <div className="flex gap-1">
        {[1, 5, 10, 20].map((num) => (
          <button key={num} type="button" onClick={() => setCantidadInput(String(num))} className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-extrabold text-[9px] py-1 rounded border border-pink-100">+{num}</button>
        ))}
      </div>
      {tipoOperacion === 'carga' && (
        <div>
          <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-0.5">Justificación de Carga *</label>
          <input type="text" value={justificacionCarga} onChange={(e) => setJustificacionCarga(e.target.value)} placeholder="Ej. Compra proveedor" required className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-pink-500" />
        </div>
      )}
      {tipoOperacion === 'descargo' && (
        <div className="space-y-1.5">
          <div>
            <label className="block text-[8px] font-black uppercase text-slate-500 tracking-wider mb-0.5">Motivo del Descargo *</label>
            <select value={motivoDescargo} onChange={(e) => { setMotivoDescargo(e.target.value); setAutorizadoPor(''); setClaveAdmin(''); setJustificacionOtro(''); }} required className="w-full bg-white border border-pink-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-pink-500">
              <option value="">Selecciona motivo...</option>
              {['DAÑO', 'VENCIMIENTO', 'OBSEQUIO', 'USO INTERNO', 'ERROR DE INGRESO', 'OTRO'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {motivoDescargo === 'USO INTERNO' && <input type="text" value={autorizadoPor} onChange={(e) => setAutorizadoPor(e.target.value)} placeholder="Autorizado por" required className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-800" />}
          {motivoDescargo === 'ERROR DE INGRESO' && <input type="password" value={claveAdmin} onChange={(e) => setClaveAdmin(e.target.value)} placeholder="Clave admin" required className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-800" />}
          {motivoDescargo === 'OTRO' && <input type="text" value={justificacionOtro} onChange={(e) => setJustificacionOtro(e.target.value)} placeholder="Detalle motivo" required className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-800" />}
        </div>
      )}
      <button type="submit" disabled={isSubmitting || !cantidadInput} className={`w-full py-1.5 rounded-xl font-black text-[11px] text-white shadow-xs ${tipoOperacion === 'carga' ? 'bg-emerald-600' : 'bg-amber-600'} ${isSubmitting ? 'opacity-50' : ''}`}>
        {isSubmitting ? 'Actualizando...' : `Continuar con ${tipoOperacion === 'carga' ? 'Carga' : 'Descargo'} ✨`}
      </button>
      <button type="button" onClick={() => setSelectedProductId(null)} className="w-full text-slate-400 hover:text-slate-600 font-bold text-[10px] py-0.5">Cancelar selección</button>
    </form>
  );

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-6 text-slate-800 font-sans relative">
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-md mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg"><Layers className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" /></div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.2 rounded-full text-pink-100">Panel Logística 🌸</span>
            <h1 className="text-xs sm:text-lg font-black tracking-tight mt-0.5">Carga, Descargo y Movimientos ✨</h1>
          </div>
        </div>
        <div className="flex flex-wrap bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/10 w-full sm:w-auto gap-1">
          <button onClick={() => setActiveTab('gestion')} className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg font-black text-[11px] sm:text-xs transition-all ${activeTab === 'gestion' ? 'bg-white text-pink-600 shadow-xs' : 'text-white hover:text-pink-200'}`}>Gestión Stock</button>
          <button onClick={() => setActiveTab('movimientos')} className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg font-black text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 ${activeTab === 'movimientos' ? 'bg-white text-pink-600 shadow-xs' : 'text-white hover:text-pink-200'}`}><History className="w-3 h-3" /> Movimientos</button>
          <button onClick={() => setActiveTab('pedidos_descargados')} className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg font-black text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 ${activeTab === 'pedidos_descargados' ? 'bg-white text-emerald-700 shadow-xs' : 'text-white hover:text-emerald-200'}`}><Truck className="w-3 h-3" /> Pedidos</button>
        </div>
      </div>

      {mensajeFeedback && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-white shadow-md ${mensajeFeedback.tipo === 'carga' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-[11px] sm:text-sm font-bold">{mensajeFeedback.texto}</span>
        </div>
      )}

      {activeTab === 'gestion' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-pink-100 shadow-xs">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar producto..." className="w-full bg-pink-50/40 border border-pink-100 rounded-lg pl-9 pr-3 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-pink-500" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 whitespace-nowrap">{filteredProducts.length} prod.</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredProducts.map((prod) => {
                const isSelected = selectedProductId === prod.id;
                return (
                  <div key={prod.id} ref={el => productRefs.current[prod.id] = el} onClick={() => { setSelectedProductId(prod.id); if (window.innerWidth < 1024) setIsMobileModalOpen(true); }} className={`bg-white border rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all ${isSelected ? 'border-pink-500 ring-1 ring-pink-400/30 bg-pink-50/40' : 'border-pink-100 hover:border-pink-300'}`}>
                    <div className="w-11 h-11 bg-pink-50 rounded-lg overflow-hidden flex-shrink-0 border border-pink-100 flex items-center justify-center">
                      {prod.img ? <img src={prod.img} alt={prod.nombre} className="w-full h-full object-cover" /> : <span className="text-[7px] text-pink-300 font-bold">Sin foto</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[7px] font-black px-1.5 py-0.2 rounded bg-pink-100 text-pink-700 uppercase">{prod.categoria || "General"}</span>
                      <h4 className="font-extrabold text-[11px] text-slate-800 truncate mt-0.5">{prod.nombre}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-500">${Number(prod.precio || 0).toLocaleString('es-CO')}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Stock: {prod.udisponibles}</span>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${isSelected ? 'bg-pink-500 border-pink-500 text-white' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && <div className="col-span-2 text-center py-8 bg-white rounded-xl border border-pink-100"><AlertCircle className="w-6 h-6 text-pink-300 mx-auto mb-1" /><p className="text-[11px] font-bold text-slate-600">No se encontraron productos.</p></div>}
            </div>
          </div>
          
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-pink-100 p-4 shadow-xs sticky top-6">
              <h3 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Registro de Movimiento
              </h3>
              {selectedProduct ? (
                <div className="space-y-3">
                  <form onSubmit={handlePreparaMovimiento} id="form-movimiento" className="space-y-2.5">
                    <div className="bg-pink-50/50 p-2.5 rounded-xl border border-pink-100">
                      <div className="text-[8px] font-black text-pink-600 uppercase tracking-wider mb-0.5">Seleccionado</div>
                      <div className="font-black text-xs text-slate-900 truncate">{selectedProduct?.nombre || 'Producto seleccionado'}</div>
                      <div className="text-[10px] font-bold text-slate-600 mt-0.5">Stock bodega: <span className="text-emerald-600 font-black">{selectedProduct?.udisponibles ?? 0} un.</span></div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1">Operación</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button type="button" onClick={() => { setTipoOperacion('carga'); setMotivoDescargo(''); }} className={`py-1.5 rounded-lg font-extrabold text-[11px] flex items-center justify-center gap-1 ${tipoOperacion === 'carga' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}><PackagePlus className="w-3.5 h-3.5" /> Carga (+)</button>
                        <button type="button" onClick={() => { setTipoOperacion('descargo'); setJustificacionCarga(''); }} className={`py-1.5 rounded-lg font-extrabold text-[11px] flex items-center justify-center gap-1 ${tipoOperacion === 'descargo' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}><PackageMinus className="w-3.5 h-3.5" /> Descargo (-)</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1">Cantidad</label>
                      <input type="number" min="1" value={cantidadInput} onChange={(e) => setCantidadInput(e.target.value)} placeholder="Ej. 10" required className="w-full bg-white border border-pink-200 rounded-lg px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-pink-500" />
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 5, 10, 20].map((num) => (
                        <button key={num} type="button" onClick={() => setCantidadInput(String(num))} className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-extrabold text-[10px] py-1 rounded border border-pink-100">+{num}</button>
                      ))}
                    </div>
                    {tipoOperacion === 'carga' && (
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider mb-0.5">Justificación de Carga *</label>
                        <input type="text" value={justificacionCarga} onChange={(e) => setJustificacionCarga(e.target.value)} placeholder="Ej. Compra proveedor" required className="w-full bg-white border border-pink-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-pink-500" />
                      </div>
                    )}
                    {tipoOperacion === 'descargo' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider mb-0.5">Motivo del Descargo *</label>
                          <select value={motivoDescargo} onChange={(e) => { setMotivoDescargo(e.target.value); setAutorizadoPor(''); setClaveAdmin(''); setJustificacionOtro(''); }} required className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-pink-500">
                            <option value="">Selecciona motivo...</option>
                            {['DAÑO', 'VENCIMIENTO', 'OBSEQUIO', 'USO INTERNO', 'ERROR DE INGRESO', 'OTRO'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        {motivoDescargo === 'USO INTERNO' && <input type="text" value={autorizadoPor} onChange={(e) => setAutorizadoPor(e.target.value)} placeholder="Autorizado por" required className="w-full bg-white border border-pink-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-800" />}
                        {motivoDescargo === 'ERROR DE INGRESO' && <input type="password" value={claveAdmin} onChange={(e) => setClaveAdmin(e.target.value)} placeholder="Clave admin" required className="w-full bg-white border border-pink-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-800" />}
                        {motivoDescargo === 'OTRO' && <input type="text" value={justificacionOtro} onChange={(e) => setJustificacionOtro(e.target.value)} placeholder="Detalle motivo" required className="w-full bg-white border border-pink-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-800" />}
                      </div>
                    )}
                  </form>
                  <div className="pt-2 border-t border-pink-100 space-y-1.5">
                    <button type="submit" form="form-movimiento" disabled={isSubmitting || !cantidadInput} className={`w-full py-2 rounded-xl font-black text-xs text-white shadow-xs ${tipoOperacion === 'carga' ? 'bg-emerald-600' : 'bg-amber-600'} ${isSubmitting ? 'opacity-50' : ''}`}>
                      {isSubmitting ? 'Actualizando...' : `Continuar con ${tipoOperacion === 'carga' ? 'Carga' : 'Descargo'} ✨`}
                    </button>
                    <button type="button" onClick={() => setSelectedProductId(null)} className="w-full text-slate-400 hover:text-slate-600 font-bold text-[11px] py-0.5">Cancelar selección</button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <PackagePlus className="w-10 h-10 text-pink-200 mx-auto mb-2 animate-pulse" />
                  <p className="text-[11px] font-bold text-slate-500">Selecciona un producto de la lista.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'movimientos' && <Movimientos />}

      {activeTab === 'pedidos_descargados' && (
     <div className="space-y-2">
     <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
       <div className="relative w-full">
         <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-600" />
         <input type="text" value={searchPedidos} onChange={(e) => setSearchPedidos(e.target.value)} placeholder="Buscar pedido o cliente..." className="w-full bg-emerald-50/40 border border-emerald-200 rounded-md pl-8 pr-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500" />
       </div>
       <span className="text-[9px] font-extrabold text-emerald-700 whitespace-nowrap bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200">
         {filteredPedidosEnviados.length} reg.
       </span>
     </div>

     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 max-h-[550px] overflow-y-auto pr-1">
       {filteredPedidosEnviados.map((pedido) => (
         <div key={pedido.id} className="bg-emerald-50/80 border border-emerald-300/80 rounded-lg p-1.5 shadow-xs flex flex-col justify-between gap-1.5 relative overflow-hidden">
           <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[6px] font-black uppercase px-1.5 py-0.2 rounded-bl-md tracking-wider">
             {pedido.estado || 'Enviado'} 📦
           </div>
           <div className="flex items-start gap-1.5 pr-6">
             <div className="w-7 h-7 bg-white rounded-md overflow-hidden flex-shrink-0 border border-emerald-200 flex items-center justify-center shadow-2xs">
               {pedido.img || pedido.imagen ? <img src={pedido.img || pedido.imagen} alt="" className="w-full h-full object-cover" /> : <Truck className="w-3.5 h-3.5 text-emerald-600" />}
             </div>
             <div className="min-w-0 flex-1">
               <span className="text-[7px] font-extrabold text-emerald-800/70 block truncate">
                 {pedido.fecha?.seconds ? new Date(pedido.fecha.seconds * 1000).toLocaleDateString('es-CO') : 'Sin fecha'}
               </span>
               <h4 className="font-black text-[9px] text-emerald-950 truncate mt-0.2">
                 {pedido.productos && pedido.productos.length > 0 ? `${pedido.productos[0].name || pedido.productos[0].nombre || 'Producto'}${pedido.productos.length > 1 ? ` (+${pedido.productos.length - 1})` : ''}` : (pedido.nombreProducto || "Sin productos")}
               </h4>
               <p className="text-[8px] font-bold text-emerald-800 truncate mt-0.1">👤 <span className="font-extrabold">{pedido.nombre || "General"}</span></p>
             </div>
           </div>
           <div className="bg-white/70 rounded-md p-1.5 border border-emerald-200/60 space-y-0.5 text-[8px]">
             <div className="flex justify-between text-slate-700">
               <span className="truncate">📞 <strong className="truncate">{pedido.telefono || "S/N"}</strong></span>
               <span>Cant: <strong className="text-emerald-700">{pedido.productos ? pedido.productos.reduce((acc, p) => acc + Number(p.quantity || p.cantidad || 1), 0) : (pedido.cantidad || 1)}</strong></span>
             </div>
             {pedido.precio && (
               <div className="flex justify-between pt-0.5 border-t border-emerald-100 font-black text-emerald-900">
                 <span>Total:</span>
                 <span>${Number(pedido.precio).toLocaleString('es-CO')}</span>
               </div>
             )}
           </div>
           <button type="button" onClick={() => setPedidoSeleccionadoDetalle(pedido)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[8px] py-1 rounded-md flex items-center justify-center gap-0.5 shadow-xs">
             <Eye className="w-2.5 h-2.5" /> Ver detalles
           </button>
         </div>
       ))}
       {filteredPedidosEnviados.length === 0 && (
         <div className="col-span-full text-center py-8 bg-white rounded-xl border border-emerald-100 shadow-xs">
           <Truck className="w-6 h-6 text-emerald-300 mx-auto mb-1 animate-bounce" />
           <p className="text-[10px] font-bold text-slate-600">No hay pedidos pagados, enviados o entregados.</p>
         </div>
       )}
     </div>
   </div>
      )}

      {pedidoSeleccionadoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl border border-emerald-200 max-h-[85vh] overflow-y-auto relative">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-100 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><Truck className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">Detalles del Pedido</h3>
                  <span className="text-[8px] text-emerald-700 font-bold uppercase">Solo Lectura 🔒</span>
                </div>
              </div>
              <button type="button" onClick={() => setPedidoSeleccionadoDetalle(null)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="flex items-center gap-3 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-emerald-200 flex items-center justify-center">
                  {pedidoSeleccionadoDetalle.img || pedidoSeleccionadoDetalle.imagen ? <img src={pedidoSeleccionadoDetalle.img || pedidoSeleccionadoDetalle.imagen} alt="" className="w-full h-full object-cover" /> : <Truck className="w-6 h-6 text-emerald-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[7px] font-black uppercase bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded">{pedidoSeleccionadoDetalle.estado || 'Pagado / Enviado'}</span>
                  <h4 className="font-extrabold text-[11px] text-slate-900 truncate mt-0.5">{pedidoSeleccionadoDetalle.nombre || "Pedido sin nombre"}</h4>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[7px] font-black uppercase text-slate-400 block">Cliente</span>
                  <span className="font-bold text-slate-800 truncate block">{pedidoSeleccionadoDetalle.nombre || "N/D"}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[7px] font-black uppercase text-slate-400 block">Teléfono</span>
                  <span className="font-bold text-slate-800 truncate block">{pedidoSeleccionadoDetalle.telefono || "N/D"}</span>
                </div>
              </div>
              {pedidoSeleccionadoDetalle.direccion && (
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px]">
                  <span className="text-[7px] font-black uppercase text-slate-400 block">Dirección</span>
                  <span className="font-bold text-slate-800">{pedidoSeleccionadoDetalle.direccion}</span>
                </div>
              )}
              {Array.isArray(pedidoSeleccionadoDetalle.productos) && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-[10px]">
                  <span className="text-[8px] font-black uppercase text-emerald-700 block">Productos en esta orden 📦</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {pedidoSeleccionadoDetalle.productos.map((prodItem, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          {prodItem.img || prodItem.imagen ? <img src={prodItem.img || prodItem.imagen} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" /> : null}
                          <p className="font-extrabold text-slate-800 truncate text-[10px]">{prodItem.name || prodItem.nombre || `Prod #${idx + 1}`}</p>
                        </div>
                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">{prodItem.quantity || prodItem.cantidad || 1} un.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <button type="button" onClick={() => setPedidoSeleccionadoDetalle(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] py-2.5 rounded-xl shadow-xs">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {isMobileModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 lg:hidden">
          <div className="bg-white w-full max-w-xs rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-pink-200 max-h-[85vh] overflow-y-auto relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-black text-slate-900 flex items-center gap-1"><Sparkles className="w-3 h-3 text-pink-500" /> Registro de Movimiento</h3>
              <button type="button" onClick={() => { setIsMobileModalOpen(false); setSelectedProductId(null); }} className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
            {renderFormularioMovimiento()}
          </div>
        </div>
      )}

      {isConfirmModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white w-full max-w-xs rounded-2xl p-4 shadow-xl border border-pink-200 text-center relative">
            <div className={`w-11 h-11 rounded-xl mx-auto flex items-center justify-center mb-2 shadow-xs ${tipoOperacion === 'carga' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {tipoOperacion === 'carga' ? <PackagePlus className="w-5 h-5" /> : <PackageMinus className="w-5 h-5" />}
            </div>
            <h3 className="text-xs font-black text-slate-900 mb-1">¿Deseas {tipoOperacion === 'carga' ? 'añadir' : 'retirar'} <span className="text-pink-600">{cantidadInput} un.</span>?</h3>
            <div className="bg-pink-50/60 rounded-xl p-2.5 border border-pink-100 my-3 text-left space-y-1 text-[9px]">
              <div>📦 <strong className="text-slate-900">{selectedProduct.nombre}</strong></div>
              <div className="text-slate-500 flex justify-between"><span>Actual: {selectedProduct.udisponibles}</span><span>Final: <strong className="text-emerald-600">{tipoOperacion === 'carga' ? Number(selectedProduct.udisponibles) + parseInt(cantidadInput || 0) : Number(selectedProduct.udisponibles) - parseInt(cantidadInput || 0)}</strong></span></div>
              <div className="text-slate-600 pt-1 border-t border-pink-100">📝 <strong>Motivo:</strong> {tipoOperacion === 'carga' ? justificacionCarga : motivoDescargo}{motivoDescargo === 'USO INTERNO' && ` (${autorizadoPor})`}{motivoDescargo === 'OTRO' && ` (${justificacionOtro})`}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-extrabold text-[11px] py-2 rounded-xl">Cancelar</button>
              <button type="button" onClick={handleConfirmarMovimiento} className={`flex-1 text-white font-extrabold text-[11px] py-2 rounded-xl shadow-xs ${tipoOperacion === 'carga' ? 'bg-emerald-600' : 'bg-amber-600'}`}>¡Confirmar! 💕</button>
            </div>
          </div>
        </div>
      )}

      {errorClaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
          <div className="bg-white w-full max-w-xs rounded-2xl p-4 shadow-xl border border-rose-200 text-center relative">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-500 mx-auto flex items-center justify-center mb-2 shadow-xs"><ShieldAlert className="w-5 h-5" /></div>
            <h3 className="text-xs font-black text-slate-900 mb-0.5">¡Clave Incorrecta! 🔒</h3>
            <p className="text-[10px] text-slate-500 mb-3">La contraseña de administrador no es válida 🌸.</p>
            <button type="button" onClick={() => setErrorClaveModalOpen(false)} className="w-full bg-rose-500 text-white font-black text-[11px] py-2 rounded-xl shadow-md">¡Entendido! ✨</button>
          </div>
        </div>
      )}
    </div>
  );
}