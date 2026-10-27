
"use strict";

/* =========================================
   USTOYOB — JavaScript
   Маълумот дар браузери ҳамин дастгоҳ нигоҳ дошта мешавад.
========================================= */

const STORAGE = {
  workers: "ustoyob_workers_v1",
  favorites: "ustoyob_favorites_v1",
  ratings: "ustoyob_ratings_v1"
};

const PROFESSIONS = [
  "Таъмири хона",
  "Барқчӣ",
  "Сантехник",
  "Рангуборчӣ",
  "Кондиционер",
  "Бинокор",
  "Дуредгар",
  "Кафшергар",
  "Устои мошин",
  "Таъмири компютер",
  "Таъмири телефон",
  "Устои мебел",
  "Шишабур",
  "Устои бом",
  "Дару тиреза",
  "Таъмири яхдон",
  "Мошини ҷомашӯӣ",
  "Тозакунии хона",
  "Кори боғ",
  "Боркашонӣ",
  "Шусташавии қолин",
  "Интернет ва камера",
  "Устои универсалӣ"
];

const CITIES = [
  "Душанбе",
  "Хуҷанд",
  "Бохтар",
  "Кӯлоб",
  "Истаравшан",
  "Турсунзода",
  "Ваҳдат",
  "Ҳисор",
  "Панҷакент",
  "Исфара",
  "Конибодом",
  "Истиклол",
  "Гулистон",
  "Хоруғ",
  "Роғун",
  "Норак",
  "Левакант",
  "Дигар"
];

const $ = (selector) => document.querySelector(selector);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn("Хатои хондани маълумот:", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    showToast("Маълумот нигоҳ дошта нашуд. Хотираи браузерро санҷ.");
    return false;
  }
}

let workers = readStorage(STORAGE.workers, []);
let favorites = readStorage(STORAGE.favorites, []);
let ratings = readStorage(STORAGE.ratings, {});
let toastTimer = null;

if (!Array.isArray(workers)) workers = [];
if (!Array.isArray(favorites)) favorites = [];
if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
  ratings = {};
}

/* ---------- Функсияҳои ёрирасон ---------- */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("tg");
}

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || value === "") {
    return "Бо маслиҳат";
  }
  return new Intl.NumberFormat("tg-TJ").format(number) + " сомонӣ";
}

function safePhone(phone) {
  return String(phone ?? "").replace(/[^\d+]/g, "");
}

function isSafeImageURL(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function workerRating(workerId) {
  const data = ratings[workerId];
  if (!data || !Array.isArray(data.values) || !data.values.length) {
    return { average: 0, count: 0 };
  }

  const values = data.values.map(Number).filter(
    (n) => Number.isFinite(n) && n >= 1 && n <= 5
  );

  if (!values.length) return { average: 0, count: 0 };

  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    count: values.length
  };
}

function getWorkerById(id) {
  return workers.find((worker) => worker.id === id);
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function persistWorkers() {
  return writeStorage(STORAGE.workers, workers);
}

function persistFavorites() {
  return writeStorage(STORAGE.favorites, favorites);
}

function persistRatings() {
  return writeStorage(STORAGE.ratings, ratings);
}

/* ---------- Гузариш байни саҳифаҳо ---------- */

const pageIds = {
  home: "homePage",
  workers: "workersPage",
  register: "registerPage",
  favorites: "favoritesPage",
  detail: "detailPage"
};

function showPage(pageName) {
  const pageId = pageIds[pageName];
  if (!pageId) return;

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  $("#mainNav").classList.remove("open");

  if (pageName === "home") renderHome();
  if (pageName === "workers") renderWorkers();
  if (pageName === "favorites") renderFavorites();
  if (pageName === "register") renderMyProfiles();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (!button) return;

  event.preventDefault();
  showPage(button.dataset.page);
});

$("#homeLink").addEventListener("click", (event) => {
  event.preventDefault();
  showPage("home");
});

$("#menuButton").addEventListener("click", () => {
  $("#mainNav").classList.toggle("open");
});

/* ---------- Пур кардани интихоби касбу маҳал ---------- */

