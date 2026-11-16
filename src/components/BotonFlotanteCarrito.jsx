import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from './cartcontent/CartContext';

export default function BotonFlotanteCarrito() {
  const { totalItems, setIsCartOpen } = useCart();
  const tieneProductos = totalItems > 0;

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
        tieneProductos
          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-purple-300'
          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
      }`}
      title="Ver Carrito de Compras"
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5" />
        {tieneProductos && (
          <span className="absolute -top-2 -right-2 bg-amber-400 text-purple-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            {totalItems}
          </span>
        )}
      </div>
      <span className="text-xs font-black tracking-wide uppercase">
        {tieneProductos ? `${totalItems} ${totalItems === 1 ? 'Ítem' : 'Ítems'}` : 'Vacío'}
      </span>
    </button>
  );
}