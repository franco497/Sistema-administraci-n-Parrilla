// src/components/Mesas/MesaModal.jsx
import React, { useState } from "react";
import { useRestaurante } from "../../context/RestauranteContext";
import FormularioReservaSimple from "./FormularioReservaSimple";
import "./MesaModal.css";

const MesaModal = ({ mesaId, onClose }) => {
  const {
    mesas,
    inventario,
    actualizarConsumosMesa,
    crearReserva,
    cancelarReserva,
    obtenerReservaPorMesa,
    cobrarMesa,
  } = useRestaurante();

  const mesa = mesas[mesaId];
  const reservaExistente = obtenerReservaPorMesa(mesaId);

  const [adultos, setAdultos] = useState(mesa.adultos || 0);
  const [menores, setMenores] = useState(mesa.menores || 0);
  const [consumos, setConsumos] = useState(mesa.consumos || {});
  const [total, setTotal] = useState(0);
  const [mostrarFormularioReserva, setMostrarFormularioReserva] =
    useState(false);

  const handleCambiarCantidad = (productoId, cantidad) => {
    setConsumos((prev) => ({
      ...prev,
      [productoId]: cantidad > 0 ? cantidad : undefined,
    }));
    if (cantidad === 0) {
      const newConsumos = { ...prev };
      delete newConsumos[productoId];
      setConsumos(newConsumos);
    }
  };

  const calcularTotal = () => {
    let totalCalculado = 0;
    Object.keys(consumos).forEach((productoId) => {
      const producto = inventario.find((p) => p.id === parseInt(productoId));
      if (producto) {
        totalCalculado += producto.precio * (consumos[productoId] || 0);
      }
    });
    setTotal(totalCalculado);
    return totalCalculado;
  };

  const handleGuardar = () => {
    actualizarConsumosMesa(mesaId, consumos, adultos, menores);
    onClose();
  };

  const handleCobrar = () => {
    const totalCalculado = calcularTotal();
    if (totalCalculado > 0) {
      const detalles = Object.keys(consumos)
        .map((productoId) => {
          const producto = inventario.find(
            (p) => p.id === parseInt(productoId),
          );
          return `${consumos[productoId]}x ${producto?.nombre || ""}`;
        })
        .filter((d) => d);

      cobrarMesa(mesaId, totalCalculado, detalles.join(", "));
    } else {
      actualizarConsumosMesa(mesaId, {}, 0, 0);
    }
    onClose();
  };

  const handleCancelarReserva = async () => {
    if (!reservaExistente) {
      alert("⚠️ No hay reserva para cancelar");
      return;
    }

    const confirmar = confirm(
      `¿Cancelar reserva de ${reservaExistente.nombre_cliente} en Mesa ${mesaId}?`,
    );
    if (!confirmar) return;

    const result = await cancelarReserva(mesaId, reservaExistente.id_reserva);
    if (result.success) {
      alert("✅ Reserva cancelada correctamente");
    } else {
      alert(`❌ Error al cancelar reserva: ${result.error}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Mesa {mesaId}</h2>

        {/* Sección de Reserva */}
        <div className="reserva-section">
          {mesa.estado === "reservada" && reservaExistente ? (
            // Mostrar reserva existente
            <>
              <div className="reserva-activa">
                <div className="reserva-icono">📅</div>
                <div className="reserva-info">
                  <p className="reserva-cliente">
                    <strong>{reservaExistente.nombre_cliente}</strong>
                  </p>
                  <p className="reserva-detalle">
                    <span>
                      🗓️{" "}
                      {new Date(
                        reservaExistente.fecha_reserva,
                      ).toLocaleDateString("es-AR")}
                    </span>
                    <span>🕐 {reservaExistente.hora_reserva}</span>
                  </p>
                </div>
              </div>
              <button className="btn-cancelar" onClick={handleCancelarReserva}>
                ❌ Cancelar Reserva
              </button>
            </>
          ) : (
            // Mostrar botón para reservar
            <div className="sin-reserva">
              {!mostrarFormularioReserva ? (
                <>
                  <p className="reserva-texto">🪑 Esta mesa está disponible</p>
                  <button
                    className="btn-reservar"
                    onClick={() => setMostrarFormularioReserva(true)}
                  >
                    📅 Reservar Mesa
                  </button>
                </>
              ) : (
                <FormularioReservaSimple
                  mesaId={mesaId}
                  onGuardar={crearReserva} // ← Aquí pasamos la función
                  onCancelar={() => setMostrarFormularioReserva(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Personas en la mesa */}
        <div className="personas-grupo">
          <label>
            👨 Adultos:
            <input
              type="number"
              min="0"
              value={adultos}
              onChange={(e) => setAdultos(parseInt(e.target.value) || 0)}
            />
          </label>
          <label>
            👦 Menores:
            <input
              type="number"
              min="0"
              value={menores}
              onChange={(e) => setMenores(parseInt(e.target.value) || 0)}
            />
          </label>
        </div>

        <h4>🍽️ Consumos</h4>
        <div className="lista-consumos">
          {inventario.map((producto) => (
            <div key={producto.id} className="item-consumo">
              <span>
                {producto.nombre}
                <small>(${producto.precio})</small>
              </span>
              <input
                type="number"
                min="0"
                value={consumos[producto.id] || 0}
                onChange={(e) =>
                  handleCambiarCantidad(
                    producto.id,
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>
          ))}
        </div>

        <div className="total-display">Total a Pagar: ${total}</div>

        <div className="modal-acciones">
          <button className="btn-calcular" onClick={calcularTotal}>
            1. Calcular Total
          </button>
          <button className="btn-guardar" onClick={handleGuardar}>
            2. Guardar (Siguen comiendo)
          </button>
          <button className="btn-cobrar" onClick={handleCobrar}>
            💳 3. Cobrar y Liberar
          </button>
          <button className="btn-cerrar" onClick={onClose}>
            Cancelar / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MesaModal;
