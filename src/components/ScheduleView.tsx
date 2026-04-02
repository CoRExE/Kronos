import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
  is_locked: boolean;
}

interface TimeSlotLabel { id: number; start: string; end: string; }

// --- COMPOSANT DRAGGABLE ---
function DraggableLesson({ lesson }: { lesson: ScheduledLessonView }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lesson-${lesson.id}`,
    data: { lessonId: lesson.id }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
    zIndex: isDragging ? 1000 : 1,
    height: "100%",
    borderLeft: `4px solid ${lesson.subject_color}`, 
    background: "rgba(128, 128, 128, 0.15)", 
    padding: "6px", 
    borderRadius: "4px",
    fontSize: "0.8rem",
    display: "flex",
    flexDirection: "column",
    boxShadow: isDragging ? "0 5px 15px rgba(0,0,0,0.3)" : "none",
    position: "relative" as const
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{lesson.subject_name}</div>
        {lesson.is_locked && <span title="Verrouillé (ne bougera pas à la prochaine génération)" style={{ fontSize: "0.7rem", opacity: 0.8 }}>🔒</span>}
      </div>
      <div style={{ opacity: 0.8 }}>{lesson.group_name}</div>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
          {lesson.teacher_name && <div style={{ opacity: 0.6, fontStyle: "italic", fontSize: "0.7rem" }}>{lesson.teacher_name}</div>}
          {lesson.room_name && <div style={{ fontSize: "0.65rem", background: "rgba(128,128,128,0.2)", padding: "1px 4px", borderRadius: "3px", fontWeight: "bold" }}>{lesson.room_name}</div>}
      </div>
    </div>
  );
}

// --- COMPOSANT DROPPABLE ---
function DroppableCell({ dayIndex, slotId, children }: { dayIndex: number, slotId: number, children?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${dayIndex}-${slotId}`,
    data: { dayIndex, slotId }
  });

  const style = {
    border: "1px solid rgba(128,128,128,0.2)", 
    padding: "4px",
    verticalAlign: "top",
    height: "100px",
    background: isOver ? "rgba(100, 108, 255, 0.2)" : "transparent",
    transition: "background 0.2s"
  };

  return (
    <td ref={setNodeRef} style={style}>
      {children}
    </td>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function ScheduleView() {
  const [lessons, setLessons] = useState<ScheduledLessonView[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [timeLabels, setTimeLabels] = useState<TimeSlotLabel[]>([]);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const allSlots = await invoke<any[]>("get_time_slots");
      const labelsMap: Record<string, TimeSlotLabel> = {};
      allSlots.forEach(s => {
        labelsMap[s.start_time] = { id: s.id, start: s.start_time, end: s.end_time };
      });
      const sortedLabels = Object.values(labelsMap).sort((a, b) => a.start.localeCompare(b.start));
      setTimeLabels(sortedLabels);

      const [lessonsData, groupsData] = await Promise.all([
        invoke<ScheduledLessonView[]>("get_scheduled_lessons"),
        invoke<StudentGroup[]>("get_all_groups")
      ]);
      
      setLessons(lessonsData);
      setGroups(groupsData);
      if (groupsData.length > 0 && selectedGroupId === null) {
        setSelectedGroupId(groupsData[0].id);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const lessonId = active.data.current?.lessonId;
    const newSlotId = over.data.current?.slotId;
    if (lessonId && newSlotId) {
      try {
        await invoke("move_lesson", { lessonId, newSlotId });
        await loadData();
      } catch (err) { alert("Déplacement impossible : " + err); }
    }
  }

  const filteredLessons = lessons.filter(l => l.group_id === selectedGroupId);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                  <td style={{ padding: "10px", border: "1px solid rgba(128,128,128,0.2)", textAlign: "center", fontSize: "0.8rem", fontWeight: "bold", background: "rgba(128,128,128,0.05)" }}>
                    {label.start}<br/><span style={{ opacity: 0.5, fontWeight: "normal" }}>{label.end}</span>
                  </td>

                  {[0, 1, 2, 3, 4, 5].map(dayIdx => {
                    const lesson = filteredLessons.find(l => l.day_index === dayIdx && l.start_time === label.start);
                    return (
                      <DroppableCell key={dayIdx} dayIndex={dayIdx} slotId={label.id}>
                        {lesson && <DraggableLesson lesson={lesson} />}
                      </DroppableCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DndContext>
  );
}
