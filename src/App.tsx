import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import Wizard from "./components/Wizard";
import Dashboard from "./components/Dashboard";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Vérifie l'état de la configuration au chargement
  async function checkConfiguration() {
    try {
      setIsLoading(true);
      const configured = await invoke<boolean>("check_is_configured");
      setIsConfigured(configured);
    } catch (error) {
      console.error("Erreur lors de la vérification de la config:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkConfiguration();
  }, []);

  if (isLoading) {
    return (
      <div className="container">
        <p>Chargement de Kronos...</p>
      </div>
    );
  }

  return (
    <main className="container">
      {isConfigured ? (
        <Dashboard />
      ) : (
        <Wizard onComplete={() => checkConfiguration()} />
      )}
    </main>
  );
}

export default App;