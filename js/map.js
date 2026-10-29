function initMap() {
  map = L.map("map", {
    fullscreenControl: true,
    zoomControl: true,
  }).setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM_DEFAULT);
  L.tileLayer(
    "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM_0_19&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
    { attribution: "&copy; IGN", maxZoom: 19 },
  ).addTo(map);
  markers = L.featureGroup().addTo(map);
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
    geocoded += 1;
  });
  fitMarkers();
  return geocoded;
}
function fitMarkers() {
  const bounds = markers.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: CONFIG.BOUNDS_PADDING });
  } else {
    map.setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM_DEFAULT);
  }
}
// Leaflet cannot size or fit a hidden map, so the view is set once the tab is shown.
function refreshMapView() {
  map.invalidateSize();
  const marker = markerIndex.get(pendingMapFocus);
  pendingMapFocus = null;
  if (marker) {
    map.setView(marker.getLatLng(), CONFIG.MAP_ZOOM_FOCUS);
    marker.openPopup();
  } else {
    fitMarkers();
  }
}
