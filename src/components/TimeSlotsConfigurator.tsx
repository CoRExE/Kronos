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
    setLoading(true);
    try {
      const rules: GenerationRule[] = activeDays.map(dayIndex => ({
        day_index: dayIndex,
        start_time: timeRanges[dayIndex].start,
        end_time: timeRanges[dayIndex].end,
        slot_type: "LESSON"
      }));

      await invoke("generate_time_slots", { 
        rules, 
        slotDurationMinutes: Number(slotDuration) 
      });

      loadSlots();
    } catch (err) {
      console.error(err);
      alert("Erreur: " + err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      padding: "1.5rem", 
      border: "1px solid rgba(128,128,128,0.3)", 
      borderRadius: "12px", 
      marginTop: "1rem",
      display: "grid",
      gridTemplateColumns: "1fr 1px 1fr",
      gap: "2rem",
      textAlign: "left" // Tout à gauche par défaut
    }}>
      
      {/* COLONNE GAUCHE : Configuration */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>⏰ Configuration de la Grille</h2>
        
        <div style={{ marginBottom: "0.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <strong>Durée d'un cours : </strong>
            <input 
              type="number" 
              value={slotDuration} 
              onChange={e => setSlotDuration(parseInt(e.target.value))}
              style={{ width: "60px", padding: "0.4rem" }}
            />
            <span>minutes</span>
          </label>
          <p style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "0.5rem" }}>
            Définit la granularité (ex: 55 min).
          </p>
        </div>

        <div style={{ display: "grid", gap: "0.8rem" }}>
          {DAYS.map(day => (
            <div key={day.index} style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "1rem",
              opacity: activeDays.includes(day.index) ? 1 : 0.4
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
                style={{ padding: "2px 4px" }}
              />
              <span style={{ fontSize: "0.9rem", opacity: 0.6 }}>à</span>
              <input 
                type="time" 
                value={timeRanges[day.index]?.end || "17:00"}
                onChange={e => updateTimeRange(day.index, 'end', e.target.value)}
                disabled={!activeDays.includes(day.index)}
                style={{ padding: "2px 4px" }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
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
                fontWeight: "bold",
                width: "100%"
                }}
            >
                {loading ? "Génération..." : "⚙️ Générer la Grille"}
            </button>
        </div>
      </div>

      {/* SÉPARATEUR VERTICAL */}
      <div style={{ backgroundColor: "rgba(128,128,128,0.3)", width: "1px", height: "100%" }}></div>

      {/* COLONNE DROITE : Aperçu */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 1rem 0" }}>Aperçu ({generatedSlots.length} créneaux)</h3>
        
        <div style={{ 
            flex: 1,
            maxHeight: "400px", 
            overflowY: "auto", 
            background: "rgba(128,128,128,0.05)", 
            padding: "1rem", 
            borderRadius: "8px",
            border: "1px inset rgba(0,0,0,0.1)"
        }}>
          {generatedSlots.length === 0 ? (
            <p style={{ opacity: 0.5, fontStyle: "italic" }}>Aucune grille générée.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {generatedSlots.map(slot => (
                <div key={slot.id} style={{ 
                    fontSize: "0.8rem", 
                    padding: "4px 8px", 
                    background: "rgba(255,255,255,0.05)", 
                    border: "1px solid rgba(128,128,128,0.1)",
                    borderRadius: "4px"
                }}>
                   <strong style={{ color: "#646cff" }}>{DAYS[slot.day_index]?.label.substring(0,3)}</strong> {slot.start_time} - {slot.end_time}
                </div>
              ))}
            </div>
          )}
        </div>
        <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.5rem" }}>
            Les modifications ne sont effectives qu'après avoir cliqué sur "Générer".
        </p>
      </div>

    </div>
  );
}