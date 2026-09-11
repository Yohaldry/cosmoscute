import { useState, useEffect, useRef } from 'react';
import { Heart, Star, ShoppingCart, Eye, ChevronLeft, ChevronRight, Sparkles, Gift, Zap, X, CheckCircle2 } from 'lucide-react';

const promoCombos = [
  { 
    name: "Combo Estudio Kawaii Pro", 
    price: "$49.900", 
    originalPrice: "$69.900",
    rating: "4.9",
    reviews: "142",
    images: [
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"
    ], 
    discount: "-28%",
    tag: "COMBO TOP",
    itemsCount: "3 Artículos",
    description: "Plumas minimalistas de tinta suave + libreta hardcover aesthetic de diseño exclusivo + pack de stickers holográficos de alta calidad.",
    includedItems: ["Pluma minimalista de gel", "Libreta Hardcover 100 hojas", "Pack de 20 stickers holográficos"],
    bgGradient: "from-pink-500 via-rose-500 to-purple-600 text-white"
  },
  { 
    name: "Kit Glow Beauty & LED", 
    price: "$109.900", 
    originalPrice: "$149.900",
    rating: "5.0",
    reviews: "118",
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"
    ], 
    discount: "-26%",
    tag: "PACK EXCLUSIVO",
    itemsCount: "2 Artículos",
    description: "Espejo LED profesional con ajuste de intensidad táctil + lámpara minimalista de escritorio con puerto de carga USB.",
    includedItems: ["Espejo de vanidad con luz LED recargable", "Lámpara minimalista táctil de escritorio"],
    bgGradient: "from-purple-600 via-fuchsia-600 to-pink-600 text-white"
  },
  { 
    name: "Dupla Urbana Galaxy Chic", 
    price: "$169.900", 
    originalPrice: "$219.900",
    rating: "4.8",
    reviews: "95",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80"
    ], 
    discount: "-22%",
    tag: "COMBO VIP",
    itemsCount: "2 Artículos",
    description: "Mochila ejecutiva impermeable Galaxy + termo inteligente de acero inoxidable con indicador LED de temperatura touch.",
    includedItems: ["Mochila ejecutiva impermeable", "Termo inteligente LED de 500ml"],
    bgGradient: "from-indigo-600 via-purple-600 to-pink-600 text-white"
  },
  { 
    name: "Set Cuddle & Notes", 
    price: "$89.900", 
    originalPrice: "$119.900",
    rating: "4.9",
    reviews: "84",
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"
    ], 
    discount: "-25%",
    tag: "AHORRO FLASH",
    itemsCount: "3 Artículos",
    description: "Libreta premium de apuntes + peluche decorativo ultra suave estilo kawaii + luz LED portátil recargable.",
    includedItems: ["Libreta premium pastel", "Peluche decorativo suave", "Luz LED portátil USB"],
    bgGradient: "from-amber-500 via-orange-500 to-rose-600 text-white"
  },
  { 
    name: "Mega Pack Escritorio Estética", 
    price: "$124.900", 
    originalPrice: "$169.900",
    rating: "5.0",
    reviews: "156",
    images: [
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80"
    ], 
    discount: "-30%",
    tag: "MÁS VENDIDO",
    itemsCount: "4 Artículos",
    description: "Lámpara LED regulable + set de plumas estéticas + termo inteligente + regalo sorpresa de la marca.",
    includedItems: ["Lámpara LED regulable", "Set de 4 plumas estéticas", "Termo inteligente", "Regalo sorpresa especial"],
    bgGradient: "from-teal-600 via-cyan-600 to-indigo-600 text-white"
  }
];

