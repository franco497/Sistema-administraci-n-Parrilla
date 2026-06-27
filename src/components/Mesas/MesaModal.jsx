// src/components/Mesas/MesaModal.jsx
import React, { useState } from 'react';
import { useRestaurante } from '../../context/RestauranteContext';
import './MesaModal.css';

const MesaModal = ({ mesaId, onClose }) => {
  const { 
    mesas, 
    inventario, 
    actualizarConsumosMesa, 
    reservarMesa, 
    cancelarReserva,
    cobrarMesa 
  } = useRestaurante();

  const mesa = mesas[mesaId];
  const [adultos, setAdultos] = useState(mesa.adultos || 0);
  const [menores, setMenores] = useState(mesa.menores || 0);
  const [consumos, setConsumos] = useState(mesa.consumos || {});
  const [total, setTotal] = useState(0);

  const handleCambiarCantidad = (productoId, cantidad) => {
    setConsumos(prev => ({
      ...prev,
      [productoId]: cantidad > 0 ? cantidad : undefined
    }));
    // Limpiar si es 0
    if (cantidad === 0) {
      const newConsumos = { ...prev };
      delete newConsumos[productoId];
      setConsumos(newConsumos);
    }
  };

  const calcularTotal = () => {
    let totalCalculado = 0;
    Object.keys(consumos).forEach(productoId => {
      const producto = inventario.find(p => p.id === parseInt(productoId));
      if (producto) {
        totalCalculado += producto.precio * (consumos[productoId] || 0);
      }
    });
    setTotal(totalCalculado);
    return totalCalculado;
  };

  const handleGuardar = () => {
    actualizarConsumosMesa(mesaId, consumos, adultos, menores);
    // Actualizar estado de la mesa a ocupada si tiene consumos o personas
    onClose();
  };

  const handleCobrar = () => {
    const totalCalculado = calcularTotal();
    if (totalCalculado > 0) {
      const detalles = Object.keys(consumos).map(productoId => {
        const producto = inventario.find(p => p.id === parseInt(productoId));
        return `${consumos[productoId]}x ${producto?.nombre || ''}`;
      }).filter(d => d);

      cobrarMesa(mesaId, totalCalculado, detalles.join(', '));
    } else {
      // Si no hay consumos, solo liberar la mesa
      actualizarConsumosMesa(mesaId, {}, 0, 0);
    }
    onClose();
  };

  const handleReserva = () => {
    if (mesa.estado === 'reservada') {
      cancelarReserva(mesaId);
    } else {
      const nombre = prompt('Nombre para la reserva:');
      if (nombre && nombre.trim()) {
        reservarMesa(mesaId, nombre.trim());
      }
    }
  };

  const obtenerProducto = (id) => inventario.find(p => p.id === id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Mesa {mesaId}</h2>

        <div className="reserva-section">
          {mesa.estado === 'reservada' ? (
            <p className="reserva-texto">Reservada para: {mesa.reservaNombre}</p>
          ) : (
            <p className="reserva-texto">¿Querés reservar esta mesa?</p>
          )}
          <button 
            className={mesa.estado === 'reservada' ? 'btn-cancelar' : 'btn-reservar'}
            onClick={handleReserva}
          >
            {mesa.estado === 'reservada' ? 'Cancelar Reserva' : 'Reservar Mesa'}
          </button>
        </div>

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
          {inventario.map(producto => (
            <div key={producto.id} className="item-consumo">
              <span>
                {producto.nombre} 
                <small>(${producto.precio})</small>
              </span>
              <input
                type="number"
                min="0"
                value={consumos[producto.id] || 0}
                onChange={(e) => handleCambiarCantidad(
                  producto.id, 
                  parseInt(e.target.value) || 0
                )}
              />
            </div>
          ))}
        </div>

        <div className="total-display">
          Total a Pagar: ${total}
        </div>

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