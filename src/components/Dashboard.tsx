import SubjectsManager from "./SubjectsManager";
import GroupsManager from "./GroupsManager";

export default function Dashboard() {
  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1>📅 Tableau de Bord Kronos</h1>
        <p>Bienvenue dans votre gestionnaire d'emploi du temps.</p>
      </header>
      
      <main style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Section Matières */}
        <SubjectsManager />

        {/* Section Groupes */}
        <GroupsManager />
        
        {/* Placeholder pour les autres sections */}
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px dashed #ccc", borderRadius: "8px", color: "#888" }}>
          <p>🚧 Prochainement : Gestion des Professeurs (Si mode établissement)...</p>
        </div>
      </main>
    </div>
  );
}