import { useState } from "react";
import Sidebar from "./Sidebar";
import Drawer from "./ui/Drawer";

// Composants Métier
import ScheduleView from "./ScheduleView";
import SubjectsManager from "./SubjectsManager";
import GroupsManager from "./GroupsManager";
import TeachersManager from "./TeachersManager";
import AllocationsManager from "./AllocationsManager";
import TimeSlotsConfigurator from "./TimeSlotsConfigurator";
import GenerationPanel from "./GenerationPanel";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Fonction pour rendre le contenu du tiroir dynamiquement
  const renderDrawerContent = () => {
    switch (activeTab) {
      case "grid": return <TimeSlotsConfigurator />;
      case "subjects": return <SubjectsManager />;
      case "teachers": return <TeachersManager />;
      case "groups": return <GroupsManager />;
      case "allocations": return <AllocationsManager />;
      case "generate": return <GenerationPanel />;
      default: return null;
    }
  };

  // Titre dynamique du tiroir
  const getDrawerTitle = () => {
    switch (activeTab) {
      case "grid": return "Configuration de la Grille";
      case "subjects": return "Gestion des Matières";
      case "teachers": return "Gestion des Professeurs";
      case "groups": return "Gestion des Classes";
      case "allocations": return "Définition des Besoins";
      case "generate": return "Moteur de Génération";
      default: return "";
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      
      {/* 1. Sidebar (Navigation) - Z-INDEX élevé pour rester cliquable */}
      <Sidebar 
        activeTab={activeTab} 
        onSelect={(tab) => setActiveTab(tab === activeTab ? null : tab)} 
      />

      {/* 2. Main Content (L'Emploi du Temps) */}
      <div style={{ flex: 1, overflow: "auto", position: "relative", backgroundColor: "#121212" }}>
        
        {/* Header simple */}
        <div style={{ padding: "1rem 2rem", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "1.2rem" }}>📅 Kronos - Emploi du Temps</h1>
          <div style={{ fontSize: "0.8rem", color: "#666" }}>Mode Établissement</div>
        </div>

        {/* La Grille Visuelle */}
        <div style={{ padding: "1rem" }}>
          <ScheduleView />
        </div>

      </div>

      {/* 3. Le Tiroir (Intercalaires) */}
      <Drawer 
        isOpen={!!activeTab} 
        onClose={() => setActiveTab(null)} 
        title={getDrawerTitle()}
        width="600px"
      >
        {renderDrawerContent()}
      </Drawer>

    </div>
  );
}