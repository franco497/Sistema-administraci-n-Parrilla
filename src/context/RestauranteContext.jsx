// src/context/RestauranteContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const RestauranteContext = createContext();

export const useRestaurante = () => {
  const context = useContext(RestauranteContext);
  if (!context) {
    throw new Error("useRestaurante debe usarse dentro de RestauranteProvider");
  }
  return context;
};

// Estado inicial de mesas (44 mesas)
const crearEstadoInicialMesas = () => {
  const mesas = {};
  for (let i = 1; i <= 44; i++) {
    mesas[i] = {
      id: i,
      estado: "disponible", // disponible | ocupada | reservada
      adultos: 0,
      menores: 0,
      consumos: {},
      reservaId: null,
      reservaNombre: "",
    };
  }
  return mesas;
};

export const RestauranteProvider = ({ children }) => {
  const [mesas, setMesas] = useState(crearEstadoInicialMesas);
  const [reservas, setReservas] = useState([]);
  const [inventario, setInventario] = useState([
    { id: 1, nombre: "Parrillada Mixta", precio: 15000, stock: 20 },
    { id: 2, nombre: "Vino Tinto", precio: 4500, stock: 15 },
    { id: 3, nombre: "Gaseosa 1L", precio: 2000, stock: 50 },
    { id: 4, nombre: "Ensalada Mixta", precio: 8000, stock: 10 },
    { id: 5, nombre: "Papas Fritas", precio: 6000, stock: 25 },
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
  const [diaActual, setDiaActual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  // Obtener sesión del usuario
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  // Cargar reservas desde Supabase al iniciar
  useEffect(() => {
    if (session) {
      cargarReservas();
    }
  }, [session]);

  const cargarReservas = async () => {
    setLoading(true);
    try {
      // Cargar reservas activas (pendientes y confirmadas)
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .in("estado", ["pendiente", "confirmada"])
        .order("fecha_reserva", { ascending: true });

      if (error) throw error;

      setReservas(data);

      // Actualizar estado de las mesas con reservas activas
      const nuevasMesas = { ...mesas };
      data.forEach((reserva) => {
        if (nuevasMesas[reserva.id_mesa]) {
          nuevasMesas[reserva.id_mesa] = {
            ...nuevasMesas[reserva.id_mesa],
            estado: "reservada",
            reservaId: reserva.id_reserva,
            reservaNombre: reserva.nombre_cliente,
          };
        }
      });
      setMesas(nuevasMesas);

      console.log("✅ Reservas cargadas:", data.length);
    } catch (error) {
      console.error("❌ Error cargando reservas:", error);
    } finally {
      setLoading(false);
    }
  };

  // src/context/RestauranteContext.jsx - ACTUALIZAR LA FUNCIÓN crearReserva

  // --- FUNCIÓN: Crear nueva reserva (SOLO CON NOMBRE) ---
  const crearReserva = async (mesaId, nombreCliente) => {
    try {
      console.log(
        "📝 Creando reserva para mesa:",
        mesaId,
        "Cliente:",
        nombreCliente,
      );

      // Validación mejorada
      if (!mesaId) {
        throw new Error("El ID de la mesa es obligatorio");
      }

      if (
        !nombreCliente ||
        typeof nombreCliente !== "string" ||
        nombreCliente.trim() === ""
      ) {
        throw new Error("El nombre del cliente es obligatorio");
      }

      // Limpiar el nombre
      const nombreLimpio = nombreCliente.trim();

      // Obtener fecha y hora actual
      const ahora = new Date();
      const fechaActual = ahora.toISOString().split("T")[0]; // YYYY-MM-DD
      const horaActual = ahora.toTimeString().slice(0, 5); // HH:MM

      console.log("📊 Datos a guardar:", {
        id_mesa: mesaId,
        nombre_cliente: nombreLimpio,
        fecha_reserva: fechaActual,
        hora_reserva: horaActual,
        cantidad_personas: 1,
        estado: "pendiente",
        creado_por: session?.user?.id,
      });

      const { data, error } = await supabase
        .from("reservas")
        .insert([
          {
            id_mesa: mesaId,
            nombre_cliente: nombreLimpio,
            fecha_reserva: fechaActual,
            hora_reserva: horaActual,
            cantidad_personas: 1,
            estado: "pendiente",
            creado_por: session?.user?.id,
          },
        ])
        .select();

      if (error) {
        console.error("❌ Error de Supabase:", error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error("No se pudo crear la reserva");
      }

      // Actualizar estado local
      const nuevaReserva = data[0];
      setReservas((prev) => [...prev, nuevaReserva]);

      // Actualizar estado de la mesa
      setMesas((prev) => ({
        ...prev,
        [mesaId]: {
          ...prev[mesaId],
          estado: "reservada",
          reservaId: nuevaReserva.id_reserva,
          reservaNombre: nombreLimpio,
        },
      }));

      console.log("✅ Reserva creada exitosamente:", nuevaReserva);
      return { success: true, data: nuevaReserva };
    } catch (error) {
      console.error("❌ Error creando reserva:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Cancelar reserva ---
  const cancelarReserva = async (mesaId, reservaId) => {
    try {
      // Si no tenemos el ID de la reserva, buscarlo en el estado
      if (!reservaId) {
        const reserva = reservas.find((r) => r.id_mesa === mesaId);
        if (!reserva) {
          throw new Error("No se encontró la reserva");
        }
        reservaId = reserva.id_reserva;
      }

      // Actualizar estado en Supabase
      const { error } = await supabase
        .from("reservas")
        .update({ estado: "cancelada" })
        .eq("id_reserva", reservaId);

      if (error) throw error;

      // Actualizar estado local
      setReservas((prev) => prev.filter((r) => r.id_reserva !== reservaId));

      // Liberar la mesa
      setMesas((prev) => ({
        ...prev,
        [mesaId]: {
          ...prev[mesaId],
          estado: "disponible",
          reservaId: null,
          reservaNombre: "",
        },
      }));

      console.log("✅ Reserva cancelada:", reservaId);
      return { success: true };
    } catch (error) {
      console.error("❌ Error cancelando reserva:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Obtener reserva por mesa ---
  const obtenerReservaPorMesa = (mesaId) => {
    return reservas.find((r) => r.id_mesa === mesaId);
  };

  // --- FUNCIONES EXISTENTES ---
  const cambiarEstadoMesa = (mesaId, nuevoEstado) => {
    setMesas((prev) => ({
      ...prev,
      [mesaId]: { ...prev[mesaId], estado: nuevoEstado },
    }));
  };

  const actualizarConsumosMesa = (mesaId, consumos, adultos, menores) => {
    setMesas((prev) => ({
      ...prev,
      [mesaId]: {
        ...prev[mesaId],
        adultos,
        menores,
        consumos,
      },
    }));
  };

  const cobrarMesa = (mesaId, total, detalle) => {
    const dias = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ];
    const dia = dias[diaActual];
    setHistorialSemanal((prev) => ({
      ...prev,
      [dia]: [
        ...prev[dia],
        { mesa: mesaId, total, detalle, fecha: new Date() },
      ],
    }));

    setMesas((prev) => ({
      ...prev,
      [mesaId]: {
        id: mesaId,
        estado: "disponible",
        adultos: 0,
        menores: 0,
        consumos: {},
        reservaId: null,
        reservaNombre: "",
      },
    }));
  };

  const value = {
    mesas,
    reservas,
    inventario,
    historialSemanal,
    diaActual,
    loading,
    session,
    setDiaActual,
    cambiarEstadoMesa,
    actualizarConsumosMesa,
    cobrarMesa,
    crearReserva,
    cancelarReserva,
    obtenerReservaPorMesa,
  };

  return (
    <RestauranteContext.Provider value={value}>
      {children}
    </RestauranteContext.Provider>
  );
};
