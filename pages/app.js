const root = document.querySelector("#app");
const initial = window.__INITIAL__;
const PAGE_SIZE = 24;
const cache = new Map();

const state = {
  meta: initial.meta,
  records: initial.records,
  selectedYear: initial.year,
  selectedCategory: "all",
  query: "",
  visibleCount: PAGE_SIZE,
  loading: false,
  error: "",
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value) => {
  if (!value) return "Не вказано";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
};

const formatNumber = (value) => new Intl.NumberFormat("uk-UA").format(value);

const normalizeSearch = (value) =>
  String(value)
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .trim();

const getInitials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("uk-UA");

const getCategory = (id) =>
  state.meta.categories.find((category) => category.id === id);

const years = Object.keys(state.meta.years).sort((a, b) =>
  b.localeCompare(a),
);

async function loadYear(year) {
  if (cache.has(year)) return cache.get(year);
  const response = await fetch(`./data/${year}.json`);
  if (!response.ok) {
    throw new Error(`Не вдалося завантажити записи за ${year} рік.`);
  }
  const records = await response.json();
  cache.set(year, records);
  return records;
}

function headerMarkup() {
  const sourceDate =
    state.meta.sourceUpdatedAt?.slice(0, 10) || state.meta.endDate;
  return `
    <header class="site-header">
      <a class="brand" href="#" aria-label="Реєстр розшуку — головна">
        <span class="brand-mark" aria-hidden="true">Р</span>
        <span>
          <strong>Реєстр розшуку</strong>
          <small>Незалежний каталог відкритих даних</small>
        </span>
      </a>
      <div class="header-status">
        <span class="status-dot" aria-hidden="true"></span>
        Дані перевірено ${formatDate(sourceDate)}
      </div>
    </header>
  `;
}

function heroMarkup() {
  return `
    <section class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-copy">
        <div class="eyebrow">
          <span>Україна</span>
          <span>2022—${escapeHtml(state.meta.endDate.slice(0, 4))}</span>
        </div>
        <h1>Офіційний розшук.<br /><em>Без домислів.</em></h1>
        <p>
          Відкритий каталог осіб, оголошених у розшук українськими
          правоохоронними органами з 1 січня 2022 року.
        </p>
        <a class="hero-cta" href="#catalog">
          Переглянути ${formatNumber(state.meta.total)} записів
          <span aria-hidden="true">↓</span>
        </a>
      </div>
      <div class="hero-metrics" aria-label="Статистика каталогу">
        <div class="metric metric-primary">
          <span>Записів</span>
          <strong>${formatNumber(state.meta.total)}</strong>
          <small>актуальних на дату оновлення</small>
        </div>
        <div class="metric">
          <span>Період</span>
          <strong>${years.length}</strong>
          <small>календарних років</small>
        </div>
        <div class="metric">
          <span>Джерело</span>
          <strong>НПУ</strong>
          <small>державний портал data.gov.ua</small>
        </div>
      </div>
    </section>
  `;
}

function cardMarkup(record) {
  const category = getCategory(record.c);
  return `
    <a class="person-card" href="#/person/${encodeURIComponent(record.id)}">
      <div class="portrait portrait-${escapeHtml(record.c)}">
        <span class="portrait-grid" aria-hidden="true"></span>
        <span class="portrait-initials">${escapeHtml(getInitials(record.n))}</span>
        <span class="portrait-label">Фото не відтворено</span>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="category-tag tag-${escapeHtml(record.c)}">
            ${escapeHtml(category?.label || "Офіційний розшук")}
          </span>
          <span>${formatDate(record.d)}</span>
        </div>
        <h3>${escapeHtml(record.n)}</h3>
        <dl>
          <div>
            <dt>Дата народження</dt>
            <dd>${formatDate(record.b)}</dd>
          </div>
          <div>
            <dt>Стаття</dt>
            <dd>${escapeHtml(record.a || "Не вказано")}</dd>
          </div>
          <div>
            <dt>Місце у картці</dt>
            <dd>${escapeHtml(record.p || "Не вказано")}</dd>
          </div>
        </dl>
        <span class="card-link">Відкрити картку <span aria-hidden="true">↗</span></span>
      </div>
    </a>
  `;
}

function filteredRecords() {
  const query = normalizeSearch(state.query);
  return state.records.filter((record) => {
    if (
      state.selectedCategory !== "all" &&
      record.c !== state.selectedCategory
    ) {
      return false;
    }
    if (!query) return true;
    return normalizeSearch(
      `${record.n} ${record.e} ${record.a} ${record.p}`,
    ).includes(query);
  });
}

