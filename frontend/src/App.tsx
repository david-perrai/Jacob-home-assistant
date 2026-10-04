import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Alert,
  Box,
  Chip,
  Container,
  Fab,
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

type FloatingButtonPosition = {
  left: number;
  top: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  latestX: number;
  latestY: number;
  initialLeft: number;
  initialTop: number;
  timer: ReturnType<typeof setTimeout>;
  dragging: boolean;
  moved: boolean;
};

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
  } = useVoiceAssistant();

  const eventSource = useSSE();
  const isBusy = sttStatus === "transcribing" || isThinking;
  const [floatingButtonPosition, setFloatingButtonPosition] =
    useState<FloatingButtonPosition | null>(null);
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [isTranscriptionVisible, setIsTranscriptionVisible] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!transcription) {
      setIsTranscriptionVisible(false);
      return;
    }

    setIsTranscriptionVisible(true);
    const timeout = setTimeout(() => setIsTranscriptionVisible(false), 30_000);
    return () => clearTimeout(timeout);
  }, [transcription]);

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
        </Toolbar>
        {isBusy && <LinearProgress className="assistant-progress" />}
      </AppBar>

      <Fab
        color={isRecording ? "error" : "primary"}
        aria-label={isRecording ? "Arrêter l'enregistrement" : "Parler à Jacob"}
        title="Maintenez pour déplacer"
        disabled={isBusy}
        onContextMenu={(event) => event.preventDefault()}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          toggleRecording();
        }}
        onPointerDown={(event) => {
          if (isBusy || event.button !== 0) return;

          const bounds = event.currentTarget.getBoundingClientRect();
          const dragState: Omit<DragState, "timer"> = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            latestX: event.clientX,
            latestY: event.clientY,
            initialLeft: bounds.left,
            initialTop: bounds.top,
            dragging: false,
            moved: false,
          };
          const timer = setTimeout(() => {
            const currentDrag = dragStateRef.current;
            if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

            currentDrag.dragging = true;
            setIsDraggingButton(true);
            setFloatingButtonPosition({
              left: currentDrag.initialLeft,
              top: currentDrag.initialTop,
            });
            if (
              currentDrag.latestX !== currentDrag.startX ||
              currentDrag.latestY !== currentDrag.startY
            ) {
              currentDrag.moved = true;
              const maxLeft = window.innerWidth - bounds.width;
              const maxTop = window.innerHeight - bounds.height;
              setFloatingButtonPosition({
                left: Math.max(
                  0,
                  Math.min(
                    maxLeft,
                    currentDrag.initialLeft + currentDrag.latestX - currentDrag.startX,
                  ),
                ),
                top: Math.max(
                  0,
                  Math.min(
                    maxTop,
                    currentDrag.initialTop + currentDrag.latestY - currentDrag.startY,
                  ),
                ),
              });
            }
          }, 350);
          dragStateRef.current = { ...dragState, timer };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const dragState = dragStateRef.current;
          if (!dragState || dragState.pointerId !== event.pointerId) return;

          dragState.latestX = event.clientX;
          dragState.latestY = event.clientY;
          if (!dragState.dragging) return;

          dragState.moved =
            dragState.moved ||
            Math.abs(event.clientX - dragState.startX) > 3 ||
            Math.abs(event.clientY - dragState.startY) > 3;
          const bounds = event.currentTarget.getBoundingClientRect();
          setFloatingButtonPosition({
            left: Math.max(
              0,
              Math.min(
                window.innerWidth - bounds.width,
                dragState.initialLeft + event.clientX - dragState.startX,
              ),
            ),
            top: Math.max(
              0,
              Math.min(
                window.innerHeight - bounds.height,
                dragState.initialTop + event.clientY - dragState.startY,
              ),
            ),
          });
        }}
        onPointerUp={(event) => {
          const dragState = dragStateRef.current;
          if (!dragState || dragState.pointerId !== event.pointerId) return;
          clearTimeout(dragState.timer);
          suppressClickRef.current = dragState.moved;
          dragStateRef.current = null;
          setIsDraggingButton(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          const dragState = dragStateRef.current;
          if (!dragState || dragState.pointerId !== event.pointerId) return;
          clearTimeout(dragState.timer);
          dragStateRef.current = null;
          setIsDraggingButton(false);
          suppressClickRef.current = false;
        }}
        sx={{
          position: "fixed",
          zIndex: 1300,
          ...(floatingButtonPosition
            ? {
                left: floatingButtonPosition.left,
                top: floatingButtonPosition.top,
                right: "auto",
                bottom: "auto",
              }
            : { right: 24, bottom: 24 }),
          touchAction: "none",
          userSelect: "none",
          cursor: isDraggingButton ? "grabbing" : "grab",
        }}
      >
        {isRecording ? <StopIcon /> : <MicIcon />}
      </Fab>

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
        {transcription && isTranscriptionVisible && (
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
