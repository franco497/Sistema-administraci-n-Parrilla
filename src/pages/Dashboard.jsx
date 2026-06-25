// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";

function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula una carga de 2 segundos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Limpia el temporizador cuando el componente se desmonte
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Cargando...</h2>
      </div>
    );
  }

  return (
    <div>
      <h1 className="panel-lettering">Bienvenido al panel del Sistema, Parrilla Milver</h1>
    </div>
  );
}

export default Dashboard;
