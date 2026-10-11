import { useEffect, useState } from "react";

interface AudioStatus {
  returnValue: boolean;
  scenario: string;
  volume: number;
  mute: boolean;
}

export default function TvStatusCard() {
  const [audioStatus, setAudioStatus] = useState<AudioStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchAudioStatus = async () => {
      try {
        const response = await fetch("/api/tv/audioStatus");
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        const status: AudioStatus = await response.json();
        if (
          !status.returnValue ||
          typeof status.volume !== "number" ||
          typeof status.mute !== "boolean"
        ) {
          throw new Error("Réponse audio invalide");
        }
        if (isActive) {
          setAudioStatus(status);
          setError(null);
        }
      } catch (fetchError) {
        console.error("Impossible de récupérer le statut audio du téléviseur", fetchError);
        if (isActive) {
          setError("Statut audio indisponible");
        }
      }
    };

    fetchAudioStatus();
    // const interval = setInterval(fetchAudioStatus, 30_000);
    // return () => {
    //   isActive = false;
    //   clearInterval(interval);
    // };
  }, []);

  return (
    <section className="dashboard-card tv-card">
      <div className="card-header">
        <span className="icon">📺</span>
        <h2>TV</h2>
      </div>
      {error ? (
        <p className="tv-status-error">{error}</p>
      ) : audioStatus ? (
        <div className="tv-audio-status">
          <span className={`tv-mute-state ${audioStatus.mute ? "muted" : "unmuted"}`}>
            {audioStatus.mute ? "Muet" : "Son activé"}
          </span>
          <span className="tv-volume">
            Volume <strong>{audioStatus.volume}</strong>
          </span>
        </div>
      ) : (
        <p className="tv-status-loading">Chargement du statut audio…</p>
      )}
    </section>
  );
}
