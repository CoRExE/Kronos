interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = true
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onCancel}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(2px)"
        }}
      >
        {/* Modal Box */}
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            background: "#1e1e1e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "1.5rem",
            width: "400px",
            maxWidth: "90vw",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            textAlign: "left"
          }}
        >
          <h3 style={{ marginTop: 0, color: danger ? "#ff4d4d" : "inherit" }}>{title}</h3>
          <p style={{ opacity: 0.8, fontSize: "0.95rem", lineHeight: "1.5", margin: "1rem 0" }}>
            {message}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
            <button 
              onClick={onCancel}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "white",
                cursor: "pointer"
              }}
            >
              {cancelLabel}
            </button>
            <button 
              onClick={onConfirm}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "6px",
                border: "none",
                background: danger ? "#ff4d4d" : "#646cff",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
