
const CSV_PATH = "LC_HARD.csv";
const STORAGE_KEY = "lc-hard-tracker-done-by-lc";

const els = {
  totalCount: document.getElementById("totalCount"),
  doneCount: document.getElementById("doneCount"),
  progressPct: document.getElementById("progressPct"),
  patternList: document.getElementById("patternList"),
  searchInput: document.getElementById("searchInput"),
  doneOnlyToggle: document.getElementById("doneOnlyToggle"),
  expandAllBtn: document.getElementById("expandAllBtn"),
  collapseAllBtn: document.getElementById("collapseAllBtn"),
  resetDoneBtn: document.getElementById("resetDoneBtn"),
};

let rawRows = [];
let groupedRows = [];
let doneMap = loadDoneMap();

function loadDoneMap() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistDoneMap() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doneMap));
}

function normalizeLcNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? String(Math.trunc(asNumber)) : String(value).trim();
}

function isCheckedMark(value) {
  return String(value || "").trim() === "✓";
}

function normalizeRow(row) {
  const lc = normalizeLcNumber(row["LC#"]);
  return {
    lc,
    problemName: String(row["Problem Name"] || "").trim(),
    link: String(row["Link"] || "").trim(),
    difficulty: String(row["Difficulty"] || "").trim(),
    whyHard: String(row["Why It's Hard (Solution Lens)"] || "").trim(),
    pattern: String(row["Pattern"] || "Other").trim(),
    companies: [
      ["Meta", isCheckedMark(row["Meta"])],
      ["Google", isCheckedMark(row["Google"])],
      ["Amazon", isCheckedMark(row["Amazon"])],
      ["Uber", isCheckedMark(row["Uber"])],
      ["Netflix", isCheckedMark(row["Netflix"])],
    ].filter(([, present]) => present).map(([name]) => name),
  };
}

function groupByPattern(rows) {
  const groups = [];
  const indexByPattern = new Map();

  rows.forEach((row) => {
    if (!indexByPattern.has(row.pattern)) {
      indexByPattern.set(row.pattern, groups.length);
      groups.push({ pattern: row.pattern, items: [] });
    }
    groups[indexByPattern.get(row.pattern)].items.push(row);
  });

  return groups;
}

function getDoneCount(rows) {
  return rows.filter((row) => doneMap[row.lc] === true).length;
}

function formatPercent(done, total) {
  if (!total) return "0%";
  return `${Math.round((done / total) * 100)}%`;
}

function filterRows(rows) {
  const query = els.searchInput.value.trim().toLowerCase();
  const doneOnly = els.doneOnlyToggle.checked;

  return rows.filter((row) => {
    const matchesDone = !doneOnly || doneMap[row.lc] === true;
    const matchesQuery =
      !query ||
      row.lc.toLowerCase().includes(query) ||
      row.problemName.toLowerCase().includes(query) ||
      row.pattern.toLowerCase().includes(query) ||
      row.whyHard.toLowerCase().includes(query);

    return matchesDone && matchesQuery;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function render() {
  const filtered = filterRows(rawRows);
  groupedRows = groupByPattern(filtered);

  const total = rawRows.length;
  const done = getDoneCount(rawRows);

  els.totalCount.textContent = total;
  els.doneCount.textContent = done;
  els.progressPct.textContent = formatPercent(done, total);

  if (!groupedRows.length) {
    els.patternList.innerHTML = `
      <div class="empty-state">
        <p>No problems match your current filter.</p>
        <p class="footer-note">Try clearing search or disabling "Show done only".</p>
      </div>
    `;
    return;
  }

  els.patternList.innerHTML = groupedRows.map((group, idx) => {
    const groupDone = getDoneCount(group.items);
    const groupTotal = group.items.length;
    const pct = groupTotal ? (groupDone / groupTotal) * 100 : 0;

    const itemsHtml = group.items.map((row) => {
      const checked = doneMap[row.lc] === true;
      const companies = row.companies.length
        ? row.companies.map((company) => `<span class="company-badge">${escapeHtml(company)}</span>`).join("")
        : `<span class="company-badge">General</span>`;

      return `
        <article class="problem-item ${checked ? "is-done" : ""}">
          <div class="problem-main">
            <label class="done-box" title="Mark done">
              <input type="checkbox" data-lc="${escapeHtml(row.lc)}" ${checked ? "checked" : ""} />
            </label>

            <div class="problem-info">
              <div class="problem-topline">
                <span class="lc-badge">LC #${escapeHtml(row.lc)}</span>
                <span class="diff-badge">${escapeHtml(row.difficulty || "Unknown")}</span>
              </div>

              <div class="problem-name ${checked ? "done" : ""}">
                <a href="${escapeHtml(row.link)}" target="_blank">
                  ${escapeHtml(row.problemName)}
                </a>
              </div>
              <div class="problem-why">${escapeHtml(row.whyHard || "No extra notes in CSV.")}</div>
            </div>

            <div class="problem-right">
              ${companies}
            </div>
          </div>
        </article>
      `;
    }).join("");

    return `
      <details class="pattern-card" ${idx < 3 ? "open" : ""}>
        <summary>
          <div class="pattern-left">
            <div class="pattern-title-row">
              <span class="pattern-title">${escapeHtml(group.pattern)}</span>
              <span class="pattern-count">${groupTotal} problems</span>
              <span class="pattern-progress">${groupDone} done - ${formatPercent(groupDone, groupTotal)}</span>
            </div>
          </div>

          <div class="pattern-progressbar" aria-hidden="true">
            <span style="width:${pct}%;"></span>
          </div>
        </summary>

        <div class="problem-list">
          ${itemsHtml}
        </div>
      </details>
    `;
  }).join("");

  bindProblemCheckboxes();
}

function bindProblemCheckboxes() {
  document.querySelectorAll('input[type="checkbox"][data-lc]').forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const lc = event.currentTarget.getAttribute("data-lc");
      doneMap[lc] = event.currentTarget.checked;
      persistDoneMap();
      render();
    });
  });
}

function expandAll() {
  document.querySelectorAll(".pattern-card").forEach((el) => {
    el.open = true;
  });
}

function collapseAll() {
  document.querySelectorAll(".pattern-card").forEach((el) => {
    el.open = false;
  });
}

function bindToolbar() {
  els.searchInput.addEventListener("input", render);
  els.doneOnlyToggle.addEventListener("change", render);
  els.expandAllBtn.addEventListener("click", expandAll);
  els.collapseAllBtn.addEventListener("click", collapseAll);
  els.resetDoneBtn.addEventListener("click", () => {
    const confirmed = window.confirm("Clear all saved done marks?");
    if (!confirmed) return;
    doneMap = {};
    persistDoneMap();
    render();
  });
}

function dedupeKeepLast(rows) {
  const lastIndexByLc = new Map();

  rows.forEach((row, index) => {
    lastIndexByLc.set(row.lc, index);
  });

  return rows.filter((row, index) => lastIndexByLc.get(row.lc) === index);
}

function init() {
  bindToolbar();

  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      rawRows = dedupeKeepLast(results.data.map(normalizeRow).filter((row) => row.lc && row.problemName));
      render();
    },
    error: () => {
      els.patternList.innerHTML = `
        <div class="empty-state">
          <p>Could not load the CSV.</p>
          <p class="footer-note">Make sure <code>LC_HARD.csv</code> is in the same folder as the site files.</p>
        </div>
      `;
    },
  });
}

init();
