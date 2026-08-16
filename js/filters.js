function setPostalHelp(message, isError = false) {
  $("postalHelp").textContent = message;
  $("postalHelp").classList.toggle("is-error", isError);
}
async function reverseGeocodePostalCode(lat, lon) {
  const response = await fetch(
    `${REVERSE_GEOCODE_API}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
  );
  if (!response.ok) {
    throw new Error("reverse geocode failed");
  }
  const payload = await response.json();
  const postcode = payload?.features?.[0]?.properties?.postcode || "";
  return /^\d{5}$/.test(postcode) ? postcode : "";
}
async function tryAutofillPostalCode() {
  if (postalAutofillAttempted) {
    return;
  }
  postalAutofillAttempted = true;
  if ($("postal").value.trim()) {
    setPostalHelp(
      "Un ou plusieurs codes postaux, séparés par une virgule ou un espace.",
    );
    return;
  }
  if (!navigator.geolocation) {
    setPostalHelp(
      "Géolocalisation indisponible : aucun code postal par défaut n a pu être proposé.",
    );
    return;
  }
  setPostalHelp(
    "Recherche de votre code postal à partir de votre localisation…",
  );
  const getPosition = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: CONFIG.GEO_TIMEOUT,
        maximumAge: CONFIG.GEO_MAX_AGE,
      }),
    );
  try {
    const position = await getPosition();
    const postcode = await reverseGeocodePostalCode(
      position.coords.latitude,
      position.coords.longitude,
    );
    if (postcode) {
      defaultPostalCode = postcode;
      if (!$("postal").value.trim()) {
        $("postal").value = postcode;
        updateFilterSummary();
      }
      setPostalHelp(`Code postal détecté automatiquement : ${postcode}.`);
      return;
    }
    setPostalHelp(
      "Localisation détectée, mais aucun code postal exploitable n a été trouvé.",
    );
  } catch (error) {
    console.warn("Autoremplissage du code postal impossible.", error);
    setPostalHelp(
      "Code postal non prérempli : autorisation refusée ou localisation indisponible.",
    );
  }
}
function setCheckboxSelection(selector, values) {
  const allowed = new Set(values);
  document.querySelectorAll(selector).forEach((input) => {
    input.checked = allowed.has(input.value);
  });
}
function surfaceMode(filters) {
  const types = filters.types.length ? filters.types : TYPE_OPTIONS;
  const hasImmeuble = types.includes("Immeuble");
  const hasLogement = types.some(
    (type) => type === "Appartement" || type === "Maison",
  );
  if (hasImmeuble && hasLogement) {
    return "mixed";
  }
  return hasImmeuble ? "immeuble" : "logement";
}
function applySurfaceGuidance(filters = getFilterState()) {
  const mode = surfaceMode(filters);
  if (mode === "immeuble") {
    $("surfaceMinLabel").innerHTML =
      "Surface habitable immeuble min (m&sup2;)";
    $("surfaceMaxLabel").innerHTML =
      "Surface habitable immeuble max (m&sup2;)";
    $("surfaceHelp").innerHTML =
      "Pour un immeuble, la surface correspond &agrave; la surface habitable de l&apos;immeuble, et non &agrave; la surface du terrain.";
    return;
  }
  if (mode === "mixed") {
    $("surfaceMinLabel").innerHTML = "Surface habitable min (m&sup2;)";
    $("surfaceMaxLabel").innerHTML = "Surface habitable max (m&sup2;)";
    $("surfaceHelp").innerHTML =
      "Appartement et maison utilisent la surface habitable du logement. Immeuble utilise la surface habitable de l&apos;immeuble. Le jardin, le terrain, la cave et le garage ne sont pas inclus.";
    return;
  }
  $("surfaceMinLabel").innerHTML =
    "Surface habitable logement min (m&sup2;)";
  $("surfaceMaxLabel").innerHTML =
    "Surface habitable logement max (m&sup2;)";
  $("surfaceHelp").innerHTML =
    "Pour un appartement ou une maison, la surface correspond &agrave; la surface habitable du logement, hors jardin, terrain, cave et garage.";
}
function validateFilters(filters = getFilterState()) {
  const missing = [];
  if (!filters.postalCodes.length) {
    missing.push("au moins un code postal");
  }
  if (!filters.types.length) {
    missing.push("au moins un type de bâtiment");
  }
  if (!filters.grades.length) {
    missing.push("au moins une classe DPE");
  }
  if (!filters.dateStart && !filters.dateEnd) {
    missing.push("au moins une date");
  }
  return { valid: missing.length === 0, missing };
}
function updateSearchEligibility(filters = getFilterState()) {
  const validation = validateFilters(filters);
  $("searchBtn").disabled = !validation.valid;
  $("searchRequirements").textContent = validation.valid
    ? "Critères minimums remplis. Vous pouvez lancer la recherche."
    : `Renseignez ${validation.missing.join(", ")} pour lancer la recherche.`;
  $("searchRequirements").classList.toggle("is-error", !validation.valid);
  return validation;
}
function matchesSurfaceFilter(item, filters) {
  if (!filters.surfaceMin && !filters.surfaceMax) {
    return true;
  }
  const surface = getSurfaceValue(item);
  if (surface == null) {
    return false;
  }
  if (filters.surfaceMin && surface < Number(filters.surfaceMin)) {
    return false;
  }
  if (filters.surfaceMax && surface > Number(filters.surfaceMax)) {
    return false;
  }
  return true;
}
function filterResults(results, filters, limit) {
  return results
    .filter((item) => matchesSurfaceFilter(item, filters))
    .slice(0, limit);
}
function renderCompactFilters(filters = getFilterState()) {
  $("compactFilterChips").innerHTML = buildFilterChips(filters)
    .map(
      (chip) =>
        `<span class="summary-chip"><i class="bi bi-${chip.icon}" aria-hidden="true"></i>${escapeHtml(chip.text)}</span>`,
    )
    .join("");
}
function setFiltersCollapsed(collapsed, options = {}) {
  // After a successful search, switch to a compact sticky summary to surface results faster.
  filtersCollapsed = Boolean(collapsed) && hasSearched;
  $("filtersCompact").classList.toggle("d-none", !filtersCollapsed);
  $("filtersFormBody").classList.toggle("d-none", filtersCollapsed);
  $("filtersPanel").classList.toggle(
    "filters-panel-collapsed",
    filtersCollapsed,
  );
  if (filtersCollapsed) {
    renderCompactFilters();
  }
  if (options.focusFilters && !filtersCollapsed) {
    $("postal").focus();
  }
}
function scrollToResults() {
  const target = $("resultsBar").classList.contains("d-none")
    ? $("listView")
    : $("resultsBar");
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
function setDefaultDates(days = 90) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  $("dEnd").valueAsDate = end;
  $("dStart").valueAsDate = start;
}
function buildOptionToggle(
  containerId,
  values,
  prefix,
  className,
  theme,
) {
  const container = $(containerId);
  container.innerHTML = "";
  values.forEach((value) => {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = `btn-check ${className}`;
    input.id = `${prefix}${value}`;
    input.value = value;
    input.checked = true;
    const appearance = theme(value);
    const label = document.createElement("label");
    label.className = `btn btn-sm ${typeof appearance === "string" ? appearance : appearance.className || ""}`;
    label.htmlFor = input.id;
    label.textContent = value;
    if (typeof appearance === "object" && appearance.style) {
      label.style.cssText = appearance.style;
    }
    input.addEventListener("change", updateFilterSummary);
    container.append(input, label);
  });
}
function initColumnToggles() {
  const menu = $("colToggles");
  menu.innerHTML = "";
  FIELDS.filter((field) => field.toggle).forEach((field) => {
    const li = document.createElement("li");
    const label = document.createElement("label");
    label.className = "dropdown-item d-flex align-items-center gap-2";
    label.innerHTML = `<input type="checkbox" class="form-check-input m-0" ${visibleToggles.has(field.toggle) ? "checked" : ""}> ${fieldLabel(field)}`;
    label.querySelector("input").addEventListener("change", (event) => {
      if (event.target.checked) {
        visibleToggles.add(field.toggle);
      } else {
        visibleToggles.delete(field.toggle);
      }
      renderTableHead();
      renderData();
    });
    li.appendChild(label);
    menu.appendChild(li);
  });
}
function getFilterState() {
  return {
    postalCodes: $("postal")
      .value.split(/[\s,]+/)
      .filter(Boolean),
    types: [...document.querySelectorAll(".type-filter:checked")].map(
      (input) => input.value,
    ),
    grades: [...document.querySelectorAll(".grade-filter:checked")].map(
      (input) => input.value,
    ),
    dateStart: $("dStart").value,
    dateEnd: $("dEnd").value,
    surfaceMin: $("sMin").value,
    surfaceMax: $("sMax").value,
    limit: Math.min(Math.max(Number($("limit").value) || 100, 1), 1000),
  };
}
function buildFilterChips(filters) {
  return [
    {
      icon: "geo-alt",
      text: filters.postalCodes.length
        ? `Zone : ${filters.postalCodes.join(", ")}`
        : "Zone : toutes",
    },
    {
      icon: "house",
      text: `Types : ${summarizeSelection(filters.types, TYPE_OPTIONS, "tous")}`,
    },
    {
      icon: "speedometer2",
      text: `DPE : ${summarizeSelection(filters.grades, GRADE_OPTIONS, "toutes")}`,
    },
    {
      icon: "calendar3",
      text:
        filters.dateStart || filters.dateEnd
          ? `Date DPE : ${filters.dateStart ? formatDate(filters.dateStart) : "?"} -> ${filters.dateEnd ? formatDate(filters.dateEnd) : "?"}`
          : "Date DPE : non filtrée",
    },
    {
      icon: "aspect-ratio",
      text:
        filters.surfaceMin || filters.surfaceMax
          ? `Surface : ${filters.surfaceMin || "0"} - ${filters.surfaceMax || "inf"} m2`
          : "Surface : toutes",
    },
    { icon: "list-ol", text: `Résultats max : ${filters.limit}` },
  ];
}
function updateFilterSummary() {
  const filters = getFilterState();
  applySurfaceGuidance(filters);
  updateSearchEligibility(filters);
  renderCompactFilters(filters);
  updateResultsToolbar();
}
function buildParams(filters = getFilterState()) {
  // Fetch extra rows when a surface range is active because that filter is refined client-side.
  const fetchSize =
    filters.surfaceMin || filters.surfaceMax
      ? Math.min(Math.max(filters.limit * 3, filters.limit), 1000)
      : filters.limit;
  const params = {
    size: fetchSize,
    select:
      FIELDS.map((field) => field.key).join(",") +
      ",surface_habitable_immeuble,code_postal_ban,_geopoint,periode_construction",
  };
  const queryParts = [
    filters.postalCodes.length
      ? `(${filters.postalCodes.map((code) => `code_postal_brut:${code}`).join(" OR ")})`
      : null,
    filters.types.length
      ? `(${filters.types.map((type) => `type_batiment:${type.toLowerCase()}`).join(" OR ")})`
      : null,
    filters.grades.length
      ? `(${filters.grades.map((grade) => `etiquette_dpe:${grade}`).join(" OR ")})`
      : null,
  ].filter(Boolean);
  if (queryParts.length) {
    params.qs = queryParts.join(" AND ");
  }
  [
    ["date_etablissement_dpe_gte", "dateStart"],
    ["date_etablissement_dpe_lte", "dateEnd"],
  ].forEach(([paramName, key]) => {
    if (filters[key]) {
      params[paramName] = filters[key];
    }
  });
  return new URLSearchParams(params).toString();
}
function setDefaultFilters() {
  $("postal").value = defaultPostalCode;
  $("sMin").value = "";
  $("sMax").value = "";
  $("limit").value = "100";
  setDefaultDates(90);
  setCheckboxSelection(".type-filter", DEFAULT_TYPE_SELECTION);
  setCheckboxSelection(".grade-filter", DEFAULT_GRADE_SELECTION);
  setPostalHelp(
    defaultPostalCode
      ? `Code postal détecté automatiquement : ${defaultPostalCode}.`
      : "Un ou plusieurs codes postaux, séparés par une virgule ou un espace.",
  );
}
