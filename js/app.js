async function fetchWithRetry(
  url,
  { retries = CONFIG.FETCH_RETRIES, baseDelayMs = CONFIG.FETCH_RETRY_BASE_DELAY } = {},
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let response;
    try {
      response = await fetch(url);
    } catch (networkError) {
      if (attempt === retries) {
        throw networkError;
      }
      await sleep(baseDelayMs * attempt);
      continue;
    }
    if (response.status === 429 && attempt < retries) {
      setState(
        "info",
        "Nouvelle tentative",
        `Le service ADEME est temporairement saturé, tentative ${attempt + 1}/${retries}…`,
        "hourglass-split",
      );
      await sleep(baseDelayMs * attempt);
      continue;
    }
    if (!response.ok) {
      throw Object.assign(new Error(response.statusText || "API error"), {
        status: response.status,
      });
    }
    return response;
  }
}
const App = {
  async search() {
    const searchButton = $("searchBtn");
    const filters = getFilterState();
    const validation = updateSearchEligibility(filters);
    if (!validation.valid) {
      setState(
        "warning",
        "Recherche incomplète",
        `Renseignez ${validation.missing.join(", ")} avant de lancer la recherche.`,
        "sliders",
      );
      return;
    }
    hasSearched = true;
    lastError = null;
    selectedRowId = null;
    lastStats = { total: 0, geocoded: 0, ungeocoded: 0 };
    updateResultsToolbar();
    setState(
      "info",
      "Recherche en cours",
      "L’application interroge les données ADEME avec vos filtres actuels.",
      "hourglass-split",
    );
    searchButton.disabled = true;
    searchButton.innerHTML =
      '<span class="spinner-wrap"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span>Recherche...</span>';
    try {
      const response = await fetchWithRetry(`${API}?${buildParams(filters)}`);
      const payload = await response.json();
      appData = filterResults(
        payload.results || [],
        filters,
        filters.limit,
      );
      applySort();
      renderData();
      setFiltersCollapsed(true);
      if (!appData.length) {
        setState(
          "warning",
          "Aucun DPE trouvé",
          "Aucun logement ne correspond à cette combinaison de filtres. Essayez une zone plus large ou une période plus longue.",
          "inbox",
        );
      } else {
        setState(
          "success",
          "Résultats chargés",
          `${appData.length} ${pluralize(appData.length, "DPE a été chargé", "DPE ont été chargés")}, avec ${lastStats.geocoded} géopoints exploitables sur la carte.`,
          "check-circle",
        );
      }
      setTimeout(scrollToResults, CONFIG.SCROLL_DELAY);
    } catch (error) {
      console.error(error);
      lastError = error;
      resetResults(true);
      setFiltersCollapsed(false);
      const isRateLimited = error.status === 429;
      const isNetworkError = error instanceof TypeError;
      setState(
        "error",
        "Erreur API",
        isRateLimited
          ? "Le service ADEME est temporairement saturé (trop de requêtes). Réessayez dans quelques instants."
          : isNetworkError
            ? "Impossible de contacter l’API ADEME. Vérifiez votre connexion internet."
            : "La requête n’a pas abouti. Vérifiez votre connexion ou réessayez avec une recherche plus simple.",
        "exclamation-triangle",
      );
    } finally {
      updateResultsToolbar();
      searchButton.disabled = false;
      searchButton.innerHTML =
        '<i class="bi bi-search me-2"></i>Lancer la recherche';
      updateSearchEligibility();
    }
  },
  sort(fieldKey) {
    sortState = {
      key: fieldKey,
      direction:
        sortState.key === fieldKey && sortState.direction === 1 ? -1 : 1,
    };
    applySort();
    renderData();
    updateResultsToolbar();
  },
  selectRow(id, scrollIntoView = true) {
    selectedRowId = id || null;
    document.querySelectorAll("tbody tr").forEach((row) => {
      row.classList.toggle(
        "selected-row",
        row.dataset.rowId === selectedRowId,
      );
      if (scrollIntoView && row.dataset.rowId === selectedRowId) {
        row.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  },
  zoom(id) {
    if (!id) {
      return;
    }
    App.selectRow(id);
    const mapTrigger = document.querySelector(
      '[data-bs-target="#mapView"]',
    );
    bootstrap.Tab.getOrCreateInstance(mapTrigger).show();
    const marker = markerIndex.get(id);
    if (marker) {
      map.setView(marker.getLatLng(), CONFIG.MAP_ZOOM_FOCUS);
      marker.openPopup();
    }
  },
};
function bindSearchEvents() {
  $("filters").addEventListener("submit", (event) => {
    event.preventDefault();
    App.search();
  });
  ["postal", "dStart", "dEnd", "sMin", "sMax", "limit"].forEach((id) => {
    $(id).addEventListener("input", updateFilterSummary);
    $(id).addEventListener("change", updateFilterSummary);
  });
  $("resetBtn").addEventListener("click", () => {
    setDefaultFilters();
    setFiltersCollapsed(false);
    resetResults();
    updateFilterSummary();
    setState(
      "info",
      "Filtres réinitialisés",
      "Les filtres ont retrouvé leurs valeurs par défaut. Vous pouvez lancer une nouvelle recherche.",
      "arrow-counterclockwise",
    );
  });
  $("editFiltersBtn").addEventListener("click", () => {
    setFiltersCollapsed(false, { focusFilters: true });
  });
  $("compactResetBtn").addEventListener("click", () => {
    $("resetBtn").click();
  });
}
function bindShareEvents() {
  $("shareEmail").addEventListener("click", shareByEmail);
  $("shareX").addEventListener("click", shareOnX);
  $("shareWhatsApp").addEventListener("click", shareOnWhatsApp);
  $("shareCopy").addEventListener("click", copyShareText);
}
function bindUIEvents() {
  document
    .querySelectorAll(
      '[data-bs-target="#mapView"], [data-bs-target="#listView"]',
    )
    .forEach((button) => {
      button.addEventListener("shown.bs.tab", (event) => {
        document
          .querySelectorAll(".view-switch .btn")
          .forEach((tabButton) => {
            tabButton.classList.toggle(
              "active",
              tabButton === event.target,
            );
          });
        if (event.target.dataset.bsTarget === "#mapView") {
          setTimeout(() => map.invalidateSize(), CONFIG.MAP_INVALIDATE_DELAY);
        }
      });
    });
}
function bindEvents() {
  bindSearchEvents();
  bindShareEvents();
  bindUIEvents();
}
function init() {
  buildOptionToggle(
    "typeContainer",
    TYPE_OPTIONS,
    "type-",
    "type-filter",
    () => "btn-outline-primary",
  );
  buildOptionToggle(
    "grades",
    GRADE_OPTIONS,
    "grade-",
    "grade-filter",
    (grade) => ({
      className: "grade-pill",
      style: `--grade-color:${(GRADE_STYLES[grade] ?? GRADE_STYLES.Def).color};--grade-text:${(GRADE_STYLES[grade] ?? GRADE_STYLES.Def).text};`,
    }),
  );
  enhanceFieldLabels();
  setDefaultFilters();
  initTheme();
  initMap();
  initColumnToggles();
  renderTableHead();
  bindEvents();
  applySurfaceGuidance();
  updateFilterSummary();
  tryAutofillPostalCode();
}
document.addEventListener("DOMContentLoaded", init);
