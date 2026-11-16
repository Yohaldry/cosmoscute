import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Search, Plus, Check } from 'lucide-react';
import ModalPedido from '../components/ModalPedido';

// Importamos el Contexto del Carrito (ajusta la ruta si está dentro de src/cartcontent)
import { useCart } from './cartcontent/CartContext'; 

import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function VistaCategoria() {
  const { nombreCategoria } = useParams();
  const navigate = useNavigate();

  // Traemos la función para agregar productos al carrito desde CartContext
  const { addToCart } = useCart();

  // Decodificamos el nombre de la categoría enviado por la URL
  const categoriaNombre = decodeURIComponent(nombreCategoria || '').toUpperCase();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para controlar el Modal de Bingo / Partidas
  const [isOpenModal, setIsOpenModal] = useState(false);

  // Estado para llevar el registro temporal de qué tarjetas muestran la intermitencia verde y el texto "AGREGADO"
  const [animatingItems, setAnimatingItems] = useState({});

  useEffect(() => {
    async function fetchProductosPorCategoria() {
      try {
        setLoading(true);
        // Consultamos la colección 'inventario' filtrando por el campo 'categoria'
        const q = query(
          collection(db, 'inventario'),
          where('categoria', '==', categoriaNombre)
        );

        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProductos(lista);
      } catch (error) {
        console.error("Error al cargar los productos de la categoría:", error);
      } finally {
        setLoading(false);
      }
    }

    if (categoriaNombre) {
      fetchProductosPorCategoria();
    }
  }, [categoriaNombre]);

  // Función exclusiva para agregar al carrito desde el botón (+) SIN ABRIR NINGÚN MODAL
  const handleAddToCartDirect = (e, item) => {
    e.stopPropagation(); // Detiene la propagación para que no navegue al detalle al hacer clic en el +
    
    if (addToCart) {
      addToCart(item);

      // Activamos la animación verde intermitente y el aviso "¡Agregado!"
      setAnimatingItems(prev => ({ ...prev, [item.id]: true }));

      // Después de 1.5 segundos removemos el efecto visual
      setTimeout(() => {
        setAnimatingItems(prev => ({ ...prev, [item.id]: false }));
      }, 1500);
    }
  };

  // Filtrado local en tiempo real dentro de la categoría
  const productosFiltrados = productos.filter(prod =>
    (prod.nombre || prod.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f7fc] text-gray-800 font-sans selection:bg-pink-500 selection:text-white">
      
      {/* HEADER DE NAVEGACIÓN */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="text-center">
            <span className="text-[9px] font-black tracking-widest text-pink-600 uppercase bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
              Categoría
            </span>
            <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight uppercase">
              {categoriaNombre}
            </h1>
          </div>

          {/* Botón exclusivo para abrir el Modal de Compra de Partida / Bingo */}
          <button 
            onClick={() => setIsOpenModal(true)} 
            className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 hover:opacity-95 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span className="hidden sm:inline">Comprar Partida</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        
        {/* BARRA DE BÚSQUEDA INTERNA */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder={`Buscar en ${categoriaNombre}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-purple-100 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all shadow-2xs"
          />
        </div>

        {/* LISTADO DE PRODUCTOS EN GRID */}
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-400 font-medium">
            Cargando productos de {categoriaNombre}...
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-12 space-y-2 bg-white rounded-2xl border border-purple-100 p-6">
            <p className="text-sm font-bold text-gray-700">No se encontraron productos en esta categoría.</p>
            <p className="text-xs text-gray-400">Intenta buscar otro término o vuelve más tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {productosFiltrados.map((item) => {
              const precioVal = Number(item.precio ?? item.costo ?? item.price ?? 0);
              const isAdded = animatingItems[item.id]; 

              return (
                <div 
                  key={item.id}
                  onClick={() => navigate(`/producto/${item.id}`)}
                  className={`group relative rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between transition-all duration-300 p-2 space-y-2 bg-white cursor-pointer hover:shadow-md hover:-translate-y-1 ${
                    isAdded 
                      ? 'border-2 border-emerald-500 ring-4 ring-emerald-400/30 animate-pulse bg-emerald-50/30 scale-[1.02]' 
                      : 'border border-purple-100'
                  }`}
                >
                  {/* Superposición visual de "¡AGREGADO!" */}
                  {isAdded && (
                    <div className="absolute inset-0 z-20 bg-emerald-600/90 backdrop-blur-xs flex flex-col items-center justify-center text-white rounded-xl animate-fadeIn">
                      <Check className="w-8 h-8 stroke-[3] mb-1 animate-bounce" />
                      <span className="text-xs font-black tracking-wider uppercase">¡Agregado!</span>
                    </div>
                  )}

                  {/* Imagen del Producto */}
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={item.img || 'https://res.cloudinary.com/dtkirmtfq/image/upload/v1788650769/CosmosCute/bek3cv3wam7jcdo6itnj.jpg'} 
                      alt={item.nombre || item.categoria} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.descuento > 0 && (
                      <span className="absolute top-1 left-1 bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                        -{item.descuento} COL
                      </span>
                    )}
                  </div>

                  {/* Detalles del Producto */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black text-gray-900 line-clamp-1 uppercase group-hover:text-purple-600 transition-colors">
                        {item.nombre || item.categoria}
                      </h3>
                      {item.descripcion && (
                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                          {item.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Precio y Botón (+) */}
                    <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-pink-600 font-black text-xs">
                        ${precioVal.toLocaleString()}
                      </span>
                      
                      <button 
                        onClick={(e) => handleAddToCartDirect(e, item)}
                        className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        title="Agregar al Carrito"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal exclusivo para la compra de partida de Bingo */}
      <ModalPedido 
        isOpen={isOpenModal} 
        onClose={() => setIsOpenModal(false)} 
      />
    </div>
  );
}