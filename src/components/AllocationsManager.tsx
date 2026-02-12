import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Subject { id: number; name: string; }
interface StudentGroup { id: number; name: string; }
interface Teacher { id: number; name: string; }

interface AllocationView {
  id: number; group_name: string; subject_name: string; teacher_name: string | null;
  subject_color: string; count: number; required_room_type: string;
}

const ROOM_TYPES = ["STANDARD", "LABO", "INFO", "GYM", "AMPHI"];

export default function AllocationsManager() {
  const [allocations, setAllocations] = useState<AllocationView[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [roomType, setRoomType] = useState("STANDARD");
  const [count, setCount] = useState(2);

  useEffect(() => { loadAllData(); }, []);

  async function loadAllData() {
    setLoading(true);
    try {
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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGroup || !selectedSubject) return;

    try {
      await invoke("create_allocation", { 
        groupId: parseInt(selectedGroup),
        subjectId: parseInt(selectedSubject),
        teacherId: selectedTeacher ? parseInt(selectedTeacher) : null,
        count: parseInt(count.toString()),
        requiredRoomType: roomType
      });
      setSelectedSubject("");
      loadAllData();
    } catch (err) { alert("Erreur: " + err); }
  }

  async function handleDelete(id: number) {
    try {
      await invoke("delete_allocation", { id });
      loadAllData();
    } catch (err) { alert(err); }
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>🔗 Allocations (Besoins)</h2>

      <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", marginBottom: "2rem", alignItems: "end", background: "rgba(128,128,128,0.05)", padding: "1rem", borderRadius: "8px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Groupe</span>
          <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} required style={{ padding: "0.6rem" }}>
            <option value="">-- Choisir --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Matière</span>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required style={{ padding: "0.6rem" }}>
            <option value="">-- Choisir --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Prof.</span>
          <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} style={{ padding: "0.6rem" }}>
            <option value="">-- Aucun --</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Type Salle</span>
          <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ padding: "0.6rem" }}>
            {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "80px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Heures</span>
          <input type="number" min="1" max="20" value={count} onChange={e => setCount(parseInt(e.target.value))} style={{ padding: "0.6rem" }} />
        </label>
        <button type="submit" style={{ padding: "0.6rem 1.5rem", height: "42px", background: "#646cff", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold" }}>Ajouter</button>
      </form>

      {loading ? <p>Chargement...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "rgba(128,128,128,0.1)", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Groupe</th>
              <th style={{ padding: "0.5rem" }}>Matière</th>
              <th style={{ padding: "0.5rem" }}>Prof.</th>
              <th style={{ padding: "0.5rem" }}>Salle</th>
              <th style={{ padding: "0.5rem" }}>Vol.</th>
              <th style={{ padding: "0.5rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {allocations.map(alloc => (
              <tr key={alloc.id} style={{ borderBottom: "1px solid rgba(128,128,128,0.1)" }}>
                <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{alloc.group_name}</td>
                <td style={{ padding: "0.5rem" }}>{alloc.subject_name}</td>
                <td style={{ padding: "0.5rem", opacity: 0.7 }}>{alloc.teacher_name || "-"}</td>
                <td style={{ padding: "0.5rem" }}><span style={{ fontSize: "0.75rem", background: "rgba(128,128,128,0.2)", padding: "2px 4px", borderRadius: "4px" }}>{alloc.required_room_type}</span></td>
                <td style={{ padding: "0.5rem" }}>{alloc.count}h</td>
                <td style={{ padding: "0.5rem" }}><button onClick={() => handleDelete(alloc.id)} style={{ color: "red", background: "transparent", border: "none", cursor: "pointer" }}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
