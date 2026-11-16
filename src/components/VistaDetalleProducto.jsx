import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus, Minus, Check, Sparkles, Heart, ShieldCheck, Truck, Star } from 'lucide-react';
import { useCart } from './cartcontent/CartContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function VistaDetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    async function fetchProducto() {
      try {
        setLoading(true);
        const docRef = doc(db, 'inventario', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProducto({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProducto(null);
        }
      } catch (error) {
        console.error("Error al cargar el producto:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProducto();
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!producto) return;
    
    // Añadimos el producto tantas veces como indique la cantidad seleccionada
    for (let i = 0; i < cantidad; i++) {
      addToCart(producto);
    }

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/40 to-purple-50/50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-purple-600 animate-pulse">Cargando magia...</p>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/40 to-purple-50/50 flex items-center justify-center p-4">
        <div className="text-center space-y-3 bg-white p-6 rounded-3xl border-2 border-pink-200 shadow-xl max-w-sm w-full">
          <span className="text-4xl">🥺</span>
          <h2 className="text-base font-black text-purple-950">Producto no encontrado</h2>
          <p className="text-xs text-gray-500">Es posible que este tesoro ya no esté disponible.</p>
          <button 
            onClick={() => navigate(-1)} 
            className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer"
          >
            Volver Atrás
          </button>
        </div>
      </div>
    );
  }

  const precioVal = Number(producto.precio ?? producto.costo ?? producto.price ?? 0);
  const imagenSrc = producto.img || producto.image || 'https://res.cloudinary.com/dtkirmtfq/image/upload/v1788650769/CosmosCute/bek3cv3wam7jcdo6itnj.jpg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/50 to-purple-50/70 text-gray-800 font-sans pb-12">
      
      {/* HEADER DE NAVEGACIÓN */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-xl border border-pink-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <span className="text-[10px] font-black tracking-widest text-pink-600 uppercase bg-pink-50 px-3 py-1 rounded-full border border-pink-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-spin" /> Detalle Exclusivo
          </span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-white rounded-3xl border-2 border-pink-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-8">
          
          {/* IMAGEN DEL PRODUCTO */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-tr from-pink-50 to-purple-50 border border-pink-100 shadow-inner group">
            <img 
              src={imagenSrc} 
              alt={producto.nombre || producto.categoria} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {producto.descuento > 0 && (
              <span className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-md uppercase tracking-wider">
                -{producto.descuento} COL OFF ✨
              </span>
            )}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md text-pink-500">
              <Heart className="w-4 h-4 fill-pink-500" />
            </div>
          </div>

          {/* INFORMACIÓN Y ACCIONES */}
          <div className="flex flex-col justify-between space-y-6">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-purple-700 uppercase bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                  {producto.categoria || 'COSMOS CUTE'}
                </span>
                <div className="flex items-center text-amber-400 text-xs gap-0.5 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> 5.0 (Calidad Garantizada)
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-purple-950 uppercase tracking-tight leading-snug">
                {producto.nombre || producto.categoria}
              </h1>

              <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                ${precioVal.toLocaleString()} <span className="text-xs font-bold text-gray-400">COP</span>
              </div>

              {producto.descripcion ? (
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                  {producto.descripcion}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                  Un artículo mágico seleccionado especialmente para ti con detalles únicos de nuestra colección kawaii.
                </p>
              )}
            </div>

            {/* CONTROLES DE CANTIDAD Y BOTÓN DE COMPRA */}
            <div className="space-y-4 pt-4 border-t border-purple-100">
              
              <div className="flex items-center justify-between bg-pink-50/50 p-3 rounded-2xl border border-pink-200/60">
                <span className="text-xs font-black text-purple-950 uppercase tracking-wider">Cantidad:</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-pink-300 text-pink-600 font-bold flex items-center justify-center shadow-xs hover:bg-pink-100 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <span className="text-sm font-black text-purple-950 w-6 text-center">{cantidad}</span>
                  <button 
                    onClick={() => setCantidad(prev => Math.min(10, prev + 1))}
                    className="w-8 h-8 rounded-xl bg-white border border-pink-300 text-pink-600 font-bold flex items-center justify-center shadow-xs hover:bg-pink-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart}
                className={`w-full py-3.5 rounded-2xl font-black text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm uppercase tracking-wider ${
                  isAdded 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 animate-pulse' 
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-pink-500/30 hover:opacity-95'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3] animate-bounce" />
                    <span>¡Agregado al Carrito! ✨</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Añadir al Carrito • ${(precioVal * cantidad).toLocaleString()}</span>
                  </>
                )}
              </button>

              {/* GARANTÍAS */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-gray-700">Compra 100% Segura</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-purple-100 shadow-2xs">
                  <Truck className="w-4 h-4 text-pink-600 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-gray-700">Envíos a Todo el País</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}