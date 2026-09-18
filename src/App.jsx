import { useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Categories from './components/Categories';
import BannersP from './components/BannersP';
import AdminPanel from './pages/AdminPanel';
import BingoGalactico from './components/BingoGalactico';
import './index.css';
import BoxGame from './components/BoxGame';
import MundoCute from './components/MundoCute';
import Footer from './components/Footer';
import useContadorVisitas from './pages/estadisticas_web/useContadorVisitas';
import WhatsAppButton from './components/WhatsApp';
import { CartProvider, useCart } from './components/cartcontent/CartContext';
import CartDrawer from './components/cartcontent/CartDrawer'; // Asegúrate de ajustar esta ruta según donde tengas tu CartDrawer
import { ShoppingCart } from 'lucide-react';

function HomeView() {
  return (
    <div>
      <Header />
      <Hero />
      <BannersP />
      <MundoCute />
      <Footer />
    </div>
  );
}

// Componente Wrapper para manejar la visibilidad del botón de WhatsApp según la ruta
function ConditionalWhatsApp() {
  const location = useLocation();

  // Si la ruta actual incluye '/admin', no renderizamos el botón
  if (location.pathname.includes('/admin')) {
    return null;
  }
  if (location.pathname.includes('/bingo')) {
    return null;
  }

  return <WhatsAppButton />;
}

// Componente global para el Carrito Flotante y su Drawer (Posicionado a la izquierda)
function GlobalFloatingCart() {
  const location = useLocation();
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Si la ruta actual incluye '/admin', no renderizamos el carrito
  if (location.pathname.includes('/admin')) {
    return null;
  }

  return (
    <>
      {/* Botón flotante del carrito en el lado izquierdo (Aparece solo si hay productos) */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-6 z-40 animate-in.fade-in slide-in-from-bottom-6 duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="group relative bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl shadow-purple-900/40 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 border border-white/20"
            aria-label="Ver Carrito"
          >
            {/* Badge indicador de cantidad */}
            <span className="absolute -top-1.5 -right-1.5 bg-pink-400 text-slate-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-bounce">
              {totalItems}
            </span>

            <ShoppingCart className="w-5 h-5 text-pink-200 group-hover:-rotate-12 transition-transform" />
            <span className="hidden sm:inline font-extrabold text-xs tracking-wide">Ver Carrito</span>
          </button>
        </div>
      )}

      {/* Drawer lila oscuro del carrito accesible globalmente */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

// Función auxiliar para redirigir automáticamente a una URL con ID único
function RedirectWithUniqueId({ baseRoute }) {
  useContadorVisitas();
  const uniqueId = crypto.randomUUID().slice(0, 8);
  return <Navigate to={`${baseRoute}/${uniqueId}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/admin" element={<AdminPanel />} />
          
          {/* Redirección automática si entran a la ruta base sin ID */}
          <Route path="/boxgame" element={<RedirectWithUniqueId baseRoute="/boxgame" />} />
          <Route path="/bingo" element={<RedirectWithUniqueId baseRoute="/bingo" />} />

          {/* Rutas dinámicas con ID único */}
          <Route path="/boxgame/:gameId" element={<BoxGame />} />
          <Route path="/bingo/:gameId" element={<BingoGalactico/>} />
        </Routes>

        {/* Botones Flotantes Globales (Carrito a la izquierda, WhatsApp a la derecha) */}
        <GlobalFloatingCart />
        <ConditionalWhatsApp />
      </CartProvider>
    </BrowserRouter>
  );
}