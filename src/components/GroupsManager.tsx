import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import AvailabilityPicker from "./AvailabilityPicker";
import ConfirmationModal from "./ui/ConfirmationModal";

interface StudentGroup {
  id: number;
  name: string;
  head_count: number;
}

export default function GroupsManager() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [headCount, setHeadCount] = useState(30);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  async function fetchGroups() {
    try {
      setLoading(true);
      const data = await invoke<StudentGroup[]>("get_all_groups");
      setGroups(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    try {
      await invoke("create_group", { name, headCount: Number(headCount) });
      setName(""); setHeadCount(30);
      fetchGroups();
    } catch (err) { alert("Erreur création: " + err); }
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      await invoke("delete_group", { id: deleteId });
      if (selectedGroup?.id === deleteId) setSelectedGroup(null);
      setDeleteId(null);
      fetchGroups();
    } catch (err) {
      alert("Impossible de supprimer : " + err);
      setDeleteId(null);
    }
  }

  useEffect(() => { fetchGroups(); }, []);

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>🎓 Gestion des Groupes / Classes</h2>

      {selectedGroup ? (
        <div style={{ marginBottom: "2rem" }}>
            <button onClick={() => setSelectedGroup(null)} style={{ marginBottom: "1rem", fontSize: "0.8rem", padding: "4px 8px" }}>← Retour</button>
            <AvailabilityPicker targetType="GROUP" targetId={selectedGroup.id} targetName={selectedGroup.name} />
        </div>
      ) : (
        <>
            <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <input type="text" placeholder="Nom (ex: CM2-A)" value={name} onChange={e => setName(e.target.value)} required style={{ padding: "0.6rem", flex: 1, minWidth: "200px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.9rem", opacity: 0.8 }}>Effectif:</label>
                <input type="number" value={headCount} onChange={e => setHeadCount(parseInt(e.target.value))} style={{ padding: "0.6rem", width: "80px" }} />
                </div>
                <button type="submit" style={{ padding: "0.6rem 1.2rem", cursor: "pointer" }}>Ajouter</button>
            </form>

            {loading ? <p>Chargement...</p> : (
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {groups.map(group => (
                    <li key={group.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem", border: "1px solid rgba(128,128,128,0.2)", borderRadius: "6px", background: "rgba(128, 128, 128, 0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>{group.name}</span>
                        <span style={{ opacity: 0.7, fontSize: "0.8em" }}>👥 {group.head_count}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => setSelectedGroup(group)} style={{ background: "rgba(100, 108, 255, 0.2)", border: "1px solid #646cff" }}>📅 Dispos</button>
                        <button onClick={() => setDeleteId(group.id)} style={{ color: "#ff4d4d", background: "transparent", border: "none", cursor: "pointer" }}>Supprimer</button>
                    </div>
                    </li>
                ))}
                </ul>
            )}
        </>
      )}

      <ConfirmationModal 
        isOpen={deleteId !== null}
        title="Supprimer le groupe ?"
        message="Cette action supprimera le groupe et toutes ses allocations de cours."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
