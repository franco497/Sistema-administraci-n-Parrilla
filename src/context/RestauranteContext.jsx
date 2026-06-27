// src/context/RestauranteContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const RestauranteContext = createContext();

export const useRestaurante = () => {
  const context = useContext(RestauranteContext);
  if (!context) {
    throw new Error('useRestaurante debe usarse dentro de RestauranteProvider');
  }
  return context;
};

// Estado inicial de mesas (44 mesas)
const crearEstadoInicialMesas = () => {
  const mesas = {};
  for (let i = 1; i <= 44; i++) {
    mesas[i] = {
      id: i,
      estado: 'disponible', // disponible | ocupada | reservada
      adultos: 0,
      menores: 0,
      consumos: {},
      reservaNombre: '',
      mozoId: null,
    };
  }
  return mesas;
};

export const RestauranteProvider = ({ children }) => {
  const [mesas, setMesas] = useState(crearEstadoInicialMesas);
  const [inventario, setInventario] = useState([
    { id: 1, nombre: 'Parrillada Mixta', precio: 15000, stock: 20 },
    { id: 2, nombre: 'Vino Tinto', precio: 4500, stock: 15 },
    { id: 3, nombre: 'Gaseosa 1L', precio: 2000, stock: 50 },
    { id: 4, nombre: 'Ensalada Mixta', precio: 8000, stock: 10 },
    { id: 5, nombre: 'Papas Fritas', precio: 6000, stock: 25 },
  ]);
  const [historialSemanal, setHistorialSemanal] = useState({
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: [],
    domingo: [],
  });
  const [diaActual, setDiaActual] = useState(0); // 0 = lunes
  const [loading, setLoading] = useState(false);

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Aquí cargarías los datos desde Supabase
      // Por ahora usamos datos locales
      console.log('📦 Cargando datos del restaurante...');
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar mesas
  const cambiarEstadoMesa = (mesaId, nuevoEstado) => {
    setMesas(prev => ({
      ...prev,
      [mesaId]: { ...prev[mesaId], estado: nuevoEstado }
    }));
  };

  const actualizarConsumosMesa = (mesaId, consumos, adultos, menores) => {
    setMesas(prev => ({
      ...prev,
      [mesaId]: {
        ...prev[mesaId],
        adultos,
        menores,
        consumos
      }
    }));
  };

  const reservarMesa = (mesaId, nombreCliente) => {
    setMesas(prev => ({
      ...prev,
      [mesaId]: {
        ...prev[mesaId],
        estado: 'reservada',
        reservaNombre: nombreCliente
      }
    }));
  };

  const cancelarReserva = (mesaId) => {
    setMesas(prev => ({
      ...prev,
      [mesaId]: {
        ...prev[mesaId],
        estado: 'disponible',
        reservaNombre: ''
      }
    }));
  };

  const cobrarMesa = (mesaId, total, detalle) => {
    const dia = Object.keys(historialSemanal)[diaActual];
    setHistorialSemanal(prev => ({
      ...prev,
      [dia]: [...prev[dia], { mesa: mesaId, total, detalle, fecha: new Date() }]
    }));

    // Liberar la mesa
    setMesas(prev => ({
      ...prev,
      [mesaId]: {
        id: mesaId,
        estado: 'disponible',
        adultos: 0,
        menores: 0,
        consumos: {},
        reservaNombre: '',
        mozoId: null
      }
    }));
  };

  // Funciones para inventario
  const agregarProducto = (producto) => {
    setInventario(prev => [...prev, { ...producto, id: Date.now() }]);
  };

  const actualizarProducto = (id, datos) => {
    setInventario(prev => prev.map(p => 
      p.id === id ? { ...p, ...datos } : p
    ));
  };

  const eliminarProducto = (id) => {
    setInventario(prev => prev.filter(p => p.id !== id));
  };

  const value = {
    mesas,
    inventario,
    historialSemanal,
    diaActual,
    loading,
    setDiaActual,
    cambiarEstadoMesa,
    actualizarConsumosMesa,
    reservarMesa,
    cancelarReserva,
    cobrarMesa,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
  };

  return (
    <RestauranteContext.Provider value={value}>
      {children}
    </RestauranteContext.Provider>
  );
};