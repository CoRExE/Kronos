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

interface TimeSlot {
  id: number;
  day_index: number;
  day_name: string;
  start_time: string;
  end_time: string;
}

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

interface TimeRow {
  start: string;
  end: string;
}

// --- COMPOSANT TOAST ---
function Toast({ message, type, onClose }: { message: string, type: 'error' | 'success', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      backgroundColor: type === 'error' ? '#ff4d4f' : '#52c41a',
      color: 'white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <span>{type === 'error' ? '❌' : '✅'}</span>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// --- COMPOSANT DRAGGABLE ---
function DraggableLesson({ lesson, onLock, onUnlock }: { 
  lesson: ScheduledLessonView, 
  onLock: (id: number) => void,
  onUnlock: (id: number) => void 
}) {
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
        
        <button 
            onClick={(e) => {
                e.stopPropagation(); 
                if (lesson.is_locked) onUnlock(lesson.id);
                else onLock(lesson.id);
            }}
            title={lesson.is_locked ? "Cliquer pour déverrouiller" : "Cliquer pour figer ce cours"}
            style={{ 
                background: "rgba(255,255,255,0.1)", 
                border: "none", 
                borderRadius: "4px", 
                cursor: "pointer", 
                fontSize: "0.7rem", 
                padding: "2px 4px" 
            }}
        >
            {lesson.is_locked ? "🔒" : "🔓"}
        </button>
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
function DroppableCell({ dayIndex, slotId, children }: { dayIndex: number, slotId: number | undefined, children?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${dayIndex}-${slotId || 'none'}`,
    data: { dayIndex, slotId },
    disabled: !slotId
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
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [timeRows, setTimeRows] = useState<TimeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { loadData(); }, []);

  function showToast(message: string, type: 'error' | 'success') {
    setToast({ message, type });
  }

  async function loadData() {
    setLoading(true);
    try {
      const slotsData = await invoke<TimeSlot[]>("get_time_slots");
      setAllSlots(slotsData);

      // Créer les lignes temporelles uniques
      const timeMap: Record<string, string> = {};
      slotsData.forEach(s => { timeMap[s.start_time] = s.end_time; });
      const sortedRows = Object.entries(timeMap)
        .sort(([startA], [startB]) => startA.localeCompare(startB))
        .map(([start, end]) => ({ start, end }));
      setTimeRows(sortedRows);

      const [lessonsData, groupsData] = await Promise.all([
        invoke<ScheduledLessonView[]>("get_scheduled_lessons"),
        invoke<StudentGroup[]>("get_all_groups")
      ]);
      
      setLessons(lessonsData);
      setGroups(groupsData);
      if (groupsData.length > 0 && selectedGroupId === null) {
        setSelectedGroupId(groupsData[0].id);
      }
    } catch (err) { 
        console.error(err); 
        showToast("Erreur lors du chargement des données", "error");
    } finally { setLoading(false); }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const lessonId = active.data.current?.lessonId;
    const newSlotId = over.data.current?.slotId;
    
    if (lessonId && newSlotId) {
      try {
        await invoke("move_lesson", { lessonId, newSlotId });
        showToast("Cours déplacé et verrouillé !", "success");
        await loadData();
      } catch (err) { 
        showToast(String(err), "error");
      }
    }
  }

  async function handleUnlock(lessonId: number) {
    try {
        await invoke("unlock_lesson", { lessonId });
        showToast("Cours déverrouillé", "success");
        await loadData();
    } catch (err) {
        showToast("Erreur déverrouillage : " + err, "error");
    }
  }

  async function handleLock(lessonId: number) {
    try {
        await invoke("lock_lesson", { lessonId });
        showToast("Cours verrouillé", "success");
        await loadData();
    } catch (err) {
        showToast("Erreur verrouillage : " + err, "error");
    }
  }

  const filteredLessons = lessons.filter(l => l.group_id === selectedGroupId);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div style={{ padding: "1rem", marginTop: "2rem", borderTop: "2px solid rgba(128,128,128,0.2)" }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
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
          <button onClick={loadData} style={{ padding: "0.5rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            {loading ? "..." : "🔄 Actualiser"}
          </button>
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
              {timeRows.map(row => (
                <tr key={row.start}>
                  <td style={{ padding: "10px", border: "1px solid rgba(128,128,128,0.2)", textAlign: "center", fontSize: "0.8rem", fontWeight: "bold", background: "rgba(128,128,128,0.05)" }}>
                    {row.start}<br/><span style={{ opacity: 0.5, fontWeight: "normal" }}>{row.end}</span>
                  </td>

                  {[0, 1, 2, 3, 4, 5].map(dayIdx => {
                    // Trouver le SLOT_ID exact pour ce (Jour, Heure)
                    const slot = allSlots.find(s => s.day_index === dayIdx && s.start_time === row.start);
                    const lesson = filteredLessons.find(l => l.day_index === dayIdx && l.start_time === row.start);
                    
                    return (
                      <DroppableCell key={dayIdx} dayIndex={dayIdx} slotId={slot?.id}>
                        {lesson && (
                          <DraggableLesson 
                            lesson={lesson} 
                            onLock={handleLock}
                            onUnlock={handleUnlock} 
                          />
                        )}
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
