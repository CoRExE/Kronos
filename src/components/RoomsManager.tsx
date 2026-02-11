import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Room {
  id: number;
  name: string;
  capacity: number;
  room_type: string;
}

const ROOM_TYPES = ["STANDARD", "LABO", "INFO", "GYM", "AMPHI"];

export default function RoomsManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(30);
  const [type, setType] = useState("STANDARD");

  async function fetchRooms() {
    try {
      setLoading(true);
      const data = await invoke<Room[]>("get_all_rooms");
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    try {
      await invoke("create_room", { 
        name, 
        capacity: Number(capacity), 
        roomType: type 
      });
      setName("");
      setCapacity(30);
      setType("STANDARD");
      fetchRooms();
    } catch (err) {
      alert("Erreur création: " + err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await invoke("delete_room", { id });
      fetchRooms();
    } catch (err) {
      alert("Impossible de supprimer : " + err);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div style={{ padding: "1rem", border: "1px solid rgba(128,128,128,0.3)", borderRadius: "8px", marginTop: "1rem" }}>
      <h2>🏛️ Gestion des Salles</h2>

      <form onSubmit={handleCreate} style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
        gap: "1rem", 
        marginBottom: "2rem", 
        alignItems: "end",
        background: "rgba(128,128,128,0.05)",
        padding: "1rem",
        borderRadius: "8px"
      }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>Nom</span>
          <input 
            type="text" 
            placeholder="Ex: Salle 101" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.3)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "80px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>Cap.</span>
          <input 
            type="number" 
            value={capacity} 
            onChange={e => setCapacity(parseInt(e.target.value))} 
            style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.3)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", opacity: 0.8 }}>Type</span>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)} 
            style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid rgba(128,128,128,0.3)" }}
          >
            {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <button type="submit" style={{ 
            padding: "0.6rem 1.5rem", 
            height: "42px", 
            cursor: "pointer", 
            backgroundColor: "#646cff", 
            color: "white", 
            border: "none", 
            borderRadius: "6px",
            fontWeight: "bold"
        }}>
          Ajouter
        </button>
      </form>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {rooms.map(room => (
            <li key={room.id} style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "0.8rem",
              border: "1px solid rgba(128,128,128,0.2)",
              borderRadius: "6px",
              background: "rgba(128, 128, 128, 0.05)"
            }}>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>{room.name}</span>
                <span style={{ marginLeft: "10px", opacity: 0.6, fontSize: "0.85rem" }}>
                  ({room.room_type} - {room.capacity} places)
                </span>
              </div>
              <button 
                onClick={() => handleDelete(room.id)} 
                title="Supprimer"
                style={{ 
                    color: "#ff4d4d", 
                    borderColor: "#ff4d4d", 
                    background: "transparent", 
                    cursor: "pointer",
                    padding: "0.4rem 0.8rem"
                }}>
                Supprimer
              </button>
            </li>
          ))}
          {rooms.length === 0 && <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center" }}>Aucune salle définie.</p>}
        </ul>
      )}
    </div>
  );
}
