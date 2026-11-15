import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaginaPrincipal from './pages/PaginaPrincipal';
import CategoriasTotales from './components/CategoriasTotales'; 
import AdminPanel from './pages/AdminPanel'; 

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Muestra la página principal en la ruta raíz */}
        <Route path="/" element={<PaginaPrincipal />} />
        
        {/* Muestra la vista completa de todas las categorías con buscador */}
        <Route path="/categorias" element={<CategoriasTotales />} />

        {/* Muestra la vista completa de todas las categorías con buscador */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}