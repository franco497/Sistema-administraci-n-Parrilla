// src/components/Mesas/SelectorMozo.jsx
import React, { useState } from "react";
import "./SelectorMozo.css";

// ✅ Asegurar que todos los props están correctos
const SelectorMozo = ({
  mesaId,           // ID de la mesa
  mozos,            // Lista de mozos disponibles
  mozoActual,       // Nombre del mozo asignado (string o null)
  onAsignar,        // Función para asignar mozo
  onRemover,        // Función para remover mozo
  loading,          // Estado de carga
}) => {
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const handleAsignarMozo = (mozoId) => {
    onAsignar(mesaId, mozoId);
    setMostrarSelector(false);
  };

  const handleRemoverMozo = () => {
    if (confirm("¿Quitar mozo asignado a esta mesa?")) {
      onRemover(mesaId);
      setMostrarSelector(false);
    }
  };

  console.log('🔍 SelectorMozo - mozoActual:', mozoActual);
  console.log('🔍 SelectorMozo - mesaId:', mesaId);

  return (
    <div className="selector-mozo">
      {mozoActual ? (
        <div className="mozo-asignado">
          <span className="mozo-icono">👨‍🍳</span>
          <span className="mozo-nombre">{mozoActual}</span>
          <button
            className="btn-cambiar-mozo"
            onClick={() => setMostrarSelector(!mostrarSelector)}
            disabled={loading}
          >
            🔄 Cambiar
          </button>
          <button
            className="btn-remover-mozo"
            onClick={handleRemoverMozo}
            disabled={loading}
          >
            ❌
          </button>
        </div>
      ) : (
        <button
          className="btn-asignar-mozo"
          onClick={() => setMostrarSelector(!mostrarSelector)}
          disabled={loading}
        >
          👨‍🍳 Asignar Mozo
        </button>
      )}

      {mostrarSelector && (
        <div className="lista-mozos">
          <h4>Seleccionar Mozo</h4>
          {mozos.length === 0 ? (
            <p className="sin-mozos">No hay mozos disponibles</p>
          ) : (
            mozos.map((mozo) => (
              <button
                key={mozo.id_mozo}
                className="mozo-opcion"
                onClick={() => handleAsignarMozo(mozo.id_mozo)}
                disabled={loading}
              >
                <span className="mozo-opcion-nombre">
                  {mozo.nombre}
                </span>
              </button>
            ))
          )}
          <button
            className="btn-cerrar-lista"
            onClick={() => setMostrarSelector(false)}
          >
            ❌ Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectorMozo;