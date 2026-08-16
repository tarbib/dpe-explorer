function loadThemeMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "auto";
  } catch (error) {
    return "auto";
  }
}
function resolvedTheme(mode = themeMode) {
  return mode === "auto"
    ? SYSTEM_THEME.matches
      ? "dark"
      : "light"
    : mode;
}
function persistTheme(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Impossible de sauvegarder le theme.", error);
  }
}
function applyTheme(mode, persist = true) {
  themeMode = mode;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolvedTheme(mode);
  if (persist) {
    persistTheme(mode);
  }
  document.querySelectorAll("[data-theme-mode]").forEach((button) => {
    const active = button.dataset.themeMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  syncMapTiles();
}
function syncMapTiles() {
  if (!map || !lightTileLayer || !darkTileLayer) {
    return;
  }
  const wantedLayer =
    resolvedTheme() === "dark" ? darkTileLayer : lightTileLayer;
  if (activeTileLayer === wantedLayer) {
    return;
  }
  if (activeTileLayer) {
    map.removeLayer(activeTileLayer);
  }
  wantedLayer.addTo(map);
  activeTileLayer = wantedLayer;
}
function initTheme() {
  document.querySelectorAll("[data-theme-mode]").forEach((button) => {
    button.addEventListener("click", () =>
      applyTheme(button.dataset.themeMode),
    );
  });
  const onSystemThemeChange = () => {
    if (themeMode === "auto") {
      applyTheme("auto", false);
    }
  };
  if (SYSTEM_THEME.addEventListener) {
    SYSTEM_THEME.addEventListener("change", onSystemThemeChange);
  } else if (SYSTEM_THEME.addListener) {
    SYSTEM_THEME.addListener(onSystemThemeChange);
  }
  applyTheme(loadThemeMode(), false);
}
