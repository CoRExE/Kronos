interface SidebarProps {
  onSelect: (tab: string) => void;
  activeTab: string | null;
}

export default function Sidebar({ onSelect, activeTab }: SidebarProps) {
  const menuItems = [
    { id: "grid", label: "⏰ Grille", icon: "⚙️" },
    { id: "subjects", label: "📚 Matières", icon: "📘" },
    { id: "teachers", label: "👨‍🏫 Profs", icon: "🎓" },
    { id: "groups", label: "🎓 Classes", icon: "👥" },
    { id: "allocations", label: "🔗 Besoins", icon: "Link" },
    { id: "rules", label: "⚖️ Règles", icon: "Scale" },
    { id: "generate", label: "🚀 Moteur", icon: "⚡" },
  ];

  return (
    <div style={{ 
      width: "80px", 
      minWidth: "80px", // Garantir la largeur
      background: "#252525", 
      borderRight: "1px solid #333",
      display: "flex", 
      flexDirection: "column",
      alignItems: "center",
      paddingTop: "1rem",
      zIndex: 50 // Supérieur au Drawer (40)
    }}>
      <div style={{ marginBottom: "2rem", fontSize: "1.5rem" }}>⏳</div>
      
      {menuItems.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          title={item.label}
          style={{
            width: "50px",
            height: "50px",
            marginBottom: "1rem",
            borderRadius: "12px",
            border: "none",
            background: activeTab === item.id ? "#646cff" : "transparent",
            color: activeTab === item.id ? "white" : "#aaa",
            fontSize: "1.2rem",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
