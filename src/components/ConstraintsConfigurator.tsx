import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function ConstraintsConfigurator() {
  const [maxHours, setMaxHours] = useState(2);
  const [allowConsecutive, setAllowConsecutive] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const h = await invoke<number>("get_global_max_daily_hours");
      const c = await invoke<boolean>("get_allow_consecutive_subjects");
      setMaxHours(h);
      setAllowConsecutive(c);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave() {
    try {
      await Promise.all([
        invoke("set_global_max_daily_hours", { hours: parseInt(maxHours.toString()) }),
        invoke("set_allow_consecutive_subjects", { allow: allowConsecutive })
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert("Erreur: " + err);
    }
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>⚖️ Règles & Contraintes Globales</h2>
      
      <div style={{ marginBottom: "2rem" }}>
        <h3>Pédagogie</h3>
        <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: "1rem" }}>
          Ces règles s'appliquent à toutes les classes et toutes les matières.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Règle 1: Max Heures */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(128,128,128,0.05)", padding: "1rem", borderRadius: "8px" }}>
                <div style={{ flex: 1 }}>
                    <strong>Limite journalière par matière</strong>
                    <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
                    Nombre maximum de créneaux d'une même matière par jour.
                    </p>
                </div>
                <input 
                    type="number" min="1" max="8" 
                    value={maxHours} 
                    onChange={e => setMaxHours(parseInt(e.target.value))}
                    style={{ width: "60px", padding: "0.5rem" }}
                />
            </div>

            {/* Règle 2: Consécutifs */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(128,128,128,0.05)", padding: "1rem", borderRadius: "8px" }}>
                <div style={{ flex: 1 }}>
                    <strong>Autoriser les cours consécutifs</strong>
                    <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
                    Permet d'avoir 2h de la même matière à la suite (ex: 8h-10h).
                    </p>
                </div>
                <input 
                    type="checkbox" 
                    checked={allowConsecutive} 
                    onChange={e => setAllowConsecutive(e.target.checked)}
                    style={{ width: "24px", height: "24px", cursor: "pointer" }}
                />
            </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        style={{ 
          padding: "0.8rem 1.5rem", 
          backgroundColor: saved ? "#10b981" : "#646cff", 
          color: "white", 
          border: "none", 
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "background 0.3s",
          width: "100%"
        }}
      >
        {saved ? "Sauvegardé !" : "Enregistrer la configuration"}
      </button>
    </div>
  );
}