function fillSelect(select, items, firstLabel, includeOther = false) {
  select.replaceChildren();

  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  select.appendChild(first);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });

  if (includeOther) {
    const option = document.createElement("option");
    option.value = "__other__";
    option.textContent = "Дигар — худам менависам";
    select.appendChild(option);
  }
}

function fillProfessionFilter() {
  const select = $("#professionFilter");
  select.replaceChildren();

  const all = document.createElement("option");
  all.value = "";
  all.textContent = "Ҳамаи касбҳо";
  select.appendChild(all);

  const known = new Set(PROFESSIONS);
  workers.forEach((worker) => {
    if (worker.profession && !known.has(worker.profession)) {
      known.add(worker.profession);
    }
  });

  [...known].forEach((profession) => {
    const option = document.createElement("option");
    option.value = profession;
    option.textContent = profession;
    select.appendChild(option);
  });
}

function fillCityFilter() {
  const select = $("#cityFilter");
  const current = select.value;
  select.replaceChildren();

  const all = document.createElement("option");
  all.value = "";
  all.textContent = "Ҳамаи маҳалҳо";
  select.appendChild(all);

  const known = new Set(CITIES.filter((city) => city !== "Дигар"));
  workers.forEach((worker) => {
    if (worker.city && !known.has(worker.city)) known.add(worker.city);
  });

  [...known].forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    select.appendChild(option);
  });

  if ([...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

fillSelect($("#workerProfession"), PROFESSIONS, "Касбро интихоб кун", true);
fillSelect($("#workerCity"), CITIES, "Шаҳр ё ноҳияро интихоб кун", true);
fillProfessionFilter();
fillCityFilter();

/* ---------- Интихоби «Дигар» ---------- */

$("#workerProfession").addEventListener("change", () => {
  const custom = $("#workerProfession").value === "__other__";
  $("#customProfessionWrap").classList.toggle("hidden", !custom);
  $("#customProfession").required = custom;

  if (!custom) $("#customProfession").value = "";
});

$("#workerCity").addEventListener("change", () => {
  const custom = $("#workerCity").value === "Дигар" ||
                 $("#workerCity").value === "__other__";

  $("#customCityWrap").classList.toggle("hidden", !custom);
  $("#customCity").required = custom;

  if (!custom) $("#customCity").value = "";
});

/* ---------- Рамзи ягонаи усто ---------- */

function makeWorkerCode() {
  const existing = new Set(workers.map((worker) => worker.code));
  let code;

  do {
    const number = Math.floor(1000 + Math.random() * 9000);
    code = "UST-" + number;
  } while (existing.has(code));

  return code;
}

/* ---------- Расм ва корти усто ---------- */

function avatarHTML(worker, extraClass = "") {
  const name = escapeHTML(worker.name || "Усто");
  const initial = escapeHTML((worker.name || "У").trim().charAt(0).toUpperCase());

  if (isSafeImageURL(worker.photo)) {
    return `
      <div class="worker-avatar ${extraClass}">
        <img src="${escapeHTML(worker.photo)}" alt="Сурати ${name}"
             loading="lazy" referrerpolicy="no-referrer"
             onerror="this.parentElement.textContent='${initial}'">
      </div>`;
  }

  return `<div class="worker-avatar ${extraClass}" aria-label="${name}">${initial}</div>`;
}

function workerCard(worker) {
  const rating = workerRating(worker.id);
  const isFavorite = favorites.includes(worker.id);
  const experience = Number(worker.experience) || 0;
  const priceText = worker.price === "" || worker.price == null
    ? "Бо маслиҳат"
    : formatPrice(worker.price);

  const priceUnit = worker.price === "" || worker.price == null
    ? ""
    : escapeHTML(worker.priceUnit || "барои кор");

  const phone = safePhone(worker.phone);

  return `
    <article class="worker-card">
      <div class="card-top">
        ${avatarHTML(worker)}
        <div class="worker-title">
          <h3>${escapeHTML(worker.name)}</h3>
          <p>${escapeHTML(worker.profession)}</p>
        </div>
        <button class="favorite-button ${isFavorite ? "active" : ""}"
          data-favorite="${escapeHTML(worker.id)}"
          aria-label="${isFavorite ? "Аз дӯстдоштаҳо хориҷ кардан" : "Ба дӯстдоштаҳо илова кардан"}"
          title="Дӯстдошта"> ${isFavorite ? "♥" : "♡"} </button>
      </div>

      <p class="card-location">⌖ ${escapeHTML(worker.city || "Маҳал нишон дода нашудааст")}</p>
      <p class="card-bio">${escapeHTML(worker.bio || "Барои маълумоти бештар бо усто тамос гир.")}</p>

      <div class="card-meta">
        <span class="meta-chip">Таҷриба: ${experience} сол</span>
        <span class="meta-chip rating">★ ${rating.count ? rating.average.toFixed(1) : "—"}${rating.count ? ` (${rating.count})` : ""}</span>
        <span class="meta-chip">Код: ${escapeHTML(worker.code)}</span>
      </div>

      <div class="card-price">${escapeHTML(priceText)} ${priceUnit ? `<small>${priceUnit}</small>` : ""}</div>

      <div class="card-actions">
        <button class="btn btn-outline" data-detail="${escapeHTML(worker.id)}">Профил</button>
        ${phone
          ? `<a class="btn btn-primary" href="tel:${escapeHTML(phone)}">☎ Занг задан</a>`
          : `<button class="btn btn-primary" data-detail="${escapeHTML(worker.id)}">Тамос</button>`
        }
      </div>
    </article>`;
}

/* ---------- Саҳифаи асосӣ ---------- */

function renderHome() {
  const list = workers.slice(0, 3);
  $("#homeWorkers").innerHTML = list.map(workerCard).join("");
  $("#homeEmpty").classList.toggle("hidden", list.length > 0);
}

/* ---------- Ҷустуҷӯ ва филтр ---------- */

function getFilteredWorkers() {
  const query = normalize($("#workerSearch").value);
  const profession = $("#professionFilter").value;
  const city = $("#cityFilter").value;
  const maxPriceText = $("#priceFilter").value;
  const maxPrice = maxPriceText === "" ? null : Number(maxPriceText);
  const sort = $("#sortWorkers").value;

  let list = workers.filter((worker) => {
    const searchable = normalize([
      worker.name,
      worker.profession,
      worker.city,
      worker.code,
      worker.bio
    ].join(" "));

    if (query && !searchable.includes(query)) return false;
    if (profession && worker.profession !== profession) return false;
    if (city && worker.city !== city) return false;

    if (maxPrice !== null) {
      if (!Number.isFinite(maxPrice) || maxPrice < 0) return false;
      if (worker.price === "" || worker.price == null) return false;
      if (Number(worker.price) > maxPrice) return false;
    }

    return true;
  });

  if (sort === "rating") {
    list.sort((a, b) => workerRating(b.id).average - workerRating(a.id).average);
  } else if (sort === "price") {
    list.sort((a, b) => {
      const pa = a.price === "" || a.price == null ? Infinity : Number(a.price);
      const pb = b.price === "" || b.price == null ? Infinity : Number(b.price);
      return pa - pb;
    });
  } else if (sort === "experience") {
    list.sort((a, b) => Number(b.experience) - Number(a.experience));
  } else {
    list.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }

  return list;
}

function renderWorkers() {
  fillProfessionFilter();
  fillCityFilter();

  const list = getFilteredWorkers();

  $("#workerGrid").innerHTML = list.map(workerCard).join("");
  $("#resultsCount").textContent = `${list.length} усто`;
  $("#workersEmpty").classList.toggle("hidden", list.length > 0);
  $("#workerGrid").classList.toggle("hidden", list.length === 0);
}

["workerSearch", "professionFilter", "cityFilter", "priceFilter", "sortWorkers"]
  .forEach((id) => {
    $("#" + id).addEventListener("input", renderWorkers);
    $("#" + id).addEventListener("change", renderWorkers);
  });

$("#clearFilters").addEventListener("click", () => {
  $("#workerSearch").value = "";
  $("#professionFilter").value = "";
  $("#cityFilter").value = "";
  $("#priceFilter").value = "";
  $("#sortWorkers").value = "newest";
  renderWorkers();
});

$("#heroSearchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  $("#workerSearch").value = $("#heroSearch").value.trim();
  showPage("workers");
  renderWorkers();
});

/* ---------- Дӯстдоштаҳо ---------- */

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((favoriteId) => favoriteId !== id);
    showToast("Усто аз дӯстдоштаҳо хориҷ шуд.");
  } else {
    favorites.push(id);
    showToast("Усто ба дӯстдоштаҳо илова шуд.");
  }

  persistFavorites();
  renderHome();
  renderWorkers();
  renderFavorites();
}

