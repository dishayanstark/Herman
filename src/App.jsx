import React, { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState();
  const [showPulse,setShowPulse]=useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service Worker registered"))
        .catch((err) => console.error("❌ Service Worker error:", err));
    }
  }, []);

  const getLocation = () => {
    setStatus("Getting location...");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(drawMapOnCanvas, () =>
        alert("Failed to get location.")
      );
    } else {
      alert("Geolocation not supported");
    }
  };

  const drawMapOnCanvas = (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const zoom = 15;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const xTile = Math.floor(((lon + 180) / 360) * n);
    const yTile = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        n
    );

    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${xTile}/${yTile}.png`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = tileUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // ctx.fillStyle = "red";
      // ctx.beginPath();
      // ctx.arc(canvas.width / 2, canvas.height / 2, 8, 0, 2 * Math.PI);
      // ctx.fill();

      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      ctx.fillText(`Latitude: ${lat.toFixed(5)}`, 10, canvas.height - 30);
      ctx.fillText(`Longitude: ${lon.toFixed(5)}`, 10, canvas.height - 10);

      setShowPulse(true);
    
      getPlaceName(lat, lon); 
      saveToBackground(lat, lon);
    };
    img.onerror = () => {
      setShowPulse(false);
      setStatus("❌ Failed to load map tile");
    };
  };

  const getPlaceName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      const name = data.display_name || "Unknown location";
      setStatus(`📍 You are at: ${name}`);
      saveToBackground(lat,lon,name);
    } catch (err) {
      console.error("Failed to fetch place name", err);
      setStatus(`📍 Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
      saveToBackground(lat,lon,null)
    }
  };

  const saveToBackground = (latitude, longitude, placeName=null) => {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((swReg) => {
        const locationData={latitude, longitude, name:placeName};
        localStorage.setItem("Location", JSON.stringify({ locationData }));
        swReg.sync.register("sync-location");
      });
    }
  };

  return (
    <div className="App">
      <h1>GeoCanvas Map Logger</h1>
      <div className="map-container" style={{position:"relative",display:"inline-block"}}>
      <canvas ref={canvasRef} width={400} height={300}></canvas>
      {showPulse && <div className="pulse-dot"></div>}
      </div>
      <button onClick={getLocation}>Get My Location</button>
      <p>Status: <strong>{status}</strong></p>
    </div>
  );
}

export default App;