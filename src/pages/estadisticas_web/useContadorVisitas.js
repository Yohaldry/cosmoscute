import { useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../firebase"; // Cambia esta ruta si tu archivo firebaseConfig está en otro lado

export default function useContadorVisitas() {
  useEffect(() => {
    const registrarVisitaWeb = async () => {
      // Esto evita que si el usuario navega por tu web se cuenten 10 visitas por error en la misma visita
      const yaVisito = sessionStorage.getItem("cosmos_visita_registrada");
      if (yaVisito) return;

      try {
        const hoy = new Date().toISOString().split("T")[0]; // Saca la fecha de hoy, ejemplo: "2026-09-09"
        const visitaRef = doc(db, "estadisticas_web", "general");
        const diarioRef = doc(db, "estadisticas_web", hoy);

        // 1. Si no existe el documento general en Firebase, lo crea en 0
        const docSnap = await getDoc(visitaRef);
        if (!docSnap.exists()) {
          await setDoc(visitaRef, { totalVisitas: 0 });
        }

        // 2. Suma +1 al total general de visitas
        await updateDoc(visitaRef, { totalVisitas: increment(1) });
        
        // 3. Suma +1 al contador del día actual (para tus estadísticas diarias)
        const diarioSnap = await getDoc(diarioRef);
        if (!diarioSnap.exists()) {
          await setDoc(diarioRef, { visitas: 1, fecha: hoy });
        } else {
          await updateDoc(diarioRef, { visitas: increment(1) });
        }

        // Marca que este dispositivo ya contó su visita en esta sesión
        sessionStorage.setItem("cosmos_visita_registrada", "true");
      } catch (error) {
        console.error("Error al registrar visita:", error);
      }
    };

    registrarVisitaWeb();
  }, []);
}