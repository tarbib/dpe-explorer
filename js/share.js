function activeShareUrl() {
  if (!window.location || !/^https?:$/.test(window.location.protocol)) {
    return "";
  }
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "";
  }
  return window.location.href;
}
function formatShareLine(item) {
  const address = item.adresse_ban || "Adresse inconnue";
  const type = formatBuildingType(item.type_batiment);
  const dpe = item.etiquette_dpe || "-";
  const ges = item.etiquette_ges || "-";
  const surface = formatSurface(getSurfaceValue(item));
  const date = item.date_etablissement_dpe
    ? formatDate(item.date_etablissement_dpe)
    : "-";
  const link = geolocationLink(item);
  return `${address} | ${type} | DPE ${dpe} | GES ${ges} | ${surface} | ${date}${link ? ` | Carte : ${link}` : ""}`;
}
function buildShareSummary() {
  const filters = getFilterState();
  const SHARE_MAX = 10;
  const allLines = appData.map(formatShareLine);
  const shownLines = allLines.slice(0, SHARE_MAX);
  const remaining = allLines.length - shownLines.length;
  const intro = `${lastStats.total} ${pluralize(lastStats.total, "résultat", "résultats")} DPE pour ${filters.postalCodes.length ? filters.postalCodes.join(", ") : "la zone sélectionnée"}`;
  const filterLine = `Filtres : types ${summarizeSelection(filters.types, TYPE_OPTIONS, "tous")}, DPE ${summarizeSelection(filters.grades, GRADE_OPTIONS, "toutes")}, période ${filters.dateStart ? formatDate(filters.dateStart) : "?"} -> ${filters.dateEnd ? formatDate(filters.dateEnd) : "?"}, surface ${filters.surfaceMin || "0"} - ${filters.surfaceMax || "inf"} m2.`;
  const statsLine = `${lastStats.geocoded} géolocalisés, ${lastStats.ungeocoded} sans géopoint. Source : ADEME.`;
  const previewLines = [intro, filterLine, statsLine];
  if (shownLines.length) {
    previewLines.push(
      "",
      `${allLines.length === 1 ? "Résultat" : "Résultats"} :`,
      ...shownLines.map((line) => `- ${line}`),
    );
    if (remaining > 0) {
      previewLines.push(`… et ${remaining} ${pluralize(remaining, "autre résultat", "autres résultats")}.`);
    }
  }
  const preview = previewLines.filter(Boolean).join("\n");
  const firstSharedLink =
    appData.map((item) => geolocationLink(item)).find(Boolean) || "";
  const short = `${intro}. ${statsLine}${firstSharedLink ? ` Carte : ${firstSharedLink}.` : ""}`;
  const url = activeShareUrl();
  return {
    subject: `Observatoire DPE - ${intro}`,
    preview,
    emailBody: `Bonjour,\n\n${preview}${url ? `\n\nLien : ${url}` : ""}\n`,
    socialText: `${short}${allLines[0] ? ` Exemple : ${allLines[0]}.` : ""}${url ? ` ${url}` : ""}`,
    hasData: hasSearched && !lastError && lastStats.total > 0,
  };
}
function refreshShareSummary() {
  lastShareSummary = buildShareSummary();
  $("shareMeta").textContent = lastShareSummary.hasData
    ? `${lastStats.total} résultats prêts à être partagés.`
    : "Aucun résultat à partager";
  [
    "shareEmail",
    "shareX",
    "shareWhatsApp",
    "shareCopy",
    "openShareModal",
  ].forEach((id) => {
    if ($(id)) {
      $(id).disabled = !lastShareSummary.hasData;
    }
  });
}
function openShareUrl(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}
function shareByEmail() {
  if (!lastShareSummary?.hasData) {
    return;
  }
  window.location.href = `mailto:?subject=${encodeURIComponent(lastShareSummary.subject)}&body=${encodeURIComponent(lastShareSummary.emailBody)}`;
}
function shareOnX() {
  if (!lastShareSummary?.hasData) {
    return;
  }
  openShareUrl(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(lastShareSummary.socialText)}`,
  );
}
function shareOnWhatsApp() {
  if (!lastShareSummary?.hasData) {
    return;
  }
  openShareUrl(
    `https://wa.me/?text=${encodeURIComponent(lastShareSummary.socialText)}`,
  );
}
async function copyShareText() {
  if (!lastShareSummary?.hasData) {
    return;
  }
  try {
    await navigator.clipboard.writeText(lastShareSummary.preview);
    setState(
      "success",
      "Résumé copié",
      "Le résumé des résultats a été copié dans le presse-papiers.",
      "clipboard-check",
    );
  } catch (error) {
    console.error(error);
    setState(
      "error",
      "Copie impossible",
      "Le navigateur a refusé la copie. Essayez l’email ou un réseau social.",
      "clipboard-x",
    );
  }
}
