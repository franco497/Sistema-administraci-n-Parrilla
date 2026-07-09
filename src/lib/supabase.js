import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 Verificando conexión Supabase:");
console.log("URL:", supabaseUrl);
console.log("Key existe:", !!supabaseAnonKey);

// ✅ EXPORTACIÓN CORRECTA
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getRedirectUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  // Detectar localhost
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

  console.log("📍 Detectando entorno:", { hostname, port, isLocal });

  if (isLocal) {
    // ✅ CORRECCIÓN: SIN el # en la URL base
    // Supabase agregará el # con el token automáticamente
    return `${protocol}//${hostname}:${port}/auth/callback`;
  }

  // Producción
  return "https://sistema-admin-parrilla-milver.netlify.app/auth/callback";
};