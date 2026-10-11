import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Alert, CircularProgress, Fab, Snackbar } from "@mui/material";
import { useRef, useState } from "react";
import RagApi from "../api/RagApi";

export default function DocumentUploadFab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  const uploadSelectedFile = async (file?: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await RagApi.uploadDocument(file);
      setNotification({
        message: `${result.filename} : ${result.message}`,
        severity: "success",
      });
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : "L'import du document a échoué.",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        hidden
        onChange={(event) => void uploadSelectedFile(event.target.files?.[0])}
      />
      <Fab
        color="secondary"
        aria-label="Importer un document PDF ou texte"
        aria-busy={isUploading}
        title={isUploading ? "Vectorisation du document en cours" : "Importer un document PDF ou texte"}
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          position: "fixed",
          right: 24,
          bottom: 96,
          zIndex: 1300,
        }}
      >
        {isUploading ? <CircularProgress size={24} color="inherit" /> : <CloudUploadIcon />}
      </Fab>
      <Snackbar
        open={notification !== null}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notification ? (
          <Alert
            severity={notification.severity}
            onClose={() => setNotification(null)}
            variant="filled"
          >
            {notification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
