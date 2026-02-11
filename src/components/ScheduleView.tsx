import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

interface ScheduledLessonView {
  id: number;
  day_index: number;
  start_time: string;
  end_time: string;
  group_name: string;
  subject_name: string;
  teacher_name: string | null;
  subject_color: string;
}

interface TimeSlotLabel {
  start: string;
  end: string;
}

export default function ScheduleView() {
  const [lessons, setLessons] = useState<ScheduledLessonView[]>([]);
  const [timeLabels, setTimeLabels] = useState<TimeSlotLabel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  async function fetchSchedule() {
    setLoading(true);
    try {
      const data = await invoke<ScheduledLessonView[]>("get_scheduled_lessons");
      setLessons(data);

      // Extraire tous les créneaux horaires uniques pour faire les lignes
      const labels: Record<string, string> = {};
      data.forEach(l => {
        labels[l.start_time] = l.end_time;
      });
      
      // Trier les créneaux par heure de début
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

  return (
    <div style={{ padding: "1rem", marginTop: "2rem", borderTop: "2px solid rgba(128,128,128,0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2>📅 Emploi du Temps</h2>
        <button onClick={fetchSchedule} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>🔄 Actualiser</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : timeLabels.length === 0 ? (
        <p style={{ fontStyle: "italic", opacity: 0.5 }}>Aucun cours généré.</p>
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
                  {/* Colonne des heures */}
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

                  {/* Colonnes des jours */}
                  {[0, 1, 2, 3, 4, 5].map(dayIdx => {
                    const lesson = lessons.find(l => l.day_index === dayIdx && l.start_time === label.start);
                    
                    return (
                      <td key={dayIdx} style={{ 
                        border: "1px solid rgba(128,128,128,0.2)", 
                        padding: "4px",
                        verticalAlign: "top",
                        height: "80px"
                      }}>
                        {lesson && (
                          <div style={{ 
                            height: "100%",
                            borderLeft: `4px solid ${lesson.subject_color}`, 
                            background: "rgba(128, 128, 128, 0.1)", 
                            padding: "6px", 
                            borderRadius: "4px",
                            fontSize: "0.8rem"
                          }}>
                            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{lesson.subject_name}</div>
                            <div style={{ opacity: 0.8 }}>{lesson.group_name}</div>
                            {lesson.teacher_name && (
                              <div style={{ opacity: 0.6, fontStyle: "italic", fontSize: "0.75rem", marginTop: "4px" }}>
                                {lesson.teacher_name}
                              </div>
                            )}
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