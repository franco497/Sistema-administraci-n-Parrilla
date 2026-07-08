import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  

console.log("🔍 Verificando conexión Supabase:");
console.log("URL:", supabaseUrl);
console.log("Key existe:", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 

export const getRedirectUrl = () => {
  // ✅ Obtener toda la información del entorno
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  const href = window.location.href;

  // ✅ Múltiples formas de detectar localhost
  const isLocal = 
    hostname === "localhost" || 
    hostname === "127.0.0.1" || 
    hostname === "0.0.0.0" ||
    hostname.includes("local");

  // ✅ LOGS EXTENSOS para depuración
  console.log("🔍 DEBUG - Información del entorno:");
  console.log("  - hostname:", hostname);
  console.log("  - port:", port);
  console.log("  - protocol:", protocol);
  console.log("  - href:", href);
  console.log("  - isLocal:", isLocal);
  console.log("  - window.location.origin:", window.location.origin);

  let redirectUrl;

  if (isLocal) {
    redirectUrl = `${protocol}//${hostname}:${port}/#/auth/callback`;
  } else {
    redirectUrl = "https://sistema-admin-parrilla-milver.netlify.app/#/auth/callback";
  }

  console.log("✅ Redirect URL final:", redirectUrl);
  return redirectUrl;
};