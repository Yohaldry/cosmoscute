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

    const [codigoSeleccionado, setCodigoSeleccionado] = useState("00");
    const [nombre, setNombre] = useState("");

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "productosBingo"), (snapshot) => {
            const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProductos(lista);
        }, (error) => {
            console.error("Error al escuchar productosBingo:", error);
        });
        return () => unsubscribe();
    }, []);

    const puestosDisponibles = useMemo(() => {
        const ocupados = new Set(
            productos
                .filter(p => editingProduct ? p.codigo !== editingProduct.codigo : true)
                .map(p => String(p.codigo).padStart(2, '0'))
        );
        const puestos = [];
        for (let i = 0; i <= 99; i++) {
            const codigoStr = String(i).padStart(2, '0');
            puestos.push({ codigo: codigoStr, ocupado: ocupados.has(codigoStr) });
        }
        return puestos;
    }, [productos, editingProduct]);

    const filteredProductos = useMemo(() => {
        return productos.filter(p => {
            const query = searchQuery.toLowerCase().trim();
            const nombreProd = (p.nombre || "").toLowerCase();
            const codigoProd = String(p.codigo || "").padStart(2, '0');
            const codigoNum = String(parseInt(p.codigo || 0, 10));
            return nombreProd.includes(query) || codigoProd.includes(query) || codigoNum.includes(query);
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
            const productoData = { codigo: codigoSeleccionado, nombre };
            if (editingProduct) {
                await updateDoc(doc(db, "productosBingo", editingProduct.id), productoData);
                if (triggerSuccessAlert) triggerSuccessAlert("¡Producto del bingo actualizado!");
            } else {
                await addDoc(collection(db, "productosBingo"), productoData);
                if (triggerSuccessAlert) triggerSuccessAlert("¡Producto registrado en el bingo!");
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;
        try {
            await deleteDoc(doc(db, "productosBingo", productToDelete.id));
            if (triggerSuccessAlert) triggerSuccessAlert("Producto eliminado del bingo.");
            setIsDeleting(false);
            setProductToDelete(null);
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-2 md:p-4 bg-gradient-to-br from-purple-50/40 via-white to-pink-50/30 text-xs">
            {/* BARRA SUPERIOR */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white px-3 py-2.5 rounded-2xl shadow-md gap-2 mb-3 shrink-0">
                <div className="relative w-full sm:max-w-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/80">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por código o nombre..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/20 text-white placeholder-white/80 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-white/30 focus:outline-none focus:bg-white/30 transition-all font-semibold shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                    <span className="font-bold bg-white/20 px-2.5 py-1.5 rounded-xl border border-white/30 backdrop-blur-xs">
                        🎯 Total: <strong className="text-white">{filteredProductos.length}</strong>/100
                    </span>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="bg-white text-[#7C69EF] hover:bg-purple-50 font-black px-3 py-1.5 rounded-xl shadow transition-all flex items-center gap-1 active:scale-95"
                    >
                        <span>✨</span> Nuevo
                    </button>
                </div>
            </div>

            {/* TABLA / CONTENEDOR */}
            <div className="bg-white/90 backdrop-blur-md border border-purple-100 rounded-2xl shadow-md flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 p-1">
                    {/* ESCRITORIO */}
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead className="sticky top-0 z-10 bg-purple-50/90 text-purple-700 uppercase text-[10px] font-black tracking-wider">
                            <tr className="border-b border-purple-100">
                                <th className="py-2.5 px-4 w-28">Puesto</th>
                                <th className="py-2.5 px-4">Nombre del Producto</th>
                                <th className="py-2.5 px-4 text-right w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                            {filteredProductos.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-10 text-slate-400 font-semibold">
                                        🛍️ No hay productos en el bingo todavía.
                                    </td>
                                </tr>
                            ) : (
                                filteredProductos.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-purple-50/40 transition-all">
                                        <td className="py-2 px-4 font-mono font-black text-[#7C69EF]">
                                            <span className="bg-purple-100/80 px-2 py-0.5 rounded-lg border border-purple-200/50">
                                                #{String(prod.codigo ?? "--").padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 font-extrabold text-slate-700">
                                            {prod.nombre ?? "--"}
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleOpenEdit(prod)} className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-[#7C69EF] text-purple-600 hover:text-white transition-all flex items-center justify-center shadow-2xs" title="Editar">✏️</button>
                                                <button onClick={() => { setProductToDelete(prod); setIsDeleting(true); }} className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white transition-all flex items-center justify-center shadow-2xs" title="Eliminar">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* MÓVIL */}
                    <div className="flex flex-col gap-1.5 md:hidden">
                        {filteredProductos.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 font-semibold">
                                🛍️ No hay productos en el bingo todavía.
                            </div>
                        ) : (
                            filteredProductos.map((prod) => (
                                <div key={prod.id} className="bg-white border border-purple-100/80 rounded-xl p-2.5 shadow-2xs flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-[#7C69EF] to-[#FF59B3] text-white font-black text-[11px] flex items-center justify-center font-mono shadow-xs">
                                            #{String(prod.codigo ?? "--").padStart(2, '0')}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-extrabold text-slate-800 truncate">{prod.nombre ?? "--"}</h4>
                                            <p className="text-[9px] font-bold text-purple-600">Puesto de Bingo 🌸</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleOpenEdit(prod)} className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">✏️</button>
                                        <button onClick={() => { setProductToDelete(prod); setIsDeleting(true); }} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shadow-2xs">🗑️</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl p-4 md:p-5 max-w-sm w-full shadow-xl border border-purple-100 space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                            <h3 className="font-black text-slate-800 uppercase flex items-center gap-1.5">
                                <span>🎯</span> {editingProduct ? "Editar Puesto" : "Registrar Puesto"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-6 h-6 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold flex items-center justify-center">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-3">
                            <div>
                                <label className="block font-extrabold text-slate-700 mb-1">Código / Puesto (00 - 99) *</label>
                                <select
                                    value={codigoSeleccionado}
                                    onChange={(e) => setCodigoSeleccionado(e.target.value)}
                                    className="w-full bg-purple-50/40 border border-purple-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none focus:border-[#7C69EF] transition-all shadow-inner"
                                    required
                                >
                                    {puestosDisponibles.map((p) => (
                                        <option key={p.codigo} value={p.codigo} disabled={p.ocupado}>
                                            Puesto {p.codigo} {p.ocupado ? "(Ocupado)" : "✨ (Libre)"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block font-extrabold text-slate-700 mb-1">Nombre del producto *</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Premio Especial"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full bg-purple-50/40 border border-purple-200 rounded-xl px-3 py-2 font-extrabold text-slate-700 focus:outline-none focus:border-[#7C69EF] transition-all shadow-inner"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" disabled={isUploading} className="bg-gradient-to-r from-[#7C69EF] to-[#FF59B3] text-white font-black px-4 py-1.5 rounded-xl shadow transition-all disabled:opacity-50">
                                    {isUploading ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleting && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-xl border border-rose-100 space-y-3 text-center">
                        <div className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl mx-auto flex items-center justify-center text-xl shadow-inner">⚠️</div>
                        <h4 className="font-black text-slate-800">¿Eliminar producto?</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">
                            Vas a eliminar el puesto <strong className="text-[#7C69EF]">#{productToDelete?.codigo}</strong> ({productToDelete?.nombre}).
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                            <button type="button" onClick={() => setIsDeleting(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl">Cancelar</button>
                            <button type="button" onClick={handleDeleteConfirm} className="bg-rose-500 hover:bg-rose-600 text-white font-black px-3.5 py-1.5 rounded-xl shadow">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}