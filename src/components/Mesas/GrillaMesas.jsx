// src/components/Mesas/GrillaMesas.jsx
import React, { useState } from "react";
import { useRestaurante } from "../../context/RestauranteContext";
import MesaCard from "./MesaCard";
import MesaModal from "./MesaModal";
import "./GrillaMesas.css";

const GrillaMesas = ({ onVolver }) => {
  const { mesas } = useRestaurante();
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const handleAbrirMesa = (mesaId) => {
    setMesaSeleccionada(mesaId);
  };

  const handleCerrarModal = () => {
    setMesaSeleccionada(null);
  };

  return (
    <div className="grilla-mesas-container">
      <div className="encabezado-seccion">
        <button className="btn-volver" onClick={onVolver}>
          ⬅ Volver al Menú
        </button>
        <h2>📋 Distribución del Salón (47 Mesas)</h2>
      </div>

      <div className="contenedor-mesas">
        {Object.keys(mesas).map((mesaId) => (
          <MesaCard
            key={mesaId}
            mesaId={parseInt(mesaId)}
            mesa={mesas[mesaId]}
            onAbrir={handleAbrirMesa}
          />
        ))}
      </div>

      {mesaSeleccionada && (
        <MesaModal mesaId={mesaSeleccionada} onClose={handleCerrarModal} />
      )}
    </div>
  );
};

export default GrillaMesas;
