import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Sparkles, Plus, Trash2, Edit3, Image as ImageIcon, Tag, Layers, X, Check, Upload, AlertCircle } from 'lucide-react';

export default function BannersPromociones({ triggerSuccessAlert, triggerErrorAlert }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);

  // Estado para la alerta de confirmación con diseño "cosmos cute"
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  // Campos del formulario (incluyendo precio y estado como boolean, por defecto true)
  const [formData, setFormData] = useState({
    titulo: '',
    precio: '',
    imagen: '',
    estado: true,
    producto1: '',
    producto2: '',
    producto3: '',
    producto4: '',
    producto5: '',
    producto6: '',
    producto7: ''
  });

  // Cargar datos de Firestore
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'bannerspromociones'));
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBanners(list);
    } catch (error) {
      console.error("Error al cargar banners:", error);
      if (triggerErrorAlert) triggerErrorAlert("Error al cargar los banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Manejar la carga de imagen desde la galería (convirtiendo a Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Abrir modal para crear o editar
  const handleOpenModal = (banner = null) => {
    if (banner) {
      setCurrentBanner(banner.id);
      setFormData({
        titulo: banner.titulo || '',
        precio: banner.precio || '',
        imagen: banner.imagen || '',
        estado: banner.estado !== undefined ? banner.estado : true,
        producto1: banner.producto1 || '',
        producto2: banner.producto2 || '',
        producto3: banner.producto3 || '',
        producto4: banner.producto4 || '',
        producto5: banner.producto5 || '',
        producto6: banner.producto6 || '',
        producto7: banner.producto7 || ''
      });
    } else {
      setCurrentBanner(null);
      setFormData({
        titulo: '',
        precio: '',
        imagen: '',
        estado: true,
        producto1: '',
        producto2: '',
        producto3: '',
        producto4: '',
        producto5: '',
        producto6: '',
        producto7: ''
      });
    }
    setIsModalOpen(true);
  };

  // Guardar (Crear o Actualizar) en Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentBanner) {
        const docRef = doc(db, 'bannerspromociones', currentBanner);
        await updateDoc(docRef, formData);
        if (triggerSuccessAlert) triggerSuccessAlert("Banner actualizado exitosamente");
      } else {
        await addDoc(collection(db, 'bannerspromociones'), formData);
        if (triggerSuccessAlert) triggerSuccessAlert("Banner creado exitosamente");
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (error) {
      console.error("Error al guardar el banner:", error);
      if (triggerErrorAlert) triggerErrorAlert("Hubo un error al guardar el banner.");
    }
  };

  // Cambiar estado rápido desde la tabla
  const handleToggleStatus = async (item) => {
    try {
      const nuevoEstado = !item.estado;
      const docRef = doc(db, 'bannerspromociones', item.id);
      await updateDoc(docRef, { estado: nuevoEstado });
      setBanners(banners.map(b => b.id === item.id ? { ...b, estado: nuevoEstado } : b));
      if (triggerSuccessAlert) triggerSuccessAlert(`Banner ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      if (triggerErrorAlert) triggerErrorAlert("Error al actualizar el estado.");
    }
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await deleteDoc(doc(db, 'bannerspromociones', deleteModal.id));
      if (triggerSuccessAlert) triggerSuccessAlert("Banner eliminado correctamente");
      fetchBanners();
    } catch (error) {
      console.error("Error al eliminar:", error);
      if (triggerErrorAlert) triggerErrorAlert("Error al eliminar el banner.");
    } finally {
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  return (
    <div className="w-full font-sans">
      
      {/* Header de la Sección */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-purple-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-pink-100 text-pink-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
              ADMINISTRACIÓN
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Gestión de Banners y Combos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea, edita y administra los combos promocionales que se muestran en el carrusel de la web.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Combo / Banner</span>
        </button>
      </div>

      {/* Tabla de Registros */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-medium text-sm">Cargando banners...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">No hay banners registrados</p>
          <p className="text-xs text-slate-400 mt-1">Empieza agregando tu primer combo promocional.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/60 border-b border-purple-100 text-purple-900 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-6">Imagen</th>
                  <th className="py-4 px-6">Título del Combo</th>
                  <th className="py-4 px-6">Precio</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Productos Asociados</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {banners.map((item) => {
                  const productsList = [item.producto1, item.producto2, item.producto3, item.producto4, item.producto5, item.producto6, item.producto7].filter(Boolean);
                  const isActivo = item.estado !== false; // Por defecto true si no está definido

                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                          {item.imagen ? (
                            <img src={item.imagen} alt={item.titulo} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-slate-800 text-sm block">
                          {item.titulo || "Sin título"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-purple-700 text-sm">
                          {item.precio ? `$${item.precio}` : "Sin precio"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                            isActivo 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Clic para cambiar estado"
                        >
                          <span className={`w-2 h-2 rounded-full ${isActivo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          {isActivo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {productsList.length > 0 ? (
                            productsList.map((prod, idx) => (
                              <span key={idx} className="bg-pink-50 text-pink-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-pink-100">
                                {prod}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">Sin productos</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL PARA CREAR / EDITAR --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-purple-100 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {currentBanner ? "Editar Banner / Combo" : "Nuevo Banner / Combo"}
                </h3>
                <p className="text-xs text-white/80">Completa los campos de información para el banner.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Título del Combo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Combo Espectacular"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Botón de encendido y apagado (Toggle Switch) para el Estado */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Estado
                  </label>
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className={`text-xs font-bold ${formData.estado ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {formData.estado ? 'Encendido' : 'Apagado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, estado: !formData.estado })}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${
                        formData.estado ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          formData.estado ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Campo Precio */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Precio
                </label>
                <input
                  type="text"
                  placeholder="Ej. 49.990"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Subir imagen desde la galería */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Imagen del Banner
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {formData.imagen ? (
                      <img src={formData.imagen} alt="Vista previa" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 border-dashed rounded-2xl p-3 flex items-center justify-center gap-2 transition-all text-xs font-bold">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span>Seleccionar imagen de la galería</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Grid de Productos (1 al 7) */}
              <div className="pt-2">
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-pink-500" />
                  Productos Asociados (hasta 7)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const fieldName = `producto${num}`;
                    return (
                      <div key={num}>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Producto {num}
                        </label>
                        <input
                          type="text"
                          placeholder={`Ej. Nombre del producto ${num}`}
                          value={formData[fieldName]}
                          onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Banner</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (COSMOS CUTE) --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-pink-100 p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">¿Estás segur@?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Esta acción eliminará el banner o combo permanentemente. No podrás recuperarlo.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/25 transition-all"
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