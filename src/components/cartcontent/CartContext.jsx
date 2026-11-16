import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Añadir producto o combo con sus datos normalizados
  const addToCart = (product) => {
    // Priorizamos 'precio', luego 'price' y por último 'costo' para que tome el valor correcto de venta
    const precioFinal = Number(product.precio ?? product.price ?? product.costo ?? 0);
    const nombreFinal = product.nombre || product.title || product.name || 'Producto';
    const imagenFinal = product.img || product.image || '';

    const productoNormalizado = {
      id: product.id || Date.now().toString(),
      nombre: nombreFinal,
      name: nombreFinal, // Por compatibilidad con vistas anteriores
      price: precioFinal,
      image: imagenFinal,
      img: imagenFinal,
      descripcion: product.descripcion || ''
    };

    setCartItems(prev => {
      const existing = prev.find(item => item.id === productoNormalizado.id);
      if (existing) {
        return prev.map(item => 
          item.id === productoNormalizado.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...productoNormalizado, quantity: 1 }];
    });

    // Abre el carrito automáticamente al presionar el botón +
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === id);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map(item => 
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const deleteItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const productsPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalPrice = productsPrice;

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      deleteItem, 
      totalItems, 
      productsPrice,
      shippingCost: 0,
      totalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);