export default function CosmoscuteRappiPromo() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null); // Estado para controlar el modal

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId;
    const speed = 0.6;

    const autoScroll = () => {
      if (!isPaused && container && !selectedCombo) {
        container.scrollLeft += speed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, selectedCombo]);

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 overflow-hidden bg-transparent font-sans">
      
      {/* Header Estilo App */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-300">
            <Zap className="w-4 h-4 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-extrabold tracking-wider bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                ⚡ COSMOSCUTE TURBO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#4A4063] tracking-tight mt-0.5">
              Combos & Duplas Favoritas 💖
            </h2>
          </div>
        </div>

        {/* Controles de Navegación */}
        <div className="hidden sm:flex items-center gap-2">
          <button 
            onClick={() => scrollByAmount(-340)}
            className="p-2 rounded-full bg-white border border-pink-200 hover:bg-pink-50 text-pink-600 transition-all shadow-sm hover:scale-105 active:scale-95"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scrollByAmount(340)}
            className="p-2 rounded-full bg-white border border-pink-200 hover:bg-pink-50 text-pink-600 transition-all shadow-sm hover:scale-105 active:scale-95"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carrusel de Banners Compactos y Delgados */}
      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 cursor-grab active:cursor-grabbing"
      >
        {promoCombos.concat(promoCombos).map((combo, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-[310px] sm:w-[340px] group"
          >
            {/* Tarjeta Rectangular Compacta */}
            <div className={`relative bg-gradient-to-br ${combo.bgGradient} rounded-2xl p-3.5 border border-white/30 shadow-[0_10px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:-translate-y-1 flex items-center gap-3`}>
              
              {/* Contenedor Izquierdo: Imágenes Duales */}
              <div className="relative w-28 sm:w-32 flex-shrink-0 h-28 sm:h-32 bg-white/90 backdrop-blur-md rounded-xl overflow-hidden p-1 flex gap-1 border border-white/60 shadow-inner">
                
                {/* Badge de Descuento */}
                <div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-sm tracking-wide flex items-center gap-0.5">
                  <Sparkles className="w-2 h-2 text-slate-950" />
                  <span>{combo.discount}</span>
                </div>

                <div className="w-1/2 h-full rounded-lg overflow-hidden relative shadow-inner">
                  <img 
                    src={combo.images[0]} 
                    alt={combo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <div className="w-1/2 h-full rounded-lg overflow-hidden relative shadow-inner">
                  <img 
                    src={combo.images[1]} 
                    alt={combo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>

                {/* Tag de Artículos */}
                <div className="absolute bottom-1.5 left-1.5 bg-slate-900/90 text-white text-[7px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 backdrop-blur-md shadow-xs border border-white/20">
                  <Gift className="w-2 h-2 text-pink-400" />
                  {combo.itemsCount}
                </div>
              </div>

              {/* Contenedor Derecho: Información y CTAs */}
              <div className="flex-1 flex flex-col justify-between h-full min-h-[125px]">
                <div>
                  {/* Fila Superior: Tag & Favorito */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-extrabold tracking-wider text-white bg-black/30 backdrop-blur-md px-1.5 py-0.5 rounded uppercase border border-white/20 shadow-xs">
                      {combo.tag}
                    </span>
                    <button className="text-white hover:text-pink-200 transition-colors bg-black/30 backdrop-blur-md p-1 rounded-full shadow-sm border border-white/20 hover:scale-110">
                      <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                    </button>
                  </div>

                  {/* Título */}
                  <h3 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-pink-200 transition-colors line-clamp-1 mb-0.5 drop-shadow-sm">
                    {combo.name}
                  </h3>

                  {/* Rating y Reseñas */}
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                    <span className="text-[10px] font-bold text-white">{combo.rating}</span>
                    <span className="text-[9px] text-white/80">({combo.reviews})</span>
                  </div>

                  {/* Descripción corta */}
                  <p className="text-[9px] sm:text-[10px] text-white/90 line-clamp-2 mb-1.5 leading-tight font-medium">
                    {combo.description}
                  </p>
                </div>

                {/* Precio y Botones ("Ver Más" abre el modal + "Agregar") */}
                <div className="pt-1.5 border-t border-white/20 mt-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-black text-xs sm:text-sm text-white tracking-tight block leading-none drop-shadow-sm">
                        {combo.price}
                      </span>
                      <span className="text-[9px] text-white/70 line-through font-semibold">
                        {combo.originalPrice}
                      </span>
                    </div>

                    {/* Botón Ver Más que abre el Modal */}
                    <button 
                      onClick={() => setSelectedCombo(combo)}
                      className="bg-white/20 hover:bg-white/30 text-white font-bold text-[9px] py-1 px-2 rounded-lg backdrop-blur-md transition-all flex items-center gap-1 border border-white/30 hover:scale-105 active:scale-95"
                    >
                      <Eye className="w-2.5 h-2.5" />
                      <span>Ver más</span>
                    </button>
                  </div>

                  {/* Botón Principal Agregar al Carrito */}
                  <button className="w-full bg-white hover:bg-pink-50 text-purple-900 font-extrabold text-[10px] py-1.5 px-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95">
                    <ShoppingCart className="w-3 h-3 text-purple-600" />
                    <span>AGREGAR AL CARRITO</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL DE DETALLES DEL COMBO --- */}
      {selectedCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100 transform transition-all">
            
            {/* Header del Modal con Gradiente */}
            <div className={`bg-gradient-to-r ${selectedCombo.bgGradient} p-5 text-white relative`}>
              <button 
                onClick={() => setSelectedCombo(null)}
                className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-colors backdrop-blur-md"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="inline-block bg-white/20 backdrop-blur-md text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                {selectedCombo.tag}
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm">
                {selectedCombo.name}
              </h3>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span className="text-xs font-bold">{selectedCombo.rating}</span>
                  <span className="text-[10px] opacity-80">({selectedCombo.reviews} reseñas)</span>
                </div>
                <div className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
                  Ahorro {selectedCombo.discount}
                </div>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              
              {/* Galería de imágenes duales en el modal */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {selectedCombo.images.map((img, idx) => (
                  <div key={idx} className="h-36 rounded-2xl overflow-hidden shadow-md border border-slate-100 relative group">
                    <img src={img} alt="Vista previa combo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>

              {/* Descripción detallada */}
              <div className="mb-5">
                <h4 className="text-xs font-black tracking-wider text-purple-900 uppercase mb-1">Descripción del Combo</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {selectedCombo.description}
                </p>
              </div>

              {/* Artículos incluidos */}
              <div className="mb-6 bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
                <h4 className="text-xs font-black tracking-wider text-purple-900 uppercase mb-2.5 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-pink-500" />
                  ¿Qué incluye este combo? ({selectedCombo.itemsCount})
                </h4>
                <ul className="space-y-2">
                  {selectedCombo.includedItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Precios y Acción de Compra en el Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Precio Promocional</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {selectedCombo.price}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-bold">
                      {selectedCombo.originalPrice}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedCombo(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Volver
                  </button>
                  <button 
                    onClick={() => {
                      alert(`¡${selectedCombo.name} agregado al carrito con éxito! 🛍️`);
                      setSelectedCombo(null);
                    }}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Agregar al Carrito</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}