function renderFavorites() {
  const list = favorites
    .map((id) => getWorkerById(id))
    .filter(Boolean);

  $("#favoritesGrid").innerHTML = list.map(workerCard).join("");
  $("#favoritesEmpty").classList.toggle("hidden", list.length > 0);
  $("#favoritesGrid").classList.toggle("hidden", list.length === 0);
}

/* ---------- Саҳифаи профили усто ---------- */

function showWorkerDetail(id) {
  const worker = getWorkerById(id);

  if (!worker) {
    showToast("Ин профил ёфт нашуд.");
    return;
  }

  const rating = workerRating(worker.id);
  const phone = safePhone(worker.phone);

  $("#workerDetail").innerHTML = `
    <article class="detail-card">
      <div class="detail-top">
        ${avatarHTML(worker)}
        <div>
          <h1>${escapeHTML(worker.name)}</h1>
          <p>${escapeHTML(worker.profession)} · ${escapeHTML(worker.city)}</p>
          <span class="meta-chip">Рамзи усто: ${escapeHTML(worker.code)}</span>
        </div>
      </div>

      <div class="detail-section">
        <h3>Маълумоти усто</h3>
        <div class="card-meta">
          <span class="meta-chip">Таҷриба: ${Number(worker.experience) || 0} сол</span>
          <span class="meta-chip rating">★ ${rating.count ? rating.average.toFixed(1) : "Баҳо нест"}${rating.count ? ` · ${rating.count} баҳо` : ""}</span>
        </div>
      </div>

      <div class="detail-section">
        <h3>Нархи хизматрасонӣ</h3>
        <p>${escapeHTML(worker.price === "" || worker.price == null ? "Бо маслиҳат" : formatPrice(worker.price))} ${worker.price !== "" && worker.price != null ? escapeHTML(worker.priceUnit || "барои кор") : ""}</p>
      </div>

      <div class="detail-section">
        <h3>Дар бораи кор</h3>
        <p>${escapeHTML(worker.bio || "Маълумоти иловагӣ ҳоло ворид нашудааст.")}</p>
      </div>

      <div class="detail-section">
        <h3>Баҳо додан ба кор</h3>
        <p>Пас аз ҳамкорӣ ба сифати кор баҳо деҳ. Дар ин версия баҳо дар ҳамин браузер нигоҳ дошта мешавад.</p>
        <div class="detail-actions">
          ${[1, 2, 3, 4, 5].map((score) =>
            `<button class="mini-button" data-rate="${score}" data-worker="${escapeHTML(worker.id)}">${"★".repeat(score)} ${score}</button>`
          ).join("")}
        </div>
      </div>

      <div class="detail-actions">
        ${phone ? `<a class="btn btn-primary" href="tel:${escapeHTML(phone)}">☎ Занг задан</a>` : ""}
        <button class="btn btn-outline" data-favorite="${escapeHTML(worker.id)}">
          ${favorites.includes(worker.id) ? "♥ Дар дӯстдоштаҳо" : "♡ Ба дӯстдоштаҳо"}
        </button>
        <button class="btn btn-outline" id="copyWorkerCode">Нусхаи рамз</button>
      </div>
    </article>`;

  $("#copyWorkerCode").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(worker.code);
      showToast("Рамзи профил нусха шуд.");
    } catch {
      showToast("Рамзи усто: " + worker.code);
    }
  });

  showPage("detail");
}

