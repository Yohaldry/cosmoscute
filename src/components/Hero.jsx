import { Sparkles, Trophy, Flame, Play, Gift } from 'lucide-react';
import { useState } from 'react';
import ModalPedido from './ModalPedido';

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="w-full px-2 md:px-8 pt-16 md:pt-20">
        <div className="relative w-full rounded-b-2xl md:rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(15,5,30,0.8)] bg-gradient-to-br from-[#0d0415] via-[#1f0b36] to-[#0a0210] border border-purple-500/30 py-5 px-4 md:px-12 flex items-center">
          
          {/* Efectos de luz ambiental de fondo */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-pink-600/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Contenedor principal equilibrado */}
          <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
            
            {/* Columna Izquierda: Textos y CTA (7 columnas) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-2.5">
              
              {/* Badge superior */}
              <div className="inline-flex items-center gap-1.5 bg-purple-950/80 border border-purple-400/40 px-2.5 py-0.5 rounded-full text-purple-200 text-[10px] font-bold tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" /> EVENTO ESPECIAL ACTIVO 🎰
              </div>

              {/* Título principal adaptable y compacto */}
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                ¡DESBLOQUEA TUS <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-fuchsia-500 drop-shadow-[0_0_25px_rgba(236,72,153,0.6)]">
                  PREMIOS CÓSMICOS!
                </span>
              </h1>

              {/* Subtítulo equilibrado */}
              <p className="text-gray-300 text-[11px] sm:text-xs md:text-sm font-medium max-w-lg leading-relaxed drop-shadow-md">
                Accede al tablero en vivo, acciona la tómbola espacial y asegura tu ronda para llevarte los mejores artículos exclusivos.
              </p>

              {/* Botones de acción */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="group relative bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 hover:from-amber-300 hover:to-purple-500 text-white font-black text-[11px] md:text-sm px-4 md:px-6 py-2 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer shadow-[0_0_25px_rgba(236,72,153,0.7)] flex items-center gap-1.5 border-2 border-white/80"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200 group-hover:scale-110 transition-transform" />
                  <span>COMPRAR PARTIDA 🚀</span>
                </button>

                <a 
                  href="https://www.tiktok.com/@tiendacosmoscute?_r=1&_t=ZS-99UdE0A9tih"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] md:text-xs px-3.5 md:px-5 py-2 rounded-full backdrop-blur-md transition-all border border-white/20 flex items-center gap-1 cursor-pointer shadow-md"
                >
                  <Play className="w-3 h-3 text-pink-400 fill-pink-400" />
                  <span>Ver Juego</span>
                </a>
              </div>

              {/* Micro-badges informativos */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] font-bold text-purple-300/80">
                <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                  <Trophy className="w-3 h-3 text-amber-400" /> Sorteo en Vivo
                </span>
                <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                  ✨ Música Activa
                </span>
              </div>

            </div>

            {/* Columna Derecha: Tarjeta Visual */}
            <div className="lg:col-span-5 flex justify-center items-center w-full pt-1 lg:pt-0">
              <div className="relative w-48 sm:w-56 md:w-64 lg:w-full max-w-xs group cursor-pointer" onClick={() => setIsModalOpen(true)}>
                
                {/* Efecto de brillo exterior */}
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-600 to-amber-400 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>

                {/* Contenedor de la imagen miniatura */}
                <div className="relative rounded-xl overflow-hidden border border-white/30 bg-[#120521] shadow-xl transition-transform duration-300 group-hover:scale-[1.02]">
                  <img 
                    src="https://res.cloudinary.com/dtkirmtfq/image/upload/v1788650769/CosmosCute/bek3cv3wam7jcdo6itnj.jpg" 
                    alt="Vista previa del juego de cajas y bingo galáctico" 
                    className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  
                  {/* Overlay flotante interactivo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-transparent to-transparent opacity-80 flex flex-col justify-end p-2.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-amber-400 to-pink-500 text-purple-950 font-black text-[10px] md:text-[11px] py-1 px-3 rounded-lg shadow-md transform group-hover:scale-105 transition-transform">
                      <Gift className="w-3.5 h-3.5" /> ¡JUGAR AHORA!
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Modal de Pedido */}
      <ModalPedido isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}