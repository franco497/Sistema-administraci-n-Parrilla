import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AuthCallback() {
  const [status, setStatus] = useState("Verificando tu login...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("📍 AuthCallback - URL completa:", window.location.href);
        console.log("📍 AuthCallback - Hash:", window.location.hash);
        
        // ✅ Obtener tokens del hash CORRECTAMENTE
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log("🔍 Tokens encontrados:", { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken, 
          type,
          hash: hash
        });

        // ✅ Si hay tokens, establecer sesión
        if (accessToken) {
          setStatus("✅ Estableciendo sesión...");
          
          console.log("🔄 Estableciendo sesión con token:", accessToken.substring(0, 20) + "...");
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error("❌ Error al establecer sesión:", error);
            throw error;
          }
          
          console.log("✅ Sesión establecida:", data);
          setStatus("✅ ¡Login exitoso! Redirigiendo...");
          
          setTimeout(() => {
            window.location.href = "/#/dashboard";
          }, 1500);
          
          return;
        }

        // ✅ Si no hay tokens, obtener sesión existente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Error al obtener sesión:", sessionError);
          throw sessionError;
        }
        
        if (session) {
          console.log("✅ Sesión existente encontrada:", session);
          setStatus("✅ ¡Sesión activa! Redirigiendo...");
          setTimeout(() => {
            window.location.href = "/#/dashboard";
          }, 1500);
          return;
        }

        // ✅ No hay sesión
        console.warn("⚠️ No se encontró sesión ni tokens");
        setStatus("❌ No se pudo autenticar. Redirigiendo al login...");
        setTimeout(() => {
          window.location.href = "/#/";
        }, 2000);

      } catch (err) {
        console.error("❌ Error en callback:", err);
        setError(err.message);
        setStatus("❌ Error de autenticación");
        setTimeout(() => {
          window.location.href = "/#/";
        }, 3000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="auth-callback-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      padding: '20px'
    }}>
      {/* Spinner */}
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <h2 style={{ color: error ? '#e74c3c' : '#2c3e50' }}>{status}</h2>
      
      {error && (
        <p style={{ color: '#e74c3c', marginTop: '10px', fontSize: '14px' }}>
          Error: {error}
        </p>
      )}
    </div>
  );
}

export default AuthCallback;