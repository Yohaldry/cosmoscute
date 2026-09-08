const categories = [
  { title: "PAPELERÍA", desc: "Agendas, Cuadernos, Stickers y más", bg: "bg-purple-100", textBg: "text-purple-900", borderBg: "border-purple-200" },
  { title: "BELLEZA", desc: "Maquillaje, Brochas, Espejos y más", bg: "bg-pink-100", textBg: "text-pink-900", borderBg: "border-pink-200" },
  { title: "ACCESORIOS", desc: "Llaveros, Bolsos, Peluches y más", bg: "bg-amber-100", textBg: "text-amber-900", borderBg: "border-amber-200" },
  { title: "LIBROS", desc: "Novelas, Manga, Desarrollo personal", bg: "bg-sky-100", textBg: "text-sky-900", borderBg: "border-sky-200" },
  { title: "REGALOS", desc: "Cajas sorpresa, Kits temáticos", bg: "bg-cyan-100", textBg: "text-cyan-900", borderBg: "border-cyan-200" },
];

export default function Categories() {
  return (
    <section className="w-full px-4 md:px-8 py-4">
      {/* Contenedor con scroll horizontal fluido y ocultando la barra de desplazamiento */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 px-1">
        {categories.map((cat, index) => (
          <div 
            key={index} 
            className={`flex-shrink-0 ${cat.bg} border ${cat.borderBg} rounded-full py-2 px-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer`}
          >
            {/* Ícono miniatura redondo */}
            <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-inner flex-shrink-0">
              <span className="text-sm">🎁</span>
            </div>

            {/* Título y descripción corta en una o dos líneas compactas */}
            <div className="flex flex-col text-left">
              <h3 className={`font-black ${cat.textBg} text-xs tracking-wide`}>{cat.title}</h3>
              <p className="text-[10px] text-gray-600 font-medium whitespace-nowrap">{cat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}