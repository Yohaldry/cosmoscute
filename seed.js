import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Copia aquí los mismos datos de configuración que tiene tu app
const firebaseConfig = {
  apiKey: "AIzaSyBQ9Ei9AK-rmllHRqoE-qPLLxTiAeOZyno",
  authDomain: "usuarios-barberos.firebaseapp.com",
   projectId: "usuarios-barberos",
  storageBucket: "usuarios-barberos.firebasestorage.app",
  messagingSenderId: "524028905050",
  appId: "1:524028905050:web:b90e371ba1f044c7283a63",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedProductos() {
  const nombresBase = [
    "Camiseta", "Gorra", "Taza", "Sticker", "Póster", 
    "Cuaderno", "Llavero", "Sudadera", "Mousepad", "Termo",
    "Bolígrafo", "Mochila", "Cargador", "Cable", "Audífonos"
  ];

  console.log("🚀 Iniciando carga de 100 productos...");

  for (let i = 0; i <= 99; i++) {
    const codigoStr = String(i).padStart(2, '0');
    const nombreAleatorio = `${nombresBase[Math.floor(Math.random() * nombresBase.length)]} ${codigoStr}`;
    
    const docRef = doc(db, "productos", codigoStr);
    await setDoc(docRef, {
      codigo: codigoStr,
      nombre: nombreAleatorio
    });
  }

  console.log("✨ ¡100 productos creados con éxito del 00 al 99!");
  process.exit(0);
}

seedProductos();