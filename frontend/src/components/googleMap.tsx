import { useState, useEffect } from "react";

interface GoogleMapProps {
  sseEventSource: EventSource | null;
}

export default function GoogleMap({ sseEventSource }: GoogleMapProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  // Écouter les événements SSE de navigation
  useEffect(() => {
    if (!sseEventSource) return;

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (["DirectoryEntry.navigateTo"].includes(data.type)) {
          const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(data.data)}&output=embed`;
          setMapUrl(embedUrl);
        }
      } catch (e) {
        console.error(
          "Erreur lors du parsing de l'événement SSE (directoryEntry):",
          e
        );
      }
    };

    sseEventSource.addEventListener("directoryEntry", handler);

    return () => {
      sseEventSource.removeEventListener("directoryEntry", handler);
    };
  }, [sseEventSource]);

  if (!mapUrl) return null;

  return (
    <section className="dashboard-card map-card">
      <div className="card-header">
        <span className="icon">🗺️</span>
        <h2>Navigation</h2>
        <button className="close-btn" onClick={() => setMapUrl(null)}>
          ×
        </button>
      </div>
      <div className="map-content">
        <iframe
          title="Google Maps"
          width="100%"
          height="450"
          style={{ border: 0, borderRadius: "8px" }}
          src={mapUrl}
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
