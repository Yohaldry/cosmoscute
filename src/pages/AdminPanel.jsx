import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import ProductosBingo from "./bingoinfo/ProductosBingo";
import InventarioGeneral from "../pages/InventarioGeneral";

export default function AdminPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bingo-productos");
  const [subTab, setSubTab] = useState("productos"); // "productos" o "categorias"

  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Estados para Modales de Creación
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [prodNombre, setProdNombre] = useState("");
  const [prodCodigo, setProdCodigo] = useState("");
  const [prodCategoria, setProdCategoria] = useState("General");
  const [prodPrecio, setProdPrecio] = useState("");
  const [prodStockActual, setProdStockActual] = useState("");
  const [prodPortada, setProdPortada] = useState("");
  
  const [catNombre, setCatNombre] = useState("");
  const [successAlert, setSuccessAlert] = useState({ isOpen: false, message: "" });
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: "" });

  // Modal de confirmación genérico para eliminación
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: "", isMultiple: false });

  const triggerSuccessAlert = (message) => {
    setSuccessAlert({ isOpen: true, message });
    setTimeout(() => {
      setSuccessAlert({ isOpen: false, message: "" });
    }, 2000);
  };

  const triggerErrorAlert = (message) => {
    setErrorAlert({ isOpen: true, message });
    setTimeout(() => {
      setErrorAlert({ isOpen: false, message: "" });
    }, 3500);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    const unsubProd = onSnapshot(collection(db, "productos"), (snapshot) => {
      setProductos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubInv = onSnapshot(collection(db, "inventario"), (snapshot) => {
      setInventario(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCat = onSnapshot(collection(db, "categorias"), (snapshot) => {
      setCategorias(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      clearTimeout(timer);
      unsubProd();
      unsubInv();
      unsubCat();
    };
  }, []);

  // Códigos disponibles (00 al 99)
  const availableMissingCodes = useMemo(() => {
    const existingCodes = new Set(productos.map(p => String(p.codigo).padStart(2, '0')));
    const missing = [];
    for (let i = 0; i < 100; i++) {
      const codeStr = String(i).padStart(2, '0');
      if (!existingCodes.has(codeStr)) {
        missing.push(codeStr);
      }
    }
    return missing;
  }, [productos]);

  // Funciones de Base de Datos para Productos
  const handleUpdateProduct = async (id, updatedFields) => {
    try {
      const docRef = doc(db, "productos", id);
      await updateDoc(docRef, updatedFields);
      triggerSuccessAlert("Producto actualizado");
    } catch (error) {
      console.error("Error actualizando producto:", error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "productos"), {
        codigo: String(prodCodigo).padStart(2, '0'),
        nombre: prodNombre,
        categoria: prodCategoria,
        precio: Number(prodPrecio) || 0,
        stockactual: Number(prodStockActual) || 0,
        portada: prodPortada || ""
      });
      setIsProductModalOpen(false);
      setProdNombre("");
      setProdCodigo("");
      setProdPrecio("");
      setProdStockActual("");
      setProdPortada("");
      triggerSuccessAlert("Producto creado con éxito");
    } catch (error) {
      console.error("Error al crear producto:", error);
    }
  };

  const handleDeleteProductRequest = (target, isMultiple = false) => {
    if (isMultiple) {
      setDeleteModal({
        isOpen: true,
        type: "productos-multi",
        id: target,
        name: `${target.length} productos seleccionados`,
        isMultiple: true
      });
    } else {
      const prod = productos.find(p => p.id === target);
      setDeleteModal({
        isOpen: true,
        type: "producto",
        id: target,
        name: prod?.nombre || "este producto",
        isMultiple: false
      });
    }
  };

  // Funciones para Categorías
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "categorias"), { nombre: catNombre });
      setIsCategoryModalOpen(false);
      setCatNombre("");
      triggerSuccessAlert("Categoría creada con éxito");
    } catch (error) {
      console.error("Error al crear categoría:", error);
    }
  };

  const handleDeleteCategoryRequest = (id, name) => {
    setDeleteModal({
      isOpen: true,
      type: "categoria",
      id: id,
      name: name,
      isMultiple: false
    });
  };

  const executeDelete = async () => {
    try {
      if (deleteModal.type === "producto") {
        await deleteDoc(doc(db, "productos", deleteModal.id));
        triggerSuccessAlert("Producto eliminado");
      } else if (deleteModal.type === "productos-multi") {
        for (const id of deleteModal.id) {
          await deleteDoc(doc(db, "productos", id));
        }
        triggerSuccessAlert("Productos seleccionados eliminados");
      } else if (deleteModal.type === "categoria") {
        await deleteDoc(doc(db, "categorias", deleteModal.id));
        triggerSuccessAlert("Categoría eliminada");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setDeleteModal({ isOpen: false, type: null, id: null, name: "", isMultiple: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F5FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-[#7C69EF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-extrabold text-[#7C69EF] tracking-wider uppercase">
            Bienvenida, Carolina Torres
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4F5FB] text-[#2D3142] overflow-hidden font-sans">
      
      {/* SIDEBAR LATERAL TONOS CLAROS */}
      <aside className="w-64 bg-white border-r border-[#E4E8F0] flex flex-col shrink-0 shadow-sm">
        <div className="p-6 border-b border-[#E4E8F0] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C69EF] to-[#9B8AFB] flex items-center justify-center shadow-md shadow-[#7C69EF]/20 text-white font-black text-base">
            BP
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-[#2D3142] tracking-wide">Carolina Torres</h1>
            <p className="text-[10px] text-[#9EA2B3] font-medium">Gestión y Control</p>
          </div>
        </div>

        <div className="px-4 py-6 flex-1 space-y-1.5">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-[#9EA2B3] mb-2">Menú Principal</p>
          
          <button
            onClick={() => setActiveTab("bingo-productos")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "bingo-productos"
                ? 'bg-[#7C69EF] text-white shadow-md shadow-[#7C69EF]/25'
                : 'text-[#6E7387] hover:bg-[#F4F5FB] hover:text-[#2D3142]'
            }`}
          >
            <span className="text-base">📦</span>
            <span>Bingo Productos</span>
          </button>

          <button
            onClick={() => setActiveTab("inventario-general")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "inventario-general"
                ? 'bg-[#7C69EF] text-white shadow-md shadow-[#7C69EF]/25'
                : 'text-[#6E7387] hover:bg-[#F4F5FB] hover:text-[#2D3142]'
            }`}
          >
            <span className="text-base">📋</span>
            <span>Inventario General</span>
          </button>
        </div>

        <div className="p-4 border-t border-[#E4E8F0] text-[10px] text-[#9EA2B3] text-center">
          Admin Dashboard v2.0
        </div>
      </aside>

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white/80 backdrop-blur border-b border-[#E4E8F0] px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h2 className="text-sm font-black text-[#2D3142] uppercase tracking-wider">
              Panel de Control
            </h2>
            <p className="text-xs text-[#9EA2B3]">
              Administracion del Sistema
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* Botones de acción */}
            {activeTab === "bingo-productos" && subTab === "productos" ? (
              <button 
                onClick={() => setIsProductModalOpen(true)}
                className="bg-[#7C69EF] hover:bg-[#6c59db] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#7C69EF]/20 transition-all flex items-center gap-2"
              >
                <span>+</span> Nuevo Producto
              </button>
            ) : activeTab === "bingo-productos" && subTab === "categorias" ? (
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-[#7C69EF] hover:bg-[#6c59db] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#7C69EF]/20 transition-all flex items-center gap-2"
              >
                <span>+</span> Nueva Categoría
              </button>
            ) : null}

            {/* Perfil de Carolina en la esquina */}
            <div className="flex items-center gap-3 pl-5 border-l border-[#E4E8F0]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-extrabold text-[#2D3142]">Carolina Torres</p>
                <p className="text-[10px] font-medium text-[#9EA2B3]">Administradora</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#7C69EF] to-[#9B8AFB] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#7C69EF]/20">
                CT
              </div>
            </div>
          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL */}
        <main className="flex-1 p-8 overflow-hidden flex flex-col">
          
          {/* SECCIÓN BINGO PRODUCTOS */}
          {activeTab === "bingo-productos" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-2xl shadow-sm">
              
              {/* BARRA DE PESTAÑAS INTERNA */}
              <div className="px-6 py-4 border-b border-[#E4E8F0] flex items-center gap-3 bg-white shrink-0">
                <button
                  onClick={() => setSubTab("productos")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    subTab === "productos"
                      ? 'bg-[#7C69EF] text-white shadow-md shadow-[#7C69EF]/20'
                      : 'bg-[#F4F5FB] text-[#9EA2B3] hover:text-[#2D3142]'
                  }`}
                >
                  📦 Productos ({productos.length})
                </button>
                <button
                  onClick={() => setSubTab("categorias")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    subTab === "categorias"
                      ? 'bg-[#7C69EF] text-white shadow-md shadow-[#7C69EF]/20'
                      : 'bg-[#F4F5FB] text-[#9EA2B3] hover:text-[#2D3142]'
                  }`}
                >
                  🏷️ Categorías ({categorias.length})
                </button>
              </div>

              {/* VISTA DE PRODUCTOS */}
              {subTab === "productos" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ProductosBingo 
                    productos={productos}
                    categorias={categorias}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenProductModal={() => setIsProductModalOpen(true)}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProductRequest}
                    triggerSuccessAlert={triggerSuccessAlert}
                  />
                </div>
              )}

              {/* VISTA DE CATEGORÍAS */}
              {subTab === "categorias" && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  <table className="w-full text-left border-collapse text-xs relative">
                    <thead className="sticky top-0 z-10 bg-[#F4F5FB]">
                      <tr className="border-b border-[#E4E8F0] text-[#9EA2B3] uppercase text-[10px] font-black tracking-wider">
                        <th className="py-4 px-6 bg-[#F4F5FB]">ID / Registro</th>
                        <th className="py-4 px-6 bg-[#F4F5FB]">Nombre de la Categoría</th>
                        <th className="py-4 px-6 bg-[#F4F5FB] text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5]">
                      {categorias.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-12 text-[#9EA2B3]">No se encontraron categorías registradas.</td>
                        </tr>
                      ) : (
                        categorias.map((cat) => (
                          <tr key={cat.id} className="hover:bg-[#FAFBFC] transition-colors">
                            <td className="py-4 px-6 font-mono text-[10px] text-[#9EA2B3]">
                              {cat.id.substring(0, 8)}...
                            </td>
                            <td className="py-4 px-6 font-bold text-[#2D3142]">
                              {cat.nombre}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                type="button"
                                onClick={() => handleDeleteCategoryRequest(cat.id, cat.nombre)}
                                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white transition-all flex items-center justify-center mx-auto shadow-xs"
                                title="Eliminar categoría"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* SECCIÓN INVENTARIO GENERAL */}
          {activeTab === "inventario-general" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-2xl shadow-sm">
              <InventarioGeneral 
                inventario={inventario}
                productosBingo={productos}
                categorias={categorias}
                availableMissingCodes={availableMissingCodes}
                triggerSuccessAlert={triggerSuccessAlert}
                triggerErrorAlert={triggerErrorAlert}
              />
            </div>
          )}

        </main>
      </div>

      {/* MODAL NUEVO PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E4E8F0] space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-4">
              <h3 className="text-base font-black text-[#2D3142]">Nuevo Producto de Bingo</h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#9EA2B3] hover:text-[#2D3142] text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Código Disponible (00 - 99)</label>
                <select 
                  value={prodCodigo} 
                  onChange={(e) => setProdCodigo(e.target.value)}
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-1"
                  required
                >
                  <option value="">Selecciona un código vacío...</option>
                  {availableMissingCodes.map(code => (
                    <option key={code} value={code}>
                      Código {code} {code === availableMissingCodes[0] ? '(Sugerido)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Nombre del Producto</label>
                <input 
                  type="text" 
                  value={prodNombre} 
                  onChange={(e) => setProdNombre(e.target.value)}
                  placeholder="Ej. Silla Rimax, Licuadora..."
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Categoría</label>
                <select 
                  value={prodCategoria} 
                  onChange={(e) => setProdCategoria(e.target.value)}
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-1"
                >
                  <option value="General">General</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Precio ($)</label>
                  <input 
                    type="number" 
                    value={prodPrecio} 
                    onChange={(e) => setProdPrecio(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Stock Actual</label>
                  <input 
                    type="number" 
                    value={prodStockActual} 
                    onChange={(e) => setProdStockActual(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#E4E8F0]">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9EA2B3] hover:bg-[#F4F5FB] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7C69EF] text-white shadow-md shadow-[#7C69EF]/20 hover:bg-[#6c59db] transition-all"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA CATEGORÍA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E4E8F0] space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-4">
              <h3 className="text-base font-black text-[#2D3142]">Nueva Categoría</h3>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#9EA2B3] hover:text-[#2D3142] text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Nombre de la Categoría</label>
                <input 
                  type="text" 
                  value={catNombre} 
                  onChange={(e) => setCatNombre(e.target.value)}
                  placeholder="Ej. Electrodomésticos, Hogar..."
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-1"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#E4E8F0]">
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9EA2B3] hover:bg-[#F4F5FB] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7C69EF] text-white shadow-md shadow-[#7C69EF]/20 hover:bg-[#6c59db] transition-all"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E4E8F0] space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-xl font-black shadow-xs">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#2D3142]">¿Estás seguro?</h3>
              <p className="text-xs text-[#9EA2B3]">
                Estás a punto de eliminar <span className="font-bold text-[#2D3142]">{deleteModal.name}</span>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 pt-3">
              <button 
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: null, id: null, name: "", isMultiple: false })}
                className="flex-1 bg-[#F4F5FB] hover:bg-[#E4E8F0] text-[#2D3142] font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={executeDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-rose-600/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTA FLOTANTE DE ÉXITO */}
      {successAlert.isOpen && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce border border-emerald-500/30">
          <span>✅</span>
          <span>{successAlert.message}</span>
        </div>
      )}

      {/* ALERTA FLOTANTE DE ERROR / ADVERTENCIA */}
      {errorAlert.isOpen && (
        <div className="fixed bottom-5 right-5 z-50 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-bounce border border-rose-500/30">
          <span>⚠️</span>
          <span>{errorAlert.message}</span>
        </div>
      )}
    </div>
  );
}