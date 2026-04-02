import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface TimeSlot {
  id: number;
  day_index: number;
  start_time: string;
}

interface Constraint {
  param_value: string; // SlotID
}

interface Props {
  targetType: 'TEACHER' | 'GROUP';
  targetId: number;
  targetName: string;
}

export default function AvailabilityPicker({ targetType, targetId, targetName }: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [forbiddenIds, setForbiddenIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [targetId]);

  async function loadData() {
    setLoading(true);
    try {
      const [allSlots, constraints] = await Promise.all([
        invoke<TimeSlot[]>("get_time_slots"),
        invoke<Constraint[]>("get_constraints", { targetType, targetId })
      ]);
      setSlots(allSlots);
      setForbiddenIds(constraints.map(c => parseInt(c.param_value)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSlot(slotId: number) {
    try {
      await invoke("toggle_forbidden_slot", { targetType, targetId, slotId });
      // Update local UI state
      setForbiddenIds(prev => 
        prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
      );
    } catch (err) {
      alert(err);
    }
  }

  // Grouper les slots par heure pour faire les lignes
  const timeLabels = Array.from(new Set(slots.map(s => s.start_time))).sort();

  return (
    <div style={{ padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
      <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>
        Disponibilités de : <span style={{ color: "#646cff" }}>{targetName}</span>
      </h3>
      <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "1rem" }}>
        Cliquez sur un créneau pour le marquer comme <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>INDISPONIBLE</span>.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}>
          <thead>
            <tr>
              <th></th>
              {DAYS.map((d, i) => <th key={i} style={{ padding: "4px" }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {timeLabels.map(time => (
              <tr key={time}>
                <td style={{ padding: "4px", fontWeight: "bold", opacity: 0.6 }}>{time}</td>
                {[0, 1, 2, 3, 4, 5].map(dayIdx => {
                  const slot = slots.find(s => s.day_index === dayIdx && s.start_time === time);
                  if (!slot) return <td key={dayIdx} style={{ background: "rgba(128,128,128,0.05)" }}></td>;
                  
                  const isForbidden = forbiddenIds.includes(slot.id);
                  return (
                    <td 
                      key={dayIdx}
                      onClick={() => toggleSlot(slot.id)}
                      style={{ 
                        width: "40px", height: "30px",
                        cursor: "pointer",
                        border: "1px solid rgba(128,128,128,0.2)",
                        background: isForbidden ? "#ff4d4d" : "#4ade8022",
                        transition: "all 0.2s"
                      }}
                      title={isForbidden ? "Indisponible" : "Disponible"}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
