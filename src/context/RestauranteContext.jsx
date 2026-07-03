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

// Estado inicial de mesas (47 mesas)
const crearEstadoInicialMesas = () => {
  const mesas = {};
  for (let i = 1; i <= 47; i++) {
    mesas[i] = {
      id: i,
      estado: "disponible",
      adultos: 0,
      menores: 0,
      pedidoId: null, // ID del pedido activo
      reservaId: null,
      reservaNombre: "",
    };
  }
  return mesas;
};

export const RestauranteProvider = ({ children }) => {
  const [mesas, setMesas] = useState(crearEstadoInicialMesas);
  const [reservas, setReservas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [pedidosActivos, setPedidosActivos] = useState({});
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

  // Cargar datos al iniciar
  useEffect(() => {
    if (session) {
      cargarDatosIniciales();
    }
  }, [session]);

  // --- FUNCIÓN: Cargar pedidos activos ---
  const cargarPedidosActivos = async () => {
    try {
      console.log("🔄 Cargando pedidos activos...");

      const { data, error } = await supabase
        .from("pedidos")
        .select("id_pedido, id_mesa, total")
        .eq("estado", "activo");

      if (error) {
        console.error("❌ Error cargando pedidos:", error);
        return;
      }

      console.log("📊 Pedidos activos encontrados:", data);

      // Actualizar pedidosActivos
      const nuevosPedidosActivos = {};
      data.forEach((pedido) => {
        nuevosPedidosActivos[pedido.id_mesa] = pedido.id_pedido;

        // Actualizar estado de las mesas
        setMesas((prev) => {
          const newState = {
            ...prev,
            [pedido.id_mesa]: {
              ...prev[pedido.id_mesa],
              estado: "ocupada",
              pedidoId: pedido.id_pedido,
            },
          };
          return newState;
        });
      });

      setPedidosActivos(nuevosPedidosActivos);
      console.log("✅ pedidosActivos actualizados:", nuevosPedidosActivos);
    } catch (error) {
      console.error("❌ Error cargando pedidos activos:", error);
    }
  };

  // --- FUNCIÓN: Cargar datos iniciales ---
  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      console.log("🔄 Cargando datos iniciales...");

      // 1. Cargar categorías
      const { data: categoriasData, error: catError } = await supabase
        .from("categorias")
        .select("*")
        .order("orden");

      if (catError) throw catError;
      setCategorias(categoriasData || []);
      console.log("✅ Categorías cargadas:", categoriasData?.length || 0);

      // 2. Cargar productos
      const { data: productosData, error: prodError } = await supabase
        .from("productos")
        .select("*")
        .order("nombre");

      if (prodError) throw prodError;
      setProductos(productosData || []);
      console.log("✅ Productos cargados:", productosData?.length || 0);

      // 3. Cargar reservas activas
      const { data: reservasData, error: resError } = await supabase
        .from("reservas")
        .select("*")
        .in("estado", ["pendiente", "confirmada"]);

      if (resError) throw resError;
      console.log("📊 Reservas activas encontradas:", reservasData);

      // ✅ GUARDAR reservas en el estado
      setReservas(reservasData || []);
      console.log("✅ Reservas cargadas:", reservasData?.length || 0);

      // 4. Cargar pedidos activos
      const { data: pedidosData, error: pedError } = await supabase
        .from("pedidos")
        .select("id_pedido, id_mesa, total")
        .eq("estado", "activo");

      if (pedError) throw pedError;
      console.log("📊 Pedidos activos encontrados:", pedidosData?.length || 0);

      // 5. ✅ CREAR EL ESTADO DE LAS MESAS DESDE CERO
      const nuevasMesas = {};

      // Inicializar todas las mesas (1-47)
      for (let i = 1; i <= 47; i++) {
        nuevasMesas[i] = {
          id: i,
          estado: "disponible",
          adultos: 0,
          menores: 0,
          consumos: {},
          reservaId: null,
          reservaNombre: "",
          pedidoId: null,
        };
      }

      // ✅ APLICAR RESERVAS (prioridad 1)
      reservasData.forEach((reserva) => {
        if (nuevasMesas[reserva.id_mesa]) {
          nuevasMesas[reserva.id_mesa] = {
            ...nuevasMesas[reserva.id_mesa],
            estado: "reservada",
            reservaId: reserva.id_reserva,
            reservaNombre: reserva.nombre_cliente,
          };
          console.log(
            `📌 Mesa ${reserva.id_mesa} → RESERVADA (${reserva.nombre_cliente})`,
          );
        }
      });

      // ✅ APLICAR PEDIDOS ACTIVOS (prioridad 2 - SOBREESCRIBE reservas)
      const nuevosPedidosActivos = {};
      pedidosData.forEach((pedido) => {
        nuevosPedidosActivos[pedido.id_mesa] = pedido.id_pedido;

        if (nuevasMesas[pedido.id_mesa]) {
          nuevasMesas[pedido.id_mesa] = {
            ...nuevasMesas[pedido.id_mesa],
            estado: "ocupada", // ← OCUPADA prevalece sobre RESERVADA
            pedidoId: pedido.id_pedido,
          };
          console.log(
            `🪑 Mesa ${pedido.id_mesa} → OCUPADA (Pedido #${pedido.id_pedido})`,
          );
        }
      });

      // ✅ ACTUALIZAR ESTADOS FINALES
      setMesas(nuevasMesas);
      setPedidosActivos(nuevosPedidosActivos);

      console.log("✅ Todos los datos cargados correctamente");
      console.log("📊 Estado final de mesas:", nuevasMesas);
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN: Crear nuevo pedido ---
  const crearPedido = async (mesaId) => {
    try {
      console.log("📝 Creando pedido para mesa:", mesaId);

      const { data, error } = await supabase
        .from("pedidos")
        .insert([
          {
            id_mesa: mesaId,
            estado: "activo",
            total: 0,
            creado_por: session?.user?.id,
          },
        ])
        .select();

      if (error) {
        console.error("❌ Error en Supabase:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("No se pudo crear el pedido");
      }

      const nuevoPedido = data[0];
      console.log("✅ Pedido creado:", nuevoPedido);

      // Actualizar estado local
      setPedidosActivos((prev) => {
        const newState = {
          ...prev,
          [mesaId]: nuevoPedido.id_pedido,
        };
        console.log("📊 pedidosActivos actualizado:", newState);
        return newState;
      });

      setMesas((prev) => {
        const newState = {
          ...prev,
          [mesaId]: {
            ...prev[mesaId],
            estado: "ocupada", // Cambiar a ocupada automáticamente
            pedidoId: nuevoPedido.id_pedido,
          },
        };
        console.log("🪑 Mesa actualizada:", newState[mesaId]);
        return newState;
      });

      return { success: true, data: nuevoPedido };
    } catch (error) {
      console.error("❌ Error creando pedido:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Agregar item al pedido ---
  const agregarItemPedido = async (mesaId, productoId, cantidad) => {
    try {
      console.log("📝 Agregando item:", { mesaId, productoId, cantidad });

      // Verificar si la mesa está reservada
      const mesaActual = mesas[mesaId];
      console.log("🪑 Estado de la mesa:", mesaActual?.estado);

      let pedidoId = pedidosActivos[mesaId];
      console.log("🔍 pedidoId actual:", pedidoId);

      // Si no hay pedido, crear uno (incluso si está reservada)
      if (!pedidoId) {
        console.log("🆕 No hay pedido, creando uno nuevo...");
        const result = await crearPedido(mesaId);
        if (!result.success) {
          throw new Error("No se pudo crear el pedido: " + result.error);
        }
        pedidoId = result.data.id_pedido;
        console.log("✅ Nuevo pedido creado con ID:", pedidoId);

        // Actualizar pedidosActivos localmente
        setPedidosActivos((prev) => {
          const newState = {
            ...prev,
            [mesaId]: pedidoId,
          };
          console.log("📊 pedidosActivos actualizado:", newState);
          return newState;
        });
      }

      // Buscar producto para obtener precio
      const producto = productos.find((p) => p.id_producto === productoId);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      console.log(
        "📦 Producto encontrado:",
        producto.nombre,
        "Precio:",
        producto.precio,
      );

      const precioUnitario = producto.precio;
      const subtotal = precioUnitario * cantidad;
      console.log("💰 Subtotal calculado:", subtotal);

      const { data, error } = await supabase
        .from("detalle_pedido")
        .insert([
          {
            id_pedido: pedidoId,
            id_producto: productoId,
            cantidad: cantidad,
            precio_unitario: precioUnitario,
            subtotal: subtotal,
          },
        ])
        .select();

      if (error) {
        console.error("❌ Error en Supabase al agregar item:", error);
        throw error;
      }

      console.log("✅ Item agregado:", data[0]);

      // Actualizar total del pedido
      await actualizarTotalPedido(pedidoId);

      return { success: true, data: data[0] };
    } catch (error) {
      console.error("❌ Error agregando item:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Actualizar total del pedido ---
  const actualizarTotalPedido = async (pedidoId) => {
    try {
      // Calcular total desde los detalles
      const { data: detalles, error: detError } = await supabase
        .from("detalle_pedido")
        .select("subtotal")
        .eq("id_pedido", pedidoId);

      if (detError) throw detError;

      const total = detalles.reduce((sum, item) => sum + item.subtotal, 0);

      const { error } = await supabase
        .from("pedidos")
        .update({ total: total })
        .eq("id_pedido", pedidoId);

      if (error) throw error;

      return { success: true, total };
    } catch (error) {
      console.error("❌ Error actualizando total:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Obtener items del pedido ---
  const obtenerItemsPedido = async (mesaId) => {
    try {
      const pedidoId = pedidosActivos[mesaId];
      console.log("🔍 Buscando items para pedido:", pedidoId, "Mesa:", mesaId);

      if (!pedidoId) {
        console.log("⚠️ No hay pedido activo para la mesa:", mesaId);
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from("detalle_pedido")
        .select(
          `
          *,
          productos (id_producto, nombre, precio)
        `,
        )
        .eq("id_pedido", pedidoId);

      if (error) {
        console.error("❌ Error en Supabase:", error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} items encontrados:`, data);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ Error obteniendo items:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Cobrar pedido ---

  const cobrarPedido = async (mesaId) => {
    try {
      console.log("🔄 cobrarPedido - mesaId:", mesaId);

      const pedidoId = pedidosActivos[mesaId];
      if (!pedidoId) {
        throw new Error("No hay pedido activo para esta mesa");
      }

      // 1. Obtener el total
      const { data: pedido, error: pedError } = await supabase
        .from("pedidos")
        .select("total")
        .eq("id_pedido", pedidoId)
        .single();

      if (pedError) throw pedError;

      // 2. Marcar pedido como pagado
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: "pagado" })
        .eq("id_pedido", pedidoId);

      if (error) throw error;

      // 3. ✅ BUSCAR SI LA MESA TIENE RESERVA ACTIVA
      const reservaActiva = reservas.find((r) => r.id_mesa === mesaId);
      console.log("📌 Reserva activa encontrada:", reservaActiva);

      // 4. ✅ SI HAY RESERVA → MARCARLA COMO COMPLETADA
      if (reservaActiva) {
        console.log(
          `📌 Completando reserva de ${reservaActiva.nombre_cliente} en mesa ${mesaId}`,
        );

        const { error: resError } = await supabase
          .from("reservas")
          .update({ estado: "completada" })
          .eq("id_reserva", reservaActiva.id_reserva);

        if (resError) {
          console.error("❌ Error completando reserva:", resError);
        } else {
          // ✅ Eliminar reserva del estado local
          setReservas((prev) =>
            prev.filter((r) => r.id_reserva !== reservaActiva.id_reserva),
          );
          console.log("✅ Reserva completada y eliminada del estado local");
        }
      }

      // 5. ✅ ACTUALIZAR MESA A DISPONIBLE (SIEMPRE)
      console.log(`🪑 Mesa ${mesaId} → DISPONIBLE`);
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
          pedidoId: null,
        },
      }));

      // 6. Eliminar pedido activo
      const newPedidosActivos = { ...pedidosActivos };
      delete newPedidosActivos[mesaId];
      setPedidosActivos(newPedidosActivos);

      console.log("✅ Pedido cobrado correctamente. Total:", pedido.total);
      return { success: true, total: pedido.total, pedidoId: pedidoId };
    } catch (error) {
      console.error("❌ Error cobrando pedido:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Cancelar pedido ---
  const cancelarPedido = async (mesaId) => {
    try {
      console.log("🔄 cancelarPedido - mesaId:", mesaId);

      const pedidoId = pedidosActivos[mesaId];
      if (!pedidoId) {
        throw new Error("No hay pedido activo");
      }

      // 1. Cancelar el pedido en la base de datos
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: "cancelado" })
        .eq("id_pedido", pedidoId);

      if (error) throw error;

      // 2. ✅ BUSCAR SI LA MESA TIENE RESERVA ACTIVA
      const reservaActiva = reservas.find((r) => r.id_mesa === mesaId);
      console.log("📌 Reserva activa encontrada:", reservaActiva);

      // 3. ✅ ACTUALIZAR ESTADO DE LA MESA
      setMesas((prev) => {
        // Si tiene reserva activa → volver a RESERVADA
        if (reservaActiva) {
          console.log(
            `📌 Mesa ${mesaId} → RESTAURANDO RESERVA (${reservaActiva.nombre_cliente})`,
          );
          return {
            ...prev,
            [mesaId]: {
              id: mesaId,
              estado: "reservada",
              adultos: 0,
              menores: 0,
              consumos: {},
              reservaId: reservaActiva.id_reserva,
              reservaNombre: reservaActiva.nombre_cliente,
              pedidoId: null,
            },
          };
        }
        // Si NO tiene reserva → disponible
        else {
          console.log(`🪑 Mesa ${mesaId} → DISPONIBLE (sin reserva)`);
          return {
            ...prev,
            [mesaId]: {
              id: mesaId,
              estado: "disponible",
              adultos: 0,
              menores: 0,
              consumos: {},
              reservaId: null,
              reservaNombre: "",
              pedidoId: null,
            },
          };
        }
      });

      // 4. Eliminar pedido activo
      const newPedidosActivos = { ...pedidosActivos };
      delete newPedidosActivos[mesaId];
      setPedidosActivos(newPedidosActivos);

      console.log("✅ Pedido cancelado correctamente");
      return { success: true };
    } catch (error) {
      console.error("❌ Error cancelando pedido:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Crear reserva ---
  const crearReserva = async (mesaId, nombreCliente) => {
    try {
      if (!nombreCliente || !nombreCliente.trim()) {
        throw new Error("El nombre del cliente es obligatorio");
      }

      const ahora = new Date();
      const { data, error } = await supabase
        .from("reservas")
        .insert([
          {
            id_mesa: mesaId,
            nombre_cliente: nombreCliente.trim(),
            fecha_reserva: ahora.toISOString().split("T")[0],
            hora_reserva: ahora.toTimeString().slice(0, 5),
            cantidad_personas: 1,
            estado: "pendiente",
            creado_por: session?.user?.id,
          },
        ])
        .select();

      if (error) throw error;

      const nuevaReserva = data[0];
      setReservas((prev) => [...prev, nuevaReserva]);

      setMesas((prev) => ({
        ...prev,
        [mesaId]: {
          ...prev[mesaId],
          estado: "reservada",
          reservaId: nuevaReserva.id_reserva,
          reservaNombre: nombreCliente.trim(),
        },
      }));

      return { success: true, data: nuevaReserva };
    } catch (error) {
      console.error("❌ Error creando reserva:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Cancelar reserva ---
  const cancelarReserva = async (mesaId, reservaId) => {
    try {
      console.log(
        "🔄 cancelarReserva - mesaId:",
        mesaId,
        "reservaId:",
        reservaId,
      );

      if (!reservaId) {
        const reserva = reservas.find((r) => r.id_mesa === mesaId);
        if (!reserva) throw new Error("No se encontró la reserva");
        reservaId = reserva.id_reserva;
      }

      // 1. Cancelar reserva en Supabase
      const { error } = await supabase
        .from("reservas")
        .update({ estado: "cancelada" })
        .eq("id_reserva", reservaId);

      if (error) throw error;

      // 2. ✅ ELIMINAR RESERVA DEL ESTADO LOCAL
      setReservas((prev) => prev.filter((r) => r.id_reserva !== reservaId));

      // 3. ✅ ACTUALIZAR MESA A DISPONIBLE (si no tiene pedido activo)
      setMesas((prev) => {
        const mesaActual = prev[mesaId];

        // Si la mesa tiene pedido activo → mantener OCUPADA
        if (mesaActual.pedidoId) {
          console.log(`🪑 Mesa ${mesaId} → OCUPADA (pedido activo)`);
          return {
            ...prev,
            [mesaId]: {
              ...mesaActual,
              reservaId: null,
              reservaNombre: "",
            },
          };
        }
        // Si no tiene pedido → DISPONIBLE
        else {
          console.log(`🪑 Mesa ${mesaId} → DISPONIBLE (sin reserva)`);
          return {
            ...prev,
            [mesaId]: {
              id: mesaId,
              estado: "disponible",
              adultos: 0,
              menores: 0,
              consumos: {},
              reservaId: null,
              reservaNombre: "",
              pedidoId: null,
            },
          };
        }
      });

      console.log("✅ Reserva cancelada correctamente");
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

  const value = {
    mesas,
    reservas,
    productos,
    categorias,
    pedidosActivos,
    loading,
    session,
    crearPedido,
    agregarItemPedido,
    obtenerItemsPedido,
    cobrarPedido,
    cancelarPedido,
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
