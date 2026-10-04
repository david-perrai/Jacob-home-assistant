import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Agenda } from "./components/Agenda";
import GoogleMap from "./components/googleMap";
import IndoorTemp from "./components/IndoorTemp";
import ShoppingList from "./components/shoppingList";
import Weather from "./components/Weather";
import { useSSE } from "./hooks/useSSE";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant";

function App() {
  const {
    isRecording,
    transcription,
    sttStatus,
    toggleRecording,
  } = useVoiceAssistant();

  const eventSource = useSSE();
  const isBusy = sttStatus === "transcribing";
  const statusLabel = isRecording
    ? "Je vous écoute"
    : sttStatus === "transcribing"
      ? "Envoi et analyse en cours"
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
          <Stack className="assistant-identity" spacing={0.5}>
            <Typography component="h1" variant="h6" className="assistant-title">
              Jacob
            </Typography>
            <Chip
              size="small"
              label={statusLabel}
              color={isRecording ? "error" : sttStatus === "error" ? "warning" : "success"}
              variant="outlined"
            />
          </Stack>

          <Stack
            className="assistant-action"
            direction="row"
            spacing={2}
            sx={{ alignItems: "center" }}
          >
            <Button
              variant="contained"
              color={isRecording ? "error" : "primary"}
              startIcon={isRecording ? <StopIcon /> : <MicIcon />}
              onClick={toggleRecording}
              disabled={isBusy}
              aria-label={isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
            >
              {isRecording ? "Terminer" : "Parler à Jacob"}
            </Button>
          </Stack>
        </Toolbar>
        {sttStatus === "transcribing" && <LinearProgress className="assistant-progress" />}
      </AppBar>

      <Container maxWidth="xl" disableGutters className="dashboard-content">
        {transcription && (
          <Paper className="transcription-panel" elevation={0}>
            <Typography variant="overline" color="text.secondary">
              Dernière demande
            </Typography>
            <Typography variant="body1">{transcription}</Typography>
          </Paper>
        )}

        <Box component="main" className="dashboard-grid">
          <Weather />
          <IndoorTemp sseEventSource={eventSource} />
          <ShoppingList sseEventSource={eventSource} />
          <Paper component="section" className="dashboard-card info-card" elevation={0}>
            <Agenda />
          </Paper>
          <GoogleMap sseEventSource={eventSource} />
        </Box>
      </Container>
    </Box>
  );
}

export default App;
