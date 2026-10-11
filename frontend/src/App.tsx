import { lazy, Suspense, useEffect, useState } from "react";
import {
  AppBar,
  Alert,
  Box,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import GoogleMap from "./components/googleMap";
import AssistantFab from "./components/AssistantFab";
import DocumentUploadFab from "./components/DocumentUploadFab";
import TextPromptFab from "./components/TextPromptFab";
import IndoorTemp from "./components/IndoorTemp";
import ShoppingList from "./components/shoppingList";
import TvStatusCard from "./components/TvStatusCard";
import Weather from "./components/Weather";
import { useSSE } from "./hooks/useSSE";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant";

const Agenda = lazy(() =>
  import("./components/Agenda").then((module) => ({ default: module.Agenda })),
);

function App() {
  const {
    isRecording,
    recordingError,
    speechError,
    promptError,
    transcription,
    sttStatus,
    isThinking,
    toggleRecording,
    submitTextPrompt,
    requestVersion,
  } = useVoiceAssistant();

  const eventSource = useSSE();
  const isBusy = sttStatus === "transcribing" || isThinking;
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useState(false);

  useEffect(() => {
    if (!transcription) {
      setIsTranscriptionVisible(false);
      return;
    }

    setIsTranscriptionVisible(true);
    const timeout = setTimeout(() => setIsTranscriptionVisible(false), 30_000);
    return () => clearTimeout(timeout);
  }, [transcription, requestVersion]);

  const statusLabel = isRecording
    ? "Je vous écoute"
    : isThinking
      ? "Réflexion…"
      : sttStatus === "transcribing"
        ? "Transcription en cours"
        : sttStatus === "error"
          ? "Transcription indisponible"
          : "Prêt à vous écouter";

  return (
    <Box className="dashboard-container">
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        className={`ai-mini-header ${isRecording ? "recording" : ""}`}
      >
        <Toolbar className="assistant-toolbar" disableGutters>
          <Stack
            className="assistant-identity"
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <Typography component="h1" variant="h6" className="assistant-title">
              Jacob
            </Typography>
            <Chip
              size="small"
              label={statusLabel}
              color={
                isRecording
                  ? "error"
                  : isThinking
                    ? "info"
                    : sttStatus === "error"
                      ? "warning"
                      : "success"
              }
              variant="outlined"
            />
          </Stack>
          {transcription && isTranscriptionVisible && (
            <Paper className="transcription-panel assistant-request" elevation={0}>
              <Typography variant="overline" color="text.secondary">
                Dernière demande
              </Typography>
              <Typography variant="body2" title={transcription} noWrap>
                {transcription}
              </Typography>
            </Paper>
          )}
        </Toolbar>
        {isBusy && <LinearProgress className="assistant-progress" />}
      </AppBar>

      <AssistantFab
        isRecording={isRecording}
        isBusy={isBusy}
        onToggleRecording={toggleRecording}
      />
      <TextPromptFab
        isBusy={isBusy}
        error={promptError}
        onSubmit={submitTextPrompt}
      />
      <DocumentUploadFab />

      <Container maxWidth="xl" disableGutters className="dashboard-content">
        {recordingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {recordingError}
          </Alert>
        )}
        {speechError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {speechError}
          </Alert>
        )}
        {promptError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {promptError}
          </Alert>
        )}
        <Box component="main" className="dashboard-grid">
          <Weather />
          <ShoppingList sseEventSource={eventSource} />
          <Box className="device-stack">
            <IndoorTemp sseEventSource={eventSource} />
            <TvStatusCard />
          </Box>
          <Paper component="section" className="dashboard-card info-card" elevation={0}>
            <Suspense fallback={<div className="agenda-status">Chargement de l'agenda...</div>}>
              <Agenda />
            </Suspense>
          </Paper>
          <GoogleMap sseEventSource={eventSource} />
        </Box>
      </Container>
    </Box>
  );
}

export default App;
