import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  PackagePlus, PackageMinus, Search, 
  CheckCircle2, AlertCircle, Layers, Sparkles, ShieldAlert, X 
} from 'lucide-react';

export default function CargoyDescargo() {
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cantidadInput, setCantidadInput] = useState('');
  const [tipoOperacion, setTipoOperacion] = useState('carga');
  
  // Estados para las justificaciones
  const [justificacionCarga, setJustificacionCarga] = useState('');
  const [motivoDescargo, setMotivoDescargo] = useState('');
  const [autorizadoPor, setAutorizadoPor] = useState('');
  const [claveAdmin, setClaveAdmin] = useState('');
  const [justificacionOtro, setJustificacionOtro] = useState('');

  const [mensajeFeedback, setMensajeFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Nuevo estado para la alerta cute de error de clave
  const [errorClaveModalOpen, setErrorClaveModalOpen] = useState(false);

  // Estado para el modal de teléfono al seleccionar un producto
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "inventario"), (snapshot) => {
      const items = snapshot.docs.map(d => {
        const data = d.data();
        const stockReal = Number(data.udisponibles ?? data.stock ?? data.cantidad ?? 0);
        return { id: d.id, ...data, udisponibles: stockReal, img: data.img || data.img1 || '' };
      });
      setProductos(items);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const actualizado = productos.find(p => p.id === selectedProduct.id);
      if (actualizado) setSelectedProduct(actualizado);
    }
  }, [productos]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q));
  }, [productos, searchQuery]);

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    // Si estamos en vista de teléfono (pantallas menores a lg), abrimos el modal automáticamente
    if (window.innerWidth < 1024) {
      setIsMobileModalOpen(true);
    }
  };

  const handlePreparaMovimiento = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const cantidad = parseInt(cantidadInput, 10);
    if (isNaN(cantidad) || cantidad <= 0) return alert("Ingresa una cantidad válida mayor a 0 ✨.");
    
    const cambioReal = cantidad * (tipoOperacion === 'carga' ? 1 : -1);
    if (tipoOperacion === 'descargo' && Number(selectedProduct.udisponibles || 0) + cambioReal < 0) {
      return alert("¡Cuidado! No puedes descargar más unidades de las disponibles 🌸.");
    }

    // Validaciones de campos obligatorios
    if (tipoOperacion === 'carga' && !justificacionCarga.trim()) {
      return alert("Por favor escribe la justificación de la carga ✨.");
    }

    if (tipoOperacion === 'descargo') {
      if (!motivoDescargo) return alert("Por favor selecciona un motivo para el descargo 🌸.");
      if (motivoDescargo === 'USO INTERNO' && !autorizadoPor.trim()) {
        return alert("Indica quién autoriza el uso interno 🔒.");
      }
      if (motivoDescargo === 'ERROR DE INGRESO' && !claveAdmin.trim()) {
        return alert("Ingresa la clave del administrador para continuar 🔑.");
      }
      if (motivoDescargo === 'OTRO' && !justificacionOtro.trim()) {
        return alert("Escribe el detalle del motivo 'OTRO' 📝.");
      }
      
      // Validación de la clave de admin con el nuevo modal cute
      if (motivoDescargo === 'ERROR DE INGRESO' && claveAdmin !== '270523') {
        setErrorClaveModalOpen(true);
        return;
      }
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmarMovimiento = async () => {
    if (!selectedProduct) return;
    const cantidad = parseInt(cantidadInput, 10);
    const cambioReal = cantidad * (tipoOperacion === 'carga' ? 1 : -1);
    const stockAnterior = Number(selectedProduct.udisponibles || 0);
    const stockNuevo = stockAnterior + cambioReal;

    let detalleJustificacion = '';
    if (tipoOperacion === 'carga') {
      detalleJustificacion = justificacionCarga;
    } else {
      detalleJustificacion = motivoDescargo;
      if (motivoDescargo === 'USO INTERNO') detalleJustificacion += ` (Autorizado por: ${autorizadoPor})`;
      if (motivoDescargo === 'OTRO') detalleJustificacion += ` (${justificacionOtro})`;
    }

    setIsSubmitting(true);
    setIsConfirmModalOpen(false);

    try {
      await updateDoc(doc(db, "inventario", selectedProduct.id), { udisponibles: increment(cambioReal) });

      await addDoc(collection(db, "historial_movimientos"), {
        productoId: selectedProduct.id,
        productoNombre: selectedProduct.nombre || "Sin nombre",
        categoria: selectedProduct.categoria || "General",
        imagen: selectedProduct.img || "",
        tipo: tipoOperacion,
        cantidad: cantidad,
        stockAnterior: stockAnterior,
        stockNuevo: stockNuevo,
        justificacion: detalleJustificacion,
        fecha: serverTimestamp()
      });

      setMensajeFeedback({
        tipo: tipoOperacion,
        texto: `✨ ¡Se ${tipoOperacion === 'carga' ? 'agregaron' : 'descontaron'} ${cantidad} unidades con éxito!`,
      });

      setCantidadInput('');
      setJustificacionCarga('');
      setMotivoDescargo('');
      setAutorizadoPor('');
      setClaveAdmin('');
      setJustificacionOtro('');
      setIsMobileModalOpen(false);

      setTimeout(() => setMensajeFeedback(null), 4000);
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      alert("Hubo un error al actualizar el stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-pink-600 uppercase">Cargando inventario cute...</p>
        </div>
      </div>
    );
  }

  const renderFormularioMovimiento = () => (
    <form onSubmit={handlePreparaMovimiento} className="space-y-4">
      <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
        <div className="text-[9px] font-black text-pink-600 uppercase tracking-wider mb-1">Seleccionado</div>
        <div className="font-black text-sm text-slate-900 mb-1">{selectedProduct.nombre}</div>
        <div className="text-xs font-bold text-slate-600">Stock bodega: <span className="text-emerald-600 font-black">{selectedProduct.udisponibles} un.</span></div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Operación</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setTipoOperacion('carga'); setMotivoDescargo(''); }} className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${tipoOperacion === 'carga' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
            <PackagePlus className="w-4 h-4" /> Carga (+)
          </button>
          <button type="button" onClick={() => { setTipoOperacion('descargo'); setJustificacionCarga(''); }} className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${tipoOperacion === 'descargo' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
            <PackageMinus className="w-4 h-4" /> Descargo (-)
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Cantidad</label>
        <input 
          type="number" min="1" value={cantidadInput} onChange={(e) => setCantidadInput(e.target.value)} placeholder="Ej. 10" required
          className="w-full bg-white border border-pink-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 focus:outline-none focus:border-pink-500"
        />
      </div>

      <div className="flex gap-2">
        {[1, 5, 10, 20].map((num) => (
          <button key={num} type="button" onClick={() => setCantidadInput(String(num))} className="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 font-extrabold text-[10px] py-1.5 rounded-lg border border-pink-100">
            +{num}
          </button>
        ))}
      </div>

      {tipoOperacion === 'carga' && (
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Justificación de Carga *</label>
          <input 
            type="text" 
            value={justificacionCarga} 
            onChange={(e) => setJustificacionCarga(e.target.value)} 
            placeholder="Ej. Compra de nueva mercancía proveedor X" 
            required
            className="w-full bg-white border border-pink-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
          />
        </div>
      )}

      {tipoOperacion === 'descargo' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Motivo del Descargo *</label>
            <select 
              value={motivoDescargo} 
              onChange={(e) => { setMotivoDescargo(e.target.value); setAutorizadoPor(''); setClaveAdmin(''); setJustificacionOtro(''); }}
              required
              className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
            >
              <option value="">Selecciona un motivo...</option>
              <option value="DAÑO">DAÑO</option>
              <option value="VENCIMIENTO">VENCIMIENTO</option>
              <option value="OBSEQUIO">OBSEQUIO</option>
              <option value="USO INTERNO">USO INTERNO</option>
              <option value="ERROR DE INGRESO">ERROR DE INGRESO</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>

          {motivoDescargo === 'USO INTERNO' && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Autorizado por: *</label>
              <input 
                type="text" 
                value={autorizadoPor} 
                onChange={(e) => setAutorizadoPor(e.target.value)} 
                placeholder="Nombre de quien autoriza" 
                required
                className="w-full bg-white border border-pink-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>
          )}

          {motivoDescargo === 'ERROR DE INGRESO' && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Clave de Administrador *</label>
              <input 
                type="password" 
                value={claveAdmin} 
                onChange={(e) => setClaveAdmin(e.target.value)} 
                placeholder="Introduce clave admin" 
                required
                className="w-full bg-white border border-pink-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>
          )}

          {motivoDescargo === 'OTRO' && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Escribe el motivo: *</label>
              <input 
                type="text" 
                value={justificacionOtro} 
                onChange={(e) => setJustificacionOtro(e.target.value)} 
                placeholder="Detalle de la salida..." 
                required
                className="w-full bg-white border border-pink-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>
          )}
        </div>
      )}

      <button type="submit" disabled={isSubmitting || !cantidadInput} className={`w-full py-3 rounded-xl font-black text-xs text-white shadow-lg transition-transform active:scale-95 ${tipoOperacion === 'carga' ? 'bg-emerald-600' : 'bg-amber-600'} ${isSubmitting ? 'opacity-50' : ''}`}>
        {isSubmitting ? 'Actualizando...' : `Continuar con ${tipoOperacion === 'carga' ? 'Carga' : 'Descargo'} ✨`}
      </button>

      <button type="button" onClick={() => { setSelectedProduct(null); setIsMobileModalOpen(false); }} className="w-full text-slate-400 hover:text-slate-600 font-bold text-xs py-1">
        Cancelar selección
      </button>
    </form>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-slate-800 font-sans relative">
      
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
            <Layers className="w-6 h-6 text-yellow-300" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-pink-100">
            Panel de Logística Admin 🌸
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-1">Carga y Descarga de Stock ✨</h1>
        <p className="text-xs sm:text-sm text-pink-100 max-w-xl">
          Selecciona un producto para registrar ingresos de mercancía o salidas con sus respectivas justificaciones obligatorias.
        </p>
      </div>

      {mensajeFeedback && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-white shadow-lg ${mensajeFeedback.tipo === 'carga' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{mensajeFeedback.texto}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto por nombre o categoría..."
                className="w-full bg-pink-50/40 border border-pink-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
              />
            </div>
            <span className="text-xs font-extrabold text-slate-500 whitespace-nowrap">{filteredProducts.length} prod.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const isSelected = selectedProduct?.id === prod.id;
              return (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className={`bg-white border rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer transition-all shadow-xs ${
                    isSelected ? 'border-pink-500 ring-2 ring-pink-400/30 bg-pink-50/40' : 'border-pink-100 hover:border-pink-300'
                  }`}
                >
                  <div className="w-14 h-14 bg-pink-50 rounded-xl overflow-hidden flex-shrink-0 border border-pink-100 flex items-center justify-center">
                    {prod.img ? <img src={prod.img} alt={prod.nombre} className="w-full h-full object-cover" /> : <span className="text-[9px] text-pink-300 font-bold">Sin foto</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-black px-2 py-0.5 rounded bg-pink-100 text-pink-700 uppercase">{prod.categoria || "General"}</span>
                    <h4 className="font-extrabold text-xs text-slate-800 truncate mt-1">{prod.nombre}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-500">${Number(prod.precio || 0).toLocaleString('es-CO')}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Stock: {prod.udisponibles}</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-pink-500 border-pink-500 text-white' : 'border-slate-300 bg-white'}`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-pink-100">
                <AlertCircle className="w-8 h-8 text-pink-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No se encontraron productos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de escritorio (oculto en móviles) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm sticky top-6">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" /> Registro de Movimiento
            </h3>

            {selectedProduct ? (
              renderFormularioMovimiento()
            ) : (
              <div className="text-center py-12 text-slate-400">
                <PackagePlus className="w-12 h-12 text-pink-200 mx-auto mb-3 animate-pulse" />
                <p className="text-xs font-bold text-slate-500">Selecciona un producto de la lista izquierda.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL PARA VISTA DE TELÉFONO */}
      {isMobileModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 lg:hidden">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border-2 border-pink-200 max-h-[90vh] overflow-y-auto relative animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" /> Registro de Movimiento
              </h3>
              <button 
                type="button" 
                onClick={() => { setIsMobileModalOpen(false); setSelectedProduct(null); }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderFormularioMovimiento()}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {isConfirmModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-pink-200 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md ${tipoOperacion === 'carga' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {tipoOperacion === 'carga' ? <PackagePlus className="w-7 h-7" /> : <PackageMinus className="w-7 h-7" />}
            </div>

            <h3 className="text-sm font-black text-slate-900 mt-2 mb-1">
              ¿Deseas {tipoOperacion === 'carga' ? 'añadir' : 'retirar'} <span className="text-pink-600">{cantidadInput} unidades</span>?
            </h3>

            <div className="bg-pink-50/60 rounded-2xl p-3 border border-pink-100 my-4 text-left space-y-1">
              <div className="text-[10px] font-bold text-slate-700 truncate">📦 <strong className="text-slate-900">{selectedProduct.nombre}</strong></div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Actual: {selectedProduct.udisponibles}</span>
                <span>Final: <strong className="text-emerald-600">{tipoOperacion === 'carga' ? Number(selectedProduct.udisponibles) + parseInt(cantidadInput || 0) : Number(selectedProduct.udisponibles) - parseInt(cantidadInput || 0)}</strong></span>
              </div>
              <div className="text-[10px] text-slate-600 pt-1 border-t border-pink-100">
                📝 <strong>Motivo:</strong> {tipoOperacion === 'carga' ? justificacionCarga : motivoDescargo}
                {motivoDescargo === 'USO INTERNO' && ` (Autorizado: ${autorizadoPor})`}
                {motivoDescargo === 'OTRO' && ` (${justificacionOtro})`}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-extrabold text-xs py-2.5 rounded-xl hover:bg-slate-200">Cancelar</button>
              <button type="button" onClick={handleConfirmarMovimiento} className={`flex-1 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md ${tipoOperacion === 'carga' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>¡Sí, confirmar! 💕</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CUTE PARA CLAVE INCORRECTA */}
      {errorClaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-rose-200 text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-500 mx-auto flex items-center justify-center mb-3 shadow-md animate-bounce">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-black text-slate-900 mt-2 mb-1">
              ¡Clave Incorrecta! 🔒
            </h3>
            <p className="text-xs text-slate-500 mb-5 px-2">
              La contraseña de administrador que ingresaste no es válida. Por favor, verifica e intenta de nuevo 🌸.
            </p>

            <button 
              type="button" 
              onClick={() => setErrorClaveModalOpen(false)} 
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-rose-500/20 hover:opacity-95 active:scale-95 transition-all"
            >
              ¡Entendido, volver a intentar! ✨
            </button>
          </div>
        </div>
      )}

    </div>
  );
}