import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const DAYS = [
  { index: 0, label: "Lundi" },
  { index: 1, label: "Mardi" },
  { index: 2, label: "Mercredi" },
  { index: 3, label: "Jeudi" },
  { index: 4, label: "Vendredi" },
  { index: 5, label: "Samedi" },
];

interface TimeSlot { id: number; day_index: number; start_time: string; end_time: string; type_: string; }
interface GenerationRule { day_index: number; start_time: string; end_time: string; slot_type: string; }
interface DayConfig { morningStart: string; morningEnd: string; afternoonStart: string; afternoonEnd: string; hasAfternoon: boolean; }

export default function TimeSlotsConfigurator() {
  const [slotDuration, setSlotDuration] = useState(60);
  const [breakDuration, setBreakDuration] = useState(0);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 3, 4]);
  const [dayConfigs, setDayConfigs] = useState<Record<number, DayConfig>>({
    0: { morningStart: "08:00", morningEnd: "12:00", afternoonStart: "13:30", afternoonEnd: "17:30", hasAfternoon: true },
    1: { morningStart: "08:00", morningEnd: "12:00", afternoonStart: "13:30", afternoonEnd: "17:30", hasAfternoon: true },
    2: { morningStart: "08:00", morningEnd: "12:00", afternoonStart: "13:30", afternoonEnd: "17:30", hasAfternoon: false },
    3: { morningStart: "08:00", morningEnd: "12:00", afternoonStart: "13:30", afternoonEnd: "17:30", hasAfternoon: true },
    4: { morningStart: "08:00", morningEnd: "12:00", afternoonStart: "13:30", afternoonEnd: "17:30", hasAfternoon: true },
    5: { morningStart: "08:00", morningEnd: "12:00", afternoonStart: "13:30", afternoonEnd: "17:30", hasAfternoon: false },
  });
  
  const [generatedSlots, setGeneratedSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // CONFIGURATEUR GLOBAL : Maintenant avec Matin ET Après-midi
  const [globalConfig, setGlobalConfig] = useState<DayConfig>({ 
    morningStart: "08:00", 
    morningEnd: "12:00", 
    afternoonStart: "13:30", 
    afternoonEnd: "17:30", 
    hasAfternoon: true 
  });

  useEffect(() => { loadSlots(); }, []);

  async function loadSlots() {
    try {
      const slots = await invoke<TimeSlot[]>("get_time_slots");
      setGeneratedSlots(slots);
    } catch (err) { console.error(err); }
  }

  function applyGlobal() {
    const newConfigs = { ...dayConfigs };
    activeDays.forEach(idx => {
        newConfigs[idx] = { ...globalConfig };
    });
    setDayConfigs(newConfigs);
  }

  function toggleDay(dayIndex: number) {
    setActiveDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort());
  }

  function updateConfig(dayIndex: number, key: keyof DayConfig, value: any) {
    setDayConfigs(prev => ({ ...prev, [dayIndex]: { ...prev[dayIndex], [key]: value } }));
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const rules: GenerationRule[] = [];
      activeDays.forEach(dayIndex => {
        const config = dayConfigs[dayIndex];
        rules.push({ day_index: dayIndex, start_time: config.morningStart, end_time: config.morningEnd, slot_type: "LESSON" });
        if (config.hasAfternoon) {
          rules.push({ day_index: dayIndex, start_time: config.afternoonStart, end_time: config.afternoonEnd, slot_type: "LESSON" });
        }
      });

      await invoke("generate_time_slots", { 
        rules, 
        slotDurationMinutes: Number(slotDuration),
        breakDurationMinutes: Number(breakDuration)
      });
      loadSlots();
    } catch (err) { alert("Erreur: " + err); } 
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: "1.5rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "12px", marginTop: "1rem", display: "grid", gridTemplateColumns: "1.5fr 1px 1.2fr", gap: "2rem" }}>
      <div>
        <h2>⏰ Configuration de la Grille</h2>
        
        {/* PARAMÈTRES GLOBAUX DURÉES */}
        <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", background: "rgba(128,128,128,0.05)", padding: "1rem", borderRadius: "8px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Cours (min)</span>
            <input type="number" value={slotDuration} onChange={e => setSlotDuration(parseInt(e.target.value))} style={{ width: "70px", padding: "4px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Intercours (min)</span>
            <input type="number" value={breakDuration} onChange={e => setBreakDuration(parseInt(e.target.value))} style={{ width: "70px", padding: "4px" }} />
          </label>
        </div>

        {/* CONFIG RAPIDE (BULK EDIT) - ÉTENDUE */}
        <div style={{ marginBottom: "2rem", border: "1px dashed #646cff", padding: "1.2rem", borderRadius: "8px", background: "rgba(100, 108, 255, 0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <strong style={{ fontSize: "0.9rem" }}>⚡ Config rapide (Appliquer aux jours cochés)</strong>
                <button onClick={applyGlobal} style={{ padding: "6px 12px", background: "#646cff", color: "white", fontSize: "0.85rem", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Appliquer à tous</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.85rem" }}>
                    <span style={{ minWidth: "60px" }}>Matin:</span>
                    <input type="time" value={globalConfig.morningStart} onChange={e => setGlobalConfig({...globalConfig, morningStart: e.target.value})} />
                    <span>à</span>
                    <input type="time" value={globalConfig.morningEnd} onChange={e => setGlobalConfig({...globalConfig, morningEnd: e.target.value})} />
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.85rem" }}>
                    <label style={{ minWidth: "60px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <input type="checkbox" checked={globalConfig.hasAfternoon} onChange={e => setGlobalConfig({...globalConfig, hasAfternoon: e.target.checked})} />
                        A-M:
                    </label>
                    <input type="time" value={globalConfig.afternoonStart} disabled={!globalConfig.hasAfternoon} onChange={e => setGlobalConfig({...globalConfig, afternoonStart: e.target.value})} />
                    <span>à</span>
                    <input type="time" value={globalConfig.afternoonEnd} disabled={!globalConfig.hasAfternoon} onChange={e => setGlobalConfig({...globalConfig, afternoonEnd: e.target.value})} />
                </div>
            </div>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          {DAYS.map(day => (
            <div key={day.index} style={{ border: "1px solid rgba(128,128,128,0.1)", padding: "0.8rem", borderRadius: "8px", opacity: activeDays.includes(day.index) ? 1 : 0.4 }}>
              <label style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input type="checkbox" checked={activeDays.includes(day.index)} onChange={() => toggleDay(day.index)} />
                {day.label}
              </label>
              
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.85rem" }}>
                <span style={{ minWidth: "50px" }}>Matin:</span>
                <input type="time" value={dayConfigs[day.index].morningStart} onChange={e => updateConfig(day.index, 'morningStart', e.target.value)} disabled={!activeDays.includes(day.index)} />
                <span>à</span>
                <input type="time" value={dayConfigs[day.index].morningEnd} onChange={e => updateConfig(day.index, 'morningEnd', e.target.value)} disabled={!activeDays.includes(day.index)} />
              </div>

              <div style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "50px" }}>
                    <input type="checkbox" checked={dayConfigs[day.index].hasAfternoon} onChange={e => updateConfig(day.index, 'hasAfternoon', e.target.checked)} disabled={!activeDays.includes(day.index)} />
                    A-M:
                </label>
                <input type="time" value={dayConfigs[day.index].afternoonStart} onChange={e => updateConfig(day.index, 'afternoonStart', e.target.value)} disabled={!activeDays.includes(day.index) || !dayConfigs[day.index].hasAfternoon} />
                <span>à</span>
                <input type="time" value={dayConfigs[day.index].afternoonEnd} onChange={e => updateConfig(day.index, 'afternoonEnd', e.target.value)} disabled={!activeDays.includes(day.index) || !dayConfigs[day.index].hasAfternoon} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleGenerate} disabled={loading} style={{ marginTop: "1rem", padding: "0.8rem", backgroundColor: "#646cff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", width: "100%", fontWeight: "bold" }}>
          {loading ? "Génération..." : "⚙️ Générer la Grille"}
        </button>
      </div>

      <div style={{ backgroundColor: "rgba(128,128,128,0.3)", width: "1px" }}></div>

      <div>
        <h3>Aperçu ({generatedSlots.length})</h3>
        <div style={{ maxHeight: "600px", overflowY: "auto", background: "rgba(128,128,128,0.05)", padding: "1rem", borderRadius: "8px" }}>
          {generatedSlots.length === 0 ? <p>Vide.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {generatedSlots.map(slot => (
                <div key={slot.id} style={{ fontSize: "0.75rem", padding: "2px 6px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.1)" }}>
                   <strong>{DAYS[slot.day_index]?.label.substring(0,3)}</strong> {slot.start_time} - {slot.end_time}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
