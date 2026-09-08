import React, { useState, useEffect } from 'react';

const ModalPedido = ({ isOpen, onClose, onConfirm }) => {
  const [cantidad, setCantidad] = useState(1);
  const [formData, setFormData] = useState({
    nombreApellido: '',
    direccion: '',
    barrio: '',
    quienRecibe: '',
    whatsapp: ''
  });
  const [errorValidacion, setErrorValidacion] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCantidad(1);
      setFormData({
        nombreApellido: '',
        direccion: '',
        barrio: '',
        quienRecibe: '',
        whatsapp: ''
      });
      setErrorValidacion('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorValidacion) setErrorValidacion('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !cantidad ||
      !formData.nombreApellido.trim() ||
      !formData.direccion.trim() ||
      !formData.barrio.trim() ||
      !formData.quienRecibe.trim() ||
      !formData.whatsapp.trim()
    ) {
      setErrorValidacion('Por favor, completa todos los campos del formulario antes de enviar.');
      return;
    }

    setErrorValidacion('');

    const mensaje = `¡Hola! Quiero confirmar mi pedido de *Bingo Galáctico* 🎮✨\n\n` +
      `*Cantidad de partidas:* ${cantidad}\n` +
      `*Información de precios:*\n` +
      `• Cada partida vale 68.000 COP (Si compra 2 o más, cada partida le queda en 65.000 COP).\n\n` +
      `*Datos de entrega:*\n` +
      `• *Nombre y Apellido:* ${formData.nombreApellido}\n` +
      `• *Dirección:* ${formData.direccion}\n` +
      `• *Barrio:* ${formData.barrio}\n` +
      `• *Quién recibe:* ${formData.quienRecibe}\n` +
      `• *WhatsApp:* ${formData.whatsapp}`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    const numeroWhatsApp = "573026158662";

    window.open(`https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`, '_blank');

    if (onConfirm) {
      onConfirm({ ...formData, cantidad });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#FFF5F7] border-4 border-[#FFD1DC] w-full max-w-md rounded-3xl p-4 sm:p-6 shadow-xl text-[#6B5B6E] relative my-auto max-h-[90vh] flex flex-col">
        
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
            Ingresa tus datos de entrega para recibir tu partida ✨
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
                placeholder="Ej. Sofia Gomez"
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
                  placeholder="Ej. Calle 123 #45-67"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093]"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#7D6B7F] mb-1">Barrio</label>
                <input 
                  type="text"
                  name="barrio"
                  value={formData.barrio}
                  onChange={handleChange}
                  placeholder="Ej. Rosales"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093]"
                />
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
                  placeholder="Ej. Ella misma / Juan"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093]"
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
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#FFD1DC] text-xs sm:text-sm text-[#6B5B6E] focus:outline-none focus:ring-2 focus:ring-[#D87093]"
                />
              </div>
            </div>

          </div>

          <div className="flex gap-2.5 pt-1 flex-shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 rounded-2xl font-bold bg-[#F3E5F5] text-[#9C7BB0] hover:bg-[#E8D7F1] transition-all shadow-xs cursor-pointer text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 sm:py-3 rounded-2xl font-bold bg-gradient-to-r from-[#FFB7B2] to-[#FF9AA2] text-white shadow-md hover:from-[#FFA09A] hover:to-[#FF858F] transition-all transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm"
            >
              ¡Confirmar Pedido 🎮!
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ModalPedido;