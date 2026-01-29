import SubjectsManager from "./SubjectsManager";
import GroupsManager from "./GroupsManager";
import TimeSlotsConfigurator from "./TimeSlotsConfigurator";
import TeachersManager from "./TeachersManager";

export default function Dashboard() {
  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1>📅 Tableau de Bord Kronos</h1>
        <p>Bienvenue dans votre gestionnaire d'emploi du temps.</p>
      </header>
      
      <main style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Section 1: Structure Temporelle */}
        <TimeSlotsConfigurator />

        {/* Section 2: Données Pédagogiques */}
        <SubjectsManager />
        <TeachersManager />
        <GroupsManager />
        
        {/* Placeholder pour les autres sections */}
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px dashed #ccc", borderRadius: "8px", color: "#888" }}>
          <p>🚧 Prochainement : Salles (Optionnel)...</p>
        </div>
      </main>
    </div>
  );
}