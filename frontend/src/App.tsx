import { useVoiceAssistant } from "./hooks/useVoiceAssistant";
import { useSSE } from "./hooks/useSSE";
import ShoppingList from "./components/shoppingList";
import GoogleMap from "./components/googleMap";
import Weather from "./components/Weather";
import IndoorTemp from "./components/IndoorTemp";
import { Agenda } from "./components/Agenda";
import "./App.css";

function App() {
  const {
    isLoaded,
    isListening,
    isInitializing,
    keywordDetected,
    isRecording,
    transcription,
    sttStatus,
    loadProgress,
    initPorcupine,
    start,
    stop,
    stopAudioSession,
  } = useVoiceAssistant();

  // Connexion SSE partagée
  const eventSource = useSSE();

  return (
    <div className="dashboard-container">
      <header
        className={`ai-mini-header ${isListening ? "listening" : ""} ${isRecording ? "recording" : ""} ${keywordDetected ? "detected" : ""}`}
      >
        <div className="ai-status-compact">
          <div className="status-dot-mini"></div>
          <span className="status-text-mini">
            {keywordDetected
              ? "Jacob: Détecté !"
              : isRecording
                ? "Jacob: Enregistrement..."
                : sttStatus === "transcribing"
                  ? "Jacob: Analyse..."
                  : isListening
                    ? "Jacob: Prêt"
                    : "Jacob: Inactif"}
          </span>
        </div>

        {sttStatus === "loading" && (
          <div className="mini-progress">
            <div
              className="mini-progress-bar"
              style={{ width: `${loadProgress}%` }}
            ></div>
          </div>
        )}

        <div className="mini-transcription">
          {transcription && <p>"{transcription}"</p>}
        </div>

        <div className="header-controls">
          {!isLoaded ? (
            <button
              className="mini-btn"
              onClick={initPorcupine}
              disabled={isInitializing}
            >
              {isInitializing ? "..." : "Recréer"}
            </button>
          ) : (
            <button
              className={`mini-btn ${isRecording || isListening ? "stop" : ""}`}
              onClick={() =>
                isRecording
                  ? stopAudioSession()
                  : isListening
                    ? stop()
                    : start()
              }
            >
              {isRecording ? "Stop" : isListening ? "Pause" : "Play"}
            </button>
          )}
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Weather Block */}
        <Weather />

        {/* Indoor Temperature Block */}
        <IndoorTemp sseEventSource={eventSource} />

        {/* Shopping List Block */}
        <ShoppingList sseEventSource={eventSource} />

        {/* Context Card (Stats/Latency) */}
        <section className="dashboard-card info-card">
          <Agenda />
        </section>

        {/* Google Maps Block */}
        <GoogleMap sseEventSource={eventSource} />
      </main>
    </div>
  );
}

export default App;
