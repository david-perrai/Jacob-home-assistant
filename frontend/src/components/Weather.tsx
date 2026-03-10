import React, { useState, useEffect } from 'react';

interface WeatherData {
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
  };
  location: {
    name: string;
    country: string;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        condition: {
          text: string;
          icon: string;
        };
      };
    }>;
  };
}

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_WEATHER_API_ACCESS_KEY;
  const city = "Nantes";

  useEffect(() => {
    const fetchWeather = async () => {
      if (!apiKey) {
        setError("API Key manquante");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&lang=fr`
        );
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError("Impossible de charger la météo");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey]);

  if (loading) {
    return (
      <section className="dashboard-card weather-card loading">
        <div className="card-header">
          <span className="icon">⌛</span>
          <h2>Météo</h2>
        </div>
        <div className="weather-content">Chargement...</div>
      </section>
    );
  }

  if (error || !weather) {
    return (
      <section className="dashboard-card weather-card error">
        <div className="card-header">
          <span className="icon">⚠️</span>
          <h2>Météo</h2>
        </div>
        <div className="weather-content">{error || "Erreur"}</div>
      </section>
    );
  }

  return (
    <section className="dashboard-card weather-card">
      <div className="card-header">
        <img 
          src={weather.current.condition.icon} 
          alt={weather.current.condition.text} 
          className="weather-icon-main"
        />
        <h2>Météo - {weather.location.name}</h2>
      </div>
      
      <div className="weather-content">
        <div className="current-weather">
          <div className="temp">{Math.round(weather.current.temp_c)}°C</div>
          <div className="condition">{weather.current.condition.text}</div>
        </div>

        <div className="forecast-grid">
          {weather.forecast.forecastday.map((day, index) => (
            <div key={day.date} className="forecast-item">
              <span className="forecast-date">
                {index === 0 ? "Aujourd'hui" : 
                 new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
              </span>
              <img src={day.day.condition.icon} alt={day.day.condition.text} title={day.day.condition.text} />
              <div className="forecast-temps">
                <span className="max">{Math.round(day.day.maxtemp_c)}°</span>
                <span className="min">{Math.round(day.day.mintemp_c)}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Weather;
