import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface StudentGroup { id: number; name: string; }

interface ScheduledLessonView {
  id: number;
  day_index: number;
  start_time: string;
  end_time: string;
  group_id: number;
  group_name: string;
  subject_name: string;
  teacher_name: string | null;
  subject_color: string;
  room_name: string | null;
}

interface TimeSlotLabel { start: string; end: string; }

export default function ScheduleView() {
  const [lessons, setLessons] = useState<ScheduledLessonView[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [timeLabels, setTimeLabels] = useState<TimeSlotLabel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [lessonsData, groupsData] = await Promise.all([
        invoke<ScheduledLessonView[]>("get_scheduled_lessons"),
        invoke<StudentGroup[]>("get_all_groups")
      ]);
      
      setLessons(lessonsData);
      setGroups(groupsData);

      // Si aucun groupe n'est sélectionné, on prend le premier par défaut
      if (groupsData.length > 0 && selectedGroupId === null) {
        setSelectedGroupId(groupsData[0].id);
      }

      // Extraire les créneaux horaires uniques pour la grille
      const labels: Record<string, string> = {};
      lessonsData.forEach(l => { labels[l.start_time] = l.end_time; });
      const sortedLabels = Object.entries(labels)
        .map(([start, end]) => ({ start, end }))
        .sort((a, b) => a.start.localeCompare(b.start));
      setTimeLabels(sortedLabels);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Filtrer les leçons pour le groupe sélectionné
  const filteredLessons = lessons.filter(l => l.group_id === selectedGroupId);

  return (
    <div style={{ padding: "1rem", marginTop: "2rem", borderTop: "2px solid rgba(128,128,128,0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <h2>📅 Emploi du Temps</h2>
            <select 
                value={selectedGroupId || ""} 
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                style={{ padding: "0.5rem", borderRadius: "4px", background: "rgba(100, 108, 255, 0.1)", color: "inherit", fontWeight: "bold", border: "1px solid #646cff" }}
            >
                {groups.map(g => <option key={g.id} value={g.id}>Classe : {g.name}</option>)}
            </select>
        </div>
        <button onClick={loadData} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>🔄 Actualiser</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : timeLabels.length === 0 ? (
        <p style={{ fontStyle: "italic", opacity: 0.5 }}>Aucun cours généré. Allez dans l'onglet Moteur.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: "800px" }}>
            <thead>
              <tr>
                <th style={{ width: "80px", padding: "10px", border: "1px solid rgba(128,128,128,0.2)" }}>Heure</th>
                {DAYS.map((day, i) => (
                  <th key={i} style={{ padding: "10px", border: "1px solid rgba(128,128,128,0.2)", background: "rgba(128,128,128,0.05)" }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeLabels.map(label => (
                <tr key={label.start}>
                  <td style={{ 
                    padding: "10px", 
                    border: "1px solid rgba(128,128,128,0.2)", 
                    textAlign: "center", 
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    background: "rgba(128,128,128,0.05)"
                  }}>
                    {label.start}<br/><span style={{ opacity: 0.5, fontWeight: "normal" }}>{label.end}</span>
                  </td>

                  {[0, 1, 2, 3, 4, 5].map(dayIdx => {
                    const lesson = filteredLessons.find(l => l.day_index === dayIdx && l.start_time === label.start);
                    
                    return (
                      <td key={dayIdx} style={{ 
                        border: "1px solid rgba(128,128,128,0.2)", 
                        padding: "4px",
                        verticalAlign: "top",
                        height: "100px"
                      }}>
                        {lesson && (
                          <div style={{ 
                            height: "100%",
                            borderLeft: `4px solid ${lesson.subject_color}`, 
                            background: "rgba(128, 128, 128, 0.1)", 
                            padding: "6px", 
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            display: "flex",
                            flexDirection: "column"
                          }}>
                            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{lesson.subject_name}</div>
                            
                            <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                                {lesson.teacher_name && (
                                    <div style={{ opacity: 0.6, fontStyle: "italic", fontSize: "0.7rem" }}>
                                        {lesson.teacher_name}
                                    </div>
                                )}
                                {lesson.room_name && (
                                    <div style={{ 
                                        fontSize: "0.65rem", 
                                        background: "rgba(128,128,128,0.2)", 
                                        padding: "1px 4px", 
                                        borderRadius: "3px",
                                        fontWeight: "bold"
                                    }}>
                                        {lesson.room_name}
                                    </div>
                                )}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}