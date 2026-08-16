function $(id) {
  return document.getElementById(id);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function formatDate(value) {
  return new Date(value).toLocaleDateString("fr-FR");
}
function formatBuildingType(value) {
  const text = String(value || "");
  return text
    ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    : "-";
}
function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function formatSurface(value) {
  const surface = normalizeNumber(value);
  return surface == null ? "-" : Math.round(surface) + " m2";
}
// The ADEME payload exposes two surface fields depending on the building type.
function getSurfaceValue(item) {
  const type = String(item.type_batiment || "").toLowerCase();
  const logement = normalizeNumber(item.surface_habitable_logement);
  const immeuble = normalizeNumber(item.surface_habitable_immeuble);
  return type.includes("immeuble") ? immeuble : logement;
}
function geolocationLink(item) {
  if (!item || !item._geopoint) {
    return "";
  }
  const parts = String(item._geopoint)
    .split(",")
    .map((value) => Number(value));
  const lat = parts[0];
  const lng = parts[1];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "";
  }
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}
function fieldLabel(field) {
  return field.key === "numero_dpe" ? "N&deg; DPE" : escapeHtml(field.label);
}
function pluralize(count, singular, plural) {
  return count > 1 ? plural : singular;
}
function summarizeSelection(values, allValues, allLabel) {
  if (!values.length) {
    return "aucun";
  }
  return values.length === allValues.length
    ? allLabel
    : values.join(", ");
}
function tooltipLabel(label, title, srText) {
  return `<span class="th-label">${label} <button type="button" class="info-trigger" data-bs-toggle="tooltip" data-bs-placement="top" title="${title}"><i class="bi bi-info-circle" aria-hidden="true"></i><span class="visually-hidden">${srText}</span></button></span>`;
}
function enhanceFieldLabels() {
  FIELDS.forEach((field) => {
    const enhancements = FIELD_ENHANCEMENTS[field.key];
    if (enhancements) Object.assign(field, enhancements);
  });
}
function setAllCheckboxes(selector, checked) {
  document.querySelectorAll(selector).forEach((input) => {
    input.checked = checked;
  });
}
