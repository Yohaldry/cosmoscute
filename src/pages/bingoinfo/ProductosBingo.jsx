import React, { useState, useMemo } from "react";

// Recibe las props necesarias para la vista de solo muestra
export default function ProductosBingo({ 
    productos = [], 
    categorias = [], 
    triggerSuccessAlert // Opcional si deseas mantener notificaciones informativas
}) {
    const [searchQuery, setSearchQuery] = useState("");

    // Lógica de filtrado de productos del bingo
    const filteredProductos = useMemo(() => {
        return productos.filter(p => 
            (p.nombre?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (p.codigo?.toString() || "").includes(searchQuery) ||
            (p.categoria?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        );
    }, [productos, searchQuery]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* BARRA DE ACCIÓN (Solo Buscador y Contador Informativo) */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-[#7C69EF] text-white p-3 rounded-2xl shadow-md gap-3 mb-4 shrink-0">
                <div className="relative flex-1 max-w-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/70 text-xs">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar en el bingo por código o nombre..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/15 text-white placeholder-white/70 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-white/20 focus:outline-none focus:bg-white/25 transition-all font-medium"
                    />
                </div>

                <div className="text-xs font-semibold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-center">
                    🎯 Total en Bingo: <span className="font-bold">{filteredProductos.length}</span> / 100
                </div>
            </div>

            {/* TABLA DE PRODUCTOS (SOLO MUESTRA) */}
            <div className="bg-white border border-[#E4E8F0] rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 max-h-full">
                    <table className="w-full text-left border-collapse text-xs relative">
                        <thead className="sticky top-0 z-10 bg-[#F4F5FB]">
                            <tr className="border-b border-[#E4E8F0] text-[#9EA2B3] uppercase text-[10px] font-black tracking-wider">
                                <th className="py-3 px-3 bg-[#F4F5FB]">Img</th>
                                <th className="py-3 px-3 bg-[#F4F5FB]">Código</th>
                                <th className="py-3 px-3 bg-[#F4F5FB]">Nombre</th>
                                <th className="py-3 px-3 bg-[#F4F5FB]">Categoría</th>
                                <th className="py-3 px-3 bg-[#F4F5FB]">Precio</th>
                                <th className="py-3 px-3 bg-[#F4F5FB]">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5]">
                            {filteredProductos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-[#9EA2B3]">
                                        No hay productos agregados al bingo todavía.
                                    </td>
                                </tr>
                            ) : (
                                filteredProductos.map((prod) => (
                                    <tr key={prod.id} className="transition-colors hover:bg-[#FAFBFC]">
                                        {/* Imagen (Solo visualización) */}
                                        <td className="py-2 px-3 w-14">
                                            <div className="relative w-9 h-9 rounded-lg bg-[#F4F5FB] border border-[#E4E8F0] overflow-hidden flex items-center justify-center shadow-sm">
                                                {prod.portada ? (
                                                    <img src={prod.portada} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>🖼️</span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        {/* Código (Texto estático destacado) */}
                                        <td className="py-2 px-3 font-mono font-bold text-[#7C69EF]">
                                            {prod.codigo ?? "--"}
                                        </td>

                                        {/* Nombre (Texto estático) */}
                                        <td className="py-2 px-3 font-bold text-[#2D3142] min-w-[200px]">
                                            {prod.nombre ?? "--"}
                                        </td>

                                        {/* Categoría (Texto estático) */}
                                        <td className="py-2 px-3 text-[#6B7280]">
                                            {prod.categoria || "General"}
                                        </td>

                                        {/* Precio (Texto estático formateado) */}
                                        <td className="py-2 px-3 font-bold text-[#7C69EF]">
                                            ${Number(prod.precio || 0).toLocaleString()}
                                        </td>

                                        {/* Stock (Texto estático) */}
                                        <td className="py-2 px-3 font-bold text-[#2D3142]">
                                            {prod.stockactual ?? 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}