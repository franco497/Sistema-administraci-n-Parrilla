// src/components/Mesas/FormularioReservaSimple.jsx
import React, { useState } from 'react';
import './FormularioReservaSimple.css';

const FormularioReservaSimple = ({ mesaId, onGuardar, onCancelar }) => {
  const [nombreCliente, setNombreCliente] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Obtener fecha y hora actual para mostrar
  const ahora = new Date();
  const fechaFormateada = ahora.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const horaFormateada = ahora.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDACIÓN: Asegurarnos que el nombre no esté vacío
    const nombreTrimmed = nombreCliente.trim();
    if (!nombreTrimmed) {
      setError('⚠️ El nombre del cliente es obligatorio');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      // CORRECCIÓN: Pasar el nombre como string, no como objeto
      const result = await onGuardar(mesaId, nombreTrimmed);
      
      // Verificar si la función retornó un resultado
      if (result && result.success) {
        setNombreCliente('');
        onCancelar(); // Cerrar modal
      } else if (result && result.error) {
        setError(`❌ Error: ${result.error}`);
      } else {
        // Si la función no retornó nada, asumimos que funcionó
        setNombreCliente('');
        onCancelar();
      }
    } catch (error) {
      console.error('Error al guardar reserva:', error);
      setError(`❌ Error al guardar la reserva: ${error.message || 'Error desconocido'}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="formulario-reserva-simple" onSubmit={handleSubmit}>
      <div className="reserva-header">
        <h3>📅 Reservar Mesa {mesaId}</h3>
      </div>
      
      <div className="campo-form">
        <label htmlFor="nombreCliente">
          👤 Nombre del Cliente <span className="obligatorio">*</span>
        </label>
        <input
          id="nombreCliente"
          type="text"
          placeholder="Ej: Juan Pérez"
          value={nombreCliente}
          onChange={(e) => {
            setNombreCliente(e.target.value);
            if (error) setError('');
          }}
          disabled={enviando}
          autoFocus
          className={error ? 'error' : ''}
          maxLength="100"
        />
        {error && <span className="mensaje-error">{error}</span>}
      </div>

      <div className="info-reserva">
        <div className="info-item">
          <span>📅 Fecha:</span>
          <strong>{fechaFormateada}</strong>
        </div>
        <div className="info-item">
          <span>🕐 Hora:</span>
          <strong>{horaFormateada}</strong>
        </div>
        <div className="info-item">
          <span>👤 Personas:</span>
          <strong>1 (por defecto)</strong>
        </div>
        <div className="info-nota">
          <small>💡 La fecha y hora se cargan automáticamente con la hora actual</small>
        </div>
      </div>

      <div className="acciones-formulario">
        <button 
          type="submit" 
          className="btn-guardar-reserva"
          disabled={enviando}
        >
          {enviando ? '⏳ Guardando...' : '✅ Reservar Ahora'}
        </button>
        <button 
          type="button" 
          className="btn-cancelar-reserva"
          onClick={onCancelar}
          disabled={enviando}
        >
          ❌ Cancelar
        </button>
      </div>
    </form>
  );
};

export default FormularioReservaSimple;