import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface StudentGroup {
  id: number;
  name: string;
  head_count: number;
}

export default function GroupsManager() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [headCount, setHeadCount] = useState(30); // Par défaut

  // Charger la liste
  async function fetchGroups() {
    try {
      setLoading(true);
      const data = await invoke<StudentGroup[]>("get_all_groups");
      setGroups(data);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  }

  // Créer un groupe
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    try {
      await invoke("create_group", { 
        name, 
        headCount: Number(headCount) // Conversion explicite
      });
      
      // Reset form
      setName("");
      setHeadCount(30);
      
      // Reload list
      fetchGroups();
    } catch (err) {
      alert("Erreur création: " + err);
    }
  }

  // Supprimer
  async function handleDelete(id: number) {
    try {
      // On utilise la syntaxe explicite qui fonctionne :)
      await invoke("delete_group", { id: id });
      fetchGroups();
    } catch (err) {
      console.error("Erreur backend suppression:", err);
      alert("Impossible de supprimer : " + err);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>🎓 Gestion des Groupes / Classes</h2>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <input 
          type="text" 
          placeholder="Nom (ex: CM2-A, 6ème B)" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
          style={{ padding: "0.6rem", flex: 1, minWidth: "200px" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.9rem", opacity: 0.8 }}>Effectif:</label>
          <input 
            type="number" 
            min="1"
            max="100"
            value={headCount} 
            onChange={e => setHeadCount(parseInt(e.target.value))} 
            style={{ padding: "0.6rem", width: "80px" }}
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
          {groups.map(group => (
            <li key={group.id} style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "0.8rem",
              border: "1px solid rgba(128,128,128,0.2)",
              borderRadius: "6px",
              background: "rgba(128, 128, 128, 0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>{group.name}</span>
                <span style={{ opacity: 0.7, fontSize: "0.9em", background: "rgba(128,128,128,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                  👥 {group.head_count} élèves
                </span>
              </div>
              
              <button 
                onClick={() => handleDelete(group.id)} 
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
          {groups.length === 0 && <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center" }}>Aucun groupe défini pour l'instant.</p>}
        </ul>
      )}
    </div>
  );
}
