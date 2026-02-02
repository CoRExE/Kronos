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

export default function ScheduleView() {
  const [lessons, setLessons] = useState<ScheduledLessonView[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  async function fetchSchedule() {
    setLoading(true);
    try {
      const data = await invoke<ScheduledLessonView[]>("get_scheduled_lessons");
      setLessons(data);
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filtrer les leçons pour un jour donné et les trier par heure
  const getLessonsForDay = (dayIndex: number) => {
    return lessons
      .filter(l => l.day_index === dayIndex)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div style={{ padding: "1rem", marginTop: "2rem", borderTop: "2px solid #eee" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>📅 Emploi du Temps Généré</h2>
        <button onClick={fetchSchedule} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>🔄 Actualiser</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : lessons.length === 0 ? (
        <p style={{ fontStyle: "italic", color: "#888" }}>Aucun cours planifié. Lancez la génération ci-dessus.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", overflowX: "auto" }}>
          {DAYS.map((dayName, index) => {
            const dayLessons = getLessonsForDay(index);
            if (dayLessons.length === 0) return null; // Masquer les jours vides (ex: Samedi)

            return (
              <div key={index} style={{ 
                border: "1px solid rgba(128,128,128,0.2)", 
                borderRadius: "8px", 
                background: "var(--background, rgba(255,255,255,0.05))",
                overflow: "hidden"
              }}>
                <h3 style={{ 
                  textAlign: "center", 
                  background: "rgba(128,128,128,0.1)", // Fond header adaptatif
                  color: "var(--foreground, inherit)", // Texte adaptatif
                  margin: 0, 
                  padding: "0.8rem", 
                  borderBottom: "1px solid rgba(128,128,128,0.2)", 
                  fontSize: "1rem" 
                }}>
                  {dayName}
                </h3>
                <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {dayLessons.map(lesson => (
                    <div key={lesson.id} style={{ 
                      borderLeft: `4px solid ${lesson.subject_color}`, 
                      background: "rgba(128, 128, 128, 0.1)", // Carte légèrement grisée (lisible sur dark & light)
                      padding: "0.6rem", 
                      borderRadius: "4px",
                      fontSize: "0.85rem",
                      color: "var(--foreground, inherit)" // Texte hérité
                    }}>
                      <div style={{ fontWeight: "bold", marginBottom: "4px", opacity: 0.9 }}>
                        {lesson.start_time} - {lesson.end_time}
                      </div>
                      <div style={{ fontWeight: "600", fontSize: "1rem", marginBottom: "2px" }}>
                        {lesson.subject_name}
                      </div>
                      <div style={{ opacity: 0.8 }}>{lesson.group_name}</div>
                      {lesson.teacher_name && (
                        <div style={{ opacity: 0.6, fontStyle: "italic", fontSize: "0.8rem", marginTop: "4px" }}>
                          {lesson.teacher_name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
