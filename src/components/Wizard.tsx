import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface WizardProps {
  onComplete: () => void;
}

type SchoolMode = "SINGLE_CLASS" | "MULTI_CLASS";

export default function Wizard({ onComplete }: WizardProps) {
  const [selectedMode, setSelectedMode] = useState<SchoolMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    if (!selectedMode) return;
    
    setIsSubmitting(true);
    try {
      await invoke("setup_app", { schoolMode: selectedMode });
      onComplete();
    } catch (error) {
      console.error("Failed to setup app:", error);
      alert("Erreur lors de la configuration: " + error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ textAlign: 'center', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Bienvenue sur Kronos 👋</h1>
      <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Pour commencer, quel type d'établissement gérez-vous ?</p>

      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '3rem' }}>
        
        {/* Option 1: Classe Unique */}
        <div 
            onClick={() => setSelectedMode("SINGLE_CLASS")}
            style={{ 
                padding: '1.5rem', 
                border: selectedMode === "SINGLE_CLASS" ? '3px solid #646cff' : '1px solid rgba(128,128,128,0.3)', 
                borderRadius: '12px', 
                cursor: 'pointer',
                background: selectedMode === "SINGLE_CLASS" ? 'rgba(100, 108, 255, 0.1)' : 'transparent',
                textAlign: 'left',
                width: '280px',
                transition: 'all 0.2s ease'
            }}
        >
            <h3 style={{ marginTop: 0 }}>🏫 Classe Unique</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Primaire / Maternelle.</p>
            <ul style={{ fontSize: '0.8rem', paddingLeft: '1.2rem', marginTop: '1rem', opacity: 0.7 }}>
                <li>Interface simplifiée</li>
                <li>Matières & Horaires uniquement</li>
            </ul>
        </div>

        {/* Option 2: Établissement */}
        <div 
            onClick={() => setSelectedMode("MULTI_CLASS")}
            style={{ 
                padding: '1.5rem', 
                border: selectedMode === "MULTI_CLASS" ? '3px solid #646cff' : '1px solid rgba(128,128,128,0.3)', 
                borderRadius: '12px', 
                cursor: 'pointer',
                background: selectedMode === "MULTI_CLASS" ? 'rgba(100, 108, 255, 0.1)' : 'transparent',
                textAlign: 'left',
                width: '280px',
                transition: 'all 0.2s ease'
            }}
        >
            <h3 style={{ marginTop: 0 }}>🏢 Établissement</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Collège / Lycée / Supérieur.</p>
            <ul style={{ fontSize: '0.8rem', paddingLeft: '1.2rem', marginTop: '1rem', opacity: 0.7 }}>
                <li>Gestion Profs & Salles</li>
                <li>Contraintes de collisions</li>
            </ul>
        </div>
      </div>

      <button 
        disabled={!selectedMode || isSubmitting}
        onClick={handleConfirm}
        style={{ 
            padding: '1rem 3rem', 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            borderRadius: '8px',
            backgroundColor: selectedMode ? '#646cff' : '#ccc',
            color: 'white',
            border: 'none',
            cursor: selectedMode ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.3s'
        }}
      >
        {isSubmitting ? "Configuration..." : "C'est parti ! 🚀"}
      </button>
    </div>
  );
}