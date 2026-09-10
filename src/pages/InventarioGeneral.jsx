import React, { useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db, storage } from "../firebase"; // O la ruta de tu archivo de configuración
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [isUploading, setIsUploading] = useState(false);
  
  const [proveedor, setProveedor] = useState("");

  // Estado para controlar la apertura/cierre del Modal de "Nuevo Producto"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [porcentajeGanancia, setPorcentajeGanancia] = useState(50);


const [descripcion, setDescripcion] = useState("");
const [estado, setEstado] = useState(true);

  // Estados para el formulario del modal de nuevo producto
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(categorias[0]?.nombre || "General");
  const [costo, setCosto] = useState("");
  const [stock, setStock] = useState("");
  const [portada, setPortada] = useState("");

  const [fileImg, setFileImg] = useState(null);
  const [fileImg1, setFileImg1] = useState(null);
  const [detailImgIndex, setDetailImgIndex] = useState(0);

  // Estados para el Modal de Edición Completa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemData, setEditingItemData] = useState(null);
  const [editFileImg, setEditFileImg] = useState(null);
  const [editFileImg1, setEditFileImg1] = useState(null);

  const [precioManual, setPrecioManual] = useState("");

  // Control de selección múltiple con checkboxes
  const [selectedIds, setSelectedIds] = useState([]);

  // Control de edición en línea (Inline Editing)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", categoria: "", costo: 0, stockactual: 0 });

  // Modal de confirmación para eliminar
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "", isMultiple: false });

  // Modal del "Ojito" para ver detalles completos
  const [detailModal, setDetailModal] = useState({ isOpen: false, item: null });

  // Cálculo automático del precio en tiempo real para el formulario modal
const costoNum = parseFloat(costo) || 0;
const porcentajeNum = Number(porcentajeGanancia) || 0;

