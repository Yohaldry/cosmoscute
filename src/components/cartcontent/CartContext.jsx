import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Costo fijo del domicilio
  const SHIPPING_COST = 15000;

  // Añadir producto o combo
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Restar o eliminar producto si llega a 0
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

  // Eliminar por completo un ítem sin importar la cantidad
  const deleteItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Cálculos automáticos
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const productsPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Total final sumando los productos + los 15.000 COP de domicilio (solo si hay productos en el carrito)
  const totalPrice = cartItems.length > 0 ? productsPrice + SHIPPING_COST : 0;

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      deleteItem, 
      totalItems, 
      productsPrice,
      shippingCost: SHIPPING_COST,
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);