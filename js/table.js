function renderBadge(type, value, size = 30, iconName = "building") {
  const grade = value || "-";
  const { color, text: textColor } = GRADE_STYLES[grade] ?? GRADE_STYLES.Def;
  if (type === "badge") {
    return `<span class="grade-badge" aria-label="Classe ${escapeHtml(grade)}" style="background:${color};color:${textColor};min-width:${size}px;min-height:${size}px"><span class="visually-hidden">Classe </span>${escapeHtml(grade)}</span>`;
  }
  if (type === "pin") {
    return `<div class="custom-pin" aria-hidden="true" style="background:${color};color:${textColor};width:${size}px;height:${size}px"><i class="bi bi-${iconName}"></i></div>`;
  }
  return "-";
}
function sortIcon(fieldKey) {
  if (sortState.key !== fieldKey) {
    return SORT_ICON.neutral;
  }
  return sortState.direction === 1 ? SORT_ICON.asc : SORT_ICON.desc;
}
function renderTableHead() {
  const thead = $("table").querySelector("thead");
  const headerCells = FIELDS.map((field) => {
    const hiddenClass =
      field.toggle && !visibleToggles.has(field.toggle) ? "d-none" : "";
    const label = field.labelHtml || fieldLabel(field);
    const icon =
      sortState.key === field.key
        ? `<i class="bi bi-${sortIcon(field.key)} sort-icon" aria-hidden="true"></i>`
        : "";
    return `<th scope="col" class="${hiddenClass}"><button type="button" class="sort-trigger" data-sort="${field.key}" aria-label="Trier par ${escapeHtml(field.key === "numero_dpe" ? "N° DPE" : field.label)}"><span>${label}</span>${icon}</button></th>`;
  }).join("");
  thead.innerHTML = `<tr>${headerCells}<th scope="col">Localisation</th></tr>`;
  thead.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => App.sort(button.dataset.sort));
  });
  thead
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((node) => bootstrap.Tooltip.getOrCreateInstance(node));
}
function applySort() {
  if (!sortState.key) {
    return;
  }
  const activeField = FIELDS.find((field) => field.key === sortState.key);
  appData.sort((left, right) => {
    const valueA =
      activeField && activeField.resolve
        ? activeField.resolve(left)
        : left[sortState.key];
    const valueB =
      activeField && activeField.resolve
        ? activeField.resolve(right)
        : right[sortState.key];
    if (valueA == null || valueA === "") {
      return 1 * sortState.direction;
    }
    if (valueB == null || valueB === "") {
      return -1 * sortState.direction;
    }
    if (typeof valueA === "number" && typeof valueB === "number") {
      return (valueA - valueB) * sortState.direction;
    }
    return (
      String(valueA).localeCompare(String(valueB), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * sortState.direction
    );
  });
}
function getFieldValue(field, item) {
  const value = field.resolve ? field.resolve(item) : item[field.key];
  if (value == null || value === "") {
    return "-";
  }
  if (field.format) {
    return field.format(value, item);
  }
  return String(value);
}
function renderRows() {
  const tbody = $("table").querySelector("tbody");
  tbody.innerHTML = "";
  appData.forEach((item) => {
    const row = document.createElement("tr");
    row.dataset.rowId = item.numero_dpe || "";
    row.className =
      item.numero_dpe && item.numero_dpe === selectedRowId
        ? "selected-row"
        : "";
    const cells = FIELDS.map((field) => {
      const hiddenClass =
        field.toggle && !visibleToggles.has(field.toggle) ? "d-none" : "";
      const value = getFieldValue(field, item);
      return `<td class="${[field.cellClass || "", hiddenClass].join(" ").trim()}" style="${field.style || ""}">${field.html ? value : escapeHtml(value)}</td>`;
    }).join("");
    row.innerHTML = `${cells}<td class="text-center"><button type="button" class="btn btn-sm btn-soft" data-zoom="${item.numero_dpe || ""}" aria-label="Voir la localisation sur la carte"><i class="bi bi-geo-alt" aria-hidden="true"></i></button></td>`;
    tbody.appendChild(row);
  });
  tbody.querySelectorAll("[data-zoom]").forEach((button) => {
    button.addEventListener("click", () => App.zoom(button.dataset.zoom));
  });
}