// Fórmula comercial de margen sobre venta (del 10% hasta el 95%)
const calculatedNewPrecio = costoNum > 0 && porcentajeNum < 100 
  ? Math.round(costoNum / (1 - (porcentajeNum / 100))) 
  : 0;
  // Filtrado ultra seguro con React.memo para optimizar la búsqueda en tiempo real
  const filteredInventario = React.useMemo(() => {
    if (!Array.isArray(inventario)) return [];
    if (!searchTerm.trim()) return inventario;

    const term = searchTerm.toLowerCase().trim();

    return inventario.filter(item => {
      const nombreItem = (item.nombre || item.productos || "").toLowerCase();
      const categoriaItem = (item.categoria || "").toLowerCase();
      const id = (item.id || "").toLowerCase();

      return nombreItem.includes(term) || categoriaItem.includes(term) || id.includes(term);
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

  const handleToggleEstadoDirecto = async (item) => {
  try {
    // Calculamos el estado actual real
    const isActivoActual = 
      item.estado === true || 
      item.activo === true || 
      String(item.estado || "").toLowerCase() === "activo" || 
      String(item.estado || "").toLowerCase() === "true" || 
      item.estado === 1;

    // Invertimos el valor para guardarlo al contrario
    const nuevoEstado = !isActivoActual;

    const productoRef = doc(db, "inventario", item.id);
    await updateDoc(productoRef, { estado: nuevoEstado });
    
    // Si no usas onSnapshot y necesitas refrescar localmente, puedes actualizar tu estado aquí
  } catch (error) {
    console.error("Error al cambiar estado directo:", error);
  }
};

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Guardar nuevo producto en la colección "inventario" de Firebase con validación de campos llenos
const handleAddInventario = async (e) => {
  e.preventDefault();
  setIsUploading(true);

  try {
    // Función auxiliar para convertir un archivo a Base64
   const convertirABase64 = (archivo) => {
  return new Promise((resolve) => {
    // Si viene vacío, retornamos vacío
    if (!archivo) return resolve("");
    
    // Si ya es un texto (como un Base64 o URL), lo devolvemos directo sin rompernos
    if (typeof archivo === 'string') {
      return resolve(archivo);
    }
    
    // Si es un archivo real (Blob o File), lo leemos con seguridad
    if (archivo instanceof Blob || archivo instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("");
    } else {
      resolve("");
    }
  });
};

    // Convertimos ambas imágenes a Base64 si el usuario las seleccionó
    const imgBase64 = await convertirABase64(fileImg);
    const img1Base64 = await convertirABase64(fileImg1);

    const costoNum = Number(costo) || 0;
    const stockNum = Number(stock) || 0;
    let precioFinalParaGuardar = 0;

    if (costoNum === 0) {
      precioFinalParaGuardar = Number(precioManual) || 0;
    } else {
      const porc = Number(porcentajeGanancia) || 50;
      const divisor = 1 - (porc / 100);
      precioFinalParaGuardar = divisor > 0 ? Math.round(costoNum / divisor) : costoNum;
    }

    const nuevoProducto = {
      nombre: nombre,
      proveedor: proveedor,
      descripcion: descripcion,
      categoria: categoria,
      stock: stockNum,
      udisponibles: stockNum,
      uingresadas: stockNum,
      costo: costoNum,
      precio: precioFinalParaGuardar,
      porcentajeGanancia: porcentajeGanancia,
      estado: estado,
      fentrada: new Date().toLocaleDateString(),
      fsalida: "--",
      img: fileImg || "",  
      img1: fileImg1 || ""
    };

    await addDoc(collection(db, "inventario"), nuevoProducto);

    // Limpiar formulario y cerrar modal
    setIsAddModalOpen(false);
    setNombre("");
    setProveedor("");
    setDescripcion("");
    setStock("");
    setCosto("");
    setPrecioManual("");
    setFileImg(null);
    setFileImg1(null);

  } catch (error) {
    console.error("Error al registrar el producto:", error);
  } finally {
    setIsUploading(false);
  }
};

  // Abrir Modal de Edición Completa
const startEditing = (item) => {
    // Determinamos de forma infalible si está activo (sea true, 1 o texto "activo")
    const isActivo = 
      item.estado === true || 
      String(item.estado || "").toLowerCase() === "activo" || 
      String(item.estado || "").toLowerCase() === "true" || 
      item.estado === 1;

    setEditingItemData({
      ...item,
      costo: item.costo || "",
      udisponibles: item.udisponibles ?? item.stockactual ?? "",
      // Guardamos directamente un booleano limpio (true o false)
      estado: isActivo 
    });
    setEditFileImg(null);
    setEditFileImg1(null);
    setIsEditModalOpen(true);
  };

  // Guardar cambios desde el Modal de Edición Completa con compresión de imágenes
const handleUpdateInventario = async (e) => {
  e.preventDefault();
  setIsUploading(true);

  try {
    const costoNum = Number(editingItemData.costo) || 0;
    let precioFinalParaGuardar = 0;

    // Si el costo es 0, respetamos el precio manual que ingresó el usuario
    if (costoNum === 0) {
      precioFinalParaGuardar = Number(editingItemData.precio) || 0;
    } else {
      // Si tiene costo, se calcula automáticamente con el margen de venta
      const porc = Number(editingItemData.porcentajeGanancia) || 50;
      const divisor = 1 - (porc / 100);
      precioFinalParaGuardar = divisor > 0 ? Math.round(costoNum / divisor) : costoNum;
    }

    // Convertimos el estado de texto ("Activo" / "Inactivo") a booleano (true / false) para Firestore
    const estadoBooleano = 
      editingItemData.estado === true || 
      String(editingItemData.estado).toLowerCase() === "activo" || 
      String(editingItemData.estado).toLowerCase() === "true" || 
      editingItemData.estado === 1;

    // Objeto limpio con los datos que se enviarán a Firebase Firestore
    const datosActualizados = {
      nombre: editingItemData.nombre,
      proveedor: editingItemData.proveedor,
      categoria: editingItemData.categoria || "General",
      udisponibles: Number(editingItemData.udisponibles) || 0,
      descripcion: editingItemData.descripcion || "",
      costo: costoNum,
      porcentajeGanancia: costoNum === 0 ? 0 : Number(editingItemData.porcentajeGanancia),
      precio: precioFinalParaGuardar,
      estado: estadoBooleano, // <--- Guardado limpiamente como true o false
      // Si seleccionaste una foto nueva la usa, de lo contrario mantiene la existente
      img: editFileImg ? editFileImg : (editingItemData.img || ""),
      img1: editFileImg1 ? editFileImg1 : (editingItemData.img1 || "")
    };

    const productoRef = doc(db, "inventario", editingItemData.id);
    await updateDoc(productoRef, datosActualizados);

    setIsEditModalOpen(false);
    
    // Limpiamos los estados temporales de los inputs de edición de fotos
    if (typeof setEditFileImg === 'function') setEditFileImg(null);
    if (typeof setEditFileImg1 === 'function') setEditFileImg1(null);

    // Opcional: recargar tu lista de inventario si no usas onSnapshot
  } catch (error) {
    console.error("Error al actualizar producto:", error);
  } finally {
    setIsUploading(false);
  }
};
  // Guardar cambios de edición en línea (Fallback por compatibilidad)
  const saveEditing = async (id) => {
    try {
      const costoNum = Number(editForm.costo) || 0;
      const precioCalculado = costoNum / 0.50;

      const docRef = doc(db, "inventario", id);
      await updateDoc(docRef, {
        nombre: editForm.nombre,
        categoria: editForm.categoria,
        costo: String(costoNum),
        precio: precioCalculado,
        udisponibles: String(editForm.stockactual) || "0"
      });
      setEditingId(null);
      triggerSuccessAlert("¡Producto de inventario actualizado!");
    } catch (error) {
      console.error("Error al actualizar inventario:", error);
      triggerErrorAlert("Error al actualizar el producto.");
    }
  };

  

  // Enviar múltiples productos seleccionados al Bingo de forma masiva
 

  // Solicitar eliminación de inventario (individual o múltiple)
  const confirmDelete = (target, isMultiple = false) => {
    if (isMultiple) {
      // Validar si alguno de los seleccionados existe en el bingo
      const hayEnBingo = target.some(id => {
        const item = inventario.find(i => i.id === id);
        if (!item) return false;
        const itemName = (item.nombre || item.productos || "").toLowerCase().trim();
        const bingoItem = productosBingo.find(
          p => (p.nombre || "").toLowerCase().trim() === itemName
        );
        return !!bingoItem; // Retorna true si existe en el bingo
      });

      if (hayEnBingo) {
        triggerErrorAlert("Primero saca el producto del bingo");
        return; // Frena totalmente
      }

      setDeleteModal({ isOpen: true, id: target, name: `${target.length} productos seleccionados`, isMultiple: true });
    } else {
      const item = inventario.find(i => i.id === target);
      if (!item) return;

      const itemName = (item.nombre || item.productos || "").toLowerCase().trim();
      const bingoItem = productosBingo.find(
        p => (p.nombre || "").toLowerCase().trim() === itemName
      );

      // 👉 REGLA ESTRICTA: Si el producto está registrado en el bingo, se bloquea la eliminación
      if (bingoItem) {
        triggerErrorAlert("Primero saca el producto del bingo");
        return; // Frena y no abre el modal
      }

      setDeleteModal({ isOpen: true, id: target, name: item?.nombre || item?.productos || "este producto", isMultiple: false });
    }
  };

 const executeDelete = async () => {
    try {
      if (deleteModal.isMultiple) {
        // Eliminar múltiples en Firestore
        for (const id of deleteModal.id) {
          await deleteDoc(doc(db, "inventario", id));
        }
        
        // 👉 ACTUALIZAR EL ESTADO LOCAL DE LA TABLA (MÚLTIPLE)
        setInventario(prevInventario => prevInventario.filter(item => !deleteModal.id.includes(item.id)));
        
        setSelectedIds([]);
        triggerSuccessAlert("Productos seleccionados eliminados del inventario");
      } else {
        // Eliminar individual en Firestore
        await deleteDoc(doc(db, "inventario", deleteModal.id));
        
        // 👉 ACTUALIZAR EL ESTADO LOCAL DE LA TABLA (INDIVIDUAL)
        setInventario(prevInventario => prevInventario.filter(item => item.id !== deleteModal.id));
        
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
      
      {/* SECCIÓN SUPERIOR: BOTÓN DE APERTURA DE MODAL Y BARRA DE BÚSQUEDA */}
      <div className="p-4 border-b border-[#E4E8F0] bg-[#FAFBFC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-[#7C69EF]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="text-sm font-black">+</span> Guardar Nuevo Producto
          </button>
          <div className="text-[10px] font-bold text-[#9EA2B3]">
            Total registros: {(inventario || []).length}
          </div>
        </div>
          
        {/* BARRA DE BÚSQUEDA */}
        <div className="w-full sm:w-80">
          <input 
            type="text"
            placeholder="🔍 Buscar por nombre, categoría o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-[11px] font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF] shadow-2xs"
          />
        </div>
      </div>

      {/* BARRA DE ACCIÓN MÚLTIPLE */}
     {selectedIds.length > 0 && (
  <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-xl my-3 text-xs shadow-lg">
    <span>{selectedIds.length} productos seleccionados</span>
    
    <div className="flex items-center gap-2">
      {/* Botón exclusivo para eliminar varios al tiempo */}
      <button
        type="button"
        onClick={() => confirmDelete(selectedIds, true)} // O tu función para eliminar múltiples IDs
        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg transition-all"
      >
        🗑️ Eliminar seleccionados ({selectedIds.length})
      </button>
    </div>
  </div>
)}

      {/* TABLA PRINCIPAL */}
     <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left border-collapse text-[10px] sm:text-[11px] relative whitespace-nowrap sm:whitespace-normal">
          <thead className="sticky top-0 z-10 bg-[#F4F5FB]">
            <tr className="border-b border-[#E4E8F0] text-[#9EA2B3] uppercase text-[8px] sm:text-[9px] font-black tracking-wider">
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2 bg-[#F4F5FB] w-6 sm:w-8 text-center">
                <input 
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={filteredInventario.length > 0 && selectedIds.length === filteredInventario.length}
                  className="rounded accent-[#7C69EF] cursor-pointer w-3 h-3 sm:w-3.5 sm:h-3.5"
                />
              </th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">ID Único</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">Producto</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">Categoría</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">Costo</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">Precio</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">Stock (Disp)</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">Ingresadas</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB]">Vendidas</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB] text-center">Estado</th>
              <th className="py-2 px-1.5 sm:py-2.5 sm:px-2.5 bg-[#F4F5FB] text-center">Acciones / Sincronización</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2F5]">
            {filteredInventario.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-12 text-[#9EA2B3] text-[11px]">
                  No se encontraron productos coincidentes en el inventario.
                </td>
              </tr>
            ) : (
              filteredInventario.map((item) => {
                const itemName = item.nombre || item.productos || "";
                
             

                const isSelected = selectedIds.includes(item.id);
                const isEditing = editingId === item.id;

                // Verificamos si el estado en el item es explícitamente "Activo" o equivalente, o si deseas usar la propiedad real del objeto item (ej. item.estado)
const isActivo = item.estado === true || item.activo === true || String(item.estado || "").toLowerCase() === "activo" || String(item.estado || "").toLowerCase() === "true" || item.estado === 1 || item.activo === 1;
                const rowStyle = isActivo 
                  ? 'bg-emerald-50/70 hover:bg-emerald-50 border-l-3 border-l-emerald-500 shadow-2xs' 
                  : 'bg-white hover:bg-[#FAFBFC] border-l-3 border-l-transparent';

                const editCostoNum = Number(editForm.costo) || 0;
                const editPrecioCalculado = editCostoNum / 0.50;

                return (
                  <tr key={item.id} className={`transition-all ${rowStyle}`}>
                    
                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2 text-center">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(item.id)}
                        className="rounded accent-[#7C69EF] cursor-pointer w-3 h-3 sm:w-3.5 sm:h-3.5"
                      />
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 font-mono text-[8px] sm:text-[9px] text-[#9EA2B3]" title={item.id}>
                      {item.id ? `${item.id.substring(0, 6)}...` : 'N/A'}
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 font-bold text-[#2D3142]">
                      {isEditing ? (
                        <input 
                          type="text"
                          value={editForm.nombre}
                          onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] w-full font-bold text-[#2D3142] focus:outline-none"
                        />
                      ) : (
                        itemName
                      )}
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5">
                      {isEditing ? (
                        <select 
                          value={editForm.categoria}
                          onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-1 py-0.5 text-[9px] sm:text-[10px] font-bold"
                        >
                          <option value="General">General</option>
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="bg-[#F4F5FB] px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md text-[#6E7387] font-semibold text-[9px] sm:text-[10px]">
                          {item.categoria || "General"}
                        </span>
                      )}
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 font-bold text-[#2D3142]">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={editForm.costo}
                          onChange={(e) => setEditForm({...editForm, costo: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-1 py-0.5 text-[10px] sm:text-[11px] w-16 sm:w-20 font-bold"
                        />
                      ) : (
                        `$${Number(item.costo || 0).toLocaleString()}`
                      )}
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 font-extrabold text-[#7C69EF]">
                      {isEditing ? (
                        <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 text-[10px] sm:text-[11px] font-bold inline-block" title="Calculado automáticamente: Costo / 0.50">
                          ${editPrecioCalculado.toLocaleString()}
                        </span>
                      ) : (
                        `$${Number(item.precio || 0).toLocaleString()}`
                      )}
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 font-bold text-[#6E7387]">
                      {isEditing ? (
                        <input 
                          type="number"
                          value={editForm.stockactual}
                          onChange={(e) => setEditForm({...editForm, stockactual: e.target.value})}
                          className="bg-white border border-[#7C69EF] rounded-md px-1 py-0.5 text-[10px] sm:text-[11px] w-12 sm:w-14 font-bold"
                        />
                      ) : (
                        item.udisponibles ?? item.stockactual ?? 0
                      )}
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 font-medium text-slate-600">
                      {item.uingresadas ?? "0"}
                    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 font-medium text-slate-600">
                      {item.uvendidas ?? "0"}
                    </td>

               <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5 text-center">
      <button
        type="button"
        onClick={() => handleToggleEstadoDirecto(item)}
        title="Haz clic para cambiar estado"
        className="transition-transform active:scale-95 focus:outline-none"
      >
        {isActivo ? (
          <span className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide shadow-2xs cursor-pointer transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Activo 🔄
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-rose-100 hover:bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide shadow-2xs cursor-pointer transition-colors">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Inactivo 🔄
          </span>
        )}
      </button>
    </td>

                    <td className="py-1.5 px-1.5 sm:py-2 sm:px-2.5">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => saveEditing(item.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[9px] sm:text-[10px] shadow-2xs"
                            >
                              OK
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[9px] sm:text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDetailModal({ isOpen: true, item })}
                              className="p-1 rounded-md bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white transition-all shadow-2xs"
                              title="Ver detalles completos"
                            >
                              👁️
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
                          </div>
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

      {/* MODAL PARA AGREGAR NUEVO PRODUCTO */}
      {isAddModalOpen && (
     <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E4E8F0] space-y-4 my-auto transition-all duration-300 ease-out transform scale-100 opacity-100">  <div className="flex items-center justify-between border-b pb-3">
      <h3 className="text-xs font-black text-[#2D3142] uppercase tracking-wider flex items-center gap-2">
        <span>📦</span> Registrar Nuevo Producto en Inventario
      </h3>
      <button
        type="button"
        onClick={() => setIsAddModalOpen(false)}
        className="text-slate-400 hover:text-slate-700 font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100"
      >
        ✕
      </button>
    </div>

    <form onSubmit={handleAddInventario} className="space-y-3 text-xs">
      <div>
        <label className="block font-bold text-slate-600 mb-1">Nombre del producto *</label>
        <input
          type="text"
          placeholder="Ej. Cartón de Bingo Premium"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          required
        />
      </div>

      <div>
        <label className="block font-bold text-slate-600 mb-1">Proveedor *</label>
        <input
          type="text"
          placeholder="Ej. Proveedor Principal S.A.S."
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          required
        />
      </div>

      {/* Nuevo campo: Descripción */}
      <div>
        <label className="block font-bold text-slate-600 mb-1">Descripción</label>
        <input
          type="text"
          placeholder="Ej. bueno producto"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-slate-600 mb-1">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          >
            <option value="General">General</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-600 mb-1">Stock Inicial *</label>
          <input
            type="number"
            placeholder="Ej. 50"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block font-bold text-slate-600 mb-1">Costo ($) *</label>
          <input
            type="number"
            placeholder="Ej. 10000"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
            required
          />
        </div>
        <div>
          <label className="block font-bold text-slate-600 mb-1">% Margen Venta</label>
          <select
            value={porcentajeGanancia}
            onChange={(e) => setPorcentajeGanancia(Number(e.target.value))}
            disabled={Number(costo) === 0}
            className={`w-full rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:border-[#7C69EF] ${
              Number(costo) === 0 
                ? "bg-slate-100 border border-[#E4E8F0] text-slate-400 cursor-not-allowed" 
                : "bg-white border border-[#E4E8F0] text-[#2D3142]"
            }`}
          >
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 95].map((p) => (
              <option key={p} value={p}>{p}%</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-600 mb-1" title="Precio final del producto">Precio Final *</label>
          <input
            type={Number(costo) === 0 ? "number" : "text"}
            placeholder={Number(costo) === 0 ? "Ej. 15000" : undefined}
            value={Number(costo) === 0 ? precioManual : (calculatedNewPrecio ? `$${calculatedNewPrecio.toLocaleString()}` : "$0")}
            disabled={Number(costo) !== 0}
            onChange={(e) => {
              if (Number(costo) === 0) {
                setPrecioManual(e.target.value);
              }
            }}
            className={`w-full rounded-xl px-3 py-2 text-xs font-bold ${
              Number(costo) === 0 
                ? "bg-white border border-[#E4E8F0] text-[#2D3142] focus:outline-none focus:border-[#7C69EF]" 
                : "bg-slate-100 border border-[#E4E8F0] text-slate-500 cursor-not-allowed"
            }`}
            required={Number(costo) === 0}
          />
        </div>
      </div>

      {/* Botón interactivo de Estado (Encendido / Apagado) y Fecha de entrada automática */}
      <div className="grid grid-cols-2 gap-3 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div>
          <label className="block font-bold text-slate-700 text-[11px] mb-1">Estado del Producto</label>
          <button
            type="button"
            onClick={() => setEstado(!estado)}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5 ${
              estado 
                ? "bg-emerald-500 text-white shadow-sm" 
                : "bg-rose-500 text-white shadow-sm"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${estado ? "bg-white animate-pulse" : "bg-white/60"}`}></span>
            {estado ? "🟢 Activo (Encendido)" : "🔴 Inactivo (Apagado)"}
          </button>
        </div>
        <div>
          <label className="block font-bold text-slate-700 text-[11px] mb-1">Fecha de Entrada (Automática)</label>
          <input
            type="text"
            disabled
            value={new Date().toLocaleDateString()}
            className="w-full bg-slate-200/70 border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 cursor-not-allowed"
          />
        </div>
      </div>

     <div className="grid grid-cols-2 gap-3 pt-1">
  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
    <label className="block font-bold text-slate-700 text-[11px]">Foto Principal (img) *</label>
    <input 
      type="file" 
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 500; // Reducimos tamaño para asegurar <1MB
            let w = img.width, h = img.height;
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
            else { if (h > MAX) { w *= MAX / h; h = MAX; } }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            setFileImg(canvas.toDataURL('image/jpeg', 0.5)); // Calidad 0.5
          };
        };
        reader.readAsDataURL(file);
      }}
      className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#7C69EF]/10 file:text-[#7C69EF]"
      required
    />
  </div>
  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
    <label className="block font-bold text-slate-700 text-[11px]">Segunda Foto (img1)</label>
    <input 
      type="file" 
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 500;
            let w = img.width, h = img.height;
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
            else { if (h > MAX) { w *= MAX / h; h = MAX; } }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            setFileImg1(canvas.toDataURL('image/jpeg', 0.5));
          };
        };
        reader.readAsDataURL(file);
      }}
      className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#7C69EF]/10 file:text-[#7C69EF]"
    />
  </div>
</div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(false)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-[#7C69EF]/20 transition-all disabled:opacity-50"
        >
          {isUploading ? "Subiendo fotos y guardando..." : "Guardar Producto"}
        </button>
      </div>
    </form>
  </div>
</div>
      )}

      {/* MODAL PARA EDITAR PRODUCTO */}
      {isEditModalOpen && editingItemData && (
  <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E4E8F0] space-y-4 animate-fadeIn max-h-[90vh] overflow-y-auto">
    <div className="flex items-center justify-between border-b pb-3">
      <h3 className="text-xs font-black text-[#2D3142] uppercase tracking-wider flex items-center gap-2">
        <span>✏️</span> Editar Producto en Inventario
      </h3>
      <button
        type="button"
        onClick={() => setIsEditModalOpen(false)}
        className="text-slate-400 hover:text-slate-700 font-bold text-xs px-2 py-0.5 rounded-lg bg-slate-100"
      >
        ✕
      </button>
    </div>

    <form onSubmit={handleUpdateInventario} className="space-y-3 text-xs">
      <div>
        <label className="block font-bold text-slate-600 mb-1">Nombre del producto *</label>
        <input
          type="text"
          value={editingItemData.nombre || ""}
          onChange={(e) => setEditingItemData({...editingItemData, nombre: e.target.value})}
          className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          required
        />
      </div>

      <div>
        <label className="block font-bold text-slate-600 mb-1">Proveedor *</label>
        <input
          type="text"
          value={editingItemData.proveedor || ""}
          onChange={(e) => setEditingItemData({...editingItemData, proveedor: e.target.value})}
          className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          required
        />
      </div>

      <div>
        <label className="block font-bold text-slate-600 mb-1">Descripción</label>
        <textarea
          value={editingItemData.descripcion || ""}
          onChange={(e) => setEditingItemData({...editingItemData, descripcion: e.target.value})}
          className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          rows="2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-slate-600 mb-1">Categoría</label>
          <select
            value={editingItemData.categoria || "General"}
            onChange={(e) => setEditingItemData({...editingItemData, categoria: e.target.value})}
            className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
          >
            <option value="General">General</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-400 mb-1">Stock Disponible (No editable)</label>
          <input
            type="number"
            value={editingItemData.udisponibles ?? ""}
            disabled
            className="w-full bg-slate-100 border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Selector de Costo, Margen de Porcentaje y Precio Final */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block font-bold text-slate-600 mb-1">Costo ($) *</label>
          <input
            type="number"
            value={editingItemData.costo ?? ""}
            onChange={(e) => {
              const nuevoCosto = e.target.value;
              setEditingItemData({
                ...editingItemData, 
                costo: nuevoCosto,
                precio: Number(nuevoCosto) === 0 ? (editingItemData.precio || "") : editingItemData.precio
              });
            }}
            className="w-full bg-white border border-[#E4E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#2D3142] focus:outline-none focus:border-[#7C69EF]"
            required
          />
        </div>
        <div>
          <label className="block font-bold text-slate-600 mb-1">% Margen Venta</label>
          <select
            value={editingItemData.porcentajeGanancia || 50}
            onChange={(e) => setEditingItemData({...editingItemData, porcentajeGanancia: Number(e.target.value)})}
            disabled={Number(editingItemData.costo) === 0}
            className={`w-full rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:border-[#7C69EF] ${
              Number(editingItemData.costo) === 0 
                ? "bg-slate-100 border border-[#E4E8F0] text-slate-400 cursor-not-allowed" 
                : "bg-white border border-[#E4E8F0] text-[#2D3142]"
            }`}
          >
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 95].map((p) => (
              <option key={p} value={p}>{p}%</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-600 mb-1">Precio Final *</label>
          <input
            type={Number(editingItemData.costo) === 0 ? "number" : "text"}
            value={
              Number(editingItemData.costo) === 0 
                ? (editingItemData.precio ?? "") 
                : (() => {
                    const costoNum = Number(editingItemData.costo) || 0;
                    const porc = Number(editingItemData.porcentajeGanancia) || 50;
                    const divisor = 1 - (porc / 100); 
                    const precioFinal = divisor > 0 ? costoNum / divisor : costoNum;
                    return precioFinal ? Math.round(precioFinal) : 0;
                  })()
            }
            disabled={Number(editingItemData.costo) !== 0}
            onChange={(e) => {
              if (Number(editingItemData.costo) === 0) {
                setEditingItemData({ ...editingItemData, precio: e.target.value });
              }
            }}
            className={`w-full rounded-xl px-3 py-2 text-xs font-bold ${
              Number(editingItemData.costo) === 0 
                ? "bg-white border border-[#E4E8F0] text-[#2D3142] focus:outline-none focus:border-[#7C69EF]" 
                : "bg-slate-100 border border-[#E4E8F0] text-slate-500 cursor-not-allowed"
            }`}
            required={Number(editingItemData.costo) === 0}
          />
        </div>
      </div>

      {/* Botón Switch de Estado (Encendido / Apagado) */}
    {/* Botón Switch de Estado (Encendido / Apagado) */}
      <div>
        <label className="block font-bold text-slate-600 mb-1">Estado del Producto</label>
        <button
          type="button"
          onClick={() => {
            // Alternamos el valor booleano actual (si era true pasa a false, y viceversa)
            setEditingItemData({ ...editingItemData, estado: !editingItemData.estado });
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
            editingItemData.estado 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              editingItemData.estado ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}></span>
            {editingItemData.estado ? "Activo" : "Inactivo"}
          </span>
          <span className="bg-white px-2 py-1 rounded-lg border shadow-xs text-[10px] text-slate-600">
            Click para cambiar 🔄
          </span>
        </button>
      </div>

      {/* Imágenes */}
    {/* Imágenes */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
          <label className="block font-bold text-slate-700 text-[11px]">Foto Principal (img)</label>
          {editingItemData.img && <img src={editingItemData.img} alt="Actual" className="w-10 h-10 object-cover rounded-md mb-1 border" />}
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX = 500;
                  let w = img.width, h = img.height;
                  if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                  else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                  canvas.width = w; canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, w, h);
                  setEditFileImg(canvas.toDataURL('image/jpeg', 0.5));
                };
              };
              reader.readAsDataURL(file);
            }}
            className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#7C69EF]/10 file:text-[#7C69EF]"
          />
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
          <label className="block font-bold text-slate-700 text-[11px]">Segunda Foto (img1)</label>
          {editingItemData.img1 && <img src={editingItemData.img1} alt="Actual 1" className="w-10 h-10 object-cover rounded-md mb-1 border" />}
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX = 500;
                  let w = img.width, h = img.height;
                  if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                  else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                  canvas.width = w; canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, w, h);
                  setEditFileImg1(canvas.toDataURL('image/jpeg', 0.5));
                };
              };
              reader.readAsDataURL(file);
            }}
            className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#7C69EF]/10 file:text-[#7C69EF]"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t">
        <button
          type="button"
          onClick={() => setIsEditModalOpen(false)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-[#7C69EF]/20 transition-all disabled:opacity-50"
        >
          {isUploading ? "Actualizando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  </div>
</div>
      )}

      {/* MODAL DETALLES (ESTILO ANTERIOR + SCROLL Y ALTURA MÁXIMA PARA EVITAR RECORTE) */}
     {/* MODAL DETALLES CORREGIDO */}
    {/* MODAL DETALLES DEFINITIVO */}
      {detailModal.isOpen && detailModal.item && (
       <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
  <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-3 animate-fadeIn my-auto">
    
    {/* Cabecera del Modal */}
    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
      <div className="flex items-center gap-2">
        <span className="p-1.5 bg-indigo-50 text-[#7C69EF] rounded-xl text-xs font-black">📦</span>
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Detalles del Producto</h3>
          <p className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1.5">
            <span>ID: {detailModal.item.id}</span>
            {detailModal.item.proveedor && (
              <span className="bg-[#7C69EF]/10 text-[#7C69EF] px-1.5 py-0.5 rounded-md font-semibold">
                • Proveedor &gt; {detailModal.item.proveedor}
              </span>
            )}
          </p>
        </div>
      </div>
      <button 
        onClick={() => setDetailModal({ isOpen: false, item: null })}
        className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
      >
        ✕
      </button>
    </div>

    {/* Contenido principal compacto */}
    <div className="space-y-2.5 text-xs">
      
      {/* Carrusel o Mensaje de Sin Imágenes */}
      {(() => {
        const images = [detailModal.item.img, detailModal.item.img1].filter(Boolean);
        
        if (images.length > 0) {
          return (
            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-xs bg-white flex items-center justify-center shrink-0">
                <img 
                  src={images[detailImgIndex] || images[0]} 
                  alt="Vista previa" 
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="flex flex-col justify-center gap-1 flex-1">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Multimedia ({images.length})</span>
                {images.length > 1 ? (
                  <div className="flex gap-1.5">
                    {images.map((imgSrc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setDetailImgIndex(idx)}
                        className={`w-8 h-8 rounded-lg overflow-hidden border transition-all cursor-pointer bg-white ${detailImgIndex === idx ? 'border-[#7C69EF] ring-2 ring-[#7C69EF]/20 scale-105' : 'border-slate-200 opacity-60'}`}
                      >
                        <img src={imgSrc} alt={`Min ${idx}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-medium text-slate-500">1 imagen disponible</p>
                )}
              </div>
            </div>
          );
        } else {
          return (
            <div className="bg-slate-50/70 p-3 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400">
              <span className="text-base">🖼️</span>
              <span className="text-[11px] font-bold">Sin imágenes registradas</span>
            </div>
          );
        }
      })()}

      {/* Nombre y Categoría */}
      <div className="bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Producto</span>
          <p className="text-xs font-black text-slate-800">{detailModal.item.nombre || detailModal.item.productos}</p>
        </div>
        <span className="bg-indigo-50 text-[#7C69EF] px-2 py-0.5 rounded-md text-[10px] font-extrabold">
          {detailModal.item.categoria || "General"}
        </span>
      </div>

      {/* Descripción del producto */}
      <div className="bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Descripción</span>
        <p className="text-[11px] font-medium text-slate-700 mt-0.5">
          {detailModal.item.descripcion || "bueno producto"}
        </p>
      </div>

      {/* Métricas en Grid de 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-50/60 border border-emerald-100 p-2 rounded-xl">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/80 block">Costo</span>
          <p className="font-extrabold text-emerald-700 text-xs">${Number(detailModal.item.costo || 0).toLocaleString()}</p>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-100 p-2 rounded-xl">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#7C69EF]/80 block">Precio Venta</span>
          <p className="font-extrabold text-[#7C69EF] text-xs">${Number(detailModal.item.precio || 0).toLocaleString()}</p>
        </div>

        <div className="bg-sky-50/60 border border-sky-100 p-2 rounded-xl">
          <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600/80 block">Stock Disponible</span>
          <p className="font-extrabold text-sky-700 text-xs">{detailModal.item.udisponibles ?? detailModal.item.stockactual ?? 0} unids</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-100 p-2 rounded-xl">
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600/80 block">Vendidas</span>
          <p className="font-extrabold text-amber-700 text-xs">{detailModal.item.uvendidas ?? "0"} unids</p>
        </div>
      </div>

      {/* Estado y Porcentaje de Ganancia */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">Estado</span>
            <span className={`inline-flex items-center gap-1 font-extrabold text-[10px] ${
              String(detailModal.item.estado) === "true" || detailModal.item.estado === true 
                ? "text-emerald-600" 
                : "text-rose-600"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                String(detailModal.item.estado) === "true" || detailModal.item.estado === true 
                  ? "bg-emerald-500 animate-pulse" 
                  : "bg-rose-500"
              }`}></span>
              {String(detailModal.item.estado) === "true" || detailModal.item.estado === true ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">% Ganancia</span>
          <strong className="text-slate-700 text-xs">{detailModal.item.porcentajeGanancia ?? 50}%</strong>
        </div>
      </div>

      {/* Fechas e Ingresos */}
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 grid grid-cols-3 text-center text-[10px]">
        <div>
          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Ingresadas</span>
          <strong className="text-slate-700">{detailModal.item.uingresadas ?? "0"}</strong>
        </div>
        <div className="border-x border-slate-200/60 px-1">
          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">F. Entrada</span>
          <strong className="text-slate-700">{detailModal.item.fentrada ?? "--"}</strong>
        </div>
        <div>
          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Salida</span>
          <strong className="text-slate-700">{detailModal.item.fsalida ?? "--"}</strong>
        </div>
      </div>

      {/* Botón Cerrar */}
      <button
        onClick={() => setDetailModal({ isOpen: false, item: null })}
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-all cursor-pointer mt-1"
      >
        Cerrar Ventana
      </button>

    </div>
  </div>
</div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteModal.isOpen && (
       <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-[#E4E8F0] space-y-4 text-center animate-fadeIn">
            <div className="text-3xl">⚠️</div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#2D3142] uppercase tracking-wider">¿Estás seguro?</h4>
              <p className="text-[11px] text-slate-500">
                Estás a punto de eliminar a <strong className="text-slate-700">{deleteModal.name}</strong> del inventario. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: null, name: "", isMultiple: false })}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    if (deleteModal.isMultiple) {
                      for (const id of deleteModal.id) {
                        await deleteDoc(doc(db, "inventario", id));
                      }
                    } else {
                      await deleteDoc(doc(db, "inventario", deleteModal.id));
                    }
                    setDeleteModal({ isOpen: false, id: null, name: "", isMultiple: false });
                    triggerSuccessAlert("Producto eliminado");
                  } catch (error) {
                    console.error("Error al eliminar:", error);
                    triggerErrorAlert("No se pudo eliminar el producto");
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex-1 shadow-md shadow-rose-600/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}