$("#backToWorkers").addEventListener("click", () => showPage("workers"));

/* ---------- Сохтан ва таҳрири профил ---------- */

function getFormValue(id) {
  return $("#" + id).value.trim();
}

function getProfessionFromForm() {
  const selected = $("#workerProfession").value;
  if (selected === "__other__") return getFormValue("customProfession");
  return selected;
}

function getCityFromForm() {
  const selected = $("#workerCity").value;
  if (selected === "Дигар" || selected === "__other__") {
    return getFormValue("customCity");
  }
  return selected;
}

function setFormMessage(message, type = "") {
  const element = $("#formMessage");
  element.textContent = message;
  element.className = "form-message " + type;
}

function resetWorkerForm() {
  $("#workerForm").reset();
  $("#editWorkerId").value = "";
  $("#customProfessionWrap").classList.add("hidden");
  $("#customCityWrap").classList.add("hidden");
  $("#customProfession").required = false;
  $("#customCity").required = false;
  $("#profileFormTitle").textContent = "Профили усто соз";
  $("#saveWorkerButton").textContent = "Сохтани профил";
  $("#cancelEditButton").classList.add("hidden");
  setFormMessage("");
}

function editWorker(id) {
  const worker = getWorkerById(id);
  if (!worker) return;

  $("#editWorkerId").value = worker.id;
  $("#workerName").value = worker.name || "";
  $("#workerPhone").value = worker.phone || "";
  $("#workerExperience").value = worker.experience ?? "";
  $("#workerPrice").value = worker.price ?? "";
  $("#workerPriceUnit").value = worker.priceUnit || "барои кор";
  $("#workerPhoto").value = worker.photo || "";
  $("#workerBio").value = worker.bio || "";

  const professionSelect = $("#workerProfession");
  if ([...professionSelect.options].some((option) => option.value === worker.profession)) {
    professionSelect.value = worker.profession;
    $("#customProfessionWrap").classList.add("hidden");
    $("#customProfession").required = false;
  } else {
    professionSelect.value = "__other__";
    $("#customProfessionWrap").classList.remove("hidden");
    $("#customProfession").required = true;
    $("#customProfession").value = worker.profession || "";
  }

  const citySelect = $("#workerCity");
  if ([...citySelect.options].some((option) => option.value === worker.city)) {
    citySelect.value = worker.city;
    $("#customCityWrap").classList.add("hidden");
    $("#customCity").required = false;
  } else {
    citySelect.value = "Дигар";
    $("#customCityWrap").classList.remove("hidden");
    $("#customCity").required = true;
    $("#customCity").value = worker.city || "";
  }

  $("#profileFormTitle").textContent = "Таҳрири профил";
  $("#saveWorkerButton").textContent = "Нигоҳ доштани тағйирот";
  $("#cancelEditButton").classList.remove("hidden");
  setFormMessage("Рамзи профил ҳангоми таҳрир тағйир намеёбад.", "success");

  showPage("register");
  $("#profileFormTitle").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#cancelEditButton").addEventListener("click", resetWorkerForm);

$("#workerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = getFormValue("workerName");
  const profession = getProfessionFromForm();
  const city = getCityFromForm();
  const phone = getFormValue("workerPhone");
  const experienceText = getFormValue("workerExperience");
  const experience = Number(experienceText);
  const priceText = getFormValue("workerPrice");
  const photo = getFormValue("workerPhoto");
  const bio = getFormValue("workerBio");
  const editingId = getFormValue("editWorkerId");

  if (!name || !profession || !city || !phone || experienceText === "") {
    setFormMessage("Лутфан ҳамаи майдонҳои ҳатмиро пур кун.", "error");
    return;
  }

  if (!Number.isFinite(experience) || experience < 0 || experience > 70) {
    setFormMessage("Таҷрибаи кориро дуруст навис.", "error");
    return;
  }

  if (priceText !== "" && (!Number.isFinite(Number(priceText)) || Number(priceText) < 0)) {
    setFormMessage("Нархи хизматрасонӣ дуруст нест.", "error");
    return;
  }

  if (photo && !isSafeImageURL(photo)) {
    setFormMessage("Нишонии сурат бояд бо http:// ё https:// оғоз шавад.", "error");
    return;
  }

  const oldWorker = editingId ? getWorkerById(editingId) : null;

  if (editingId && !oldWorker) {
    setFormMessage("Профили таҳриршаванда ёфт нашуд.", "error");
    return;
  }

  const workerData = {
    id: oldWorker ? oldWorker.id : (
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "worker-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)
    ),
    code: oldWorker ? oldWorker.code : makeWorkerCode(),
    name,
    profession,
    city,
    phone,
    experience,
    price: priceText === "" ? "" : Number(priceText),
    priceUnit: getFormValue("workerPriceUnit"),
    photo,
    bio,
    createdAt: oldWorker ? oldWorker.createdAt : Date.now(),
    updatedAt: Date.now()
  };

  if (oldWorker) {
    workers = workers.map((worker) =>
      worker.id === oldWorker.id ? workerData : worker
    );
  } else {
    workers.unshift(workerData);
  }

  if (!persistWorkers()) {
    setFormMessage("Маълумот нигоҳ дошта нашуд. Хотираи браузерро санҷ.", "error");
    return;
  }

  fillProfessionFilter();
  fillCityFilter();
  resetWorkerForm();
  renderMyProfiles();
  renderHome();
  renderWorkers();

  setFormMessage(
    `Профил нигоҳ дошта шуд. Рамзи устои ту: ${workerData.code}`,
    "success"
  );

  showToast(
    oldWorker
      ? "Тағйирот нигоҳ дошта шуд."
      : "Профили усто сохта шуд! Рамз: " + workerData.code
  );
});

