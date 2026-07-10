// src/components/Mesas/GrillaMesas.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRestaurante } from '../../context/RestauranteContext';
import MesaCard from './MesaCard';
import './GrillaMesas.css';

const GrillaMesas = ({ onVolver }) => {
  const { mesas } = useRestaurante();
  const navigate = useNavigate();

  const handleAbrirMesa = (mesaId) => {
    // ✅ Navegar a la vista de la mesa en lugar de abrir modal
    navigate(`/mesa/${mesaId}`);
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
    </div>
  );
};

export default GrillaMesas;