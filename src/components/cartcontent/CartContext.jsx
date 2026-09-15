import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Crear el Contexto
const CartContext = createContext();

// 2. Hook personalizado para usar el carrito fácilmente
export const useCart = () => useContext(CartContext);

// 3. El Proveedor (donde vive la lógica)
export const CartProvider = ({ children }) => {
    // Estado inicial: intenta cargar de LocalStorage, si no, usa array vacío
    const [cart, setCart] = useState(() => {
        try {
            const storedCart = localStorage.getItem('bingo_cart');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error("Error leyendo localStorage:", error);
            return [];
        }
    });

    // Guardar en LocalStorage cada vez que el carrito cambie
    useEffect(() => {
        try {
            localStorage.setItem('bingo_cart', JSON.stringify(cart));
        } catch (error) {
            console.error("Error guardando en localStorage:", error);
        }
    }, [cart]);

    // --- LÓGICA DEL CARRITO ---

    // Agregar producto (o aumentar cantidad si ya existe)
    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);

            if (existingItem) {
                // Si ya existe, solo aumentamos la cantidad
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // Si es nuevo, lo agregamos con quantity: 1
                // Asignamos un ID único temporal si el producto no tiene (producto.id)
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
        // Opcional: Podrías lanzar una alerta visual o abrir el modal aquí
    };

    // Eliminar producto completamente
    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    // Cambiar cantidad (input manual o botones +/-)
    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId ? { ...item, quantity: parseInt(quantity) } : item
            )
        );
    };

    // Vaciar carrito
    const clearCart = () => {
        setCart([]);
    };

    // Calcular totales (cantidad de items y precio total)
    const totals = cart.reduce((acc, item) => {
        acc.quantity += item.quantity;
        acc.price += item.price * item.quantity;
        return acc;
    }, { quantity: 0, price: 0 });

    // El objeto que exponemos a la app
    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totals
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};