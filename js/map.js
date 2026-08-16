function initMap() {
  map = L.map("map", {
    fullscreenControl: true,
    zoomControl: true,
  }).setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM_DEFAULT);
  lightTileLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap contributors" },
  );
  darkTileLayer = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "&copy; OpenStreetMap contributors &copy; CARTO" },
  );
  markers = L.layerGroup().addTo(map);
  syncMapTiles();
}
function popupContent(item) {
  const rows = FIELDS.map((field) => {
    const value = getFieldValue(field, item);
    return `<dt>${fieldLabel(field)}</dt><dd>${field.html ? value : escapeHtml(value)}</dd>`;
  }).join("");
  return `<div class="fw-bold border-bottom pb-2 mb-2">${escapeHtml(item.adresse_ban || "Adresse inconnue")}</div><dl class="popup-grid">${rows}</dl>`;
}
function markerIconName(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("maison")) {
    return "house-door-fill";
  }
  if (normalized.includes("immeuble")) {
    return "buildings-fill";
  }
  return "building";
}
function renderMarkers() {
  markers.clearLayers();
  markerIndex = new Map();
  const bounds = [];
  let geocoded = 0;
  appData.forEach((item) => {
    if (!item._geopoint) {
      return;
    }
    const parts = String(item._geopoint).split(",").map(Number);
    const lat = parts[0];
    const lng = parts[1];
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: renderBadge(
          "pin",
          item.etiquette_dpe,
          CONFIG.MARKER_SIZE,
          markerIconName(item.type_batiment),
        ),
        className: "",
        iconSize: [CONFIG.MARKER_SIZE, CONFIG.MARKER_SIZE],
      }),
    }).bindPopup(popupContent(item));
    marker.did = item.numero_dpe || "";
    marker.on("click", () => App.selectRow(marker.did, false));
    marker.addTo(markers);
    markerIndex.set(marker.did, marker);
    bounds.push([lat, lng]);
    geocoded += 1;
  });
  if (bounds.length) {
    map.fitBounds(bounds, { padding: CONFIG.BOUNDS_PADDING });
  } else {
    map.setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM_DEFAULT);
  }
  return geocoded;
}