function updateResults() {
  const results = document.querySelector("#results");
  if (!results) return;

  if (state.error) {
    results.innerHTML = `
      <div class="empty-state">
        <strong>Дані тимчасово недоступні</strong>
        <p>${escapeHtml(state.error)}</p>
      </div>
    `;
    return;
  }

  if (state.loading) {
    results.innerHTML = `
      <div class="results-bar"><span>Завантаження офіційних записів…</span></div>
      <div class="cards-grid" aria-hidden="true">
        ${Array.from({ length: 8 }, () => '<div class="person-card card-skeleton"></div>').join("")}
      </div>
    `;
    return;
  }

  const filtered = filteredRecords();
  const visible = filtered.slice(0, state.visibleCount);
  const sourceDate =
    state.meta.sourceUpdatedAt?.slice(0, 10) || state.meta.endDate;

  results.innerHTML = `
    <div class="results-bar" aria-live="polite">
      <span>Знайдено ${formatNumber(filtered.length)}</span>
      <span class="results-note">Оновлення: ${formatDate(sourceDate)}</span>
    </div>
    ${
      visible.length
        ? `<div class="cards-grid">${visible.map(cardMarkup).join("")}</div>`
        : `<div class="empty-state">
            <strong>Збігів не знайдено</strong>
            <p>Спробуйте інший рік, категорію або коротший запит.</p>
          </div>`
    }
    ${
      state.visibleCount < filtered.length
        ? `<button class="load-more" id="load-more" type="button">
            Показати ще ${Math.min(PAGE_SIZE, filtered.length - state.visibleCount)}
            <span aria-hidden="true">↓</span>
          </button>`
        : ""
    }
  `;

  document.querySelector("#load-more")?.addEventListener("click", () => {
    state.visibleCount += PAGE_SIZE;
    updateResults();
  });
}

async function changeYear(year) {
  state.selectedYear = year;
  state.visibleCount = PAGE_SIZE;
  state.loading = true;
  state.error = "";
  updateResults();

  try {
    state.records =
      year === "all"
        ? (await Promise.all(years.map(loadYear))).flat()
        : await loadYear(year);
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    updateResults();
  }
}

function homeMarkup() {
  return `
    <main>
      ${headerMarkup()}
      ${heroMarkup()}
      <section class="directory" id="catalog">
        <div class="section-heading">
          <div>
            <span class="section-kicker">Каталог</span>
            <h2>Знайти офіційний запис</h2>
          </div>
          <p>Пошук за ПІБ, транслітерацією, статтею та місцем у картці.</p>
        </div>
        <div class="search-panel">
          <label class="search-field">
            <span>Пошук</span>
            <input id="search" type="search" placeholder="Прізвище, стаття або місце…" autocomplete="off" />
          </label>
          <label class="select-field">
            <span>Рік оголошення</span>
            <select id="year">
              ${years
                .map(
                  (year) =>
                    `<option value="${year}" ${state.selectedYear === year ? "selected" : ""}>${year} · ${formatNumber(state.meta.years[year])}</option>`,
                )
                .join("")}
              <option value="all">Усі роки · ${formatNumber(state.meta.total)}</option>
            </select>
          </label>
          <label class="select-field">
            <span>Категорія</span>
            <select id="category">
              <option value="all">Усі категорії</option>
              ${state.meta.categories
                .map(
                  (category) =>
                    `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`,
                )
                .join("")}
            </select>
          </label>
        </div>
        <div id="results"></div>
      </section>
      <section class="truth-strip">
        <span class="truth-index">01</span>
        <p>
          <strong>Що цей каталог не стверджує.</strong>
          Державний набір не підтверджує громадянство, факт виїзду за кордон,
          поточне місцезнаходження або винуватість особи.
        </p>
      </section>
      <footer class="site-footer">
        <div>
          <strong>Реєстр розшуку</strong>
          <span>Громадський інтерфейс до відкритих даних</span>
        </div>
        <p>Джерело: ${escapeHtml(state.meta.sourceName)}. Ліцензія: ${escapeHtml(state.meta.license)}.</p>
      </footer>
    </main>
  `;
}

function renderHome() {
  root.innerHTML = homeMarkup();
  document.querySelector("#search").value = state.query;
  document.querySelector("#category").value = state.selectedCategory;

  document.querySelector("#search").addEventListener("input", (event) => {
    state.query = event.target.value;
    state.visibleCount = PAGE_SIZE;
    updateResults();
  });
  document.querySelector("#year").addEventListener("change", (event) => {
    changeYear(event.target.value);
  });
  document.querySelector("#category").addEventListener("change", (event) => {
    state.selectedCategory = event.target.value;
    state.visibleCount = PAGE_SIZE;
    updateResults();
  });

  updateResults();
  if (!cache.has(state.selectedYear)) {
    loadYear(state.selectedYear).then((records) => {
      state.records = records;
      if (!location.hash.startsWith("#/person/")) updateResults();
    });
  }
}

