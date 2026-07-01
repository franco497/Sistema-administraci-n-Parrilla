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
      setReservas(reservasData || []);
      console.log("✅ Reservas cargadas:", reservasData?.length || 0);

      // 4. 🔥 Cargar pedidos activos
      await cargarPedidosActivos();

      console.log("✅ Todos los datos cargados correctamente");
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
      const pedidoId = pedidosActivos[mesaId];
      if (!pedidoId) {
        throw new Error("No hay pedido activo para esta mesa");
      }

      // Obtener el total antes de cobrar
      const { data: pedido, error: pedError } = await supabase
        .from("pedidos")
        .select("total")
        .eq("id_pedido", pedidoId)
        .single();

      if (pedError) throw pedError;

      // Marcar pedido como pagado
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: "pagado" })
        .eq("id_pedido", pedidoId);

      if (error) throw error;

      // Liberar mesa
      setMesas((prev) => ({
        ...prev,
        [mesaId]: {
          id: mesaId,
          estado: "disponible",
          adultos: 0,
          menores: 0,
          pedidoId: null,
          reservaId: null,
          reservaNombre: "",
        },
      }));

      // Eliminar pedido activo
      const newPedidosActivos = { ...pedidosActivos };
      delete newPedidosActivos[mesaId];
      setPedidosActivos(newPedidosActivos);

      return {
        success: true,
        total: pedido.total,
        pedidoId: pedidoId,
      };
    } catch (error) {
      console.error("❌ Error cobrando pedido:", error);
      return { success: false, error: error.message };
    }
  };

  // --- FUNCIÓN: Cancelar pedido ---
  const cancelarPedido = async (mesaId) => {
    try {
      const pedidoId = pedidosActivos[mesaId];
      if (!pedidoId) {
        throw new Error("No hay pedido activo");
      }

      const { error } = await supabase
        .from("pedidos")
        .update({ estado: "cancelado" })
        .eq("id_pedido", pedidoId);

      if (error) throw error;

      // Liberar mesa
      setMesas((prev) => ({
        ...prev,
        [mesaId]: {
          id: mesaId,
          estado: "disponible",
          adultos: 0,
          menores: 0,
          pedidoId: null,
          reservaId: null,
          reservaNombre: "",
        },
      }));

      const newPedidosActivos = { ...pedidosActivos };
      delete newPedidosActivos[mesaId];
      setPedidosActivos(newPedidosActivos);

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
      if (!reservaId) {
        const reserva = reservas.find((r) => r.id_mesa === mesaId);
        if (!reserva) throw new Error("No se encontró la reserva");
        reservaId = reserva.id_reserva;
      }

      const { error } = await supabase
        .from("reservas")
        .update({ estado: "cancelada" })
        .eq("id_reserva", reservaId);

      if (error) throw error;

      setReservas((prev) => prev.filter((r) => r.id_reserva !== reservaId));

      setMesas((prev) => ({
        ...prev,
        [mesaId]: {
          ...prev[mesaId],
          estado: "disponible",
          reservaId: null,
          reservaNombre: "",
        },
      }));

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
