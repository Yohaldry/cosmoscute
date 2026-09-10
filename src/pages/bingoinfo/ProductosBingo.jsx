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
        <div className="flex flex-col h-full overflow-hidden p-4">
            {/* BARRA DE ACCIÓN */}
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

                <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 text-center">
                        🎯 Total en Bingo: <span className="font-bold">{filteredProductos.length}</span> / 100
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="bg-white text-[#7C69EF] hover:bg-slate-100 font-bold px-4 py-1.5 rounded-xl text-xs shadow transition-all flex items-center gap-1.5"
                    >
                        <span>➕</span> Nuevo en Bingo
                    </button>
                </div>
            </div>

            {/* TABLA DE PRODUCTOS */}
            <div className="bg-white border border-[#E4E8F0] rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 max-h-full">
                    <table className="w-full text-left border-collapse text-xs relative">
                        <thead className="sticky top-0 z-10 bg-[#F4F5FB]">
                            <tr className="border-b border-[#E4E8F0] text-[#9EA2B3] uppercase text-[10px] font-black tracking-wider">
                                <th className="py-3 px-4 bg-[#F4F5FB]">Código</th>
                                <th className="py-3 px-4 bg-[#F4F5FB]">Nombre</th>
                                <th className="py-3 px-4 bg-[#F4F5FB] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5]">
                            {filteredProductos.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-12 text-[#9EA2B3]">
                                        No hay productos independientes agregados al bingo todavía.
                                    </td>
                                </tr>
                            ) : (
                                filteredProductos.map((prod) => (
                                    <tr key={prod.id} className="transition-colors hover:bg-[#FAFBFC]">
                                        <td className="py-3 px-4 font-mono font-bold text-[#7C69EF] w-32">
                                            {String(prod.codigo ?? "--").padStart(2, '0')}
                                        </td>

                                        <td className="py-3 px-4 font-bold text-[#2D3142]">
                                            {prod.nombre ?? "--"}
                                        </td>

                                        <td className="py-3 px-4 text-right w-32">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(prod)}
                                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-[#7C69EF] transition-colors"
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
                                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
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
                </div>
            </div>

            {/* MODAL PARA CREAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E4E8F0] space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-xs font-black text-[#2D3142] uppercase tracking-wider flex items-center gap-2">
                                <span>🎯</span> {editingProduct ? "Editar Producto de Bingo" : "Registrar Producto en Bingo"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 mb-1">Seleccionar Código / Puesto (00 - 99) *</label>
                                <select
                                    value={codigoSeleccionado}
                                    onChange={(e) => setCodigoSeleccionado(e.target.value)}
                                    className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
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
                                <label className="block font-bold text-slate-600 mb-1">Nombre del producto *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Premio Especial Bingo"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
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
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E4E8F0] space-y-4 text-center">
                        <div className="text-3xl">⚠️</div>
                        <h4 className="font-bold text-slate-800 text-sm">¿Eliminar producto del bingo?</h4>
                        <p className="text-xs text-slate-500">
                            Estás a punto de eliminar el puesto <span className="font-bold text-[#7C69EF]">#{productToDelete?.codigo}</span> ({productToDelete?.nombre}). Esta acción no se puede deshacer.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleting(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
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