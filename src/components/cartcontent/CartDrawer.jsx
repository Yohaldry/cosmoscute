import { useState } from 'react';
import { X, Trash2, ShoppingBag, Truck, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCart } from './CartContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CartDrawer({ isOpen, onClose }) {
  // Ajustado: quitamos clearCart ya que no viene en el contexto
  const { cartItems, addToCart, removeFromCart, deleteItem, totalItems, productsPrice, shippingCost, totalPrice } = useCart();
  
  // Estados para vistas y alertas
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);

  // Estados para los campos de datos personales del cliente
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    direccion: '',
    barrio: '',
    ciudad: '',
    quienrecibe: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.toUpperCase()
    });
  };

  // Guardar en Firebase (Colección: "pedidos")
  const handleFinalizeOrder = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const nuevaOrden = {
      id: Date.now(),
      fechaCreacion: serverTimestamp(), // Guarda la fecha y hora exacta del servidor de Firebase
      fecha: new Date().toLocaleDateString('es-CO'),
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono,
      correo: formData.correo,
      direccion: formData.direccion,
      barrio: formData.barrio,
      ciudad: formData.ciudad,
      quienrecibe: formData.quienrecibe,
      // Array de productos con nombre, cantidad y precio para mostrar en el panel de administración
      productos: cartItems.map(item => ({
        name: item.name.toUpperCase(),
        quantity: item.quantity || 1,
        price: item.price || 0
      })),
      cantidadPartidas: totalItems,
      precio: totalPrice,
      estado: "recibido",
      estadoventa: "venta"
    };

    try {
      // 🚀 CONEXIÓN REAL A FIREBASE (Colección: "pedidos")
      await addDoc(collection(db, "pedidos"), nuevaOrden);
      
      console.log("Pedido subido exitosamente a Firebase:", nuevaOrden);

      setIsLoading(false);
      setSuccessAlert(true); // Muestra la alerta "cosmoscute"
      
      // Vaciar el carrito eliminando cada ítem mediante su id
      cartItems.forEach(item => deleteItem(item.id));

    } catch (error) {
      console.error("Error al subir el pedido a Firebase:", error);
      setIsLoading(false);
      alert("Hubo un error al procesar tu pedido. Inténtalo de nuevo.");
    }
  };

  // Cerrar alerta de éxito y limpiar
  const handleCloseSuccess = () => {
    setSuccessAlert(false);
    setShowCheckoutForm(false);
    onClose();
  };

  const handleClose = () => {
    if (!successAlert) {
      setShowCheckoutForm(false);
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Fondo oscuro suave difuminado */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose} 
      />

      {/* Contenedor Drawer */}
      <div className={`absolute inset-x-0 bottom-0 sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:bottom-auto w-full sm:w-screen sm:max-w-md h-[60vh] sm:h-[calc(100vh-1rem)] sm:my-2 sm:mr-2 flex transform transition-transform duration-300 ease-out ${
        isOpen 
          ? 'translate-y-0 sm:translate-x-0' 
          : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
      }`}>
        
        <div className="w-full h-full bg-[#181022]/95 backdrop-blur-2xl border-t sm:border-t-0 sm:border-l border-purple-500/20 text-white shadow-2xl flex flex-col rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none overflow-hidden relative">
          
          {/* ALERTA VISIBLE ESTILO COSMOSCUTE CUANDO TODO SALE OK */}
          {successAlert && (
            <div className="absolute inset-0 z-50 bg-[#181022]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/40 mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                ¡Pedido Exitoso! <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/90 mt-2 max-w-xs leading-relaxed">
                Tu pedido ha sido procesado con éxito. Pronto un asesor se comunicará contigo para finalizar la entrega.
              </p>
              <button
                type="button"
                onClick={handleCloseSuccess}
                className="mt-6 w-full max-w-xs bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-2xl text-xs font-black tracking-wide shadow-lg shadow-pink-500/25 transition-all uppercase"
              >
                Aceptar
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-4 border-b border-purple-500/20 bg-purple-950/40 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-2">
              {showCheckoutForm && !successAlert && (
                <button 
                  type="button"
                  onClick={() => setShowCheckoutForm(false)} 
                  className="p-1 rounded-lg bg-purple-500/20 text-purple-200 hover:text-white transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-pink-300 shadow-inner">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5 uppercase">
                  {showCheckoutForm ? 'Tus Datos' : 'Tu Carrito'} <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400 animate-pulse" />
                </h2>
                <span className="text-[10px] text-purple-300/80 font-medium uppercase">
                  {showCheckoutForm ? 'Información para el envío' : `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`}
                </span>
              </div>
            </div>
            <button type="button" onClick={handleClose} className="p-1.5 sm:p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 hover:text-white transition-colors border border-purple-500/20">
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Contenido Dinámico: Vista de Carrito o Formulario de Datos */}
          {!showCheckoutForm ? (
            <>
              {/* Lista de productos */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-2 sm:space-y-3 custom-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 sm:py-24 text-purple-300/60 space-y-2">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400/60" />
                    </div>
                    <p className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase">Tu carrito está vacío</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 sm:gap-3.5 bg-purple-900/20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-purple-500/20 shadow-md hover:border-purple-400/40 transition-all">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-purple-950/50 border border-purple-500/20 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] sm:text-xs font-bold text-white truncate uppercase">{item.name}</h4>
                        <p className="text-pink-300 text-[11px] sm:text-xs font-black mt-0.5">${(item.price * item.quantity).toLocaleString()}</p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <button type="button" onClick={() => removeFromCart(item.id)} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-purple-500/20 border border-purple-400/20 flex items-center justify-center text-[10px] sm:text-xs text-purple-200 hover:bg-purple-500/40 hover:text-white transition-colors">-</button>
                          <span className="text-[11px] sm:text-xs font-extrabold text-white px-1">{item.quantity}</span>
                          <button type="button" onClick={() => addToCart(item)} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-purple-500/20 border border-purple-400/20 flex items-center justify-center text-[10px] sm:text-xs text-purple-200 hover:bg-purple-500/40 hover:text-white transition-colors">+</button>
                        </div>
                      </div>

                      <button type="button" onClick={() => deleteItem(item.id)} className="text-purple-400/60 hover:text-red-400 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer / Total con botón Siguiente */}
              {cartItems.length > 0 && (
                <div className="p-3.5 sm:p-6 border-t border-purple-500/20 bg-purple-950/40 backdrop-blur-md space-y-2 sm:space-y-3 shadow-inner flex-shrink-0">
                  <div className="flex justify-between items-center text-[11px] sm:text-xs text-purple-200/80 uppercase">
                    <span>Subtotal productos:</span>
                    <span className="font-semibold">${productsPrice.toLocaleString()} COP</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] sm:text-xs text-purple-200/80 uppercase">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400"/> Costo de envío:</span>
                    <span className="font-semibold">${shippingCost.toLocaleString()} COP</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm pt-2 border-t border-purple-500/20 uppercase">
                    <span className="text-white font-extrabold">Total a pagar:</span>
                    <span className="text-sm sm:text-base font-black text-pink-300">${totalPrice.toLocaleString()} COP</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black tracking-wide shadow-lg shadow-pink-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-1 uppercase"
                  >
                    <span>Siguiente</span> <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Formulario de Datos Personales del Cliente */
            <form onSubmit={handleFinalizeOrder} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 custom-scrollbar text-xs">
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">Nombre *</label>
                    <input 
                      type="text" 
                      name="nombre" 
                      required
                      placeholder="Ej. JUAN" 
                      value={formData.nombre} 
                      onChange={handleInputChange}
                      style={{ textTransform: 'uppercase' }}
                      className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">Apellido *</label>
                    <input 
                      type="text" 
                      name="apellido" 
                      required
                      placeholder="Ej. PÉREZ" 
                      value={formData.apellido} 
                      onChange={handleInputChange}
                      style={{ textTransform: 'uppercase' }}
                      className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">Teléfono *</label>
                    <input 
                      type="tel" 
                      name="telefono" 
                      required
                      placeholder="Ej. 3332548430" 
                      value={formData.telefono} 
                      onChange={handleInputChange}
                      className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">Correo electrónico *</label>
                    <input 
                      type="email" 
                      name="correo" 
                      required
                      placeholder="TUCORREO@GMAIL.COM" 
                      value={formData.correo} 
                      onChange={handleInputChange}
                      style={{ textTransform: 'uppercase' }}
                      className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">Dirección exacta *</label>
                  <input 
                    type="text" 
                    name="direccion" 
                    required
                    placeholder="Ej. CALLE 23 #23-09" 
                    value={formData.direccion} 
                    onChange={handleInputChange}
                    style={{ textTransform: 'uppercase' }}
                    className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">Barrio *</label>
                    <input 
                      type="text" 
                      name="barrio" 
                      required
                      placeholder="Ej. ROSALES" 
                      value={formData.barrio} 
                      onChange={handleInputChange}
                      style={{ textTransform: 'uppercase' }}
                      className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">Ciudad *</label>
                    <input 
                      type="text" 
                      name="ciudad" 
                      required
                      placeholder="Ej. CÚCUTA" 
                      value={formData.ciudad} 
                      onChange={handleInputChange}
                      style={{ textTransform: 'uppercase' }}
                      className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-purple-300 font-semibold mb-1 uppercase">¿Quién recibe? *</label>
                  <input 
                    type="text" 
                    name="quienrecibe" 
                    required
                    placeholder="Ej. HIJO / FAMILIAR" 
                    value={formData.quienrecibe} 
                    onChange={handleInputChange}
                    style={{ textTransform: 'uppercase' }}
                    className="w-full bg-purple-900/30 border border-purple-500/30 rounded-xl px-3 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-400 uppercase"
                  />
                </div>

              </div>

              {/* Botón FINALIZAR PEDIDO con envío real a Firebase */}
              <div className="p-3.5 sm:p-6 border-t border-purple-500/20 bg-purple-950/40 backdrop-blur-md flex-shrink-0">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black tracking-wide shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase disabled:opacity-50"
                >
                  <span>{isLoading ? 'PROCESANDO...' : 'FINALIZAR PEDIDO'}</span> <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}