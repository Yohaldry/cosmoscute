import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

// Inicializa con tus credenciales de Firebase Admin o tu app
initializeApp();

async function setCors() {
  const bucket = getStorage().bucket("tu-bucket.appspot.com"); // Reemplaza con tu bucket
  await bucket.setCorsConfiguration([
    {
      origin: ["http://localhost:5173"],
      method: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      responseHeader: ["*"],
      maxAgeSeconds: 3600,
    },
  ]);
  console.log("CORS configurado exitosamente");
}

setCors().catch(console.error);