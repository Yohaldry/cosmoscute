import React, { useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export default function InventarioGeneral({
  inventario,
  productosBingo,
  categorias,
  availableMissingCodes,
  triggerSuccessAlert,
  triggerErrorAlert
}) {
  // Estado para la barra de búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para el formulario de nuevo producto en inventario
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(categorias[0]?.nombre || "General");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [portada, setPortada] = useState("");

  // Control de selección múltiple con checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  // Control de edición en línea (Inline Editing)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", categoria: "", precio: 0, stockactual: 0 });

  // Modal de confirmación para eliminar
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "", isMultiple: false });

  // Modal del "Ojito" para ver detalles completos
  const [detailModal, setDetailModal] = useState({ isOpen: false, item: null });

  // Filtrado ultra seguro con React.memo para optimizar la búsqueda en tiempo real
  const filteredInventario = React.useMemo(() => {
    if (!Array.isArray(inventario)) return [];
    if (!searchTerm.trim()) return inventario;

    const term = searchTerm.toLowerCase().trim();

    return inventario.filter(item => {
      const nombre = (item.productos || item.nombre || "").toLowerCase();
      const categoria = (item.categoria || "").toLowerCase();
      const id = (item.id || "").toLowerCase();

      return nombre.includes(term) || categoria.includes(term) || id.includes(term);
    });
  }, [inventario, searchTerm]);

  // Manejar selección de todos los elementos filtrados
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredInventario.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Guardar nuevo producto en la colección "inventario" de Firebase
  const handleAddInventario = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      await addDoc(collection(db, "inventario"), {
        productos: nombre.trim(),
        categoria: categoria || "General",
        precio: Number(precio) || 0,
        udisponibles: String(stock) || "0",
        uingresadas: String(stock) || "0",
        uvendidas: "0",
        fentrada: new Date().toLocaleDateString('es-CO'),
        fsalida: "--",
        img: "",
        img1: "",
        portada: portada.trim() || ""
      });
      setNombre("");
      setPrecio("");
      setStock("");
      setPortada("");
      triggerSuccessAlert("¡Producto guardado en el Inventario General!");
    } catch (error) {
      console.error("Error al guardar en inventario:", error);
    }
  };

  // Activar modo edición en línea
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({
      nombre: item.productos || item.nombre || "",
      categoria: item.categoria || "General",
      precio: item.precio || 0,
      stockactual: item.udisponibles ?? item.stockactual ?? 0
    });
  };

  // Guardar cambios de edición en línea
  const saveEditing = async (id) => {
    try {
      const docRef = doc(db, "inventario", id);
      await updateDoc(docRef, {
        productos: editForm.nombre,
        categoria: editForm.categoria,
        precio: Number(editForm.precio) || 0,
        udisponibles: String(editForm.stockactual) || "0"
      });
      setEditingId(null);
      triggerSuccessAlert("¡Producto de inventario actualizado!");
    } catch (error) {
      console.error("Error al actualizar inventario:", error);
    }
  };

  // Sincronización Interactiva Individual con la Tabla de Bingo
  const handleToggleBingoStatus = async (item) => {
    const itemName = item.productos || item.nombre || "";
    const existingInBingo = productosBingo.find(
      p => (p.nombre || "").toLowerCase().trim() === itemName.toLowerCase().trim()
    );

    if (existingInBingo) {
      try {
        await deleteDoc(doc(db, "productos", existingInBingo.id));
        triggerSuccessAlert(`"${itemName}" fue retirado de la tabla bingo (Código [${existingInBingo.codigo}] liberado)`);
      } catch (error) {
        console.error("Error al quitar de bingo:", error);
      }
    } else {
      if (availableMissingCodes.length === 0) {
        triggerErrorAlert("⚠️ ¡La tabla bingo está llena (100/100)! Para agregar este producto, debes sacar algún producto de la tabla bingo primero.");
        return;
      }

      const assignedCode = availableMissingCodes[0];

      try {
        await addDoc(collection(db, "productos"), {
          codigo: assignedCode,
          nombre: itemName,
          categoria: item.categoria || "General",
          precio: Number(item.precio) || 0,
          stockactual: Number(item.udisponibles ?? item.stockactual ?? 0),
          portada: item.portada || ""
        });
        triggerSuccessAlert(`✨ ¡"${itemName}" agregado al Bingo con el código automático [${assignedCode}]!`);
      } catch (error) {
        console.error("Error al agregar al bingo:", error);
      }
    }
  };

  // Enviar múltiples productos seleccionados al Bingo de forma masiva
  const handleBatchAddToBingo = async () => {
    const itemsToProcess = inventario.filter(item => selectedIds.includes(item.id));
    const currentBingoNames = new Set(productosBingo.map(p => (p.nombre || "").toLowerCase().trim()));
    
    const itemsNotYetInBingo = itemsToProcess.filter(item => {
      const name = (item.productos || item.nombre || "").toLowerCase().trim();
      return !currentBingoNames.has(name);
    });

    if (itemsNotYetInBingo.length === 0) {
      triggerErrorAlert("⚠️ Todos los productos seleccionados ya se encuentran en la tabla de bingo.");
      return;
    }

    if (itemsNotYetInBingo.length > availableMissingCodes.length) {
      triggerErrorAlert(`⚠️ No hay suficientes espacios en el Bingo. Intentas agregar ${itemsNotYetInBingo.length} productos, pero solo quedan ${availableMissingCodes.length} cupos disponibles.`);
      return;
    }

    try {
      for (let i = 0; i < itemsNotYetInBingo.length; i++) {
        const item = itemsNotYetInBingo[i];
        const assignedCode = availableMissingCodes[i];
        const itemName = item.productos || item.nombre || "";

        await addDoc(collection(db, "productos"), {
          codigo: assignedCode,
          nombre: itemName,
          categoria: item.categoria || "General",
          precio: Number(item.precio) || 0,
          stockactual: Number(item.udisponibles ?? item.stockactual ?? 0),
          portada: item.portada || ""
        });
      }

      setSelectedIds([]);
      triggerSuccessAlert(`✨ ¡Se agregaron ${itemsNotYetInBingo.length} productos al Bingo exitosamente!`);
    } catch (error) {
      console.error("Error al agregar productos al bingo de forma masiva:", error);
      triggerErrorAlert("Hubo un error al procesar el envío masivo al bingo.");
    }
  };

  // Solicitar eliminación de inventario (individual o múltiple)
  const confirmDelete = (target, isMultiple = false) => {
    if (isMultiple) {
      setDeleteModal({ isOpen: true, id: target, name: `${target.length} productos seleccionados`, isMultiple: true });
    } else {
      const item = inventario.find(i => i.id === target);
      setDeleteModal({ isOpen: true, id: target, name: item?.productos || item?.nombre || "este producto", isMultiple: false });
    }
  };

  const executeDelete = async () => {
    try {
      if (deleteModal.isMultiple) {
        for (const id of deleteModal.id) {
          await deleteDoc(doc(db, "inventario", id));
        }
        setSelectedIds([]);
        triggerSuccessAlert("Productos seleccionados eliminados del inventario");
      } else {
        await deleteDoc(doc(db, "inventario", deleteModal.id));
        triggerSuccessAlert("Producto eliminado del inventario");
      }
    } catch (error) {
      console.error("Error al eliminar del inventario:", error);
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: "", isMultiple: false });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      
      {/* SECCIÓN SUPERIOR: FORMULARIO Y BARRA DE BÚSQUEDA */}
      <div className="p-4 border-b border-[#E4E8F0] bg-[#FAFBFC] space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="text-[11px] font-black text-[#2D3142] uppercase tracking-wider">
            Guardar Nuevo Producto en Inventario General
          </h3>
          
          {/* BARRA DE BÚSQUEDA */}
          <div className="w-full sm:w-72">
            <input 
              type="text"
              placeholder="🔍 Buscar por nombre, categoría o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] shadow-2xs"
            />
          </div>
        </div>

        <form onSubmit={handleAddInventario} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <input 
            type="text" 
            placeholder="Nombre del producto..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-white border border-[#E4E8F0] rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
            required
          />
          <select 
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-white border border-[#E4E8F0] rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          >
            <option value="General">General</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
          <input 
            type="number" 
            placeholder="Precio ($)"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="bg-white border border-[#E4E8F0] rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          />
          <input 
            type="number" 
            placeholder="Stock Actual"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="bg-white border border-[#E4E8F0] rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          />
          <button 
            type="submit"
            className="bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-sm shadow-[#7C69EF]/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>+</span> Guardar Producto
          </button>
        </form>

        <div className="flex justify-between items-center text-[10px] font-bold text-[#9EA2B3] pt-1">
          <span>Total en inventario: {(inventario || []).length} registros</span>
          {searchTerm && <span>Filtrados: {filteredInventario.length} resultados</span>}
        </div>
      </div>

      {/* BARRA DE ACCIÓN MÚLTIPLE */}
      {selectedIds.length > 0 && (
        <div className="bg-[#7C69EF]/10 px-5 py-2 border-b border-[#7C69EF]/20 flex items-center justify-between text-[11px] animate-fadeIn">
          <span className="font-bold text-[#7C69EF]">
            ✓ {selectedIds.length} producto(s) seleccionado(s)
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBatchAddToBingo}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-1 text-[11px]"
            >
              <span>🟢</span> Enviar seleccionados al Bingo
            </button>
            <button 
              onClick={() => confirmDelete(selectedIds, true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded-lg shadow-2xs transition-all flex items-center gap-1 text-[11px]"
            >
              <span>🗑️</span> Eliminar seleccionados
            </button>
          </div>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse text-[11px] relative">
          <thead className="sticky top-0 z-10 bg-[#F4F5FB]">
            <tr className="border-b border-[#E4E8F0] text-[#9EA2B3] uppercase text-[9px] font-black tracking-wider">
              <th className="py-2.5 px-2 bg-[#F4F5FB] w-8 text-center">
                <input 
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredInventario.length > 0 && selectedIds.length === filteredInventario.length}
                  className="rounded accent-[#7C69EF] cursor-pointer w-3.5 h-3.5"
                />
              </th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB]">ID Único</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB]">Producto</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB]">Categoría</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB]">Precio</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB]">Stock (Disp)</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB]">Ingresadas</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB]">Vendidas</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB] text-center">Estado en Bingo</th>
              <th className="py-2.5 px-2.5 bg-[#F4F5FB] text-center">Acciones / Sincronización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {filteredInventario.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-12 text-[#9EA2B3] text-[11px]">
                  No se encontraron productos coincidentes en el inventario.
                </td>
              </tr>
            ) : (
              filteredInventario.map((item) => {
                const itemName = item.productos || item.nombre || "";
                const isAssignedToBingo = productosBingo.find(
                  p => (p.nombre || "").toLowerCase().trim() === itemName.toLowerCase().trim()
                );
                const isSelected = selectedIds.includes(item.id);
                const isEditing = editingId === item.id;

                const rowStyle = isAssignedToBingo 
                  ? 'bg-emerald-50/70 hover:bg-emerald-50 border-l-3 border-l-emerald-500 shadow-2xs' 
                  : 'bg-white hover:bg-[#FAFBFC] border-l-3 border-l-transparent';

                return (
                  <tr key={item.id} className={`transition-all ${rowStyle}`}>
                    
                    <td className="py-2 px-2 text-center">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(item.id)}
                        className="rounded accent-[#7C69EF] cursor-pointer w-3.5 h-3.5"
                      />
                    </td>

                    <td className="py-2 px-2.5 font-mono text-[9px] text-[#9EA2B3]" title={item.id}>
                      {item.id.substring(0, 6)}...
                    </td>

                    <td className="py-2 px-2.5 font-bold text-[#2D3142]">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editForm.nombre}
                          onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-2 py-0.5 text-[11px] w-full font-bold text-[#2D3142] focus:outline-none"
                        />
                      ) : (
                        itemName
                      )}
                    </td>

                    <td className="py-2 px-2.5">
                      {isEditing ? (
                        <select 
                          value={editForm.categoria}
                          onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        >
                          <option value="General">General</option>
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="bg-[#F4F5FB] px-2 py-0.5 rounded-md text-[#6E7387] font-semibold text-[10px]">
                          {item.categoria || "General"}
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-2.5 font-extrabold text-[#2D3142]">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={editForm.precio}
                          onChange={(e) => setEditForm({...editForm, precio: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-1.5 py-0.5 text-[11px] w-16 font-bold"
                        />
                      ) : (
                        `$${Number(item.precio || 0).toLocaleString()}`
                      )}
                    </td>

                    <td className="py-2 px-2.5 font-bold text-[#6E7387]">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={editForm.stockactual}
                          onChange={(e) => setEditForm({...editForm, stockactual: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-1.5 py-0.5 text-[11px] w-14 font-bold"
                        />
                      ) : (
                        item.udisponibles ?? item.stockactual ?? 0
                      )}
                    </td>

                    <td className="py-2 px-2.5 font-medium text-slate-600">
                      {item.uingresadas ?? "0"}
                    </td>

                    <td className="py-2 px-2.5 font-medium text-slate-600">
                      {item.uvendidas ?? "0"}
                    </td>

                    {/* Estado Visual en Bingo con botones verde (en bingo) o rojo (fuera de bingo) */}
                    <td className="py-2 px-2.5 text-center">
                      {isAssignedToBingo ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide shadow-2xs">
                          <span>🟢</span> {isAssignedToBingo.codigo}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide shadow-2xs">
                          <span>🔴</span> —
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-2.5">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={() => saveEditing(item.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[10px] shadow-2xs"
                            >
                              OK
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setDetailModal({ isOpen: true, item })}
                              className="p-1 rounded-md bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white transition-all shadow-2xs"
                              title="Ver detalles completos"
                            >
                              👁️
                            </button>

                            <button
                              onClick={() => handleToggleBingoStatus(item)}
                              className={`px-2 py-0.5 rounded-lg font-black text-[9px] shadow-2xs transition-all ${
                                isAssignedToBingo
                                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300'
                                  : 'bg-[#7C69EF] hover:bg-[#6c59db] text-white'
                              }`}
                            >
                              {isAssignedToBingo ? "Quitar" : "+ Bingo"}
                            </button>

                            <button 
                              onClick={() => startEditing(item)}
                              className="p-1 rounded-md bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white transition-all shadow-2xs"
                              title="Editar"
                            >
                              ✏️
                            </button>

                            <button 
                              onClick={() => confirmDelete(item.id, false)}
                              className="p-1 rounded-md bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white transition-all shadow-2xs"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLES */}
      {detailModal.isOpen && detailModal.item && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-[#E4E8F0] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="text-xs font-black text-[#2D3142] uppercase tracking-wider flex items-center gap-1.5">
                <span>👁️</span> Detalle Completo
              </h3>
              <button 
                onClick={() => setDetailModal({ isOpen: false, item: null })}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                <div><span className="font-bold text-slate-500">Nombre:</span> <span className="text-[#2D3142] font-bold">{detailModal.item.productos || detailModal.item.nombre}</span></div>
                <div><span className="font-bold text-slate-500">Categoría:</span> <span className="text-[#2D3142] font-semibold">{detailModal.item.categoria || "General"}</span></div>
                <div><span className="font-bold text-slate-500">Precio:</span> <span className="text-[#2D3142] font-extrabold">${Number(detailModal.item.precio || 0).toLocaleString()}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F4F5FB] p-2.5 rounded-xl border border-[#E4E8F0]">
                  <span className="block font-bold text-slate-500 text-[9px] uppercase">Fecha de Entrada</span>
                  <span className="text-[#7C69EF] font-black text-xs">{detailModal.item.fentrada || "No registrada"}</span>
                </div>
                <div className="bg-[#F4F5FB] p-2.5 rounded-xl border border-[#E4E8F0]">
                  <span className="block font-bold text-slate-500 text-[9px] uppercase">Fecha de Salida</span>
                  <span className="text-amber-600 font-black text-xs">{detailModal.item.fsalida || "Pendiente / Activo"}</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button 
                onClick={() => setDetailModal({ isOpen: false, item: null })}
                className="w-full bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-md shadow-[#7C69EF]/20"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E4E8F0] space-y-3 text-center">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-lg font-black shadow-xs">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#2D3142]">¿Estás seguro?</h3>
              <p className="text-[11px] text-[#9EA2B3]">
                Estás a punto de eliminar <span className="font-bold text-[#2D3142]">{deleteModal.name}</span> del inventario general.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, id: null, name: "", isMultiple: false })}
                className="flex-1 bg-[#F4F5FB] hover:bg-[#E4E8F0] text-[#2D3142] font-bold py-2 px-3 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={executeDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-md shadow-rose-600/20"
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