const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

console.log("Iniciando conexión con Firebase...");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const categoriasPapeleria = ["Escolar", "Oficina", "Artes", "Papelería Fina", "General"];
const nombresPapeleria = [
  "Lápiz Mirado HB", "Cuaderno Profesional 100 Hojas", "Borrador de Nata", 
  "Sacapuntas de Aluminio", "Bolígrafo Bic Azul", "Bolígrafo Bic Negro", 
  "Corrector Líquido", "Tijeras Escolares Punta Redonda", "Regla Plástica 30cm", 
  "Carpeta Colgante", "Bloc de Hojas Milimetradas", "Resaltador Fluorescente Amarillo", 
  "Marcador Permanente Negro", "Plumones de Colores x12", "Cinta Adhesiva Transparente", 
  "Pegamento en Barra 40g", "Juego de Geometría", "Compás de Precisión", 
  "Bloc de Notas Adhesivas (Post-it)", "Papel Bond Carta x500"
];

function generarFechaAleatoria() {
  const dia = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const anio = '2026';
  return `${dia}/${mes}/${anio}`;
}

async function cargarProductosMasivos() {
  console.log("Generando 150 productos con el campo 'nombre' y 'costo'...");
  const collectionRef = db.collection('inventario');
  let batch = db.batch();
  let count = 0;

  for (let i = 1; i <= 150; i++) {
    const nombreAleatorio = nombresPapeleria[Math.floor(Math.random() * nombresPapeleria.length)] + ` #${i}`;
    const categoriaAleatoria = categoriasPapeleria[Math.floor(Math.random() * categoriasPapeleria.length)];
    const precioAleatorio = Math.floor(Math.random() * 45000) + 1000; 
    const costoAleatorio = String(Math.floor(Math.random() * 5000) + 500); 
    const udisponibles = Math.floor(Math.random() * 100) + 1;
    const uingresadas = Math.floor(Math.random() * 50) + udisponibles;
    const uvendidas = uingresadas - udisponibles;

    const docRef = collectionRef.doc(); 
    batch.set(docRef, {
      categoria: categoriaAleatoria,
      costo: costoAleatorio,
      fentrada: generarFechaAleatoria(),
      fsalida: generarFechaAleatoria(),
      img: "",
      img1: "",
      nombre: nombreAleatorio,
      precio: precioAleatorio,
      udisponibles: udisponibles.toString(),
      uingresadas: uingresadas.toString(),
      uvendidas: uvendidas.toString()
    });

    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  console.log("Enviando datos a Firestore...");
  await batch.commit();
  console.log("¡Carga masiva de 150 productos completada con éxito!");
}

cargarProductosMasivos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error detallado:", error);
    process.exit(1);
  });