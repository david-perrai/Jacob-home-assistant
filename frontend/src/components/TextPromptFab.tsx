import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  TextField,
} from "@mui/material";
import { FormEvent, useState } from "react";

interface TextPromptFabProps {
  isBusy: boolean;
  error: string | null;
  onSubmit: (text: string) => Promise<boolean>;
}

export default function TextPromptFab({
  isBusy,
  error,
  onSubmit,
}: TextPromptFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const submitPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request = prompt.trim();
    if (!request || isBusy) return;

    setPrompt("");
    setIsOpen(false);
    void onSubmit(request);
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="Écrire à Jacob"
        title="Écrire une demande à Jacob"
        onClick={() => setIsOpen(true)}
        sx={{
          position: "fixed",
          right: 24,
          bottom: 168,
          zIndex: 1300,
        }}
      >
        <SendIcon />
      </Fab>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="text-prompt-title"
      >
        <Box component="form" onSubmit={submitPrompt}>
          <DialogTitle id="text-prompt-title">Écrire à Jacob</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ pt: 1 }}>
              <TextField
                autoFocus
                fullWidth
                multiline
                minRows={3}
                maxRows={8}
                label="Votre demande"
                placeholder="Que souhaitez-vous demander ?"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={isBusy}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!prompt.trim() || isBusy}
              startIcon={
                isBusy ? <CircularProgress size={16} color="inherit" /> : <SendIcon />
              }
            >
              Envoyer
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
