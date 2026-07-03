// src/components/LogoutButton.jsx
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmar = confirm("¿Seguro que quieres cerrar sesión?");
    if (confirmar) {
      await supabase.auth.signOut();
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn-logout"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "rgba(231, 111, 81, 0.2)",
        color: "white",
        border: "1px solid rgba(231, 111, 81, 0.4)",
        padding: "10px 20px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "0.95rem",
        transition: "all 0.3s ease",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backdropFilter: "blur(10px)",
      }}
      onMouseEnter={(e) => {
        e.target.style.background = "rgba(231, 111, 81, 0.4)";
        e.target.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "rgba(231, 111, 81, 0.2)";
        e.target.style.transform = "translateY(0)";
      }}
    >
      <span>🚪</span>
      <span>Cerrar Sesión</span>
    </button>
  );
};

export default LogoutButton;
