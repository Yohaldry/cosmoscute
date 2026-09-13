import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Heart, Star, ShoppingCart, Eye, ChevronLeft, ChevronRight, Sparkles, Gift, Zap, X, CheckCircle2 } from 'lucide-react';

export default function CosmoscuteRappiPromo() {
  const scrollRef = useRef(null);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [promoCombos, setPromoCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar banners y combos desde Firestore filtrando únicamente los que tienen estado en true
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        
        const q = query(collection(db, 'bannerspromociones'), where('estado', '==', true));
        const querySnapshot = await getDocs(q);
        
        const list = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Filtrar productos asociados que no estén vacíos
          const included = [
            data.producto1, 
            data.producto2, 
            data.producto3, 
            data.producto4, 
            data.producto5, 
            data.producto6, 
            data.producto7
          ].filter(Boolean);

          // Construir array dinámico de imágenes disponibles
          const imgList = [];
          if (data.imagen) imgList.push(data.imagen);
          if (data.imagen2) imgList.push(data.imagen2);

          const finalImages = imgList.length > 0 
            ? imgList 
            : ["https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80"];

          // Formatear el precio obtenido de la base de datos (campo "precio")
          // Si está almacenado como número o texto, lo adaptamos de forma segura
          const rawPrice = data.precio;
          let formattedPrice = "$99.900"; // Fallback por defecto
          
          if (rawPrice !== undefined && rawPrice !== null && rawPrice !== "") {
            // Si ya es un string con formato (ej: "$99.900" o "99900"), lo manejamos
            formattedPrice = typeof rawPrice === 'number' 
              ? `$${rawPrice.toLocaleString('es-CO')}` 
              : (rawPrice.startsWith('$') ? rawPrice : `$${rawPrice}`);
          }

          return {
            id: doc.id,
            name: data.titulo || "Combo Especial",
            price: formattedPrice,
            originalPrice: data.precioOriginal || "$139.900", // Opcional si también guardas el precio tachado
            rating: "4.9",
            reviews: "128",
            images: finalImages,
            discount: data.descuento || "-25%",
            tag: "COMBO TOP",
            itemsCount: `${included.length} Artículos`,
            description: `Pack promocional exclusivo que incluye una selección especial de artículos de alta calidad: ${included.join(', ')}.`,
            includedItems: included.length > 0 ? included : ["Artículo exclusivo principal", "Regalo sorpresa de la marca"],
            bgGradient: "from-pink-500 via-rose-500 to-purple-600 text-white",
          };
        });

        setPromoCombos(list);
      } catch (error) {
        console.error("Error al cargar banners desde Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-xs text-slate-400 font-medium">Cargando promos exclusivas...</div>;
  }

  if (promoCombos.length === 0) {
    return null; 
  }

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
        {promoCombos.length > 1 && (
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
        )}
      </div>

      {/* Contenedor de Banners */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 cursor-grab active:cursor-grabbing"
      >
        {promoCombos.map((combo) => (
          <div 
            key={combo.id} 
            className="flex-shrink-0 w-[310px] sm:w-[340px] group"
          >
            {/* Tarjeta Rectangular Compacta */}
            <div className={`relative bg-gradient-to-br ${combo.bgGradient} rounded-2xl p-3.5 border border-white/30 shadow-[0_10px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:-translate-y-1 flex items-center gap-3`}>
              
              {/* Contenedor Izquierdo: Galería Dinámica (1 o 2 fotos) */}
              <div className="relative w-28 sm:w-32 flex-shrink-0 h-28 sm:h-32 bg-white/90 backdrop-blur-md rounded-xl overflow-hidden p-1 flex gap-1 border border-white/60 shadow-inner">
                
                {/* Badge de Descuento */}
                <div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-sm tracking-wide flex items-center gap-0.5">
                  <Sparkles className="w-2 h-2 text-slate-950" />
                  <span>{combo.discount}</span>
                </div>

                {combo.images.length === 1 ? (
                  <div className="w-full h-full rounded-lg overflow-hidden relative shadow-inner">
                    <img 
                      src={combo.images[0]} 
                      alt={combo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                ) : (
                  <>
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
                  </>
                )}

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

                {/* Precio y Botones */}
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

                    <button 
                      onClick={() => setSelectedCombo(combo)}
                      className="bg-white/20 hover:bg-white/30 text-white font-bold text-[9px] py-1 px-2 rounded-lg backdrop-blur-md transition-all flex items-center gap-1 border border-white/30 hover:scale-105 active:scale-95"
                    >
                      <Eye className="w-2.5 h-2.5" />
                      <span>Ver más</span>
                    </button>
                  </div>

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
              
              <div className={`grid gap-3 mb-6 ${selectedCombo.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {selectedCombo.images.map((img, idx) => (
                  <div key={idx} className={`rounded-2xl overflow-hidden shadow-md border border-slate-100 relative group ${selectedCombo.images.length === 1 ? 'h-48' : 'h-36'}`}>
                    <img src={img} alt="Vista previa combo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>

            

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