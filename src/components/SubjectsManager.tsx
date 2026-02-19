import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ConfirmationModal from "./ui/ConfirmationModal";

interface Subject {
  id: number;
  name: string;
  short_code?: string | null;
  color: string;
}

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => { fetchSubjects(); }, []);

  async function fetchSubjects() {
    try {
      setLoading(true);
      const data = await invoke<Subject[]>("get_all_subjects");
      setSubjects(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    try {
      await invoke("create_subject", { name, shortCode: shortCode || null, color });
      setName(""); setShortCode("");
      fetchSubjects();
    } catch (err) { alert("Erreur: " + err); }
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      await invoke("delete_subject", { id: deleteId });
      setDeleteId(null);
      fetchSubjects();
    } catch (err) { alert(err); }
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>📚 Gestion des Matières</h2>

      <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem", alignItems: "end", background: "rgba(128,128,128,0.05)", padding: "1rem", borderRadius: "8px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Nom</span>
          <input type="text" placeholder="Maths" value={name} onChange={e => setName(e.target.value)} required style={{ padding: "0.6rem" }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Code</span>
          <input type="text" placeholder="MATH" value={shortCode} onChange={e => setShortCode(e.target.value)} style={{ padding: "0.6rem" }} />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height: "40px", border: "none" }} />
            <button type="submit" style={{ flex: 1, padding: "0.6rem", background: "#646cff", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>Ajouter</button>
        </div>
      </form>

      {loading ? <p>Chargement...</p> : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {subjects.map(sub => (
            <li key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem", border: "1px solid rgba(128,128,128,0.2)", borderRadius: "6px", background: "rgba(128, 128, 128, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: sub.color }}></span>
                <strong>{sub.name}</strong>
                {sub.short_code && <span style={{ opacity: 0.6, fontSize: "0.9rem" }}>({sub.short_code})</span>}
              </div>
              <button onClick={() => setDeleteId(sub.id)} style={{ color: "#ff4d4d", background: "transparent", border: "none", cursor: "pointer" }}>Supprimer</button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmationModal 
        isOpen={deleteId !== null}
        title="Supprimer la matière ?"
        message="Cette action est irréversible. La matière sera retirée de toutes les allocations liées."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
