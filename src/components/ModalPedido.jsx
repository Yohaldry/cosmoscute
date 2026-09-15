import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate de que la ruta a tu firebaseConfig sea correcta

const ModalPedido = ({ isOpen, onClose, onConfirm }) => {
  const [cantidad, setCantidad] = useState(1);
  const [formData, setFormData] = useState({
    nombreApellido: '',
    email: '',
    direccion: '',
    barrio: '',
    ciudad: '',
    categoria: '',
    quienRecibe: '',
    whatsapp: ''
  });
  const [errorValidacion, setErrorValidacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCantidad(1);
      setFormData({
        nombreApellido: '',
        email: '',
        direccion: '',
        barrio: '',
        ciudad: '',
        categoria: '',
        quienRecibe: '',
        whatsapp: ''
      });
      setErrorValidacion('');
      setLoading(false);
      setShowSuccessAlert(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;

    if (name === 'whatsapp') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'email') {
      processedValue = value;
    } else {
      processedValue = value.toUpperCase();
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errorValidacion) setErrorValidacion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !cantidad ||
      !formData.nombreApellido.trim() ||
      !formData.email.trim() ||
      !formData.direccion.trim() ||
      !formData.barrio.trim() ||
      !formData.ciudad.trim() ||
      !formData.categoria.trim() ||
      !formData.quienRecibe.trim() ||
      !formData.whatsapp.trim()
    ) {
      setErrorValidacion('Por favor, completa todos los campos del formulario, incluyendo la categoría.');
      return;
    }

    setErrorValidacion('');
    setLoading(true);

    // Cálculo exacto del precio según la promoción: 1 = 68.000 c/u, 2 o más = 65.000 c/u
    const precioUnitario = cantidad >= 2 ? 65000 : 68000;
    const precioTotal = cantidad * precioUnitario;
    const detallePartidas = `- ${cantidad}x Partida(s) de Bingo Galáctico [Categoría: ${formData.categoria}] ($${precioUnitario.toLocaleString()} c/u) = $${precioTotal.toLocaleString()} COP`;

    const orderId = Math.floor(100000 + Math.random() * 900000);
    const fechaActual = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const templateParams = {
      order_id: orderId,
      nombre: formData.nombreApellido.split(' ')[0] || '',
      apellido: formData.nombreApellido.split(' ').slice(1).join(' ') || '',
      cantidad: cantidad,
      cantidadPartidas: cantidad,
      customer_name: formData.nombreApellido,
      customer_email: formData.email,
      customer_phone: formData.whatsapp,
      telefono: formData.whatsapp,
      direccion: formData.direccion,
      barrio: formData.barrio,
      ciudad: formData.ciudad,
      categoria: formData.categoria,
      quienrecibe: formData.quienRecibe,
      productos: "BINGO GALACTICO",
      fecha: fechaActual,
      customer_address: `${formData.direccion}, Barrio: ${formData.barrio}, Ciudad: ${formData.ciudad}`,
      customer_notes: `Categoría: ${formData.categoria} | Quién recibe: ${formData.quienRecibe}`,
      cart_items: detallePartidas,
      cart_total: `${precioTotal.toLocaleString()} COP`
    };

    try {
      const SERVICE_ID = "service_lmc7ztk";
      const TEMPLATE_INTERNO = "template_tgxm0cp"; 
      const TEMPLATE_CLIENTE = "template_w2hvo5m"; 
      const PUBLIC_KEY = "gJ7hwekEH8jm6KLye";

      // 1. Envía los correos mediante EmailJS
      await emailjs.send(SERVICE_ID, TEMPLATE_INTERNO, templateParams, PUBLIC_KEY);
      await emailjs.send(SERVICE_ID, TEMPLATE_CLIENTE, templateParams, PUBLIC_KEY);

      // 2. Separar nombre y apellido de forma segura para la base de datos
      const partesNombre = formData.nombreApellido.trim().split(' ');
      const nombre = partesNombre[0] || '';
      const apellido = partesNombre.slice(1).join(' ') || '';

      // 3. Guardar el pedido en Firestore en la colección "pedidos" con todos los campos sincronizados
      await addDoc(collection(db, "pedidos"), {
        id: orderId,
        nombre: nombre,
        apellido: apellido,
        correo: formData.email,
        direccion: formData.direccion,
        barrio: formData.barrio,
        ciudad: formData.ciudad,
        categoria: formData.categoria,
        quienrecibe: formData.quienRecibe,
        telefono: formData.whatsapp,
        cantidadPartidas: cantidad,
        precio: precioTotal,
        estado: "recibido",
        productos: ["BINGO GALACTICO"],
        fechaCreacion: new Date()
      });

      if (onConfirm) {
        onConfirm({ ...formData, cantidad, precioTotal });
      }

      // 4. Mostramos la alerta de éxito
      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      setErrorValidacion('Hubo un error al enviar el pedido. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarExito = () => {
    setShowSuccessAlert(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FFF5F7] border-4 border-[#FFD1DC] w-full max-w-md rounded-3xl p-4 sm:p-6 shadow-xl text-[#6B5B6E] relative my-auto max-h-[90vh] flex flex-col">
        
        {/* ALERTA DE ÉXITO ESTILO COSMOSCUTE */}
        {showSuccessAlert && (
          <div className="absolute inset-0 bg-[#FFF5F7]/95 backdrop-blur-sm z-30 rounded-3xl p-6 flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="w-16 h-16 bg-[#FFE5EC] border-2 border-[#FFD1DC] rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">
              💌
            </div>
            <h3 className="text-xl font-extrabold text-[#D87093] mb-2 tracking-wide">
              ¡Pedido Realizado con Éxito! ✨
            </h3>
            <p className="text-xs sm:text-sm text-[#7D6B7F] mb-6 leading-relaxed">
              Hemos enviado los detalles de tu compra a tu correo electrónico y registrado tu pedido. 
              <br/><br/>
              🔍 <strong className="text-[#D87093]">Revisa tu bandeja principal</strong> y si no lo ves allí, por favor <strong className="text-[#D87093]">revisa la carpeta de SPAM</strong>.
            </p>
            <button
              type="button"
              onClick={handleFinalizarExito}
              className="px-6 py-2.5 rounded-2xl font-bold bg-gradient-to-r from-[#FFB7B2] to-[#FF9AA2] text-white shadow-md hover:from-[#FFA09A] hover:to-[#FF858F] transition-all transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm"
            >
              ¡Entendido, gracias! 🌸
            </button>
          </div>
        )}

        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 z-10">
          <a
            href="/boxgame"
            title="Ir al juego (/boxgame)"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1E88E5] font-bold flex items-center justify-center transition-all shadow-sm cursor-pointer text-xs sm:text-sm"
          >
            ▶
          </a>

          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFE5EC] hover:bg-[#FFD1DC] text-[#D87093] font-bold flex items-center justify-center transition-all shadow-sm cursor-pointer text-xs sm:text-sm"
          >
            ✕
          </button>
        </div>

        <div className="text-center mb-3 sm:mb-4 pr-12 flex-shrink-0">
          <span className="text-2xl sm:text-3xl">🌸</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#D87093] mt-0.5 tracking-wide">
            ¡Completar Pedido!
          </h2>
          <p className="text-[11px] sm:text-xs text-[#9B889E] mt-0.5">
            Ingresa tus datos para recibir tu partida y confirmación ✨
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto pr-1 flex-1" noValidate>
          
          <div className="bg-white/80 border-2 border-[#FCE4EC] rounded-2xl p-3 shadow-xs text-center space-y-0.5">
            <span className="block font-bold text-[11px] sm:text-xs text-[#D87093] uppercase tracking-wider">Detalle de Precios 🏷️</span>
            <p className="text-[11px] sm:text-xs text-[#7D6B7F]">
              La partida vale <strong className="text-[#D87093]">68.000 COP</strong>. Si compras 2 o más, cada partida te queda en <strong className="text-[#D87093]">65.000 COP</strong>.
            </p>
          </div>

          {errorValidacion && (
            <div className="bg-[#FFEBEE] border-2 border-[#FFCDD2] rounded-xl p-2.5 text-center">
              <p className="text-[11px] sm:text-xs font-bold text-[#C62828]">⚠️ {errorValidacion}</p>
            </div>
          )}

          <div className="space-y-2.5 bg-white/60 p-3 sm:p-4 rounded-2xl border border-[#FCE4EC]">
            
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">¿Cuántas partidas quieres?</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={cantidad}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= 10) {
                    setCantidad(val);
                  } else if (e.target.value === '') {
                    setCantidad('');
                  }
                  if (errorValidacion) setErrorValidacion('');
                }}
                onBlur={() => {
                  if (!cantidad || cantidad < 1) setCantidad(1);
                }}
                className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093]"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">Nombre y Apellido</label>
              <input 
                type="text"
                name="nombreApellido"
                value={formData.nombreApellido}
                onChange={handleChange}
                placeholder="EJ. SOFIA GOMEZ"
                className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093] uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">Correo Electrónico (para tu confirmación)</label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej. sofia@gmail.com"
                className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">Dirección de entrega</label>
                <input 
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="EJ. CALLE 123 #45-67"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093] uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">Barrio</label>
                <input 
                  type="text"
                  name="barrio"
                  value={formData.barrio}
                  onChange={handleChange}
                  placeholder="EJ. ROSALES"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093] uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">Ciudad</label>
                <input 
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  placeholder="EJ. BOGOTA"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093] uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#D87093] mb-1">Categoría 🧸</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093] cursor-pointer"
                >
                  <option value="">Selecciona...</option>
                  <option value="NIÑO">👦 NIÑO</option>
                  <option value="NIÑA">👧 NIÑA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">¿Quién recibe?</label>
                <input 
                  type="text"
                  name="quienRecibe"
                  value={formData.quienRecibe}
                  onChange={handleChange}
                  placeholder="EJ. ELLA MISMA / JUAN"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093] uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">Número de WhatsApp</label>
                <input 
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="Ej. 3001234567"
                  maxLength="10"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093]"
                />
              </div>
            </div>

          </div>

          <div className="flex gap-2.5 pt-1 flex-shrink-0">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 sm:py-3 rounded-2xl font-bold bg-[#F3E5F5] text-[#9C7BB0] hover:bg-[#E8D7F1] transition-all shadow-xs cursor-pointer text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 sm:py-3 rounded-2xl font-bold bg-gradient-to-r from-[#FFB7B2] to-[#FF9AA2] text-white shadow-md hover:from-[#FFA09A] hover:to-[#FF858F] transition-all transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Procesando...' : '¡Confirmar Pedido 🎮!'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ModalPedido;