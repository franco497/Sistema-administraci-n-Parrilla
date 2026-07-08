import { useState } from "react";
import { supabase, getRedirectUrl } from "../lib/supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // ✅ Asegurarse de que getRedirectUrl se ejecute en el momento del envío
      const redirectUrl = getRedirectUrl();
      
      console.log("📧 Enviando magic link a:", email);
      console.log("🔗 Redirect URL (desde Login):", redirectUrl);

      // ✅ Verificar que la URL sea correcta antes de enviar
      if (!redirectUrl || !redirectUrl.startsWith('http')) {
        throw new Error(`URL de redirección inválida: ${redirectUrl}`);
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      console.log("📦 Respuesta de Supabase:", data);

      if (error) throw error;

      setMessage(`✨ ¡Magic link enviado a ${email}! Revisa tu correo.`);
      setEmail("");
    } catch (err) {
      console.error("❌ Error completo:", err);
      setError(err.message || "Error al enviar el magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Inicia Sesion con Magic Link, solo ingresa tu E-mail:</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="login-input"
          />
        </div>

        <button type="submit" disabled={loading} className="login-button">
          {loading ? "Enviando..." : "Enviar Magic Link"}
        </button>

        {message && <div className="login-message success">{message}</div>}
        {error && <div className="login-message error">❌ {error}</div>}
      </form>
    </div>
  );
}

export default Login;