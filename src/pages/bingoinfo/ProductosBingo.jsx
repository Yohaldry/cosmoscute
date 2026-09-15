import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";

export default function ProductosBingoContainer({ triggerSuccessAlert }) {
    const [productos, setProductos] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Estados exclusivos para código y nombre
    const [codigoSeleccionado, setCodigoSeleccionado] = useState("00");
    const [nombre, setNombre] = useState("");

    // Sincronización en tiempo real con la colección "productosBingo" de Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "productosBingo"), (snapshot) => {
            const lista = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProductos(lista);
        }, (error) => {
            console.error("Error al escuchar productosBingo:", error);
        });

        return () => unsubscribe();
    }, []);

    // Generar puestos disponibles del 00 al 99
    const puestosDisponibles = useMemo(() => {
        const ocupados = new Set(
            productos
                .filter(p => editingProduct ? p.codigo !== editingProduct.codigo : true)
                .map(p => String(p.codigo).padStart(2, '0'))
        );
        
        const puestos = [];
        for (let i = 0; i <= 99; i++) {
            const codigoStr = String(i).padStart(2, '0');
            puestos.push({
                codigo: codigoStr,
                ocupado: ocupados.has(codigoStr)
            });
        }
        return puestos;
    }, [productos, editingProduct]);

    // Filtrar productos del bingo por código o nombre
    const filteredProductos = useMemo(() => {
        return productos.filter(p => {
            const query = searchQuery.toLowerCase().trim();
            const nombreProd = (p.nombre || "").toLowerCase();
            const codigoProd = String(p.codigo || "").padStart(2, '0');
            const codigoNum = String(parseInt(p.codigo || 0, 10));

            return nombreProd.includes(query) || 
                   codigoProd.includes(query) || 
                   codigoNum.includes(query);
        }).sort((a, b) => parseInt(a.codigo || 0, 10) - parseInt(b.codigo || 0, 10));
    }, [productos, searchQuery]);

    const handleOpenCreate = () => {
        setEditingProduct(null);
        const primerLibre = puestosDisponibles.find(p => !p.ocupado);
        setCodigoSeleccionado(primerLibre ? primerLibre.codigo : "00");
        setNombre("");
        setIsModalOpen(true);
    };

    const handleOpenEdit = (prod) => {
        setEditingProduct(prod);
        setCodigoSeleccionado(String(prod.codigo ?? "00").padStart(2, '0'));
        setNombre(prod.nombre || "");
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            const productoData = {
                codigo: codigoSeleccionado,
                nombre: nombre
            };

            if (editingProduct) {
                const docRef = doc(db, "productosBingo", editingProduct.id);
                await updateDoc(docRef, productoData);
                if (triggerSuccessAlert) triggerSuccessAlert("¡Producto del bingo actualizado con éxito!");
            } else {
                await addDoc(collection(db, "productosBingo"), productoData);
                if (triggerSuccessAlert) triggerSuccessAlert("¡Producto registrado en el bingo exitosamente!");
            }

            setIsModalOpen(false);
        } catch (error) {
            console.error("Error al guardar producto del bingo:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;
        try {
            await deleteDoc(doc(db, "productosBingo", productToDelete.id));
            if (triggerSuccessAlert) triggerSuccessAlert("Producto eliminado del bingo correctamente.");
            setIsDeleting(false);
            setProductToDelete(null);
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-3 md:p-6 bg-gradient-to-br from-purple-50/40 via-white to-pink-50/30">
            {/* BARRA DE ACCIÓN SUPERIOR (Estilo Cosmos Cute) */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white p-4 rounded-3xl shadow-xl shadow-purple-500/15 gap-3.5 mb-5 shrink-0 border border-purple-200/40">
                <div className="relative flex-1 max-w-sm">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/80 text-xs">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por código o nombre..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/20 text-white placeholder-white/80 text-xs rounded-2xl pl-9 pr-4 py-2.5 border border-white/30 focus:outline-none focus:bg-white/30 focus:ring-2 focus:ring-white/50 transition-all font-semibold shadow-inner"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
                    <div className="text-xs font-black bg-white/20 px-3.5 py-2.5 rounded-2xl border border-white/30 text-center backdrop-blur-xs shadow-xs">
                        🎯 Total en Bingo: <span className="font-black text-white">{filteredProductos.length}</span> / 100
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="bg-white text-[#7C69EF] hover:bg-purple-50 font-black px-5 py-2.5 rounded-2xl text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-95"
                    >
                        <span className="text-sm">✨</span> Nuevo en Bingo
                    </button>
                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL DE DATOS */}
            <div className="bg-white/90 backdrop-blur-md border border-purple-100 rounded-3xl shadow-xl shadow-purple-500/5 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 max-h-full p-2 md:p-0">
                    
                    {/* VISTA DE ESCRITORIO (TABLA ELEGANTE) */}
                    <table className="w-full text-left border-collapse text-xs relative hidden md:table">
                        <thead className="sticky top-0 z-10 bg-purple-50/80 backdrop-blur-md">
                            <tr className="border-b border-purple-100 text-purple-700 uppercase text-[11px] font-black tracking-wider">
                                <th className="py-4 px-6">Código / Puesto</th>
                                <th className="py-4 px-6">Nombre del Producto</th>
                                <th className="py-4 px-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                            {filteredProductos.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-16 text-slate-400 font-semibold text-xs">
                                        <div className="text-3xl mb-2">🛍️</div>
                                        No hay productos independientes agregados al bingo todavía.
                                    </td>
                                </tr>
                            ) : (
                                filteredProductos.map((prod) => (
                                    <tr key={prod.id} className="transition-all hover:bg-purple-50/40 group">
                                        <td className="py-4 px-6 font-mono font-black text-[#7C69EF] w-40">
                                            <span className="inline-flex items-center justify-center bg-purple-100/80 text-purple-700 px-3 py-1 rounded-xl text-xs shadow-2xs border border-purple-200/50">
                                                #{String(prod.codigo ?? "--").padStart(2, '0')}
                                            </span>
                                        </td>

                                        <td className="py-4 px-6 font-extrabold text-slate-700 text-sm">
                                            {prod.nombre ?? "--"}
                                        </td>

                                        <td className="py-4 px-6 text-right w-36">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(prod)}
                                                    className="w-9 h-9 rounded-xl bg-purple-50 hover:bg-[#7C69EF] text-purple-600 hover:text-white transition-all flex items-center justify-center shadow-2xs hover:shadow-md"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProductToDelete(prod);
                                                        setIsDeleting(true);
                                                    }}
                                                    className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex items-center justify-center shadow-2xs hover:shadow-md"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* VISTA MÓVIL (TARJETAS ESTILO RAPPI / COSMOS CUTE) */}
                    <div className="flex flex-col gap-2.5 md:hidden p-1">
                        {filteredProductos.length === 0 ? (
                            <div className="text-center py-16 text-slate-400 font-semibold text-xs">
                                <div className="text-3xl mb-2">🛍️</div>
                                No hay productos independientes agregados al bingo todavía.
                            </div>
                        ) : (
                            filteredProductos.map((prod) => (
                                <div 
                                    key={prod.id} 
                                    className="bg-white border border-purple-100/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 active:scale-[0.99] transition-all"
                                >
                                    <div className="flex items-center gap-3.5 overflow-hidden">
                                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-[#7C69EF] to-[#FF59B3] text-white font-black text-xs flex items-center justify-center shadow-md shadow-purple-500/20 font-mono">
                                            #{String(prod.codigo ?? "--").padStart(2, '0')}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-extrabold text-slate-800 text-xs truncate">{prod.nombre ?? "--"}</h4>
                                            <p className="text-[10px] font-bold text-purple-600 mt-0.5">Puesto de Bingo 🌸</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(prod)}
                                            className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs shadow-2xs active:scale-90 transition-all"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProductToDelete(prod);
                                                setIsDeleting(true);
                                            }}
                                            className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-xs shadow-2xs active:scale-90 transition-all"
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>

            {/* MODAL PARA CREAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl border border-purple-100 space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-purple-100 pb-3.5">
                            <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <span className="text-base">🎯</span> {editingProduct ? "Editar Producto de Bingo" : "Registrar Producto en Bingo"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-xs flex items-center justify-center transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-extrabold text-slate-700 mb-1.5">Seleccionar Código / Puesto (00 - 99) *</label>
                                <select
                                    value={codigoSeleccionado}
                                    onChange={(e) => setCodigoSeleccionado(e.target.value)}
                                    className="w-full bg-purple-50/40 border border-purple-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#7C69EF] focus:ring-2 focus:ring-purple-300/40 transition-all shadow-inner"
                                    required
                                >
                                    {puestosDisponibles.map((p) => (
                                        <option key={p.codigo} value={p.codigo} disabled={p.ocupado}>
                                            Puesto {p.codigo} {p.ocupado ? "(Ocupado)" : "✨ (Disponible)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-extrabold text-slate-700 mb-1.5">Nombre del producto *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Premio Especial Bingo"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full bg-purple-50/40 border border-purple-200 rounded-2xl px-4 py-3 text-xs font-extrabold text-slate-700 focus:outline-none focus:border-[#7C69EF] focus:ring-2 focus:ring-purple-300/40 transition-all shadow-inner"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="bg-gradient-to-r from-[#7C69EF] to-[#FF59B3] hover:opacity-95 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-md shadow-purple-500/30 transition-all disabled:opacity-50"
                                >
                                    {isUploading ? "Guardando..." : "Guardar en Bingo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ALERTA DE ELIMINACIÓN */}
            {isDeleting && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-7 max-w-sm w-full shadow-2xl border border-rose-100 space-y-4 text-center">
                        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner">
                            ⚠️
                        </div>
                        <h4 className="font-black text-slate-800 text-sm">¿Eliminar producto del bingo?</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Estás a punto de eliminar el puesto <span className="font-black text-[#7C69EF]">#{productToDelete?.codigo}</span> ({productToDelete?.nombre}). Esta acción no se puede deshacer.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleting(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="bg-rose-500 hover:bg-rose-600 text-white font-black px-5 py-2.5 rounded-2xl text-xs shadow-md shadow-rose-500/30 transition-all"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}