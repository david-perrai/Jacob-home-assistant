import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Portal,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useEffect, useRef, useState } from "react";
import RagApi from "../api/RagApi";
import type { SttStatus } from "../hooks/useTranscription";

interface AssistantSpeedDialProps {
  isRecording: boolean;
  isBusy: boolean;
  isThinking: boolean;
  sttStatus: SttStatus;
  transcription: string;
  assistantResponse: string;
  subscribeToAudioLevel: (listener: (level: number) => void) => () => void;
  promptError: string | null;
  isVoicePanelOpen: boolean;
  isStarting: boolean;
  onShowVoicePanel: () => void;
  onDismissVoicePanel: () => void;
  onToggleRecording: () => void;
  onSubmitTextPrompt: (text: string, file?: File) => Promise<boolean>;
}

export default function AssistantSpeedDial({
  isRecording,
  isBusy,
  isThinking,
  sttStatus,
  transcription,
  assistantResponse,
  subscribeToAudioLevel,
  promptError,
  isVoicePanelOpen,
  isStarting,
  onShowVoicePanel,
  onDismissVoicePanel,
  onToggleRecording,
  onSubmitTextPrompt,
}: AssistantSpeedDialProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [notification, setNotification] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  useEffect(
    () => subscribeToAudioLevel(setAudioLevel),
    [subscribeToAudioLevel],
  );

  useEffect(() => {
    if (!assistantResponse) return;

    onShowVoicePanel();
    const openTimer = window.setTimeout(() => {
      onDismissVoicePanel();
    }, 5_000);

    return () => {
      window.clearTimeout(openTimer);
    };
  }, [assistantResponse, onDismissVoicePanel, onShowVoicePanel]);

  const submitPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const request = prompt.trim();
    if ((!request && !selectedFile) || isBusy) return;

    setPrompt("");
    const file = selectedFile ?? undefined;
    setSelectedFile(null);
    setIsPromptOpen(false);
    void onSubmitTextPrompt(request, file);
  };

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
        message:
          error instanceof Error
            ? error.message
            : "L'import du document a échoué.",
        severity: "error",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const displayedText =
    assistantResponse ||
    (isStarting
      ? "Préparation de l’écoute…"
      : transcription ||
        (isThinking
          ? "Jacob prépare une réponse…"
          : sttStatus === "transcribing"
            ? "Transcription en cours…"
            : isRecording
              ? "Je vous écoute…"
              : "Dites quelque chose pour commencer."));

  return (
    <>
      <Box
        component="nav"
        aria-label="Actions de l’assistant"
        className="sidebar-assistant-actions"
      >
        <Button
          className="sidebar-nav-item sidebar-assistant-action"
          aria-label="Écrire à Jacob"
          startIcon={<SendIcon />}
          onClick={() => setIsPromptOpen(true)}
        >
          Écrire à Jacob
        </Button>
        <Button
          className="sidebar-nav-item sidebar-assistant-action"
          aria-label="Importer un document PDF ou texte"
          startIcon={
            isUploading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <CloudUploadIcon />
            )
          }
          disabled={isUploading}
          aria-busy={isUploading}
          title={
            isUploading
              ? "Vectorisation du document en cours"
              : "Importer un document PDF ou texte"
          }
          onClick={() => fileInputRef.current?.click()}
        >
          Importer
        </Button>
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        hidden
        onChange={(event) => void uploadSelectedFile(event.target.files?.[0])}
      />

      {isVoicePanelOpen && (
        <Portal>
          <Box
            className="assistant-overlay"
            role="presentation"
            onDoubleClick={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") onDismissVoicePanel();
            }}
          >
            <Paper
              className="assistant-voice-panel"
              component="section"
              elevation={0}
              aria-live="polite"
              aria-label="Conversation vocale avec Jacob"
            >
              <Box className="assistant-voice-content">
                {!assistantResponse && isRecording && (
                  <IconButton
                    className="assistant-voice-stop"
                    aria-label="Arrêter l’écoute"
                    title="Arrêter l’écoute"
                    onClick={onToggleRecording}
                  >
                    <StopIcon />
                  </IconButton>
                )}
                <Box className="assistant-voice-message">
                  <Typography
                    component="p"
                    className="assistant-voice-text"
                    aria-label={
                      assistantResponse ? "Réponse de Jacob" : "Message vocal"
                    }
                  >
                    {displayedText}
                  </Typography>
                  {(isRecording || isBusy || isStarting) &&
                    !assistantResponse && (
                      <Box className="assistant-voice-indicator-row">
                        {isRecording && (
                          <div
                            className="voice-visualizer assistant-voice-visualizer"
                            role="img"
                            aria-label="Niveau sonore du microphone"
                          >
                            {[0.58, 0.86, 1, 0.76, 0.5].map((weight, index) => (
                              <span
                                className="voice-visualizer-bar"
                                key={index}
                                style={{
                                  height: `${Math.max(18, audioLevel * weight * 100)}%`,
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {(isBusy || isStarting) && !isRecording && (
                          <CircularProgress
                            className="assistant-voice-status"
                            size={20}
                            color="inherit"
                            role="status"
                            aria-label={
                              isStarting
                                ? "Préparation de l’écoute"
                                : isThinking
                                  ? "Jacob réfléchit"
                                  : "Transcription en cours"
                            }
                          />
                        )}
                      </Box>
                    )}
                </Box>
              </Box>
            </Paper>
          </Box>
        </Portal>
      )}

      <Dialog
        open={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        fullWidth
        maxWidth="sm"
        className="app-dialog"
        aria-labelledby="text-prompt-title"
      >
        <Box component="form" onSubmit={submitPrompt}>
          <DialogTitle id="text-prompt-title">Écrire à Jacob</DialogTitle>
          <DialogContent>
            {promptError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {promptError}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  component="label"
                  htmlFor="text-prompt-file"
                  startIcon={<AttachFileIcon />}
                  disabled={isBusy}
                >
                  Joindre un fichier
                </Button>
                <input
                  id="text-prompt-file"
                  type="file"
                  accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,application/pdf,text/plain,image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) setSelectedFile(file);
                    event.currentTarget.value = "";
                  }}
                />
                {selectedFile && (
                  <Chip
                    label={selectedFile.name}
                    onDelete={() => setSelectedFile(null)}
                    disabled={isBusy}
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setIsPromptOpen(false)}>Annuler</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={(!prompt.trim() && !selectedFile) || isBusy}
              startIcon={
                isBusy ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
            >
              Envoyer
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
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
