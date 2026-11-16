import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Sparkles, X, Heart, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';

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

      await emailjs.send(SERVICE_ID, TEMPLATE_INTERNO, templateParams, PUBLIC_KEY);
      await emailjs.send(SERVICE_ID, TEMPLATE_CLIENTE, templateParams, PUBLIC_KEY);

      const partesNombre = formData.nombreApellido.trim().split(' ');
      const nombre = partesNombre[0] || '';
      const apellido = partesNombre.slice(1).join(' ') || '';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-950/20 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      {/* Contenedor principal con tonos pasteles claros, luminosos y coloridos */}
      <div className="bg-gradient-to-br from-white via-pink-50/70 to-purple-50/80 border-2 border-pink-300 w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl text-gray-800 relative my-auto max-h-[92vh] flex flex-col">
        
        {/* ALERTA DE ÉXITO */}
        {showSuccessAlert && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 rounded-3xl p-6 flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="w-20 h-20 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center text-white text-4xl mb-4 shadow-lg shadow-pink-500/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-purple-900 mb-2 tracking-wide flex items-center gap-2">
              ¡Pedido Realizado con Éxito! <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-6 max-w-sm leading-relaxed">
              Hemos enviado los detalles de tu compra a tu correo electrónico y registrado tu pedido con éxito. 
              <br/><br/>
              🔍 <strong className="text-pink-600">Revisa tu bandeja principal</strong> y si no lo ves allí, por favor <strong className="text-pink-600">revisa la carpeta de SPAM</strong>.
            </p>
            <button
              type="button"
              onClick={handleFinalizarExito}
              className="px-8 py-3 rounded-2xl font-black bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:opacity-95 transition-all transform hover:scale-105 cursor-pointer text-xs sm:text-sm tracking-wide uppercase"
            >
              ¡Entendido, gracias! 🌸
            </button>
          </div>
        )}

        {/* BOTÓN CERRAR */}
        <div className="absolute top-4 right-4 z-15">
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-pink-100 hover:bg-pink-200 text-pink-600 font-bold flex items-center justify-center transition-all shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* CABECERA CLARA Y COLORIDA */}
        <div className="text-center mb-4 pr-6 flex-shrink-0">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-white shadow-md shadow-pink-200">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight flex items-center justify-center gap-2">
            ¡Completar Pedido! <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse" />
          </h2>
          <p className="text-xs font-bold text-pink-600 mt-0.5 uppercase tracking-wide">
            Ingresa tus datos para recibir tu partida y confirmación ✨
          </p>
        </div>

        {/* FORMULARIO CON FONDOS BLANCOS Y BORDES CLAROS */}
        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1" noValidate>
          
          {/* CAJA DE PRECIOS */}
          <div className="bg-gradient-to-r from-pink-100/70 via-purple-100/60 to-pink-100/70 border border-pink-300 rounded-2xl p-3.5 text-center space-y-1 shadow-xs">
            <span className="block font-black text-[11px] text-pink-600 uppercase tracking-widest flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Detalle de Promoción 🏷️
            </span>
            <p className="text-xs text-purple-950 font-medium">
              La partida vale <strong className="text-pink-600 font-bold">68.000 COP</strong>. Si compras 2 o más, cada una te queda en <strong className="text-purple-700 font-bold">65.000 COP</strong>.
            </p>
          </div>

          {/* ALERTA DE ERROR */}
          {errorValidacion && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs font-bold text-red-600">{errorValidacion}</p>
            </div>
          )}

          {/* CAMPOS */}
          <div className="space-y-3 bg-white p-4 rounded-3xl border border-pink-200/60 shadow-sm">
            
            <div>
              <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">¿Cuántas partidas quieres? *</label>
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">Nombre y Apellido *</label>
              <input 
                type="text"
                name="nombreApellido"
                value={formData.nombreApellido}
                onChange={handleChange}
                placeholder="EJ. SOFIA GOMEZ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all uppercase placeholder-purple-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">Correo Electrónico (para confirmación) *</label>
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="EJ. SOFIA@GMAIL.COM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all uppercase placeholder-purple-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">Dirección de entrega *</label>
                <input 
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="EJ. CALLE 123 #45-67"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all uppercase placeholder-purple-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">Barrio *</label>
                <input 
                  type="text"
                  name="barrio"
                  value={formData.barrio}
                  onChange={handleChange}
                  placeholder="EJ. ROSALES"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all uppercase placeholder-purple-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">Ciudad *</label>
                <input 
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  placeholder="EJ. BOGOTA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all uppercase placeholder-purple-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-pink-600 mb-1 uppercase tracking-wider">Categoría 🧸 *</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-100/60 border border-pink-300 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all cursor-pointer"
                >
                  <option value="">Selecciona...</option>
                  <option value="NIÑO">👦 NIÑO</option>
                  <option value="NIÑA">👧 NIÑA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">¿Quién recibe? *</label>
                <input 
                  type="text"
                  name="quienRecibe"
                  value={formData.quienRecibe}
                  onChange={handleChange}
                  placeholder="EJ. ELLA MISMA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all uppercase placeholder-purple-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-purple-900 mb-1 uppercase tracking-wider">WhatsApp *</label>
                <input 
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="3001234567"
                  maxLength="10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-pink-50/40 border border-pink-200 text-xs sm:text-sm font-bold text-purple-950 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all placeholder-purple-300"
                />
              </div>
            </div>

          </div>

          {/* BOTONES */}
          <div className="flex gap-3 pt-2 flex-shrink-0">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl font-black bg-pink-100 text-pink-700 hover:bg-pink-200 transition-all shadow-xs cursor-pointer text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl font-black bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:opacity-95 transition-all transform hover:-translate-y-0.5 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Procesando...' : '¡Confirmar Pedido 🎮!'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ModalPedido;