import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

// Jours de la semaine
const DAYS = [
  { index: 0, label: "Lundi" },
  { index: 1, label: "Mardi" },
  { index: 2, label: "Mercredi" },
  { index: 3, label: "Jeudi" },
  { index: 4, label: "Vendredi" },
  { index: 5, label: "Samedi" },
];

interface TimeSlot {
  id: number;
  day_index: number;
  start_time: string;
  end_time: string;
  type_: string;
}

interface GenerationRule {
  day_index: number;
  start_time: string;
  end_time: string;
  slot_type: string;
}

export default function TimeSlotsConfigurator() {
  const [slotDuration, setSlotDuration] = useState(60);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 3, 4]); // Par défaut: Lun, Mar, Jeu, Ven
  const [timeRanges, setTimeRanges] = useState<Record<number, { start: string, end: string }>>({
    0: { start: "08:00", end: "17:00" },
    1: { start: "08:00", end: "17:00" },
    2: { start: "08:00", end: "12:00" }, // Mercredi matin
    3: { start: "08:00", end: "17:00" },
    4: { start: "08:00", end: "17:00" },
    5: { start: "08:00", end: "12:00" },
  });
  
  const [generatedSlots, setGeneratedSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger la config existante au montage
  useEffect(() => {
    loadConfig();
    loadSlots();
  }, []);

  async function loadConfig() {
    try {
      const duration = await invoke<number>("get_slot_duration");
      setSlotDuration(duration);
    } catch (err) {
      console.error("Error loading config:", err);
    }
  }

  async function loadSlots() {
    try {
      const slots = await invoke<TimeSlot[]>("get_time_slots");
      setGeneratedSlots(slots);
    } catch (err) {
      console.error("Error loading slots:", err);
    }
  }

  function toggleDay(dayIndex: number) {
    if (activeDays.includes(dayIndex)) {
      setActiveDays(activeDays.filter(d => d !== dayIndex));
    } else {
      setActiveDays([...activeDays, dayIndex].sort());
    }
  }

  function updateTimeRange(dayIndex: number, type: 'start' | 'end', value: string) {
    setTimeRanges(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], [type]: value }
    }));
  }

  async function handleGenerate() {
    // Note: window.confirm ne fonctionne pas toujours bien dans Tauri v2 selon l'OS.
    // Pour l'instant on bypass la confirmation.
    // if (!confirm("Attention : Cela va effacer la grille existante. Continuer ?")) return;

    setLoading(true);
    try {
      // Construire les règles pour le backend
      const rules: GenerationRule[] = activeDays.map(dayIndex => ({
        day_index: dayIndex,
        start_time: timeRanges[dayIndex].start,
        end_time: timeRanges[dayIndex].end,
        slot_type: "LESSON"
      }));

      // Appel Rust
      await invoke("generate_time_slots", { 
        rules, 
        slotDurationMinutes: Number(slotDuration) 
      });

      alert("Grille générée avec succès !");
      loadSlots(); // Recharger l'affichage
    } catch (err) {
      console.error(err);
      alert("Erreur: " + err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>⏰ Configuration de la Grille</h2>
      
      <div style={{ marginBottom: "1.5rem" }}>
        <label>
          <strong>Durée d'un cours (minutes) : </strong>
          <input 
            type="number" 
            value={slotDuration} 
            onChange={e => setSlotDuration(parseInt(e.target.value))}
            style={{ width: "60px", padding: "0.4rem", marginLeft: "10px" }}
          />
        </label>
        <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.5rem" }}>
          Cela définit la granularité de l'emploi du temps (ex: 55 min).
        </p>
      </div>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
        {DAYS.map(day => (
          <div key={day.index} style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem",
            opacity: activeDays.includes(day.index) ? 1 : 0.5
          }}>
            <label style={{ width: "100px", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={activeDays.includes(day.index)}
                onChange={() => toggleDay(day.index)}
              />
              {day.label}
            </label>
            
            <input 
              type="time" 
              value={timeRanges[day.index]?.start || "08:00"}
              onChange={e => updateTimeRange(day.index, 'start', e.target.value)}
              disabled={!activeDays.includes(day.index)}
            />
            <span>à</span>
            <input 
              type="time" 
              value={timeRanges[day.index]?.end || "17:00"}
              onChange={e => updateTimeRange(day.index, 'end', e.target.value)}
              disabled={!activeDays.includes(day.index)}
            />
          </div>
        ))}
      </div>

      <button 
        onClick={handleGenerate} 
        disabled={loading}
        style={{ 
          padding: "0.8rem 1.5rem", 
          backgroundColor: "#646cff", 
          color: "white", 
          border: "none", 
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        {loading ? "Génération en cours..." : "⚙️ Générer la Grille"}
      </button>

      {/* Aperçu rapide */}
      <div style={{ marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
        <h3>Aperçu ({generatedSlots.length} créneaux)</h3>
        <div style={{ maxHeight: "200px", overflowY: "auto", background: "rgba(0,0,0,0.05)", padding: "1rem", borderRadius: "4px" }}>
          {generatedSlots.length === 0 ? (
            <p>Aucune grille définie.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, fontSize: "0.9rem" }}>
              {generatedSlots.map(slot => (
                <li key={slot.id} style={{ marginBottom: "4px" }}>
                   📅 {DAYS[slot.day_index]?.label} : {slot.start_time} - {slot.end_time}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
