import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaginaPrincipal from './pages/PaginaPrincipal';
import CategoriasTotales from './components/CategoriasTotales'; 
import AdminPanel from './pages/AdminPanel';
import VistaCategoria from './components/VistaCategoria';
import VistaDetalleProducto from './components/VistaDetalleProducto'
// Importamos el Proveedor del Carrito, el Drawer y el Botón Flotante
import { CartProvider } from './components/cartcontent/CartContext'; 
import CartDrawer from './components/cartcontent/CartDrawer';
import BotonFlotanteCarrito from './components/BotonFlotanteCarrito';

export default function App() {
  return (
    <Router>
      <CartProvider>
        <Routes>
          {/* Muestra la página principal en la ruta raíz */}
          <Route path="/" element={<PaginaPrincipal />} />
          
          {/* Muestra la vista completa de todas las categorías con buscador */}
          <Route path="/categorias" element={<CategoriasTotales />} />

          {/* Panel de administración */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Vista dinámica por categoría */}
          <Route path="/categoria/:nombreCategoria" element={<VistaCategoria />} />

          {/* 🚀 NUEVA RUTA DINÁMICA PARA DETALLE DE PRODUCTO INDIVIDUAL */}
          <Route path="/producto/:id" element={<VistaDetalleProducto />} />
        </Routes>

        {/* 🛒 Elementos globales visibles en TODAS las vistas */}
        <BotonFlotanteCarrito />
        <CartDrawer />

      </CartProvider>
    </Router>
  );
}