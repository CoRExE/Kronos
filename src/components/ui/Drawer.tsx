import { ReactNode, useEffect, useState } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export default function Drawer({ isOpen, onClose, title, children, width = "500px" }: DrawerProps) {
  const [show, setShow] = useState(isOpen);

  // Gestion de l'animation de montage/démontage
  useEffect(() => {
    if (isOpen) setShow(true);
    else {
      const timer = setTimeout(() => setShow(false), 300); // Match CSS transition
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  return (
    <>
      {/* Plus d'overlay bloquant pour permettre le clic sur la sidebar */}

      {/* Panneau Latéral */}
      <div style={{
        position: "fixed",
        top: 0, 
        left: "80px", // DÉCALAGE pour laisser la Sidebar libre !
        bottom: 0,
        width: width,
        maxWidth: "calc(100vw - 80px)",
        backgroundColor: "var(--background, #1a1a1a)",
        color: "var(--foreground, #fff)",
        boxShadow: isOpen ? "4px 0 15px rgba(0,0,0,0.5)" : "none",
        zIndex: 40, // En dessous de la sidebar (qui sera à 50)
        transform: isOpen ? "translateX(0)" : "translateX(-110%)",
        transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.1)"
      }}>
        {/* Header */}
        <div style={{ 
          padding: "1.5rem", 
          borderBottom: "1px solid rgba(128,128,128,0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.02)"
        }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: "transparent", 
              border: "none", 
              fontSize: "1.5rem", 
              cursor: "pointer",
              color: "inherit",
              opacity: 0.7
            }}
          >
            ×
          </button>
        </div>

        {/* Contenu Scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {children}
        </div>
      </div>
    </>
  );
}
