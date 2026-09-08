import { useState } from 'react';
import { 
  Heart, Star, ShoppingCart, Search, Sparkles, 
  ArrowRight, ShieldCheck, Truck, Headphones, Send, Gift, Flame
} from 'lucide-react';

const categories = [
  { id: 'all', name: '✨ Todo', count: '24' },
  { id: 'papeleria', name: '📚 Papelería', count: '8' },
  { id: 'tech', name: '⚡ Tech & LED', count: '6' },
  { id: 'lifestyle', name: '👜 Lifestyle', count: '10' },
];

const products = [
  { id: 1, name: "Set de Plumas Minimalistas Premium", price: 24900, category: 'papeleria', rating: 4.9, reviews: 128, image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80", tag: "BEST SELLER" },
  { id: 2, name: "Espejo Organizador LED Profesional", price: 89900, category: 'tech', rating: 5.0, reviews: 96, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80", tag: "NUEVO" },
  { id: 3, name: "Mochila Urbana Exec Galaxy", price: 129900, category: 'lifestyle', rating: 4.8, reviews: 74, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80", tag: "15% OFF" },
  { id: 4, name: "Libreta de Notas Exec Hardcover", price: 49900, category: 'papeleria', rating: 4.9, reviews: 53, image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80", tag: "PRO" },
  { id: 5, name: "Lámpara de Escritorio Minimalista LED", price: 59900, category: 'tech', rating: 5.0, reviews: 112, image: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80", tag: "TRENDY" },
  { id: 6, name: "Termo Inteligente Display Touch", price: 69900, category: 'tech', rating: 4.9, reviews: 88, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80", tag: "LIMITADO" },
];

export default function CosmosCuteClean() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(2);
  const [favorites, setFavorites] = useState([1, 4]);

  const formatPrice = (price) => `$${price.toLocaleString('es-CO')}`;

  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2D2A32] font-sans antialiased selection:bg-pink-200 selection:text-pink-900">
      


      {/* HERO SECTION - RECOGIDO Y MÁS PEQUEÑO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1">
        <div className="rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-700 text-white px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden shadow-md">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2.5 text-center sm:text-left z-10">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-yellow-200 shadow-xs">
              <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase text-pink-200 tracking-wider">Colección 2026</div>
              <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-snug">
                Diseño, Estética y Funcionalidad para tu Día a Día ✨
              </h2>
            </div>
          </div>

          <button className="bg-white text-slate-900 hover:bg-pink-100 font-extrabold text-[10px] sm:text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 flex-shrink-0 z-10">
            <span>Ver Catálogo</span> <ArrowRight className="w-3 h-3 text-pink-600" />
          </button>
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
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* GRILLA DE PRODUCTOS (Ultra compacta en móviles con 2 columnas proporcionales) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-1 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="bg-white border border-pink-100/80 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between relative group shadow-xs hover:shadow-xl hover:border-pink-300 transition-all duration-300">
              
              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 rounded-full uppercase shadow-xs">
                {prod.tag}
              </span>

              <button 
                onClick={(e) => toggleFavorite(prod.id, e)}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 text-slate-400 hover:text-pink-500 bg-white/90 backdrop-blur-xs p-1 sm:p-1.5 rounded-full border border-pink-100 shadow-xs transition-transform active:scale-95"
              >
                <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${favorites.includes(prod.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
              </button>

              <div>
                <div className="w-full h-24 sm:h-32 bg-pink-50/40 rounded-lg sm:rounded-xl overflow-hidden border border-pink-100/60 mb-2 relative group-hover:shadow-inner">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-700">{prod.rating}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium">({prod.reviews})</span>
                </div>
                <h3 className="font-bold text-[10px] sm:text-[11px] text-slate-800 line-clamp-2 leading-snug mb-2 sm:mb-3 group-hover:text-pink-600 transition-colors">{prod.name}</h3>
              </div>

              <div>
                <div className="font-black text-[11px] sm:text-xs sm:text-sm text-slate-900 mb-1.5 sm:mb-2">{formatPrice(prod.price)}</div>
                <button 
                  onClick={() => setCartCount(c => c + 1)}
                  className="w-full bg-pink-50 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white text-pink-600 font-extrabold text-[9px] sm:text-[10px] py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs"
                >
                  <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Agregar
                </button>
              </div>

            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-pink-100 shadow-sm">
            <Gift className="w-10 h-10 text-pink-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No encontramos productos con esa búsqueda.</p>
            <p className="text-[10px] text-slate-400 mt-1">Prueba con otra palabra clave o categoría.</p>
          </div>
        )}
      </section>

    </div>
  );
}