import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Categories from './components/Categories';
import Products from './components/Products';
import AdminPanel from './pages/AdminPanel';
import BingoGalactico from './components/BingoGalactico';
import './index.css';
import BoxGame from './components/BoxGame';
import MundoCute from './components/MundoCute';
import Footer from './components/Footer';
import useContadorVisitas from './pages/estadisticas_web/useContadorVisitas'

function HomeView() {
  return (
    <div>
      <Header />
      <Hero />
      <Products />
      <MundoCute />
      <Footer />
    </div>
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
    </BrowserRouter>
  );
}