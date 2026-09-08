import { Search, User, ShoppingBag, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ModalPedido from './ModalPedido'; // Asegúrate de ajustar la ruta según la ubicación de tu archivo

export default function Header() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed h-14 top-0 left-0 w-full z-50 transition-all duration-300 flex items-center border-b ${
        isScrolled 
          ? 'bg-[#1f0b36]/10 backdrop-blur-md border-purple-500/30 shadow-md' 
          : 'bg-transparent border-transparent'
      }`}>
        {/* Navegación principal */}
        <div className="w-full px-4 md:px-20 flex items-center justify-between">
          {/* Logo y texto ultra compacto */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <img 
              src="https://res.cloudinary.com/dtkirmtfq/image/upload/q_auto,f_auto,w_400/v1784603746/CosmosCute/uyjhbf3bqmox7ovppbmn.png" 
              alt="Cosmos Cute Logo" 
              className="w-12 h-12 shadow-sm transition-transform"
              style={{ imageRendering: 'high-quality' }}
            />
          </div>

          {/* Menú de enlaces con tonos morados */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-xs text-black-200">
            {['Inicio', 'Tienda', 'Colecciones', 'Novedades', 'Nosotros', 'Contacto'].map((item) => (
              <a
                key={item}
                href="#"
                className="px-2.5 py-1 rounded-full transition-all duration-200 hover:bg-purple-900/40 hover:backdrop-blur-sm hover:text-pink-300"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Iconos de la derecha y botón de jugar */}
          <div className="flex items-center gap-2 text-purple-200">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(216,180,254,0.5)] cursor-pointer transition-all transform hover:scale-105 border border-white/30 flex items-center gap-1 animate-pulse"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Jugar ahora</span>
            </button>

            <button className="p-1.5 rounded-full transition-all duration-200 hover:bg-purple-900/40 hover:backdrop-blur-sm">
              <Search className="w-4 h-4 cursor-pointer" />
            </button>
            
            <button className="p-1.5 rounded-full transition-all duration-200 hover:bg-purple-900/40 hover:backdrop-blur-sm">
              <User className="w-4 h-4 cursor-pointer" />
            </button>
            
            <div className="relative cursor-pointer p-1.5 rounded-full transition-all duration-200 group hover:bg-purple-900/40 hover:backdrop-blur-sm">
              <ShoppingBag className="w-4 h-4 transition-colors" />
              <span className="absolute top-0 right-0 bg-[#FF69B4] text-white text-[9px] w-3 h-3 rounded-full flex items-center justify-center font-bold shadow">
                2
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Renderizado del Modal externo */}
      <ModalPedido 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}