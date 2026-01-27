import { invoke } from "@tauri-apps/api/core";

interface WizardProps {
  onComplete: () => void;
}

export default function Wizard({ onComplete }: WizardProps) {

  async function handleSelectMode(mode: "SINGLE_CLASS" | "MULTI_CLASS") {
    try {
      // Appel vers le Rust
      await invoke("setup_app", { schoolMode: mode });
      // Si succès, on notifie le parent pour changer d'écran
      onComplete();
    } catch (error) {
      console.error("Failed to setup app:", error);
      alert("Erreur lors de la configuration: " + error);
    }
  }

  return (
    <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Bienvenue sur Kronos 👋</h1>
      <p>Pour commencer, quel type d'établissement gérez-vous ?</p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem' }}>
        
        {/* Option 1: Classe Unique */}
        <button 
            className="card"
            onClick={() => handleSelectMode("SINGLE_CLASS")}
            style={{ 
                padding: '2rem', 
                border: '2px solid #ccc', 
                borderRadius: '12px', 
                cursor: 'pointer',
                background: 'transparent',
                textAlign: 'left',
                maxWidth: '300px'
            }}
        >
            <h3>🏫 Classe Unique</h3>
            <p style={{ opacity: 0.8 }}>Idéal pour le Primaire ou Maternelle.</p>
            <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem', marginTop: '1rem', opacity: 0.7 }}>
                <li>Interface simplifiée</li>
                <li>Pas de gestion des professeurs</li>
                <li>Pas de gestion des salles</li>
            </ul>
        </button>

        {/* Option 2: Établissement */}
        <button 
             className="card"
            onClick={() => handleSelectMode("MULTI_CLASS")}
            style={{ 
                padding: '2rem', 
                border: '2px solid #646cff', 
                borderRadius: '12px', 
                cursor: 'pointer',
                background: 'transparent',
                textAlign: 'left',
                maxWidth: '300px'
            }}
        >
            <h3>🏢 Établissement</h3>
            <p style={{ opacity: 0.8 }}>Collège, Lycée ou Supérieur.</p>
            <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem', marginTop: '1rem', opacity: 0.7 }}>
                <li>Gestion des conflits (Profs/Salles)</li>
                <li>Contraintes avancées</li>
                <li>Emplois du temps multiples</li>
            </ul>
        </button>

      </div>
    </div>
  );
}
