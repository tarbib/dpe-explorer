const API =
  "https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines";
const REVERSE_GEOCODE_API = "https://api-adresse.data.gouv.fr/reverse/";
const STORAGE_KEY = "dpe-explorer-theme-mode";
const SYSTEM_THEME = window.matchMedia("(prefers-color-scheme: dark)");
const TYPE_OPTIONS = ["Appartement", "Maison", "Immeuble"];
const GRADE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"];
const DEFAULT_TYPE_SELECTION = ["Appartement", "Maison"];
const DEFAULT_GRADE_SELECTION = ["A", "B", "C"];
const CONFIG = {
  MAP_CENTER: [46.6, 1.9],
  MAP_ZOOM_DEFAULT: 6,
  MAP_ZOOM_FOCUS: 16,
  MAP_INVALIDATE_DELAY: 120,
  MARKER_SIZE: 34,
  BOUNDS_PADDING: [24, 24],
  GEO_TIMEOUT: 8000,
  GEO_MAX_AGE: 300000,
  SCROLL_DELAY: 80,
  FETCH_RETRIES: 3,
  FETCH_RETRY_BASE_DELAY: 2000,
};
const GRADE_STYLES = {
  A:   { color: "#319834", text: "#ffffff" },
  B:   { color: "#33cc31", text: "#09280d" },
  C:   { color: "#cbfc34", text: "#1f2937" },
  D:   { color: "#fbfe06", text: "#1f2937" },
  E:   { color: "#fbcc04", text: "#1f2937" },
  F:   { color: "#f68e1e", text: "#111827" },
  G:   { color: "#ef1d26", text: "#ffffff" },
  Def: { color: "#94a3b8", text: "#0f172a" },
};
// Centralize visible columns, cell renderers and tooltip labels in one place.
// key: nom du champ dans les données ADEME. label: en-tête affiché dans le tableau.
// format: transforme la valeur brute en texte (ou HTML si html: true) pour l'affichage.
const FIELDS = [
  {
    key: "adresse_ban",
    label: "Adresse",
    cellClass: "cell-address cell-primary text-break",
    style: "max-width:280px",
  },
  {
    key: "type_batiment",
    label: "Type",
    cellClass: "cell-secondary",
    format: (value) => formatBuildingType(value),
  },
  {
    key: "surface_habitable_logement",
    label: "Surface",
    cellClass: "text-end font-monospace",
    resolve: (item) => getSurfaceValue(item),
    format: (value) => formatSurface(value),
  },
  {
    key: "annee_construction",
    label: "Année",
    cellClass: "text-center cell-secondary",
    // Falls back to the construction period when the exact year is missing.
    resolve: (item) => item.annee_construction || item.periode_construction || null,
  },
  {
    key: "numero_dpe",
    label: "N° DPE",
    cellClass: "font-monospace small cell-secondary",
    toggle: "dpe-id",
    html: true,
    format: (value) =>
      value
        ? `<a href="https://data.ademe.fr/datasets/dpe03existant/full?p=%2Fdata-fair%2Fembed%2Fdataset%2Fdpe03existant%2Ftable&q=${encodeURIComponent(value)}" target="_blank" rel="noreferrer noopener">${escapeHtml(value)}</a>`
        : "-",
  },
  {
    key: "etiquette_dpe",
    label: "DPE",
    cellClass: "text-center cell-primary",
    html: true,
    format: (value) => renderBadge("badge", value),
  },
  {
    key: "etiquette_ges",
    label: "GES",
    cellClass: "text-center cell-secondary",
    toggle: "ges",
    html: true,
    format: (value) => renderBadge("badge", value),
  },
  {
    key: "conso_5_usages_par_m2_ep",
    label: "Conso",
    labelHtml:
      '<span class="th-label">Conso <button type="button" class="info-trigger" data-bs-toggle="tooltip" data-bs-placement="top" title="Consommation annuelle d’énergie primaire du logement, rapportée au m², calculée sur 5 usages du DPE."><i class="bi bi-info-circle" aria-hidden="true"></i><span class="visually-hidden">Explication de la consommation énergétique.</span></button></span>',
    cellClass: "text-end font-monospace cell-secondary",
    toggle: "conso",
    format: (value) => (value ? Math.round(value) : "-"),
  },
  {
    key: "date_etablissement_dpe",
    label: "Date",
    cellClass: "text-center cell-secondary",
    toggle: "date",
    format: (value) => (value ? formatDate(value) : "-"),
  },
];
const SORT_ICON = {
  neutral: "arrow-down-up",
  asc: "sort-up",
  desc: "sort-down",
};
const FIELD_ENHANCEMENTS = {
  annee_construction: {
    label: "Année",
    labelHtml: tooltipLabel(
      "Année",
      "Année de construction renseignée dans le DPE. Si elle est absente, la période de construction est affichée.",
      "Explication de l’année de construction.",
    ),
  },
  numero_dpe: {
    label: "N° DPE",
    labelHtml: tooltipLabel(
      "N&deg; DPE",
      "Identifiant unique du diagnostic dans la base ADEME. Le lien ouvre la fiche correspondante.",
      "Explication du numéro DPE.",
    ),
  },
  surface_habitable_logement: {
    label: "Surface",
    labelHtml: tooltipLabel(
      "Surface",
      "Surface habitable retenue par le DPE : celle du logement pour un appartement ou une maison, ou celle de l’immeuble si le type est Immeuble.",
      "Explication de la surface habitable.",
    ),
  },
  etiquette_dpe: {
    labelHtml: tooltipLabel(
      "DPE",
      "Classe de performance énergétique du bien, de A à G, calculée à partir de la consommation énergétique.",
      "Explication de la classe DPE.",
    ),
  },
  etiquette_ges: {
    labelHtml: tooltipLabel(
      "GES",
      "Classe d’émissions de gaz à effet de serre du bien, de A à G.",
      "Explication de la classe GES.",
    ),
  },
  date_etablissement_dpe: {
    labelHtml: tooltipLabel(
      "Date",
      "Date d’établissement du DPE, c’est-à-dire la date à laquelle le diagnostic a été réalisé.",
      "Explication de la date du DPE.",
    ),
  },
};
