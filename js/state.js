let appData = [];
let sortState = { key: "date_etablissement_dpe", direction: -1 };
let map;
let markers;
let markerIndex = new Map();
let selectedRowId = null;
let themeMode = "auto";
let activeTileLayer = null;
let lightTileLayer = null;
let darkTileLayer = null;
let lastStats = { total: 0, geocoded: 0, ungeocoded: 0 };
let hasSearched = false;
let lastError = null;
let lastShareSummary = null;
let filtersCollapsed = false;
let defaultPostalCode = "";
let postalAutofillAttempted = false;
const visibleToggles = new Set(
  FIELDS.filter((field) => field.toggle).map((field) => field.toggle),
);
