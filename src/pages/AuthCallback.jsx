// src/pages/AuthCallback.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AuthCallback() {
  const [status, setStatus] = useState("Verificando tu login...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Procesando callback de autenticación...");
        
        // Obtener la sesión
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Error de sesión:", sessionError);
          throw sessionError;
        }

        if (session) {
          console.log("✅ Sesión obtenida:", session.user.email);
          setStatus("✅ Login exitoso! Redirigiendo...");
          
          // Redirigir al dashboard
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        } else {
          console.warn("⚠️ No hay sesión activa");
          setStatus("❌ No se pudo autenticar. Redirigiendo...");
          
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      } catch (error) {
        console.error("❌ Error en callback:", error);
        setError(error.message || "Error de autenticación");
        setStatus("❌ Error de autenticación. Redirigiendo...");
        
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        {error ? (
          <>
            <h2 style={{ color: "#ef5350" }}>❌ Error</h2>
            <p>{error}</p>
            <p style={{ fontSize: "0.9rem", color: "#888" }}>{status}</p>
          </>
        ) : (
          <>
            <h2 style={{ color: "#4caf50" }}>🔄 Procesando...</h2>
            <p>{status}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;