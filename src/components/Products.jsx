import { useState, useEffect, useRef } from 'react';
import { Heart, Star, ShoppingCart, ChevronLeft, ChevronRight, Sparkles, Gift } from 'lucide-react';

const promoCombos = [
  { 
    name: "Combo Estudio Kawaii Pro", 
    price: "$49.900", 
    originalPrice: "$69.900",
    rating: 142, 
    images: [
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80"
    ], 
    tag: "COMBO -28%",
    itemsCount: "3 Artículos",
    description: "Plumas minimalistas + libreta hardcover + stickers."
  },
  { 
    name: "Kit Glow Beauty & LED", 
    price: "$109.900", 
    originalPrice: "$149.900",
    rating: 118, 
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80"
    ], 
    tag: "PACK EXCLUSIVO",
    itemsCount: "2 Artículos",
    description: "Espejo LED profesional + lámpara minimalista."
  },
  { 
    name: "Dupla Urbana Galaxy Chic", 
    price: "$169.900", 
    originalPrice: "$219.900",
    rating: 95, 
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80"
    ], 
    tag: "COMBO VIP",
    itemsCount: "2 Artículos",
    description: "Mochila executiva Galaxy + termo inteligente touch."
  },
  { 
    name: "Set Cuddle & Notes", 
    price: "$89.900", 
    originalPrice: "$119.900",
    rating: 84, 
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80"
    ], 
    tag: "AHORRO TOP",
    itemsCount: "3 Artículos",
    description: "Libreta premium + peluche + luz LED portátil."
  },
  { 
    name: "Mega Pack Escritorio Estética", 
    price: "$124.900", 
    originalPrice: "$169.900",
    rating: 156, 
    images: [
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80"
    ], 
    tag: "BEST SELLER",
    itemsCount: "4 Artículos",
    description: "Lámpara LED + plumas + termo + sorpresa."
  }
];

export default function PastelCardsPromoSection() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId;
    const speed = 0.6;

    const autoScroll = () => {
      if (!isPaused && container) {
        container.scrollLeft += speed;
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-3 sm:px-6 py-8 overflow-hidden bg-transparent">
      {/* Encabezado */}
      <div className="flex flex-col items-center justify-center mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/80 border border-pink-200 mb-2 shadow-xs">
          <span className="text-pink-400 animate-bounce text-xs">🎁</span>
          <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#4A4063]">COMBOS Y PROMOCIONES ESPECIALES</span>
          <span className="text-pink-400 animate-bounce text-xs">✨</span>
        </div>
        
        <div className="flex items-center justify-between w-full mt-1">
          <button 
            onClick={() => scrollByAmount(-300)}
            className="hidden sm:flex p-2 rounded-full bg-white border border-pink-200 hover:bg-pink-50 text-pink-500 transition-all shadow-sm hover:scale-110"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h2 className="text-lg sm:text-xl font-black text-[#4A4063] tracking-tight mx-auto flex items-center gap-2">
            💖 BANNERS DE COMBOS & DUPLAS 💖
          </h2>

          <button 
            onClick={() => scrollByAmount(300)}
            className="hidden sm:flex p-2 rounded-full bg-white border border-pink-200 hover:bg-pink-50 text-pink-500 transition-all shadow-sm hover:scale-110"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carrusel de Banners */}
      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-4 px-2 cursor-grab active:cursor-grabbing"
      >
        {promoCombos.concat(promoCombos).map((combo, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-80 sm:w-96 group"
          >
            {/* Banner Rectangular con Borde Degradado Pastel */}
            <div className="p-[2px] rounded-2xl bg-gradient-to-r from-pink-200 via-purple-200 to-amber-200 shadow-[0_8px_20px_rgba(232,196,218,0.2)] group-hover:shadow-[0_12px_28px_rgba(232,196,218,0.4)] transition-all duration-300 group-hover:-translate-y-1">
              
              {/* Tarjeta con Fondo Pastel Suave */}
              <div className="bg-gradient-to-br from-[#FFF9FB] via-[#FDF6FC] to-[#F7F2FC] backdrop-blur-sm rounded-[14px] p-3 flex items-center gap-3 relative border border-pink-100">
                
                {/* Botón de Favorito Flotante */}
                <button className="absolute top-2 right-2 z-10 text-pink-400 hover:text-pink-500 transition-colors bg-white/90 backdrop-blur-xs p-1 rounded-full shadow-2xs border border-pink-100">
                  <Heart className="w-3 h-3 fill-current" />
                </button>

                {/* Doble Imagen Izquierda */}
                <div className="w-24 sm:w-28 h-24 sm:h-28 flex-shrink-0 bg-pink-50 rounded-xl overflow-hidden relative shadow-inner flex gap-1 p-1 border border-pink-100">
                  <div className="w-1/2 h-full rounded-lg overflow-hidden relative">
                    <img 
                      src={combo.images[0]} 
                      alt={combo.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <div className="w-1/2 h-full rounded-lg overflow-hidden relative">
                    <img 
                      src={combo.images[1]} 
                      alt={combo.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 bg-white/90 text-pink-600 text-[7px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 backdrop-blur-xs border border-pink-100">
                    <Gift className="w-2 h-2 text-pink-500" />
                    {combo.itemsCount}
                  </div>
                </div>

                {/* Contenido Derecho del Banner */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-2">
                  <div>
                    {/* Tag y Rating */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-gradient-to-r from-pink-200 to-purple-200 text-purple-900 font-extrabold text-[8px] px-2 py-0.5 rounded-full tracking-wider flex items-center gap-0.5 shadow-2xs">
                        <Sparkles className="w-2 h-2 text-pink-500" />
                        {combo.tag}
                      </span>
                      <div className="flex items-center text-amber-400 gap-0.5 text-[9px] font-bold text-slate-500">
                        <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                        <span>5.0</span>
                      </div>
                    </div>

                    {/* Título y Descripción Corta */}
                    <h3 className="font-bold text-xs text-slate-800 truncate mb-0.5">
                      {combo.name}
                    </h3>
                    <p className="text-[9px] text-slate-500 line-clamp-1 mb-2 leading-relaxed">
                      {combo.description}
                    </p>
                  </div>

                  {/* Precios y Botón de Acción en la Misma Línea */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-xs sm:text-sm text-pink-600">
                          {combo.price}
                        </span>
                        <span className="text-[9px] text-slate-400 line-through font-semibold">
                          {combo.originalPrice}
                        </span>
                      </div>
                    </div>

                    <button className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-[9px] py-1.5 px-2.5 rounded-full transition-all duration-300 flex items-center gap-1 shadow-sm">
                      <ShoppingCart className="w-3 h-3" />
                      <span>¡LO QUIERO!</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}