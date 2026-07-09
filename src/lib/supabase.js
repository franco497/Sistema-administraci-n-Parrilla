export const getRedirectUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  // ✅ CORRECCIÓN: Detectar localhost correctamente
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  console.log("📍 Detectando entorno:", { hostname, port, isLocal });

  if (isLocal) {
    // ✅ CORRECCIÓN: Incluir el # para HashRouter
    return `${protocol}//${hostname}:${port}/#/auth/callback`;
  }

  // ✅ CORRECCIÓN: Incluir el # para HashRouter en producción
  return "https://sistema-admin-parrilla-milver.netlify.app/#/auth/callback";
};