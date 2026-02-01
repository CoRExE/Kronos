import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function GenerationPanel() {
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleGenerate() {
    // Pas de confirm() ici non plus pour l'instant
    
    setGenerating(true);
    setStatus("Calcul en cours...");
    
    try {
      // 1. Appel du moteur
      await invoke("generate_schedule");
      setStatus("✅ Génération terminée avec succès !");
      
      // TODO: Rediriger vers la vue "Emploi du temps" (Phase 4)
    } catch (err) {
      console.error(err);
      setStatus("❌ Erreur : " + err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ padding: "2rem", border: "2px solid #646cff", borderRadius: "12px", marginTop: "2rem", textAlign: "center", backgroundColor: "rgba(100, 108, 255, 0.05)" }}>
      <h2>🚀 Génération</h2>
      <p style={{ marginBottom: "1.5rem" }}>
        Lancez l'algorithme pour créer l'emploi du temps optimal en fonction de vos contraintes.
      </p>

      <button 
        onClick={handleGenerate} 
        disabled={generating}
        style={{ 
          padding: "1rem 2rem", 
          fontSize: "1.2rem", 
          backgroundColor: generating ? "#ccc" : "#646cff", 
          color: "white", 
          border: "none", 
          borderRadius: "8px",
          cursor: generating ? "not-allowed" : "pointer",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        {generating ? "Calcul en cours..." : "Générer l'Emploi du Temps"}
      </button>

      {status && (
        <div style={{ marginTop: "1.5rem", fontWeight: "bold", padding: "1rem", borderRadius: "6px", background: status.startsWith("✅") ? "#d4edda" : "#f8d7da", color: status.startsWith("✅") ? "#155724" : "#721c24" }}>
          {status}
        </div>
      )}
    </div>
  );
}
