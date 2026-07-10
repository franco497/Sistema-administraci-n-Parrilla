// src/App.jsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { RestauranteProvider } from "./context/RestauranteContext";
import Login from "./pages/login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import MesaView from "./pages/MesaView";  // ← IMPORTAR
import NotFound from "./pages/NotFound";

function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2 style={{ color: "white" }}>Cargando...</h2>
      </div>
    );
  }

  return (
    <RestauranteProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={!session ? <Login /> : <Navigate to="/dashboard" />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={session ? <Dashboard /> : <Navigate to="/" />}
          />
          {/* ✅ NUEVA RUTA: Vista de mesa */}
          <Route
            path="/mesa/:mesaId"
            element={session ? <MesaView /> : <Navigate to="/" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </RestauranteProvider>
  );
}

export default App;