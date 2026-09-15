import { useLocation } from 'react-router-dom';
import React from 'react';
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
import { CartProvider } from './components/cartcontent/CartContext';

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

  return <WhatsAppButton />;
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
        <Route path="/bingo/:gameId" element={<BingoGalactico />} />
      </Routes>

      {/* Botón de WhatsApp condicional (se oculta automáticamente en /admin) */}
      <ConditionalWhatsApp />
      </CartProvider>
    </BrowserRouter>
  );
}