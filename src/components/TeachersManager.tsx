import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Teacher {
  id: number;
  name: string;
}

export default function TeachersManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  async function fetchTeachers() {
    try {
      setLoading(true);
      const data = await invoke<Teacher[]>("get_all_teachers");
      setTeachers(data);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    try {
      await invoke("create_teacher", { name });
      setName("");
      fetchTeachers();
    } catch (err) {
      alert("Erreur création: " + err);
    }
  }

  async function handleDelete(id: number) {
    // Note: window.confirm ne fonctionne pas dans Tauri v2.
    // if (!confirm("Supprimer cet enseignant ?")) return;
    
    try {
      await invoke("delete_teacher", { id });
      fetchTeachers();
    } catch (err) {
      alert("Impossible de supprimer : " + err);
    }
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>👨‍🏫 Gestion des Professeurs</h2>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <input 
          type="text" 
          placeholder="Nom (ex: M. Dupont)" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
          style={{ padding: "0.6rem", flex: 1, minWidth: "200px" }}
        />
        <button type="submit" style={{ padding: "0.6rem 1.2rem", cursor: "pointer" }}>
          Ajouter
        </button>
      </form>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {teachers.map(teacher => (
            <li key={teacher.id} style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "0.8rem",
              border: "1px solid rgba(128,128,128,0.2)",
              borderRadius: "6px",
              background: "rgba(128, 128, 128, 0.05)"
            }}>
              <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>{teacher.name}</span>
              <button 
                onClick={() => handleDelete(teacher.id)} 
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
          {teachers.length === 0 && <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center" }}>Aucun professeur défini.</p>}
        </ul>
      )}
    </div>
  );
}
