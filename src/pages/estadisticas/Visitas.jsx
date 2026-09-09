import React, { useState } from "react";

export default function Visitas() {
  // Datos falsos de prueba para verificar visibilidad y diseño
  const [visitas] = useState([
    { id: "1", dispositivo: "Chrome / Windows", fecha: "09/09/2026 - 12:30", detalle: "Bogotá, Colombia (IP: 190.24.xx)" },
    { id: "2", dispositivo: "Safari / iPhone", fecha: "09/09/2026 - 11:15", detalle: "Medellín, Colombia (IP: 181.53.xx)" },
    { id: "3", dispositivo: "Chrome / Android", fecha: "08/09/2026 - 22:40", detalle: "Cali, Colombia (IP: 186.84.xx)" },
    { id: "4", dispositivo: "Firefox / Linux", fecha: "08/09/2026 - 19:10", detalle: "Bogotá, Colombia (IP: 190.24.xx)" },
    { id: "5", dispositivo: "Edge / Windows", fecha: "08/09/2026 - 15:05", detalle: "Barranquilla, Colombia (IP: 201.233.xx)" },
  ]);

  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-5 h-5 border-2 border-[#7C69EF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 bg-white h-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-[#2D3142]">Registro de Visitas Web (Demo)</h3>
          <p className="text-[9px] text-[#9EA2B3]">Control y estadísticas de acceso al sitio.</p>
        </div>
        <div className="bg-[#F4F5FB] px-2.5 py-1 rounded-xl border border-[#E4E8F0]">
          <span className="text-[9px] font-bold text-[#7C69EF]">Total Visitas: {visitas.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-[#E4E8F0] rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F5FB] border-b border-[#E4E8F0] text-[8px] font-black uppercase text-[#9EA2B3]">
              <th className="p-2">ID / Dispositivo</th>
              <th className="p-2">Fecha / Hora</th>
              <th className="p-2">Ubicación / Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8F0] text-[9px]">
            {visitas.map((v) => (
              <tr key={v.id} className="hover:bg-[#F4F5FB]/50 transition-all">
                <td className="p-2 font-bold text-[#2D3142]">{v.dispositivo}</td>
                <td className="p-2 text-[#6E7387]">{v.fecha}</td>
                <td className="p-2 text-[#6E7387]">{v.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}