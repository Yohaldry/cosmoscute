const admin = require('firebase-admin');

// Si estás corriendo el script localmente, asegúrate de apuntar a tu archivo de credenciales descargado de Firebase:
// const serviceAccount = require('./path-to-your-serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Si tu entorno ya tiene configurada la variable GOOGLE_APPLICATION_CREDENTIALS, puedes dejar solo esto:
admin.initializeApp();

const db = admin.firestore();

async function normalizarProductos() {
    try {
        console.log("Conectando a Firestore y obteniendo documentos de 'inventario'...");
        const snapshot = await db.collection('inventario').get();

        if (snapshot.empty) {
            console.log("⚠️ No se encontraron documentos en la colección 'inventario'. Revisa el nombre de la colección.");
            return;
        }

        const batch = db.batch();
        let count = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            
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
                descripcion: data.descripcion || "bueno producto",
                descucento: data.descucento ?? "0%" 
            };

            batch.set(doc.ref, productoEstandar, { merge: true });
            count++;
        });

        await batch.commit();
        console.log(`¡Éxito! Se actualizaron ${count} productos correctamente con el campo "descucento".`);
        
    } catch (error) {
        console.error("❌ Error al actualizar los productos en Firebase:", error);
    }
}

normalizarProductos();