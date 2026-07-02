// src/components/Mesas/MesaModal.jsx
import React, { useState, useEffect } from "react";
import { useRestaurante } from "../../context/RestauranteContext";
import FormularioReservaSimple from "./FormularioReservaSimple";
import { generarFacturaPDF } from "../../services/pdfService";
import "./MesaModal.css";

const MesaModal = ({ mesaId, onClose }) => {
  const {
    mesas,
    productos,
    categorias,
    pedidosActivos,
    agregarItemPedido,
    obtenerItemsPedido,
    cobrarPedido,
    cancelarPedido,
    crearReserva,
    cancelarReserva,
    obtenerReservaPorMesa,
    crearPedido,
  } = useRestaurante();

  const mesa = mesas[mesaId];
  const reservaExistente = obtenerReservaPorMesa(mesaId);
  const pedidoId = pedidosActivos[mesaId];

  // ✅ ESTADO LOCAL PARA EL NOMBRE DE LA RESERVA (PERSISTE DURANTE EL MODAL)
  const [nombreReservaLocal, setNombreReservaLocal] = useState("");

  const [adultos, setAdults] = useState(mesa.adultos || 0);
  const [menores, setMenores] = useState(mesa.menores || 0);
  const [itemsPedido, setItemsPedido] = useState([]);
  const [total, setTotal] = useState(0);
  const [mostrarFormularioReserva, setMostrarFormularioReserva] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [cantidades, setCantidades] = useState({});
  const [mensaje, setMensaje] = useState("");

  // ✅ INICIALIZAR nombreReservaLocal al abrir el modal
  useEffect(() => {
    console.log("🔄 useEffect - mesaId:", mesaId, "pedidoId:", pedidoId);

    // ✅ OBTENER RESERVA DESDE EL ESTADO GLOBAL
    const reservaActual = obtenerReservaPorMesa(mesaId);
    console.log("📌 Reserva actual para mesa", mesaId, ":", reservaActual);

    if (reservaActual) {
      console.log("📝 Reserva encontrada:", reservaActual.nombre_cliente);
      setNombreReservaLocal(reservaActual.nombre_cliente);
    } else if (mesa.reservaNombre) {
      console.log("📝 Usando mesa.reservaNombre:", mesa.reservaNombre);
      setNombreReservaLocal(mesa.reservaNombre);
    } else {
      console.log("📝 Sin reserva, nombre local vacío");
      setNombreReservaLocal("");
    }

    if (pedidoId) {
      cargarItemsPedido();
    } else {
      console.log("ℹ️ No hay pedido activo, resetando items");
      setItemsPedido([]);
      setTotal(0);
    }
  }, [pedidoId, mesaId, mesa.reservaNombre, obtenerReservaPorMesa]); // ✅ Agregar dependencias

  // Función para cargar items y calcular total
  const cargarItemsPedido = async () => {
    console.log(
      "🔄 cargarItemsPedido - mesaId:",
      mesaId,
      "pedidoId:",
      pedidoId,
    );

    if (!pedidoId) {
      console.log("ℹ️ No hay pedidoId, resetando");
      setItemsPedido([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setMensaje("🔄 Cargando pedido...");

    try {
      const result = await obtenerItemsPedido(mesaId);
      console.log("📥 Resultado de obtenerItemsPedido:", result);

      if (result.success) {
        const items = result.data || [];
        console.log("📊 Items recibidos:", items);
        setItemsPedido(items);

        const totalCalculado = items.reduce((sum, item) => {
          const subtotal = parseFloat(item.subtotal) || 0;
          return sum + subtotal;
        }, 0);

        console.log("💰 Total calculado:", totalCalculado);
        setTotal(totalCalculado);
        setMensaje(
          `✅ ${items.length} items cargados - Total: $${totalCalculado.toLocaleString()}`,
        );
      } else {
        console.error("❌ Error al cargar items:", result.error);
        setMensaje(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error cargando items:", error);
      setMensaje("❌ Error al cargar el pedido");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de cantidad
  const handleCantidadChange = (productoId, cantidad) => {
    setCantidades((prev) => ({
      ...prev,
      [productoId]: Math.max(0, parseInt(cantidad) || 0),
    }));
  };

  // ✅ Agregar item al pedido - SIN RECARGAR EL MODAL COMPLETO
  const handleAgregarItem = async (productoId) => {
    const cantidad = cantidades[productoId] || 0;
    console.log(
      "🔄 handleAgregarItem - productoId:",
      productoId,
      "cantidad:",
      cantidad,
    );

    if (cantidad <= 0) {
      setMensaje("⚠️ La cantidad debe ser mayor a 0");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setLoading(true);
    setMensaje("🔄 Agregando item...");

    try {
      console.log("📤 Llamando a agregarItemPedido...");
      const result = await agregarItemPedido(mesaId, productoId, cantidad);
      console.log("📥 Resultado de agregarItemPedido:", result);

      if (result.success) {
        setMensaje(`✅ ${cantidad}x agregado correctamente`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await cargarItemsPedido();
        setCantidades((prev) => ({ ...prev, [productoId]: 0 }));
        setTimeout(() => setMensaje(""), 2000);
      } else {
        console.error("❌ Error al agregar:", result.error);
        setMensaje(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error agregando item:", error);
      setMensaje("❌ Error al agregar el item");
    } finally {
      setLoading(false);
    }
  };

  // CALCULAR TOTAL
  const calcularTotal = async () => {
    console.log("🔄 CALCULAR TOTAL - mesaId:", mesaId, "pedidoId:", pedidoId);
    setMensaje("🔄 Calculando total...");
    setLoading(true);

    try {
      if (pedidoId) {
        console.log("📤 Cargando items desde la BD...");
        await cargarItemsPedido();
        console.log("✅ Total actualizado a:", total);
        setMensaje(`💰 Total calculado: $${total.toLocaleString()}`);
      } else {
        console.log("⚠️ No hay pedido activo");
        if (itemsPedido.length > 0) {
          const totalCalculado = itemsPedido.reduce((sum, item) => {
            return sum + (parseFloat(item.subtotal) || 0);
          }, 0);
          setTotal(totalCalculado);
          setMensaje(
            `💰 Total calculado (local): $${totalCalculado.toLocaleString()}`,
          );
        } else {
          setMensaje("⚠️ No hay items en el pedido");
        }
      }

      setTimeout(() => {
        if (!mensaje.includes("Error")) {
          setMensaje("");
        }
      }, 3000);
    } catch (error) {
      console.error("❌ Error calculando total:", error);
      setMensaje("❌ Error al calcular el total");
    } finally {
      setLoading(false);
    }
  };

  // Guardar (siguen comiendo)
  const handleGuardar = () => {
    if (itemsPedido.length === 0) {
      setMensaje("⚠️ No hay items para guardar");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setMensaje(`✅ Pedido guardado - Total: $${total.toLocaleString()}`);
    setTimeout(() => {
      setMensaje("");
      onClose();
    }, 1500);
  };

  // ✅ COBRAR Y LIBERAR - Usa nombreReservaLocal
  const handleCobrar = async () => {
    if (itemsPedido.length === 0) {
      setMensaje("⚠️ No hay items en el pedido para cobrar");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    // ✅ Usar el nombre de la reserva local o "Consumidor Final"
    const nombreCliente = nombreReservaLocal || "Consumidor Final";
    console.log("👤 Nombre del cliente para la factura:", nombreCliente);

    const confirmar = confirm(
      `¿Cobrar $${total.toLocaleString()} de la Mesa ${mesaId}?\n\n` +
        `Cliente: ${nombreCliente}\n` +
        `📄 Se generará una factura en PDF`,
    );

    if (!confirmar) return;

    setLoading(true);
    setMensaje("🔄 Procesando cobro y generando PDF...");

    try {
      const result = await cobrarPedido(mesaId);

      if (result.success) {
        const pedidoCompleto = {
          id_pedido: result.pedidoId,
          total: result.total,
          estado: "pagado",
          created_at: new Date().toISOString(),
        };

        try {
          generarFacturaPDF(pedidoCompleto, itemsPedido, mesaId, {
            nombre: nombreCliente,
          });
          console.log("✅ PDF generado correctamente para:", nombreCliente);
        } catch (pdfError) {
          console.error("❌ Error generando PDF:", pdfError);
          setMensaje("⚠️ Pedido cobrado pero hubo error al generar el PDF");
          setTimeout(() => setMensaje(""), 3000);
        }

        setMensaje(
          `✅ Pedido cobrado. Total: $${result.total.toLocaleString()}`,
        );
        setItemsPedido([]);
        setTotal(0);

        setTimeout(() => {
          setMensaje("");
          onClose();
        }, 2000);
      } else {
        setMensaje(`❌ Error al cobrar: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error cobrando:", error);
      setMensaje("❌ Error al procesar el cobro");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar pedido
  const handleCancelarPedido = async () => {
    if (!pedidoId) {
      setMensaje("⚠️ No hay pedido activo");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    const confirmar = confirm(`¿Cancelar el pedido de la Mesa ${mesaId}?`);
    if (!confirmar) return;

    setLoading(true);
    setMensaje("🔄 Cancelando pedido...");

    try {
      const result = await cancelarPedido(mesaId);
      if (result.success) {
        setMensaje("✅ Pedido cancelado");
        setItemsPedido([]);
        setTotal(0);
        setTimeout(() => {
          setMensaje("");
          onClose();
        }, 1500);
      } else {
        setMensaje(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cancelando:", error);
      setMensaje("❌ Error al cancelar el pedido");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancelar reserva - Limpia nombreReservaLocal
  const handleCancelarReserva = async () => {
    if (!reservaExistente) {
      setMensaje("⚠️ No hay reserva para cancelar");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    const confirmar = confirm(
      `¿Cancelar reserva de ${reservaExistente.nombre_cliente} en Mesa ${mesaId}?`,
    );
    if (!confirmar) return;

    setLoading(true);
    setMensaje("🔄 Cancelando reserva...");

    try {
      const result = await cancelarReserva(mesaId, reservaExistente.id_reserva);
      if (result.success) {
        setMensaje("✅ Reserva cancelada correctamente");
        setNombreReservaLocal(""); // ✅ LIMPIAR NOMBRE LOCAL
        setMostrarFormularioReserva(false);
        setTimeout(() => setMensaje(""), 2000);
      } else {
        setMensaje(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cancelando reserva:", error);
      setMensaje("❌ Error al cancelar la reserva");
    } finally {
      setLoading(false);
    }
  };

  // Agrupar productos por categoría
  const productosPorCategoria = {};
  categorias.forEach((cat) => {
    productosPorCategoria[cat.id_categoria] = {
      ...cat,
      productos: productos.filter(
        (p) => p.id_categoria === cat.id_categoria && p.disponible,
      ),
    };
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <h2>Mesa {mesaId}</h2>
          {pedidoId && <span className="badge-pedido">Pedido #{pedidoId}</span>}
          {mesa.estado === "ocupada" && (
            <span className="badge-ocupada">🟢 Ocupada</span>
          )}
          {/* ✅ Mostrar reserva usando nombreReservaLocal */}
          {nombreReservaLocal && (
            <span className="badge-reservada">📅 {nombreReservaLocal}</span>
          )}
        </div>

        {/* MENSAJE DE ESTADO */}
        {mensaje && (
          <div
            className={`mensaje-estado ${
              mensaje.includes("Error") || mensaje.includes("⚠️")
                ? "error"
                : "success"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* SECCIÓN DE RESERVA */}
        <div className="reserva-section">
          {nombreReservaLocal ? (
            // ✅ Usar nombreReservaLocal para mostrar la reserva
            <>
              <div className="reserva-activa">
                <div className="reserva-icono">📅</div>
                <div className="reserva-info">
                  <p className="reserva-cliente">
                    <strong>{nombreReservaLocal}</strong>
                  </p>
                  {reservaExistente && (
                    <p className="reserva-detalle">
                      <span>
                        🗓️{" "}
                        {new Date(
                          reservaExistente.fecha_reserva,
                        ).toLocaleDateString("es-AR")}
                      </span>
                      <span>🕐 {reservaExistente.hora_reserva}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                className="btn-cancelar"
                onClick={handleCancelarReserva}
                disabled={loading}
              >
                ❌ Cancelar Reserva
              </button>
            </>
          ) : (
            <div className="sin-reserva">
              {!mostrarFormularioReserva ? (
                <>
                  <p className="reserva-texto">🪑 Esta mesa está disponible</p>
                  <button
                    className="btn-reservar"
                    onClick={() => setMostrarFormularioReserva(true)}
                    disabled={loading}
                  >
                    📅 Reservar Mesa
                  </button>
                </>
              ) : (
                <FormularioReservaSimple
                  mesaId={mesaId}
                  onGuardar={crearReserva}
                  onCancelar={() => setMostrarFormularioReserva(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* MENÚ DE PRODUCTOS */}
        <h4>🍽️ Menú</h4>
        <div className="menu-productos">
          {Object.values(productosPorCategoria).map(
            (categoria) =>
              categoria.productos.length > 0 && (
                <div key={categoria.id_categoria} className="categoria-menu">
                  <h5>{categoria.nombre}</h5>
                  <div className="productos-lista">
                    {categoria.productos.map((producto) => (
                      <div key={producto.id_producto} className="producto-item">
                        <div className="producto-info">
                          <span className="producto-nombre">
                            {producto.nombre}
                          </span>
                          <span className="producto-precio">
                            ${producto.precio.toLocaleString()}
                          </span>
                        </div>
                        <div className="producto-accion">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={cantidades[producto.id_producto] || 0}
                            onChange={(e) =>
                              handleCantidadChange(
                                producto.id_producto,
                                e.target.value,
                              )
                            }
                            disabled={loading}
                          />
                          <button
                            className="btn-agregar"
                            onClick={() =>
                              handleAgregarItem(producto.id_producto)
                            }
                            disabled={
                              loading || !(cantidades[producto.id_producto] > 0)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>

        {/* LISTA DE ITEMS DEL PEDIDO */}
        {itemsPedido.length > 0 && (
          <>
            <h4>📋 Pedido Actual</h4>
            <div className="items-pedido">
              {itemsPedido.map((item) => (
                <div key={item.id_detalle} className="item-pedido">
                  <span className="item-cantidad">{item.cantidad}x</span>
                  <span className="item-nombre">
                    {item.productos?.nombre || "Producto"}
                  </span>
                  <span className="item-subtotal">
                    ${parseFloat(item.subtotal).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TOTAL */}
        <div className="total-display">
          <span>💰 Total a Pagar:</span>
          <span className="total-monto">${total.toLocaleString()}</span>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="modal-acciones">
          <button
            className="btn-calcular"
            onClick={calcularTotal}
            disabled={loading}
          >
            {loading ? "⏳ Calculando..." : "1. Calcular Total"}
          </button>
          <button
            className="btn-guardar"
            onClick={handleGuardar}
            disabled={loading || itemsPedido.length === 0}
          >
            2. Guardar (Siguen comiendo)
          </button>
          <button
            className="btn-cobrar"
            onClick={handleCobrar}
            disabled={loading || itemsPedido.length === 0}
          >
            💳 3. Cobrar y Liberar
          </button>
          {pedidoId && (
            <button
              className="btn-cancelar-pedido"
              onClick={handleCancelarPedido}
              disabled={loading}
            >
              ❌ Cancelar Pedido
            </button>
          )}
          <button className="btn-cerrar" onClick={onClose} disabled={loading}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MesaModal;
