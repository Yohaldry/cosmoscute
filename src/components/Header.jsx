import { Search, User, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CartDrawer from './cartcontent/CartDrawer'; // Ajusta la ruta si es necesario
import { useCart } from './cartcontent/CartContext'; // Importamos el hook del contexto que me pasaste

export default function Header() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // Estado para abrir/cerrar el panel lateral
  const { totalItems } = useCart(); // Obtenemos el total de ítems en tiempo real

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
        <div className="w-full px-4 md:px-20 flex items-center justify-between">
          <div className="flex items-center cursor-pointer group relative py-2 mt-3" onClick={() => navigate('/')}>
            <img 
              src="https://res.cloudinary.com/dtkirmtfq/image/upload/q_auto,f_auto,w_400/v1784603746/CosmosCute/uyjhbf3bqmox7ovppbmn.png" 
              alt="Cosmos Cute Logo" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-md transition-transform transform group-hover:scale-105"
            />
          </div>

          <nav className="hidden md:flex items-center gap-1 font-medium text-xs text-black">
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

          <div className="flex items-center gap-2 text-black">
            <button className="p-1.5 rounded-full transition-all duration-200 hover:bg-purple-900/40 hover:backdrop-blur-sm">
              <Search className="w-4 h-4 cursor-pointer text-black" />
            </button>
            
            <button className="p-1.5 rounded-full transition-all duration-200 hover:bg-purple-900/40 hover:backdrop-blur-sm">
              <User className="w-4 h-4 cursor-pointer text-black" />
            </button>
            
            {/* Botón del carrito: abre directamente la barra lateral */}
            <div 
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer p-1.5 rounded-full transition-all duration-200 group hover:bg-purple-900/40 hover:backdrop-blur-sm"
            >
              <ShoppingBag className="w-4 h-4 transition-colors text-black" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-[#FF69B4] text-white text-[9px] w-3 h-3 rounded-full flex items-center justify-center font-bold shadow">
                  {totalItems}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barra lateral del carrito */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}