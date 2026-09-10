const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function normalizarProductos() {
    const snapshot = await db.collection('inventario').get();
    const batch = db.batch();

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Estructura estándar con los campos solicitados y valores por defecto ajustados
        const productoEstandar = {
            categoria: data.categoria || "OTROS",
            costo: data.costo ?? 2600,
            fentrada: data.fentrada || "9/9/2026",
            fsalida: data.fsalida || "--",
            id: data.id || doc.id,
            img: data.img || "",
            img1: data.img1 || "",
            nombre: data.nombre || "Sin nombre",
            porcentajeGanancia: data.porcentajeGanancia ?? 50,
            portada: data.portada || "",
            precio: data.precio ?? 5200,
            proveedor: data.proveedor || "MORITA",
            udisponibles: data.udisponibles ?? 2,
            uingresadas: data.uingresadas || "2",
            uvendidas: data.uvendidas || "0",
            estado: data.estado !== undefined ? data.estado : "true",
            descripcion: data.descripcion || "bueno producto"
        };

        // Actualiza el documento manteniendo su ID original y combinando los datos
        batch.set(doc.ref, productoEstandar, { merge: true });
    });

    await batch.commit();
    console.log("¡Todos los productos han sido actualizados con la estructura estándar!");
}

normalizarProductos();