function profileMarkup(record) {
  const category = getCategory(record.c);
  const sourceDate =
    state.meta.sourceUpdatedAt?.slice(0, 10) || state.meta.endDate;
  return `
    <main class="profile-page">
      ${headerMarkup()}
      <div class="profile-shell">
        <a class="back-link" href="#">← Повернутися до каталогу</a>
        <section class="profile-hero">
          <div class="profile-portrait portrait-${escapeHtml(record.c)}">
            <span class="portrait-grid" aria-hidden="true"></span>
            <span class="profile-initials">${escapeHtml(getInitials(record.n))}</span>
            <span class="portrait-label">Фото не відтворено</span>
          </div>
          <div class="profile-title">
            <div class="profile-status-row">
              <span class="category-tag tag-${escapeHtml(record.c)}">${escapeHtml(category?.label || "Офіційний розшук")}</span>
              <span>ID ${escapeHtml(record.id)}</span>
            </div>
            <h1>${escapeHtml(record.n)}</h1>
            ${record.e ? `<p class="transliteration">${escapeHtml(record.e)}</p>` : ""}
            <p class="profile-lead">
              Запис оприлюднений у державному наборі як активна картка розшуку.
              Наведені формулювання не є вироком суду.
            </p>
          </div>
        </section>
        <div class="profile-layout">
          <div class="profile-main">
            <section class="detail-section">
              <div class="detail-index">01</div>
              <div>
                <span class="section-kicker">Підстава розшуку</span>
                <h2>Що вказано в офіційній картці</h2>
                <dl class="detail-list">
                  <div><dt>Категорія</dt><dd>${escapeHtml(category?.label || "Не вказано")}</dd></div>
                  <div><dt>Статті</dt><dd class="article-value">${escapeHtml(record.a || "Не вказано")}</dd></div>
                  <div><dt>Запобіжний захід / статус</dt><dd>${escapeHtml(record.r || "Не вказано")}</dd></div>
                </dl>
              </div>
            </section>
            <section class="detail-section">
              <div class="detail-index">02</div>
              <div>
                <span class="section-kicker">Хронологія</span>
                <h2>Дати у записі</h2>
                <dl class="detail-list two-column">
                  <div><dt>Дата народження</dt><dd>${formatDate(record.b)}</dd></div>
                  <div><dt>Дата розшуку / зникнення</dt><dd>${formatDate(record.d)}</dd></div>
                </dl>
              </div>
            </section>
            <section class="detail-section">
              <div class="detail-index">03</div>
              <div>
                <span class="section-kicker">Географія</span>
                <h2>Місце, зазначене у картці</h2>
                <p class="location-value">${escapeHtml(record.p || "Не вказано")}</p>
                <div class="caution-box">
                  Це не поточне й не ймовірне місцезнаходження.
                </div>
              </div>
            </section>
          </div>
          <aside class="profile-aside">
            <div><span>Дата запису</span><strong>${formatDate(record.d)}</strong></div>
            <div><span>Орган розшуку</span><strong>${escapeHtml(record.o || "Не вказано")}</strong></div>
            <div><span>Дані перевірено</span><strong>${formatDate(sourceDate)}</strong></div>
          </aside>
        </div>
      </div>
    </main>
  `;
}

async function renderProfile(id) {
  const cached = [...cache.values()].flat().find((record) => record.id === id);
  const initialRecord = state.records.find((record) => record.id === id);
  if (cached || initialRecord) {
    root.innerHTML = profileMarkup(cached || initialRecord);
    return;
  }

  root.innerHTML = `
    <main class="profile-shell">
      <a class="back-link" href="#">← Повернутися до каталогу</a>
      <div class="profile-loading">Перевіряємо офіційний запис…</div>
    </main>
  `;

  try {
    const indexResponse = await fetch("./data/index.json");
    const index = await indexResponse.json();
    const year = index[id];
    const records = year ? await loadYear(year) : [];
    const record = records.find((item) => item.id === id);
    root.innerHTML = record
      ? profileMarkup(record)
      : `<main class="profile-shell"><a class="back-link" href="#">← Повернутися</a><div class="profile-missing"><span>404</span><h1>Запис не знайдено</h1></div></main>`;
  } catch {
    root.innerHTML = `<main class="profile-shell"><a class="back-link" href="#">← Повернутися</a><div class="profile-missing"><h1>Дані тимчасово недоступні</h1></div></main>`;
  }
}

function renderRoute() {
  const match = location.hash.match(/^#\/person\/(.+)$/);
  if (match) renderProfile(decodeURIComponent(match[1]));
  else renderHome();
}

window.addEventListener("hashchange", renderRoute);
renderRoute();
