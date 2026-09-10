import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Heart, Star, ShoppingCart, Search, Sparkles, 
  ArrowRight, ShieldCheck, Truck, Headphones, Send, Gift, Flame, X, CheckCircle2
} from 'lucide-react';

export default function CosmosCuteClean() {
  const [productos, setProductos] = useState([]);
  const [categoriasDB, setCategoriasDB] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(2);
  const [favorites, setFavorites] = useState([1, 4]);

  // Estado para el Modal de Detalles
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Sincronización en tiempo real con Firestore
// Sincronización en tiempo real con Firestore desde la colección "inventario" filtrando solo los activos
  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, "inventario"), (snapshot) => {
      const items = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          img: data.img || '',
          img1: data.img1 || ''
        };
      }).filter(prod => {
        // Filtramos estrictamente para que solo pasen los que tienen estado true / activo
        const isActivo = 
          prod.estado === true || 
          String(prod.estado || "").toLowerCase() === "activo" || 
          String(prod.estado || "").toLowerCase() === "true" || 
          prod.estado === 1;
        return isActivo;
      });

      setProductos(items);
      setIsLoading(false);
    });

    const unsubCat = onSnapshot(collection(db, "categorias"), (snapshot) => {
      const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategoriasDB(cats);
    });

    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  // Función directa para obtener las imágenes de 'img' y 'img1'
  // Función para validar que el Base64 sea utilizable
 const getProductImages = (prod) => {
    const images = [];
    
    [prod.img, prod.img1].forEach(imgVal => {
      if (imgVal && typeof imgVal === 'string' && imgVal.trim().length > 10) {
        let val = imgVal.trim();
        
        // Si por error se guardó un blob temporal de la PC, lo ignoramos para que no intente cargarlo en vano
        if (val.startsWith('blob:')) {
          return; 
        }
        
        // Si es un base64 crudo sin el encabezado, se lo añadimos
        if (!val.startsWith('http') && !val.startsWith('data:image')) {
          val = `data:image/jpeg;base64,${val}`;
        }
        
        images.push(val);
      }
    });
    
    return images;
  };

  // Construir categorías dinámicamente
  const categories = [
    { id: 'all', name: '✨ Todo', count: productos.length },
    ...categoriasDB.map(cat => ({
      id: cat.nombre,
      name: `🏷️ ${cat.nombre}`,
      count: productos.filter(p => p.categoria === cat.nombre).length
    }))
  ];

  const formatPrice = (price) => `$${Number(price || 0).toLocaleString('es-CO')}`;

  const filteredProducts = productos.filter(prod => {
    const matchesCategory = selectedCategory === 'all' || prod.categoria === selectedCategory;
    const matchesSearch = (prod.nombre || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleOpenModal = (prod) => {
    setSelectedProduct(prod);
    setActiveImageIndex(0);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFFDF9]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-pink-600 tracking-tight uppercase">Cargando Mundo Cute...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2D2A32] font-sans antialiased selection:bg-pink-200 selection:text-pink-900">
      
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1">
        <div className="rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-white px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden shadow-md">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2.5 text-center sm:text-left z-10">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-yellow-200 shadow-xs">
              <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase text-pink-200 tracking-wider">Inventario en Vivo</div>
              <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-snug">
                Diseño, Estética y Funcionalidad para tu Día a Día ✨
              </h2>
            </div>
          </div>

          <button className="bg-white text-slate-900 hover:bg-pink-100 font-extrabold text-[10px] sm:text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 flex-shrink-0 z-10">
            <span>Explorar</span> <ArrowRight className="w-3 h-3 text-pink-600" />
          </button>
        </div>
      </section>

      {/* BARRA DE BÚSQUEDA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos en el inventario..."
            className="w-full bg-white border border-pink-100 rounded-full pl-9 pr-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-400 shadow-2xs"
          />
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-xs ${
                selectedCategory === cat.id 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/25 scale-105' 
                  : 'bg-white text-slate-600 border border-pink-100 hover:bg-pink-50/50'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </section>

      {/* GRILLA DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-1 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {filteredProducts.map((prod) => {
            const productImages = getProductImages(prod);
            const mainImage = productImages.length > 0 ? productImages[0] : null;

            return (
              <div 
                key={prod.id} 
                onClick={() => handleOpenModal(prod)}
                className="bg-white border border-pink-100/80 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between relative group shadow-xs hover:shadow-xl hover:border-pink-300 transition-all duration-300 cursor-pointer"
              >
                
                <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 rounded-full uppercase shadow-xs">
                  {prod.categoria || "General"}
                </span>

                <button 
                  onClick={(e) => toggleFavorite(prod.id, e)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 text-slate-400 hover:text-pink-500 bg-white/90 backdrop-blur-xs p-1 sm:p-1.5 rounded-full border border-pink-100 shadow-xs transition-transform active:scale-95"
                >
                  <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${favorites.includes(prod.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                </button>

                <div>
                  <div className="w-full h-28 sm:h-36 bg-pink-50/40 rounded-lg sm:rounded-xl overflow-hidden border border-pink-100/60 mb-2 relative flex items-center justify-center">
                   {mainImage ? (
                      <img 
                        src={mainImage} 
                        alt={prod.nombre} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          console.error("Error al renderizar la imagen Base64 para el producto:", prod.nombre, mainImage);
                        }}
                      />
                    ) : (
                      <div className="text-pink-300 text-[10px] font-bold text-center p-2">
                        Imagen no válida o vacía
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-700">5.0</span>
                    </div>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${Number(prod.udisponibles || prod.stockactual) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      Stock Disponible
                    </span>
                  </div>

                  <h3 className="font-bold text-[10px] sm:text-[11px] text-slate-800 line-clamp-2 leading-snug mb-2 sm:mb-3 group-hover:text-pink-600 transition-colors">
                    {prod.nombre}
                  </h3>
                </div>

                <div>
                  <div className="font-black text-[11px] sm:text-xs sm:text-sm text-slate-900 mb-1.5 sm:mb-2">
                    {formatPrice(prod.precio)}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCartCount(c => c + 1);
                    }}
                    className="w-full bg-pink-50 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white text-pink-600 font-extrabold text-[9px] sm:text-[10px] py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Agregar
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-pink-100 shadow-sm">
            <Gift className="w-10 h-10 text-pink-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No hay productos en esta categoría o búsqueda.</p>
            <p className="text-[10px] text-slate-400 mt-1">Agrega productos desde tu panel de administración.</p>
          </div>
        )}
      </section>

      {/* MODAL DE DETALLES DEL PRODUCTO */}
      {selectedProduct && (() => {
        const modalImages = getProductImages(selectedProduct);
        const currentActiveImg = modalImages[activeImageIndex] || modalImages[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-pink-100 overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              
              {/* Botón Cerrar */}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-pink-100 text-slate-700 p-2 rounded-full backdrop-blur-md shadow-md transition-transform active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto p-6 sm:p-8 flex flex-col md:flex-row gap-6">
                
                {/* Sección de Imágenes en Grande */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <div className="w-full h-72 sm:h-80 bg-pink-50/50 rounded-2xl overflow-hidden border border-pink-100 flex items-center justify-center relative shadow-inner">
                    {currentActiveImg ? (
                      <img src={currentActiveImg} alt={selectedProduct.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-pink-300 text-xs font-bold">Sin imágenes disponibles</div>
                    )}
                  </div>

                  {/* Miniaturas dinámicas para img e img1 */}
                  {modalImages.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {modalImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-pink-500 scale-105 shadow-md' : 'border-pink-100 opacity-70'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Información del Producto */}
                <div className="w-full md:w-1/2 flex flex-col justify-between">
                  <div>
                    <span className="bg-pink-100 text-pink-700 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
                      {selectedProduct.categoria || "Mundo Cute"}
                    </span>

                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-2">
                      {selectedProduct.nombre}
                    </h2>

                    <div className="text-2xl font-black text-pink-600 mb-4">
                      {formatPrice(selectedProduct.precio)}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${Number(selectedProduct.udisponibles || selectedProduct.stockactual) > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                        <CheckCircle2 className="w-3 h-3" /> Stock disponible
                      </span>
                    </div>

                    {selectedProduct.descripcion && (
                      <p className="text-xs text-slate-600 leading-relaxed mb-6 bg-pink-50/30 p-3.5 rounded-xl border border-pink-100/50">
                        {selectedProduct.descripcion}
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      setCartCount(c => c + 1);
                      setSelectedProduct(null);
                    }}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition-transform active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" /> Agregar al Carrito
                  </button>

                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}