/* ---------- Профилҳои дар ҳамин браузер сохташуда ---------- */

function renderMyProfiles() {
  const container = $("#myProfilesList");

  if (!workers.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Ҳоло профиле дар ин браузер сохта нашудааст.</p>
      </div>`;
    return;
  }

  container.innerHTML = workers.map((worker) => `
    <div class="my-profile-row">
      <div>
        <b>${escapeHTML(worker.name)}</b>
        <small>${escapeHTML(worker.profession)} · ${escapeHTML(worker.code)}</small>
      </div>
      <div class="my-profile-actions">
        <button class="mini-button" data-edit="${escapeHTML(worker.id)}">Таҳрир</button>
        <button class="mini-button danger" data-delete="${escapeHTML(worker.id)}">Нест кардан</button>
      </div>
    </div>
  `).join("");
}

/* ---------- Амалҳои кортҳо ---------- */

document.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    event.preventDefault();
    toggleFavorite(favoriteButton.dataset.favorite);
    return;
  }

  const detailButton = event.target.closest("[data-detail]");
  if (detailButton) {
    event.preventDefault();
    showWorkerDetail(detailButton.dataset.detail);
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    editWorker(editButton.dataset.edit);
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    deleteWorker(deleteButton.dataset.delete);
    return;
  }

  const rateButton = event.target.closest("[data-rate]");
  if (rateButton) {
    rateWorker(rateButton.dataset.worker, Number(rateButton.dataset.rate));
  }
});

/* ---------- Нест кардани профил ---------- */

function deleteWorker(id) {
  const worker = getWorkerById(id);
  if (!worker) return;

  const confirmed = confirm(
    `Профили "${worker.name}" (${worker.code}) нест карда шавад?`
  );

  if (!confirmed) return;

  workers = workers.filter((item) => item.id !== id);
  favorites = favorites.filter((favoriteId) => favoriteId !== id);
  delete ratings[id];

  persistWorkers();
  persistFavorites();
  persistRatings();

  renderMyProfiles();
  renderHome();
  renderWorkers();
  renderFavorites();
  fillProfessionFilter();
  fillCityFilter();

  showToast("Профил аз ҳамин браузер нест карда шуд.");
}

/* ---------- Баҳо додан ---------- */

function rateWorker(id, score) {
  if (!Number.isInteger(score) || score < 1 || score > 5) return;

  const worker = getWorkerById(id);
  if (!worker) {
    showToast("Профил ёфт нашуд.");
    return;
  }

  const current = ratings[id] && Array.isArray(ratings[id].values)
    ? ratings[id].values
    : [];

  current.push(score);
  ratings[id] = { values: current };

  if (!persistRatings()) return;

  showToast("Ташаккур! Баҳои ту дар ҳамин браузер нигоҳ дошта шуд.");
  showWorkerDetail(id);
  renderWorkers();
  renderHome();
  renderFavorites();
}

/* ---------- Оғози сайт ---------- */

$("#currentYear").textContent = new Date().getFullYear();

renderHome();
renderWorkers();
renderFavorites();
renderMyProfiles();

