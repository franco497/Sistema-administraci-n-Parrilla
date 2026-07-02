// src/components/Mesas/MesaCard.jsx
import React from "react";
import "./MesaCard.css";

const MesaCard = ({ mesaId, mesa, onAbrir }) => {
  const getEstadoClase = () => {
    if (mesa.estado === "ocupada") return "ocupada";
    if (mesa.estado === "reservada") return "reservada";
    return "disponible";
  };

  const getEstadoTexto = () => {
    if (mesa.estado === "ocupada") return "👥 Ocupada";
    if (mesa.estado === "reservada") return `⏳ ${mesa.reservaNombre}`;
    return "✅ Disponible";
  };

  const getDetalleOcupada = () => {
    if (mesa.estado === "ocupada") {
      return `${mesa.adultos}👨 ${mesa.menores}👦`;
    }
    return "";
  };

  return (
    <div className={`mesa ${getEstadoClase()}`} onClick={() => onAbrir(mesaId)}>
      <div className="numero-mesa">Mesa {mesaId}</div>
      <div className="estado-texto">{getEstadoTexto()}</div>
      {mesa.estado === "ocupada" && (
        <div className="detalle-ocupada">{getDetalleOcupada()}</div>
      )}
    </div>
  );
};

export default MesaCard;
