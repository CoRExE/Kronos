import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// On type la structure que le Rust nous renvoie (voir models.rs)
interface Subject {
  id: number;
  name: string;
  short_code?: string | null;
  color: string;
}

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [color, setColor] = useState("#3b82f6");

  // Charger la liste
  async function fetchSubjects() {
    try {
      setLoading(true);
      const data = await invoke<Subject[]>("get_all_subjects");
      setSubjects(data);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoading(false);
    }
  }

  // Créer une matière
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    try {
      await invoke("create_subject", { 
        name, 
        shortCode: shortCode || null, 
        color 
      });
      
      // Reset form
      setName("");
      setShortCode("");
      setColor("#3b82f6");
      
      // Reload list
      fetchSubjects();
    } catch (err) {
      alert("Erreur création: " + err);
    }
  }

  // Supprimer
  async function handleDelete(id: number) {
    try {
      await invoke('delete_subject', { id });
      await fetchSubjects();
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>📚 Gestion des Matières</h2>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <input 
          type="text" 
          placeholder="Nom (ex: Mathématiques)" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
          style={{ padding: "0.6rem", flex: 1, minWidth: "200px" }}
        />
        <input 
          type="text" 
          placeholder="Code (ex: MATH)" 
          value={shortCode} 
          onChange={e => setShortCode(e.target.value)} 
          style={{ padding: "0.6rem", width: "100px" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid #ccc", padding: "4px", borderRadius: "4px" }}>
            <input 
            type="color" 
            value={color} 
            onChange={e => setColor(e.target.value)} 
            title="Couleur"
            style={{ height: "30px", width: "30px", padding: 0, border: "none", background: "none", cursor: "pointer" }}
            />
        </div>
        
        <button type="submit" style={{ padding: "0.6rem 1.2rem", cursor: "pointer" }}>
          Ajouter
        </button>
      </form>

      {/* Liste */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {subjects.map(sub => (
            <li key={sub.id} style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "0.8rem",
              border: "1px solid rgba(128,128,128,0.2)",
              borderRadius: "6px",
              background: "rgba(128, 128, 128, 0.05)" // Légèrement grisé, marche en dark/light
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ 
                  display: "inline-block", 
                  width: "18px", 
                  height: "18px", 
                  borderRadius: "50%", 
                  backgroundColor: sub.color,
                  border: "1px solid rgba(255,255,255,0.2)"
                }}></span>
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>{sub.name}</span>
                {sub.short_code && <span style={{ opacity: 0.7, fontSize: "0.9em" }}>({sub.short_code})</span>}
              </div>
              
              <button 
                onClick={() => handleDelete(sub.id)} 
                title="Supprimer"
                style={{ 
                    color: "#ff4d4d", 
                    borderColor: "#ff4d4d", 
                    background: "transparent", 
                    cursor: "pointer",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.9rem"
                }}>
                Supprimer
              </button>
            </li>
          ))}
          {subjects.length === 0 && <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center" }}>Aucune matière définie pour l'instant.</p>}
        </ul>
      )}
    </div>
  );
}
