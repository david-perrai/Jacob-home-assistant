import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { Alert, Box, Container, Paper, Typography } from "@mui/material";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import AssistantSpeedDial from "./components/AssistantSpeedDial";
import EventTimeline from "./components/EventTimeline";
import GoogleMap from "./components/googleMap";
import IndoorTemp from "./components/IndoorTemp";
import RecipesCard from "./components/RecipesCard";
import ShoppingList from "./components/shoppingList";
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
    assistantResponse,
    sttStatus,
    isThinking,
    toggleRecording,
    submitTextPrompt,
    subscribeToAudioLevel,
  } = useVoiceAssistant();

  const eventSource = useSSE();
  const isBusy = sttStatus === "transcribing" || isThinking;
  const [activePage, setActivePage] = useState<"overview" | "agenda">(
    "overview",
  );
  const [isVoicePanelOpen, setVoicePanelOpen] = useState(false);
  const [isWaitingForRecording, setWaitingForRecording] = useState(false);
  const lastTouchTapRef = useRef(0);
  const recordingStartTimeoutRef = useRef<number | null>(null);
  const recordingStateRef = useRef({ isRecording, isBusy });
  recordingStateRef.current = { isRecording, isBusy };
  const showVoicePanel = useCallback(() => setVoicePanelOpen(true), []);
  const dismissVoicePanel = useCallback(() => {
    if (recordingStartTimeoutRef.current !== null) {
      window.clearTimeout(recordingStartTimeoutRef.current);
      recordingStartTimeoutRef.current = null;
    }
    setWaitingForRecording(false);
    setVoicePanelOpen(false);
  }, []);
  useEffect(
    () => () => {
      if (recordingStartTimeoutRef.current !== null) {
        window.clearTimeout(recordingStartTimeoutRef.current);
      }
    },
    [],
  );
  const activateVoiceAssistant = useCallback(() => {
    setVoicePanelOpen(true);
    if (
      recordingStateRef.current.isRecording ||
      recordingStateRef.current.isBusy ||
      recordingStartTimeoutRef.current !== null
    ) {
      return;
    }

    setWaitingForRecording(true);
    recordingStartTimeoutRef.current = window.setTimeout(() => {
      recordingStartTimeoutRef.current = null;
      setWaitingForRecording(false);
      if (
        !recordingStateRef.current.isRecording &&
        !recordingStateRef.current.isBusy
      ) {
        toggleRecording();
      }
    }, 1_000);
  }, [toggleRecording]);

  return (
    <Box
      className="dashboard-container"
      onDoubleClick={() => {
        if (Date.now() - lastTouchTapRef.current < 600) return;
        activateVoiceAssistant();
      }}
      onTouchEnd={() => {
        const now = Date.now();
        if (now - lastTouchTapRef.current < 350) {
          lastTouchTapRef.current = now;
          activateVoiceAssistant();
          return;
        }
        lastTouchTapRef.current = now;
      }}
    >
      <Box component="aside" className="dashboard-sidebar">
        <Box className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">
            J
          </span>
          <Typography component="span" className="sidebar-brand-name">
            Jacob
          </Typography>
        </Box>
        <Box
          component="nav"
          aria-label="Navigation principale"
          className="sidebar-nav"
        >
          <Box
            component="button"
            type="button"
            aria-current={activePage === "overview" ? "page" : undefined}
            className={`sidebar-nav-item${activePage === "overview" ? " active" : ""}`}
            onClick={() => setActivePage("overview")}
          >
            <HomeRoundedIcon aria-hidden="true" />
            <span>Vue d’ensemble</span>
          </Box>
          <Box
            component="button"
            type="button"
            aria-current={activePage === "agenda" ? "page" : undefined}
            className={`sidebar-nav-item${activePage === "agenda" ? " active" : ""}`}
            onClick={() => setActivePage("agenda")}
          >
            <CalendarMonthRoundedIcon aria-hidden="true" />
            <span>Agenda</span>
          </Box>
        </Box>
        <AssistantSpeedDial
          isRecording={isRecording}
          isBusy={isBusy}
          isThinking={isThinking}
          sttStatus={sttStatus}
          transcription={transcription}
          assistantResponse={assistantResponse}
          subscribeToAudioLevel={subscribeToAudioLevel}
          promptError={promptError}
          isVoicePanelOpen={isVoicePanelOpen}
          isStarting={isWaitingForRecording}
          onShowVoicePanel={showVoicePanel}
          onDismissVoicePanel={dismissVoicePanel}
          onToggleRecording={toggleRecording}
          onSubmitTextPrompt={submitTextPrompt}
        />
      </Box>

      <Box component="div" className="dashboard-main">
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
          {activePage === "overview" ? (
            <Box component="main" className="dashboard-grid">
              <Weather />
              <IndoorTemp sseEventSource={eventSource} />
              <RecipesCard />
              <ShoppingList sseEventSource={eventSource} />
              <Paper
                component="section"
                className="dashboard-card info-card timeline-card"
                elevation={0}
              >
                <EventTimeline onOpenAgenda={() => setActivePage("agenda")} />
              </Paper>
              <GoogleMap sseEventSource={eventSource} />
            </Box>
          ) : (
            <Box component="main" className="agenda-page">
              <Typography
                component="h1"
                variant="h4"
                className="agenda-page-title"
              >
                Agenda
              </Typography>
              <Paper
                component="section"
                className="dashboard-card agenda-page-card"
                elevation={0}
              >
                <Suspense
                  fallback={
                    <div className="agenda-status">
                      Chargement de l'agenda...
                    </div>
                  }
                >
                  <Agenda showHeading={false} />
                </Suspense>
              </Paper>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default App;
