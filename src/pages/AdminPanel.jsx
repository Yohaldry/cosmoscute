import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import ProductosBingo from "./bingoinfo/ProductosBingo";
import InventarioGeneral from "../pages/InventarioGeneral";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bingo-productos");
  const [subTab, setSubTab] = useState("productos");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [productos, setProductos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [categorias, setCategorias] = useState([]);

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

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: "", isMultiple: false });

  const triggerSuccessAlert = (message) => {
    setSuccessAlert({ isOpen: true, message });
    setTimeout(() => setSuccessAlert({ isOpen: false, message: "" }), 2000);
  };

  const triggerErrorAlert = (message) => {
    setErrorAlert({ isOpen: true, message });
    setTimeout(() => setErrorAlert({ isOpen: false, message: "" }), 3500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (authInput === "270523") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setAuthInput("");
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    setAuthInput("");
  };

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated]);

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

  // PANTALLA DE BLOQUEO / VALIDACIÓN DE IDENTIDAD OBLIGATORIA EN CADA CARGA
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F5FB] font-sans text-[10px]">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-[#E4E8F0] max-w-xs w-full space-y-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C69EF] to-[#9B8AFB] flex items-center justify-center text-white font-black text-sm mx-auto shadow-md shadow-[#7C69EF]/20">
            CT
          </div>
          <div className="space-y-1">
            <h1 className="text-xs font-black text-[#2D3142] uppercase tracking-wider">Acceso Restringido</h1>
            <p className="text-[10px] text-[#9EA2B3]">Ingresa la clave de seguridad para visualizar el panel.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={authInput}
              onChange={(e) => setAuthInput(e.target.value)}
              placeholder="Clave de acceso..."
              className={`w-full bg-[#F4F5FB] border ${authError ? 'border-rose-500' : 'border-[#E4E8F0]'} rounded-xl px-3 py-2 text-xs font-bold text-center text-[#2D3142] focus:outline-none focus:border-[#7C69EF]`}
              autoFocus
              required
            />
            {authError && (
              <p className="text-[9px] font-bold text-rose-500">Clave incorrecta. Intenta nuevamente.</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-[#7C69EF]/20 transition-all"
            >
              Verificar Identidad
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F5FB]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#7C69EF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[9px] font-bold text-[#7C69EF] tracking-tight uppercase">
            Carolina Torres
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F4F5FB] text-[#2D3142] overflow-hidden font-sans text-[10px]">
      
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden md:flex w-48 bg-white border-r border-[#E4E8F0] flex-col shrink-0 shadow-2xs justify-between">
        <div>
          <div className="p-3 border-b border-[#E4E8F0] flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#7C69EF] to-[#9B8AFB] flex items-center justify-center text-white font-black text-[10px]">
              CT
            </div>
            <div className="truncate">
              <h1 className="text-[10px] font-extrabold text-[#2D3142] tracking-tight truncate">Carolina Torres</h1>
              <p className="text-[7px] text-[#9EA2B3]">Admin</p>
            </div>
          </div>

          <div className="p-2 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("bingo-productos")}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                activeTab === "bingo-productos"
                  ? 'bg-[#7C69EF] text-white shadow-2xs'
                  : 'text-[#6E7387] hover:bg-[#F4F5FB]'
              }`}
            >
              <span>📦</span>
              <span>Bingo Productos</span>
            </button>

            <button
              onClick={() => setActiveTab("inventario-general")}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                activeTab === "inventario-general"
                  ? 'bg-[#7C69EF] text-white shadow-2xs'
                  : 'text-[#6E7387] hover:bg-[#F4F5FB]'
              }`}
            >
              <span>📋</span>
              <span>Inventario General</span>
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-[#E4E8F0]">
          <button
            onClick={handleLock}
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-1.5 px-2 rounded-md text-[9px] transition-all flex items-center justify-center gap-1"
          >
            <span>🔒</span> <span>Bloquear Panel</span>
          </button>
        </div>
      </aside>

      {/* MENÚ HAMBURGUESA MÓVIL */}
      <div 
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex md:hidden transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`w-60 bg-white h-full shadow-xl flex flex-col p-3 justify-between transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#7C69EF] to-[#9B8AFB] flex items-center justify-center text-white font-black text-[10px]">
                  CT
                </div>
                <div>
                  <h1 className="text-[10px] font-extrabold text-[#2D3142]">Carolina Torres</h1>
                  <p className="text-[7px] text-[#9EA2B3]">Admin</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#9EA2B3] text-xs font-bold p-1">✕</button>
            </div>

            <div className="flex flex-col gap-1.5 pt-2">
              <button
                onClick={() => { setActiveTab("bingo-productos"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === "bingo-productos" ? 'bg-[#7C69EF] text-white' : 'text-[#6E7387] bg-[#F4F5FB]'
                }`}
              >
                <span>📦</span>
                <span>Bingo Productos</span>
              </button>

              <button
                onClick={() => { setActiveTab("inventario-general"); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === "inventario-general" ? 'bg-[#7C69EF] text-white' : 'text-[#6E7387] bg-[#F4F5FB]'
                }`}
              >
                <span>📋</span>
                <span>Inventario General</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E4E8F0]">
            <button
              onClick={handleLock}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 px-2 rounded-md text-[9px] transition-all flex items-center justify-center gap-1"
            >
              <span>🔒</span> <span>Bloquear Panel</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* BARRA SUPERIOR MÓVIL */}
        <div className="flex md:hidden bg-white border-b border-[#E4E8F0] px-3 py-2 items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#7C69EF] to-[#9B8AFB] flex items-center justify-center text-white font-black text-[10px]">
              CT
            </div>
            <div>
              <h1 className="text-[10px] font-extrabold text-[#2D3142] leading-tight">Carolina Torres</h1>
              <p className="text-[7px] text-[#9EA2B3] leading-tight">Admin</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-[#F4F5FB] text-[#2D3142] text-xs font-black shadow-2xs border border-[#E4E8F0]"
          >
            ☰
          </button>
        </div>

        {/* HEADER */}
        <header className="h-9 md:h-11 bg-white border-b border-[#E4E8F0] px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] md:text-[11px] font-black text-[#2D3142] uppercase tracking-wider">
              {activeTab === "bingo-productos" ? "Bingo Productos" : "Inventario General"}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {activeTab === "bingo-productos" && subTab === "productos" ? (
              <button 
                onClick={() => setIsProductModalOpen(true)}
                className="bg-[#7C69EF] text-white px-2 py-1 rounded-md text-[9px] font-bold shadow-2xs flex items-center gap-0.5"
              >
                <span>+</span> <span>Nuevo</span>
              </button>
            ) : activeTab === "bingo-productos" && subTab === "categorias" ? (
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-[#7C69EF] text-white px-2 py-1 rounded-md text-[9px] font-bold shadow-2xs flex items-center gap-0.5"
              >
                <span>+</span> <span>Categoría</span>
              </button>
            ) : null}
          </div>
        </header>

        {/* CONTENEDOR */}
        <main className="flex-1 p-1.5 md:p-3 overflow-hidden flex flex-col">
          
          {activeTab === "bingo-productos" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs">
              
              <div className="px-2 py-1 border-b border-[#E4E8F0] flex items-center gap-1 bg-white shrink-0">
                <button
                  onClick={() => setSubTab("productos")}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                    subTab === "productos" ? 'bg-[#7C69EF] text-white' : 'bg-[#F4F5FB] text-[#9EA2B3]'
                  }`}
                >
                  📦 Productos ({productos.length})
                </button>
                <button
                  onClick={() => setSubTab("categorias")}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                    subTab === "categorias" ? 'bg-[#7C69EF] text-white' : 'bg-[#F4F5FB] text-[#9EA2B3]'
                  }`}
                >
                  🏷️ Categorías ({categorias.length})
                </button>
              </div>

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

              {subTab === "categorias" && (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="sticky top-0 z-10 bg-[#F4F5FB]">
                      <tr className="border-b border-[#E4E8F0] text-[#9EA2B3] uppercase text-[7px] font-black tracking-wider">
                        <th className="py-1.5 px-2">ID</th>
                        <th className="py-1.5 px-2">Nombre</th>
                        <th className="py-1.5 px-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5]">
                      {categorias.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-[#9EA2B3] text-[9px]">Sin categorías.</td>
                        </tr>
                      ) : (
                        categorias.map((cat) => (
                          <tr key={cat.id} className="hover:bg-[#FAFBFC]">
                            <td className="py-1.5 px-2 font-mono text-[8px] text-[#9EA2B3]">
                              {cat.id.substring(0, 5)}...
                            </td>
                            <td className="py-1.5 px-2 font-bold text-[#2D3142] text-[9px]">
                              {cat.nombre}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button 
                                type="button"
                                onClick={() => handleDeleteCategoryRequest(cat.id, cat.nombre)}
                                className="w-5 h-5 rounded bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white transition-all flex items-center justify-center mx-auto text-[9px]"
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

          {activeTab === "inventario-general" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs">
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

      {/* MODAL PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-2">
          <div className="bg-white rounded-lg max-w-xs w-full p-3 shadow-xl border border-[#E4E8F0] space-y-2">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-1.5">
              <h3 className="text-[10px] font-black text-[#2D3142]">Nuevo Producto</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-[#9EA2B3] text-[10px] font-bold">✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-1.5">
              <div>
                <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Código</label>
                <select 
                  value={prodCodigo} 
                  onChange={(e) => setProdCodigo(e.target.value)}
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded px-1.5 py-1 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  required
                >
                  <option value="">Selecciona código...</option>
                  {availableMissingCodes.map(code => (
                    <option key={code} value={code}>Código {code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Nombre</label>
                <input 
                  type="text" 
                  value={prodNombre} 
                  onChange={(e) => setProdNombre(e.target.value)}
                  placeholder="Ej. Silla..."
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded px-1.5 py-1 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  required
                />
              </div>
              <div>
                <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Categoría</label>
                <select 
                  value={prodCategoria} 
                  onChange={(e) => setProdCategoria(e.target.value)}
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded px-1.5 py-1 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                >
                  <option value="General">General</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Precio ($)</label>
                  <input 
                    type="number" 
                    value={prodPrecio} 
                    onChange={(e) => setProdPrecio(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded px-1.5 py-1 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Stock</label>
                  <input 
                    type="number" 
                    value={prodStockActual} 
                    onChange={(e) => setProdStockActual(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded px-1.5 py-1 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-1 pt-1 border-t border-[#E4E8F0]">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-2 py-1 rounded text-[9px] font-bold text-[#9EA2B3]">Cancelar</button>
                <button type="submit" className="px-2 py-1 rounded text-[9px] font-bold bg-[#7C69EF] text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-2">
          <div className="bg-white rounded-lg max-w-xs w-full p-3 shadow-xl border border-[#E4E8F0] space-y-2">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-1.5">
              <h3 className="text-[10px] font-black text-[#2D3142]">Nueva Categoría</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-[#9EA2B3] text-[10px] font-bold">✕</button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-1.5">
              <div>
                <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Nombre</label>
                <input 
                  type="text" 
                  value={catNombre} 
                  onChange={(e) => setCatNombre(e.target.value)}
                  placeholder="Ej. Hogar..."
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded px-1.5 py-1 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  required
                />
              </div>
              <div className="flex justify-end gap-1 pt-1 border-t border-[#E4E8F0]">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-2 py-1 rounded text-[9px] font-bold text-[#9EA2B3]">Cancelar</button>
                <button type="submit" className="px-2 py-1 rounded text-[9px] font-bold bg-[#7C69EF] text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-2">
          <div className="bg-white rounded-lg p-3 max-w-xs w-full shadow-xl border border-[#E4E8F0] space-y-2 text-center">
            <div className="w-7 h-7 bg-rose-50 text-rose-500 rounded-md flex items-center justify-center mx-auto text-xs font-black">⚠️</div>
            <div className="space-y-0.5">
              <h3 className="text-[10px] font-black text-[#2D3142]">¿Estás seguro?</h3>
              <p className="text-[9px] text-[#9EA2B3]">
                Vas a eliminar <span className="font-bold text-[#2D3142]">{deleteModal.name}</span>.
              </p>
            </div>
            <div className="flex gap-1 pt-1">
              <button type="button" onClick={() => setDeleteModal({ isOpen: false, type: null, id: null, name: "", isMultiple: false })} className="flex-1 bg-[#F4F5FB] text-[#2D3142] font-bold py-1 px-2 rounded text-[9px]">Cancelar</button>
              <button type="button" onClick={executeDelete} className="flex-1 bg-rose-600 text-white font-bold py-1 px-2 rounded text-[9px]">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTAS */}
      {successAlert.isOpen && (
        <div className="fixed bottom-2 right-2 z-50 bg-emerald-600 text-white px-2 py-1 rounded shadow-md flex items-center gap-1 text-[9px] font-bold">
          <span>✅</span> <span>{successAlert.message}</span>
        </div>
      )}
      {errorAlert.isOpen && (
        <div className="fixed bottom-2 right-2 z-50 bg-rose-600 text-white px-2 py-1 rounded shadow-md flex items-center gap-1 text-[9px] font-bold">
          <span>⚠️</span> <span>{errorAlert.message}</span>
        </div>
      )}
    </div>
  );
}