self.addEventListener("install", () => {
  console.log("✅ Service Worker installed");
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-location") {
    event.waitUntil(syncLocation());
  }
});

async function syncLocation() {
  const data = localStorage.getItem("geoLocation");
  if (data) {
    const { lat, lon } = JSON.parse(data);
    console.log("📡 Background Sync Triggered:", { lat, lon });
  
  }
}