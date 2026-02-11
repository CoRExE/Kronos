import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// Types des dépendances
interface Subject { id: number; name: string; }
interface StudentGroup { id: number; name: string; }
interface Teacher { id: number; name: string; }

// Type de l'allocation affichée (View)
interface AllocationView {
  id: number;
  group_name: string;
  subject_name: string;
  teacher_name: string | null;
  subject_color: string;
  count: number;
}

export default function AllocationsManager() {
  // Data lists
  const [allocations, setAllocations] = useState<AllocationView[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>(""); // Optionnel
  const [count, setCount] = useState(2); // Heures par défaut

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      // Chargement parallèle pour la vitesse
      const [allocsData, subData, grpData, teachData] = await Promise.all([
        invoke<AllocationView[]>("get_allocations"),
        invoke<Subject[]>("get_all_subjects"),
        invoke<StudentGroup[]>("get_all_groups"),
        invoke<Teacher[]>("get_all_teachers"),
      ]);

      setAllocations(allocsData);
      setSubjects(subData);
      setGroups(grpData);
      setTeachers(teachData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup || !selectedSubject) {
      alert("Veuillez sélectionner un groupe et une matière.");
      return;
    }

    try {
      await invoke("create_allocation", { 
        groupId: parseInt(selectedGroup),
        subjectId: parseInt(selectedSubject),
        teacherId: selectedTeacher ? parseInt(selectedTeacher) : null,
        count: parseInt(count.toString())
      });
      
      // Reset partiel (on garde souvent le groupe pour saisir la suite)
      setSelectedSubject("");
      // setSelectedTeacher(""); // On peut garder le prof aussi si c'est le même
      loadAllData(); // Recharger la liste
    } catch (err) {
      alert("Erreur création: " + err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await invoke("delete_allocation", { id });
      loadAllData();
    } catch (err) {
      alert("Erreur suppression: " + err);
    }
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>🔗 Allocations (Besoins)</h2>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Définissez ici le volume horaire pour chaque classe. <br/>
        Ex: "La 6ème A a 4h de Maths avec M. Dupont".
      </p>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleCreate} style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
        gap: "1rem", 
        marginBottom: "2rem", 
        alignItems: "end",
        background: "rgba(128,128,128,0.05)",
        padding: "1rem",
        borderRadius: "8px"
      }}>
        
        {/* Groupe */}
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>Groupe</span>
          <select 
            value={selectedGroup} 
            onChange={e => setSelectedGroup(e.target.value)}
            style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.3)" }}
            required
          >
            <option value="">-- Choisir --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>

        {/* Matière */}
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>Matière</span>
          <select 
            value={selectedSubject} 
            onChange={e => setSelectedSubject(e.target.value)}
            style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.3)" }}
            required
          >
            <option value="">-- Choisir --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        {/* Professeur (Optionnel) */}
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>Prof. (Optionnel)</span>
          <select 
            value={selectedTeacher} 
            onChange={e => setSelectedTeacher(e.target.value)}
            style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.3)" }}
          >
            <option value="">-- Aucun --</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>

        {/* Heures */}
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "80px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>Heures</span>
          <input 
            type="number" 
            min="1" 
            max="20" 
            value={count} 
            onChange={e => setCount(parseInt(e.target.value))}
            style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.3)" }}
          />
        </label>

        <button type="submit" style={{ 
            padding: "0.6rem 1.5rem", 
            height: "42px", 
            cursor: "pointer", 
            backgroundColor: "#646cff", 
            color: "white", 
            border: "none", 
            borderRadius: "6px",
            fontWeight: "bold",
            transition: "all 0.2s"
        }}>
          Ajouter
        </button>
      </form>

      {/* Liste des Allocations */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
          <thead>
            <tr style={{ background: "rgba(128,128,128,0.1)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Groupe</th>
              <th style={{ padding: "0.5rem" }}>Matière</th>
              <th style={{ padding: "0.5rem" }}>Professeur</th>
              <th style={{ padding: "0.5rem" }}>Volume</th>
              <th style={{ padding: "0.5rem" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map(alloc => (
              <tr key={alloc.id} style={{ borderBottom: "1px solid rgba(128,128,128,0.1)" }}>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{alloc.group_name}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ 
                    display: "inline-block", width: "10px", height: "10px", 
                    borderRadius: "50%", background: alloc.subject_color, marginRight: "8px" 
                  }}></span>
                  {alloc.subject_name}
                </td>
                <td style={{ padding: "0.5rem", opacity: alloc.teacher_name ? 1 : 0.5 }}>
                  {alloc.teacher_name || "-"}
                </td>
                <td style={{ padding: "0.5rem" }}>{alloc.count}h</td>
                <td style={{ padding: "0.5rem" }}>
                  <button 
                    onClick={() => handleDelete(alloc.id)}
                    style={{ color: "#ff4d4d", border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {allocations.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "1rem", textAlign: "center", fontStyle: "italic", opacity: 0.6 }}>
                  Aucune allocation définie. Commencez par sélectionner un groupe et une matière.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
