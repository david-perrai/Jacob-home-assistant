import React, { useState, useEffect } from "react";

interface RoomInfo {
  id: string;
  reachable: boolean;
  temperature?: number;
  setpoint?: number;
}

interface NetatmoData {
  homeId: string;
  rooms: {
    [roomName: string]: RoomInfo;
  };
}

interface IndoorTempProps {
  sseEventSource: EventSource | null;
}

export default function IndoorTemp({ sseEventSource }: IndoorTempProps) {
  const [data, setData] = useState<NetatmoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sseEventSource) return;

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (["Netatmo.temperature.set"].includes(data.type)) {
          fetchTemperatures();
        }
      } catch (e) {
        console.error(
          "Erreur lors du parsing de l'événement SSE (Netatmo.temperature.set):",
          e,
        );
      }
    };

    sseEventSource.addEventListener("Netatmo.temperature.set", handler);

    return () => {
      sseEventSource.removeEventListener("Netatmo.temperature.set", handler);
    };
  }, [sseEventSource]);

  const fetchTemperatures = async () => {
    try {
      const response = await fetch("/api/netatmo/rooms");
      if (response.status === 400 || response.status === 500) {
        // If credentials/tokens are missing or failed, trigger authorization flow
        setNeedsAuth(true);
        setData(null);
        return;
      }
      if (!response.ok) throw new Error("Erreur de connexion");

      const result = await response.json();
      if (!result.rooms || Object.keys(result.rooms).length === 0) {
        setNeedsAuth(true);
      } else {
        setData(result);
        setNeedsAuth(false);
      }
      setError(null);
    } catch (err) {
      setError("Impossible de charger les températures");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemperatures();
    // Refresh every 10 minutes
    const interval = setInterval(fetchTemperatures, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    try {
      const redirectUri = "http://localhost:8080/netatmo/callback";
      const response = await fetch(
        `/api/netatmo/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`,
      );
      if (!response.ok) throw new Error("Failed to get auth URL");
      const authData = await response.json();
      if (authData.url) {
        window.location.href = authData.url;
      }
    } catch (err) {
      console.error(err);
      setError("Erreur d'authentification");
    }
  };

  if (loading) {
    return (
      <section className="dashboard-card indoor-temp-card loading">
        <div className="card-header">
          <span className="icon">🌡️</span>
          <h2>Température intérieure</h2>
        </div>
        <div className="indoor-temp-content">Chargement des données...</div>
      </section>
    );
  }

  if (needsAuth) {
    return (
      <section className="dashboard-card indoor-temp-card auth-needed">
        <div className="card-header">
          <span className="icon">🌡️</span>
          <h2>Température intérieure</h2>
        </div>
        <div className="netatmo-auth-prompt">
          <p>
            Associez votre thermostat Netatmo pour afficher les températures en
            temps réel.
          </p>
          <button className="netatmo-connect-btn" onClick={handleConnect}>
            <span className="btn-icon">🔐</span> Associer Netatmo
          </button>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="dashboard-card indoor-temp-card error">
        <div className="card-header">
          <span className="icon">⚠️</span>
          <h2>Température intérieure</h2>
        </div>
        <div className="indoor-temp-content error-text">
          {error || "Erreur lors du chargement."}
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-card indoor-temp-card">
      <div className="card-header">
        <span className="icon">🌡️</span>
        <h2>Température intérieure</h2>
      </div>

      <div className="rooms-grid">
        {Object.entries(data.rooms).map(([roomName, info]) => (
          <div key={info.id} className="room-card">
            <div className="room-status-indicator">
              <span
                className={`status-dot ${info.reachable ? "online" : "offline"}`}
              />
              <span className="room-name">{roomName}</span>
            </div>

            {info.temperature !== undefined ? (
              <div className="room-temp">
                <span className="temp-value">
                  {info.temperature.toFixed(1)}
                </span>
                <span className="temp-unit">°C</span>
              </div>
            ) : (
              <div className="room-temp-missing">--</div>
            )}

            {info.setpoint !== undefined && (
              <div className="room-setpoint">
                <span>Consigne : </span>
                <span className="setpoint-value">
                  {info.setpoint.toFixed(1)}°C
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
