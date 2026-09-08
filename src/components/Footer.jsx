import { ShieldCheck, Truck, Headphones, Send, Sparkles } from 'lucide-react';

export default function CosmosCuteFooterOnly() {
  return (
    <footer className="bg-[#C5B4E3] text-slate-900 pt-8 pb-4 border-t border-[#B19CD9] font-sans antialiased text-xs shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Tarjetas de Beneficios Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-8 mb-8 border-b border-slate-900/10">
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xs border border-white/40 p-3 rounded-xl shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-white/80 text-slate-900 flex items-center justify-center font-bold shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[11px]">Envíos Seguros</h4>
              <p className="text-[10px] text-slate-700">Bogotá y cobertura nacional</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xs border border-white/40 p-3 rounded-xl shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-white/80 text-slate-900 flex items-center justify-center font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[11px]">Compra Garantizada</h4>
              <p className="text-[10px] text-slate-700">Protección en cada transacción</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xs border border-white/40 p-3 rounded-xl shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-white/80 text-slate-900 flex items-center justify-center font-bold shadow-2xs">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[11px]">Atención VIP 24/7</h4>
              <p className="text-[10px] text-slate-700">Soporte personalizado</p>
            </div>
          </div>
        </div>

        {/* Contenido Principal del Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          
          {/* Columna de Marca */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center text-slate-900 font-black text-xs shadow-xs">
                CC
              </div>
              <span className="font-black text-sm tracking-tight text-slate-900">
                COSMOS<span className="text-pink-700">CUTE</span>
              </span>
            </div>
            <p className="text-slate-800 text-[10px] leading-relaxed max-w-xs mb-3">
              Curaduría de tecnología, estilo y herramientas funcionales con diseño estético optimizado para alto rendimiento.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 border border-white/50 text-slate-900 text-[9px] font-bold shadow-2xs">
              <Sparkles className="w-3 h-3 text-pink-700" /> Hecho con estilo en Bogotá, CO
            </div>
          </div>

          {/* Enlaces de Navegación */}
          <div>
            <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] mb-3">Colección</h5>
            <ul className="space-y-2 text-[10px] text-slate-800">
              <li><a href="#papeleria" className="hover:text-black font-medium transition-colors">Papelería Minimalista</a></li>
              <li><a href="#tech" className="hover:text-black font-medium transition-colors">Gadgets & Tech</a></li>
              <li><a href="#lifestyle" className="hover:text-black font-medium transition-colors">Lifestyle & Bags</a></li>
              <li><a href="#novedades" className="hover:text-black font-medium transition-colors">Novedades 2026</a></li>
            </ul>
          </div>

          {/* Enlaces Legales & Ayuda */}
          <div>
            <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] mb-3">Soporte</h5>
            <ul className="space-y-2 text-[10px] text-slate-800">
              <li><a href="#ayuda" className="hover:text-black font-medium transition-colors">Centro de Ayuda</a></li>
              <li><a href="#envios" className="hover:text-black font-medium transition-colors">Estado de Envíos</a></li>
              <li><a href="#garantia" className="hover:text-black font-medium transition-colors">Políticas y Garantías</a></li>
              <li><a href="#contacto" className="hover:text-black font-medium transition-colors">Contacto Directo</a></li>
            </ul>
          </div>

          {/* Newsletter Suscripción */}
          <div className="col-span-2 md:col-span-1">
            <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] mb-3">Boletín Exclusivo</h5>
            <p className="text-[10px] text-slate-800 mb-2">Recibe drops y ofertas directamente en tu correo.</p>
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="tucorreo@dominio.com" 
                  className="w-full bg-white/70 border border-white/50 rounded-lg pl-2.5 pr-8 py-1.5 text-[10px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-500 shadow-inner"
                />
                <button className="absolute right-1 top-1 bottom-1 px-2 bg-slate-900 hover:bg-black text-white rounded-md flex items-center justify-center transition-colors shadow-2xs">
                  <Send className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="text-[8px] text-slate-700">Cero spam. Desuscríbete cuando quieras.</span>
            </div>
          </div>

        </div>

        {/* Barra Inferior de Créditos */}
        <div className="pt-4 border-t border-slate-900/10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-800 gap-2">
          <p>© 2026 CosmosCute Enterprise. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-[9px]">
            <a href="#privacidad" className="hover:text-black transition-colors">Política de Privacidad</a>
            <span>•</span>
            <a href="#terminos" className="hover:text-black transition-colors">Términos de Servicio</a>
          </div>
        </div>

      </div>
    </footer>
  );
}