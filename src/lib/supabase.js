import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 Verificando conexión Supabase:");
console.log("URL:", supabaseUrl);
console.log("Key existe:", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getRedirectUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  // ✅ CORRECCIÓN: Detectar correctamente localhost
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  console.log("📍 Detectando entorno:", { hostname, port, isLocal });

  if (isLocal) {
    // ✅ CORRECCIÓN: Incluir el # para HashRouter
    return `${protocol}//${hostname}:${port}/#/auth/callback`;
  }

  // ✅ CORRECCIÓN: Incluir el # para HashRouter en producción
  return "https://sistema-admin-parrilla-milver.netlify.app/#/auth/callback";
};
