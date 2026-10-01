import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import ProductosBingo from "./bingoinfo/ProductosBingo";
import InventarioGeneral from "../pages/InventarioGeneral";
import Visitas from "./estadisticas_web/View"; 
import BannersPromociones from './bannerspromociones/BannersPromociones';
import { PanelDePedidos } from './Pedidos/PanelDePedidos';
import CargoyDescargo  from './cargoydescargo/CargoyDescargo';
import Movimientos from './movimientos/Movimientos';


export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState(false);
const [isSuccessAnim, setIsSuccessAnim] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bingo-productos");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isExpanded, setIsExpanded] = useState(false);
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
  
  // Estados para Categorías (Crear / Editar / Buscar)
  const [catNombre, setCatNombre] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  const filteredCategorias = useMemo(() => {
    if (!catSearch.trim()) return categorias;
    return categorias.filter(cat => 
      cat.nombre.toLowerCase().includes(catSearch.toLowerCase())
    );
  }, [categorias, catSearch]);

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

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catNombre.trim()) return;
    try {
      if (editingCategory) {
        await updateDoc(doc(db, "categorias", editingCategory.id), { nombre: catNombre });
        triggerSuccessAlert("Categoría actualizada con éxito");
      } else {
        await addDoc(collection(db, "categorias"), { nombre: catNombre });
        triggerSuccessAlert("Categoría creada con éxito");
      }
      setCatNombre("");
      setEditingCategory(null);
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      triggerErrorAlert("No se pudo guardar la categoría");
    }
  };

  const handleEditCategoryClick = (cat) => {
    setEditingCategory(cat);
    setCatNombre(cat.nombre);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCatNombre("");
  };

  const handleDeleteCategoryRequest = (id) => {
    const cat = categorias.find(c => c.id === id);
    setDeleteModal({
      isOpen: true,
      type: "categoria",
      id: id,
      name: cat?.nombre || "esta categoría",
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
      triggerErrorAlert("Error al eliminar el elemento");
    } finally {
      setDeleteModal({ isOpen: false, type: null, id: null, name: "", isMultiple: false });
    }
  };

  if (!isAuthenticated) {
    return (
     <div className="relative flex h-screen items-center justify-center bg-gradient-to-tr from-[#f3e8ff] via-[#e0e7ff] to-[#fce7f3] font-sans text-[10px] overflow-hidden select-none">
  
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
  <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>

  <div className={`relative bg-white/40 backdrop-blur-2xl p-7 rounded-3xl shadow-2xl shadow-purple-900/10 border border-white/60 max-w-xs w-full space-y-5 text-center transition-all duration-500 transform ${isSuccessAnim ? 'scale-105 shadow-pink-500/20 border-pink-300' : 'scale-100'}`}>
    
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] flex items-center justify-center text-white font-black text-xl mx-auto shadow-lg shadow-purple-500/30 transition-all duration-500 ${isSuccessAnim ? 'rotate-[360deg] scale-110 from-emerald-400 to-teal-500 shadow-emerald-500/30' : 'animate-bounce'}`}>
      {isSuccessAnim ? '✨' : '🌸'}
    </div>

    <div className="space-y-1.5">
      <h1 className="text-sm font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent uppercase tracking-wider">
        {isSuccessAnim ? "¡Acceso Concedido!" : "Cosmos Secure"}
      </h1>
      <p className="text-[10px] text-slate-600 font-medium">
        {isSuccessAnim ? "Entrando al universo de administración..." : "Ingresa tu clave secreta para continuar."}
      </p>
    </div>

    {isSuccessAnim ? (
      <div className="py-6 space-y-3 animate-fade-in">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-[11px] font-extrabold text-emerald-600 animate-pulse">Verificando estrellas... 🌟</p>
      </div>
    ) : (
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative group">
          <input
            type="password"
            value={authInput}
            onChange={(e) => setAuthInput(e.target.value)}
            placeholder="Escribe tu clave..."
            className={`w-full bg-white/50 backdrop-blur-md border-2 ${authError ? 'border-rose-400 bg-rose-50/40 animate-shake' : 'border-purple-100/60 group-hover:border-purple-300'} rounded-2xl px-4 py-3 text-xs font-bold text-center text-slate-700 tracking-widest focus:outline-none focus:border-[#7C69EF] focus:bg-white/80 transition-all shadow-inner`}
            autoFocus
            required
          />
          
          <div className="flex justify-center gap-1.5 mt-2">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < authInput.length 
                    ? 'w-4 bg-gradient-to-r from-[#7C69EF] to-[#FF59B3] shadow-xs' 
                    : 'w-1.5 bg-slate-300/60'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {authError && (
          <p className="text-[9px] font-bold text-rose-500 animate-bounce">❌ Clave incorrecta. ¡Inténtalo de nuevo!</p>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] hover:opacity-95 text-white font-extrabold py-3 rounded-2xl text-xs shadow-lg shadow-purple-500/20 transition-all transform active:scale-95"
        >
          🚀 Verificar Identidad
        </button>
      </form>
    )}

    <div className="pt-1 text-[8px] text-slate-500 font-semibold tracking-wide">
      Carolina Torres • Admin Panel 🌸
    </div>
  </div>
</div>
    );
  }

  if (isLoading) {
    return (
  <div className="relative flex h-screen items-center justify-center bg-gradient-to-tr from-[#f3e8ff] via-[#e0e7ff] to-[#fce7f3] font-sans text-[10px] overflow-hidden select-none">
  
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
  <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>

  <div className="relative bg-white/40 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl shadow-purple-900/10 border border-white/60 flex flex-col items-center gap-4 max-w-xs w-full mx-4 text-center transform transition-all animate-fade-in">
    
    <div className="relative w-14 h-14 flex items-center justify-center">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#7C69EF] to-[#FF59B3] opacity-40 blur-md animate-pulse"></div>
      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <div className="space-y-2 w-full">
      <h2 className="text-xs font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent uppercase tracking-widest animate-pulse">
        Cargando Universo
      </h2>
      
      <div className="w-full h-1 bg-purple-200/50 rounded-full overflow-hidden p-0.5">
        <div className="h-full bg-gradient-to-r from-[#7C69EF] to-[#FF59B3] rounded-full animate-[shimmer_2s_infinite]"></div>
      </div>

      <p className="text-[10px] text-slate-500 font-semibold tracking-wide pt-1">
        Carolina Torres <span className="text-pink-500">✨</span>
      </p>
    </div>

  </div>
</div>
    );
  }

  return (
    <div className="flex flex-1 flex-row h-screen bg-[#F4F5FB] text-[#2D3142] overflow-hidden font-sans text-[10px] relative">
      
      {/* SIDEBAR ESCRITORIO */}
    {/* SIDEBAR ESCRITORIO */}
      <aside 
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
        className={`hidden md:flex ${isSidebarCollapsed ? "w-20" : "w-60"} bg-white/90 backdrop-blur-md border-r border-purple-100/60 flex-col shrink-0 shadow-lg justify-between transition-all duration-300 ease-in-out relative z-10`}
      >
        <div>
        <div className="p-4 border-b border-purple-50 flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-3 truncate w-full">
              <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden shadow-md shadow-purple-500/25">
                <img 
                  src="https://res.cloudinary.com/dtkirmtfq/image/upload/v1784603746/CosmosCute/uyjhbf3bqmox7ovppbmn.png" 
                  alt="CosmosCute Logo" 
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <div className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}>
                <h1 className="text-[11px] font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent tracking-tight truncate">Carolina Torres</h1>
                <p className="text-[8px] font-bold text-pink-400">Cosmos Admin 🌸</p>
              </div>
            </div>
          </div>

          <div className="p-3 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("bingo-productos")}
              title="Bingo Productos"
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[11px] font-extrabold transition-all ${
                activeTab === "bingo-productos"
                  ? 'bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-700'
              }`}
            >
              <span className="text-base shrink-0">📦</span>
              <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "hidden" : "inline"}`}>Bingo Productos</span>
            </button>

            <button
              onClick={() => setActiveTab("inventario-general")}
              title="Inventario General"
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[11px] font-extrabold transition-all ${
                activeTab === "inventario-general"
                  ? 'bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-700'
              }`}
            >
              <span className="text-base shrink-0">📋</span>
              <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "hidden" : "inline"}`}>Inventario General</span>
            </button>

            {/* SECCIÓN CARGO Y DESCARGO */}
            <button
              onClick={() => setActiveTab("cargo-y-descargo")}
              title="Cargo y Descargo"
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[11px] font-extrabold transition-all ${
                activeTab === "cargo-y-descargo"
                  ? 'bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-700'
              }`}
            >
              <span className="text-base shrink-0">🔄</span>
              <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "hidden" : "inline"}`}>Cargo y Descargo</span>
            </button>

            <button
              onClick={() => setActiveTab("estadisticas")}
              title="Estadísticas"
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[11px] font-extrabold transition-all ${
                activeTab === "estadisticas"
                  ? 'bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-700'
              }`}
            >
              <span className="text-base shrink-0">📊</span>
              <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "hidden" : "inline"}`}>Estadísticas</span>
            </button>

            <button
              onClick={() => setActiveTab("banners-promociones")}
              title="Banners y Promociones"
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[11px] font-extrabold transition-all ${
                activeTab === "banners-promociones"
                  ? 'bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-700'
              }`}
            >
              <span className="text-base shrink-0">🖼️</span>
              <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "hidden" : "inline"}`}>Banners y Promociones</span>
            </button>

            <button
              onClick={() => setActiveTab("pedidos")}
              title="Pedidos"
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[11px] font-extrabold transition-all ${
                activeTab === "pedidos"
                  ? 'bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-700'
              }`}
            >
              <span className="text-base shrink-0">🛍️</span>
              <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "hidden" : "inline"}`}>Pedidos</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 border-t border-purple-50">
          <button
            onClick={handleLock}
            title="Bloquear Panel"
            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold py-2.5 px-3 rounded-2xl text-[10px] transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <span className="text-sm shrink-0">🔒</span> <span className={`truncate transition-opacity duration-200 ${isSidebarCollapsed ? "hidden" : "inline"}`}>Bloquear Panel</span>
          </button>
        </div>
      </aside>

      {/* MENÚ MÓVIL ESTÁTICO AL LADO (Z-50 y contenedor absoluto/relativo bien distribuido) */}
      <div className="md:hidden relative z-30 shrink-0">
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div 
          className={`absolute top-0 left-0 h-full z-50 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col justify-between p-3 transition-all duration-300 ease-in-out border-r border-purple-100 ${
            isMobileMenuOpen ? "w-64" : "w-16"
          }`}
          onClick={() => { if (!isMobileMenuOpen) setIsMobileMenuOpen(true); }}
        >
          <div>
            <div className={`flex items-center ${isMobileMenuOpen ? "justify-between" : "justify-center"} border-b border-purple-100/60 pb-3 mb-3`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-tr from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-500/25">
                  ✨
                </div>
                <div className={`transition-opacity duration-200 whitespace-nowrap ${isMobileMenuOpen ? "opacity-100" : "opacity-0 hidden"}`}>
                  <h1 className="text-xs font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent tracking-tight">Carolina Torres</h1>
                  <p className="text-[9px] font-bold text-pink-400">Cosmos Admin 🌸</p>
                </div>
              </div>
              {isMobileMenuOpen && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} 
                  className="w-6 h-6 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-full font-bold transition-all text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {[
                { id: "bingo-productos", label: "Bingo Productos", icon: "📦" },
                { id: "inventario-general", label: "Inventario General", icon: "📋" },
                { id: "cargo-y-descargo", label: "Cargo y Descargo", icon: "🔄" },
                { id: "estadisticas", label: "Estadísticas", icon: "📊" },
                { id: "banners-promociones", label: "Banners y Promociones", icon: "🖼️" },
                { id: "pedidos", label: "Pedidos", icon: "🛍️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => { 
                    e.stopPropagation();
                    setActiveTab(tab.id); 
                    setIsMobileMenuOpen(false); 
                  }}
                  title={tab.label}
                  className={`flex items-center gap-3.5 p-3 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-[#7C69EF] via-[#9B8AFB] to-[#FF59B3] text-white shadow-md shadow-purple-500/30' 
                      : 'text-slate-600 bg-purple-50/40 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  <span className="text-base shrink-0 w-6 text-center">{tab.icon}</span>
                  <span className={`transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 hidden"}`}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-purple-100/60">
            <button
              onClick={(e) => { e.stopPropagation(); handleLock(); }}
              title="Bloquear Panel"
              className={`w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold p-3 rounded-2xl text-xs transition-all flex items-center ${isMobileMenuOpen ? "justify-start gap-2" : "justify-center"}`}
            >
              <span className="text-sm shrink-0 w-6 text-center">🔒</span> 
              <span className={`transition-opacity duration-300 whitespace-nowrap ${isMobileMenuOpen ? "opacity-100" : "opacity-0 hidden"}`}>
                Bloquear Panel
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO CENTRAL (Empujado a la derecha en móvil gracias a ml-16 y en escritorio por flex) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden ml-16 md:ml-0">
        
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
              {activeTab === "bingo-productos" && "Bingo Productos"}
              {activeTab === "inventario-general" && "Inventario General"}
              {activeTab === "cargo-y-descargo" && "Cargo y Descargo"}
              {activeTab === "estadisticas" && "Estadísticas y Visitas"}
              {activeTab === "banners-promociones" && "Banners y Promociones"}
              {activeTab === "pedidos" && "Pedidos"}
            </h2>
          </div>
          {activeTab === "inventario-general" && (
            <button
              onClick={() => { setEditingCategory(null); setCatNombre(""); setCatSearch(""); setIsCategoryModalOpen(true); }}
              className="bg-gradient-to-r from-[#7C69EF] to-[#9B8AFB] hover:opacity-90 text-white font-extrabold px-3 py-1.5 rounded-xl text-[9px] shadow-md shadow-[#7C69EF]/20 transition-all flex items-center gap-1.5"
            >
              <span>🏷️</span> Gestionar Categorías
            </button>
          )}
        </header>

        {/* CONTENEDOR */}
        <main className="flex-1 p-1.5 md:p-3 overflow-hidden flex flex-col">
          
          {activeTab === "bingo-productos" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs p-2">
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
            </div>
          )}

          {activeTab === "inventario-general" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs">
              <InventarioGeneral 
                inventario={inventario}
                productosBingo={productos}
                categorias={categorias}
                availableMissingCodes={availableMissingCodes}
                onOpenCategoryModal={() => { setEditingCategory(null); setCatNombre(""); setCatSearch(""); setIsCategoryModalOpen(true); }}
                onDeleteCategory={handleDeleteCategoryRequest}
                triggerSuccessAlert={triggerSuccessAlert}
                triggerErrorAlert={triggerErrorAlert}
              />
            </div>
          )}

          {/* VISTA DE CARGO Y DESCARGO */}
          {activeTab === "cargo-y-descargo" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs">
              <CargoyDescargo 
                triggerSuccessAlert={triggerSuccessAlert}
                triggerErrorAlert={triggerErrorAlert}
              />
            </div>
          )}

          {activeTab === "banners-promociones" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs">
              <BannersPromociones 
                triggerSuccessAlert={triggerSuccessAlert}
                triggerErrorAlert={triggerErrorAlert}
              />
            </div>
          )}

          {activeTab === "pedidos" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs">
              <PanelDePedidos 
                triggerSuccessAlert={triggerSuccessAlert}
                triggerErrorAlert={triggerErrorAlert}
              />
            </div>
          )}

          {activeTab === "estadisticas" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-[#E4E8F0] rounded-lg shadow-2xs p-2">
              <div className="flex-1 flex flex-col overflow-hidden">
                <Visitas />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-2xl border border-[#E4E8F0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-2">
              <h3 className="text-xs font-black text-[#2D3142]">Nuevo Producto</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-[#9EA2B3] text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-2">
              <div>
                <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Código</label>
                <select 
                  value={prodCodigo} 
                  onChange={(e) => setProdCodigo(e.target.value)}
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-2 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
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
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-2 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  required
                />
              </div>
              <div>
                <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Categoría</label>
                <select 
                  value={prodCategoria} 
                  onChange={(e) => setProdCategoria(e.target.value)}
                  className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-2 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                >
                  <option value="General">General</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Precio ($)</label>
                  <input 
                    type="number" 
                    value={prodPrecio} 
                    onChange={(e) => setProdPrecio(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-2 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[7px] font-extrabold uppercase tracking-wider text-[#9EA2B3]">Stock</label>
                  <input 
                    type="number" 
                    value={prodStockActual} 
                    onChange={(e) => setProdStockActual(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl px-2 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] mt-0.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-1.5 pt-2 border-t border-[#E4E8F0]">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-3 py-1.5 rounded-xl text-[9px] font-bold text-[#9EA2B3] bg-[#F4F5FB]">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 rounded-xl text-[9px] font-bold bg-[#7C69EF] text-white shadow-md shadow-[#7C69EF]/20">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl border border-[#E4E8F0] space-y-3 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E4E8F0] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🏷️</span>
                <h3 className="text-xs font-black text-[#2D3142]">Gestión de Categorías</h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-[#9EA2B3] text-xs font-bold hover:text-[#2D3142]">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="bg-[#F4F5FB] p-3 rounded-xl border border-[#E4E8F0] space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[8px] font-extrabold uppercase tracking-wider text-[#7C69EF]">
                  {editingCategory ? "✏️ Editando Categoría" : "✨ Nueva Categoría"}
                </label>
                {editingCategory && (
                  <button type="button" onClick={handleCancelCategoryEdit} className="text-[8px] font-bold text-rose-500 hover:underline">
                    Cancelar edición
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  value={catNombre} 
                  onChange={(e) => setCatNombre(e.target.value)}
                  placeholder="Nombre de la categoría..."
                  className="flex-1 bg-white border border-[#E4E8F0] rounded-xl px-2.5 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
                  required
                />
                <button 
                  type="submit" 
                  className="bg-[#7C69EF] hover:bg-[#6c59db] text-white font-extrabold px-3 py-1.5 rounded-xl text-[9px] shadow-sm transition-all shrink-0"
                >
                  {editingCategory ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>

            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#9EA2B3]">🔍</span>
              <input 
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full bg-[#F4F5FB] border border-[#E4E8F0] rounded-xl pl-7 pr-3 py-1.5 text-[9px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-44">
              <p className="text-[8px] font-black uppercase tracking-wider text-[#9EA2B3] px-1">
                Resultados ({filteredCategorias.length} de {categorias.length})
              </p>
              {filteredCategorias.length === 0 ? (
                <div className="p-4 text-center text-[#9EA2B3] bg-[#F4F5FB]/50 rounded-xl text-[9px]">
                  {catSearch ? "No se encontraron categorías con ese nombre." : "No hay categorías registradas todavía."}
                </div>
              ) : (
                filteredCategorias.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between bg-white border border-[#E4E8F0] p-2 rounded-xl shadow-2xs hover:border-[#7C69EF]/50 transition-all">
                    <span className="text-[9px] font-bold text-[#2D3142] truncate max-w-[180px]">{cat.nombre}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => handleEditCategoryClick(cat)}
                        className="bg-[#7C69EF]/10 hover:bg-[#7C69EF]/20 text-[#7C69EF] font-bold px-2 py-1 rounded-lg text-[8px] transition-all"
                      >
                        Editar
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteCategoryRequest(cat.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded-lg text-[8px] transition-all"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E4E8F0]">
              <button 
                type="button" 
                onClick={() => setIsCategoryModalOpen(false)} 
                className="w-full bg-[#7C69EF] text-white font-extrabold py-2 rounded-xl text-[9px] shadow-md shadow-[#7C69EF]/20"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-2xl border border-[#E4E8F0] space-y-3 text-center">
            <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mx-auto text-xs font-black shadow-sm">⚠️</div>
            <div className="space-y-1">
              <h3 className="text-xs font-black text-[#2D3142]">¿Estás seguro?</h3>
              <p className="text-[9px] text-[#9EA2B3]">
                Vas a eliminar <span className="font-bold text-[#2D3142]">{deleteModal.name}</span>.
              </p>
            </div>
            <div className="flex gap-1.5 pt-1">
              <button type="button" onClick={() => setDeleteModal({ isOpen: false, type: null, id: null, name: "", isMultiple: false })} className="flex-1 bg-[#F4F5FB] text-[#2D3142] font-bold py-2 px-2 rounded-xl text-[9px]">Cancelar</button>
              <button type="button" onClick={executeDelete} className="flex-1 bg-rose-600 text-white font-bold py-2 px-2 rounded-xl text-[9px] shadow-md shadow-rose-600/20">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTAS */}
      {successAlert.isOpen && (
        <div className="fixed bottom-3 right-3 z-50 bg-emerald-600 text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-[9px] font-bold animate-bounce">
          <span>✅</span> <span>{successAlert.message}</span>
        </div>
      )}
      {errorAlert.isOpen && (
        <div className="fixed bottom-3 right-3 z-50 bg-rose-600 text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-[9px] font-bold">
          <span>⚠️</span> <span>{errorAlert.message}</span>
        </div>
      )}
    </div>
  );
}