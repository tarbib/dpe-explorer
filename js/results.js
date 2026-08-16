function buildResultsSummary(filters) {
  const parts = [];
  if (filters.postalCodes.length) {
    parts.push(`zone ${filters.postalCodes.join(", ")}`);
  }
  parts.push(
    `types ${summarizeSelection(filters.types, TYPE_OPTIONS, "tous")}`,
  );
  parts.push(
    `DPE ${summarizeSelection(filters.grades, GRADE_OPTIONS, "toutes")}`,
  );
  if (filters.dateStart || filters.dateEnd) {
    parts.push(
      `periode ${filters.dateStart ? formatDate(filters.dateStart) : "?"} -> ${filters.dateEnd ? formatDate(filters.dateEnd) : "?"}`,
    );
  }
  if (filters.surfaceMin || filters.surfaceMax) {
    parts.push(
      `surface ${filters.surfaceMin || "0"} - ${filters.surfaceMax || "inf"} m2`,
    );
  }
  parts.push(`limite ${filters.limit}`);
  return parts.join(" - ");
}
function updateResultsToolbar() {
  const filters = getFilterState();
  const summary = buildResultsSummary(filters);
  const resultsBar = $("resultsBar");
  $("countPill").innerHTML =
    `<i class="bi bi-list-ul"></i>${lastStats.total} ${pluralize(lastStats.total, "résultat", "résultats")}`;
  if (!hasSearched) {
    resultsBar.classList.add("d-none");
    $("resultsMeta").textContent = "";
    $("tableMeta").textContent =
      "Le tri, les colonnes visibles et la sélection active seront disponibles après la première recherche.";
    $("mapMeta").textContent =
      "La carte affichera ensuite les logements géolocalisés correspondant à vos filtres.";
  } else if (lastError) {
    resultsBar.classList.remove("d-none");
    $("resultsMeta").textContent = "Recherche en erreur.";
    $("tableMeta").textContent =
      "Aucun résultat fiable à afficher tant que la requête n’a pas abouti.";
    $("mapMeta").textContent =
      "La carte attend une réponse valide de l’API avant d’afficher des marqueurs.";
  } else if (!lastStats.total) {
    resultsBar.classList.remove("d-none");
    $("resultsMeta").textContent = "Aucun résultat pour ces critères.";
    $("tableMeta").textContent =
      "Le tableau reste vide, car aucun DPE ne correspond à cette combinaison de filtres.";
    $("mapMeta").textContent =
      "La carte n’a aucun logement à afficher pour cette recherche.";
  } else {
    resultsBar.classList.remove("d-none");
    $("resultsMeta").textContent =
      `${lastStats.geocoded} géolocalisés, ${lastStats.ungeocoded} sans géopoint.`;
    $("tableMeta").textContent =
      "Cliquez sur un en-tête pour trier, puis utilisez l’icône de localisation pour centrer un logement sur la carte.";
    $("mapMeta").textContent =
      "Les marqueurs sont colorés selon la classe DPE. Les logements sans géopoint restent consultables dans la liste.";
  }
  refreshShareSummary();
}
function setState(kind, title, copy, icon) {
  const stateBox = $("stateBox");
  stateBox.dataset.kind = kind;
  $("stateIcon").innerHTML =
    `<i class="bi bi-${icon}" aria-hidden="true"></i>`;
  $("stateTitle").textContent = title;
  $("stateCopy").textContent = copy;
  stateBox.classList.toggle("d-none", kind === "success");
}
function resetResults(keepSearchState = false) {
  appData = [];
  selectedRowId = null;
  markerIndex = new Map();
  lastStats = { total: 0, geocoded: 0, ungeocoded: 0 };
  lastError = null;
  if (!keepSearchState) {
    hasSearched = false;
    setFiltersCollapsed(false);
  }
  renderData();
  updateResultsToolbar();
}
function renderData() {
  if (!appData.length) {
    $("resBox").classList.add("d-none");
    $("emptyList").classList.remove("d-none");
    $("mapInfo").textContent = hasSearched
      ? "Aucun logement géolocalisé à afficher pour cette recherche."
      : "La carte se remplira après votre première recherche.";
    markers.clearLayers();
    return;
  }
  $("emptyList").classList.add("d-none");
  $("resBox").classList.remove("d-none");
  renderTableHead();
  renderRows();
  const geocoded = renderMarkers();
  const ungeocoded = Math.max(appData.length - geocoded, 0);
  lastStats = { total: appData.length, geocoded, ungeocoded };
  $("mapInfo").textContent = ungeocoded
    ? `${geocoded} résultats sont localisés sur la carte. ${ungeocoded} restent disponibles uniquement dans la liste, faute de géopoint.`
    : `${geocoded} résultats sont géolocalisés et visibles sur la carte.`;
}
