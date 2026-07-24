import { useState } from "react";

interface LocationFieldsProps {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
}

export function LocationFields({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}: LocationFieldsProps) {
  const [message, setMessage] = useState("");

  function captureLocation() {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not available in this browser.");
      return;
    }
    setMessage("Getting location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLatitudeChange(position.coords.latitude.toFixed(6));
        onLongitudeChange(position.coords.longitude.toFixed(6));
        setMessage(`Location captured (±${Math.round(position.coords.accuracy)} m).`);
      },
      () => setMessage("Location permission was denied or unavailable."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="location-fields">
      <div className="field">
        <label htmlFor="latitude">Latitude</label>
        <input
          id="latitude"
          inputMode="decimal"
          value={latitude}
          onChange={(event) => onLatitudeChange(event.target.value)}
          placeholder="15.3071"
        />
      </div>
      <div className="field">
        <label htmlFor="longitude">Longitude</label>
        <input
          id="longitude"
          inputMode="decimal"
          value={longitude}
          onChange={(event) => onLongitudeChange(event.target.value)}
          placeholder="120.9464"
        />
      </div>
      <button type="button" className="btn secondary location-button" onClick={captureLocation}>
        Use my location
      </button>
      {message && <span className="form-hint">{message}</span>}
    </div>
  );
}
