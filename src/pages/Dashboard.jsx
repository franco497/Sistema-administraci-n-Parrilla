// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useRestaurante } from '../context/RestauranteContext';
import MenuPrincipal from '../components/MenuPrincipal/MenuPrincipal';
import GrillaMesas from '../components/Mesas/GrillaMesas';
import './Dashboard.css';

const Dashboard = () => {
  const { loading } = useRestaurante();
  const [vistaActual, setVistaActual] = useState('principal');

  const handleSeleccionarModulo = (moduloId) => {
    setVistaActual(moduloId);
  };

  const handleVolverMenu = () => {
    setVistaActual('principal');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Cargando sistema...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {vistaActual === 'principal' && (
        <MenuPrincipal onSeleccionarModulo={handleSeleccionarModulo} />
      )}

      {vistaActual === 'mesas' && (
        <GrillaMesas onVolver={handleVolverMenu} />
      )}

      {vistaActual === 'cargar' && (
        <div className="seccion-en-construccion">
          <button className="btn-volver" onClick={handleVolverMenu}>
            ⬅ Volver al Menú
          </button>
          <h2>📦 Cargar Mercadería</h2>
          <p>Próximamente: Formulario para cargar compras</p>
        </div>
      )}

      {vistaActual === 'stock' && (
        <div className="seccion-en-construccion">
          <button className="btn-volver" onClick={handleVolverMenu}>
            ⬅ Volver al Menú
          </button>
          <h2>📊 Ver Stock</h2>
          <p>Próximamente: Tabla de inventario con alertas</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;