// src/components/Mesas/SelectorMozo.jsx
import React, { useState } from "react";
import "./SelectorMozo.css";

const SelectorMozo = ({
  mesaId,
  mozos,
  mozoActual,
  onAsignar,
  onRemover,
  loading,
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
                  {mozo.nombre} {mozo.apellido}
                </span>
                <span className="mozo-opcion-telefono">{mozo.telefono}</span>
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
