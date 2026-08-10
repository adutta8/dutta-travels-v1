// ===== Dutta Travels — shared site behaviour =====

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initWhatsappLinks();
  initFormSubmissions();
  if (document.getElementById("availability-app")) {
    initAvailabilityCalendar();
  }
});

/* ---------- Mobile nav ---------- */
function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });
}

/* ---------- WhatsApp links ---------- */
function buildWhatsappUrl(message) {
  const number = (SITE_CONFIG.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const text = encodeURIComponent(message || "Hi Dutta Travels, I'd like to enquire about bus availability.");
  return `https://wa.me/${number}?text=${text}`;
}

function initWhatsappLinks() {
  document.querySelectorAll("[data-whatsapp]").forEach((el) => {
    const customMessage = el.getAttribute("data-whatsapp-message");
    el.href = buildWhatsappUrl(customMessage);
    el.target = "_blank";
    el.rel = "noopener";
  });

  document.querySelectorAll("[data-phone-display]").forEach((el) => {
    el.textContent = SITE_CONFIG.PHONE_DISPLAY;
  });
  document.querySelectorAll("[data-phone-tel]").forEach((el) => {
    el.href = `tel:+${(SITE_CONFIG.WHATSAPP_NUMBER || "").replace(/\D/g, "")}`;
  });
  document.querySelectorAll("[data-email-display]").forEach((el) => {
    el.textContent = SITE_CONFIG.EMAIL;
  });
  document.querySelectorAll("[data-email-link]").forEach((el) => {
    el.href = `mailto:${SITE_CONFIG.EMAIL}`;
  });
}

/* ---------- Forms (Formspree via fetch, with inline success message) ---------- */
function initFormSubmissions() {
  document.querySelectorAll("form[data-formspree]").forEach((form) => {
    const endpoint = SITE_CONFIG.FORMSPREE_ENDPOINT;
    const submitBtn = form.querySelector('button[type="submit"]');
    const successBox = form.parentElement.querySelector(".form-success");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!endpoint || endpoint.indexOf("PASTE_YOUR") === 0) {
        alert(
          "This form isn't connected yet. The site owner needs to add a Formspree endpoint in js/config.js (see README.md). " +
          "You can also reach us directly on WhatsApp using the button on this page."
        );
        return;
      }

      const formData = new FormData(form);
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          form.reset();
          if (successBox) {
            successBox.classList.add("visible");
            successBox.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else {
          alert("Sorry, something went wrong sending your enquiry. Please try WhatsApp or call us instead.");
        }
      } catch (err) {
        alert("Sorry, something went wrong sending your enquiry. Please try WhatsApp or call us instead.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Enquiry";
        }
      }
    });
  });
}

/* ---------- Availability calendar (Google Sheet CSV -> calendar) ---------- */

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseFlexibleDate(raw) {
  if (!raw) return null;
  const value = raw.trim();

  // ISO: YYYY-MM-DD
  let m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // DD/MM/YYYY or DD-MM-YYYY
  m = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function fetchBookedRanges() {
  const url = SITE_CONFIG.BOOKINGS_CSV_URL;
  if (!url || url.indexOf("PASTE_YOUR") === 0) {
    throw new Error("NOT_CONFIGURED");
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("FETCH_FAILED");
  const text = await response.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  // First row is assumed to be the header (From Date, To Date, Note) — skip it.
  const dataRows = rows.slice(1);
  const ranges = [];
  dataRows.forEach((cols) => {
    const from = parseFlexibleDate(cols[0]);
    const to = parseFlexibleDate(cols[1]) || from;
    const note = (cols[2] || "").trim();
    if (from) ranges.push({ from, to, note });
  });
  return ranges;
}

function buildBookedDateSet(ranges) {
  const map = new Map();
  ranges.forEach(({ from, to, note }) => {
    const cursor = new Date(from);
    const end = new Date(to);
    while (cursor <= end) {
      map.set(dateKey(cursor), note || "Booked");
      cursor.setDate(cursor.getDate() + 1);
    }
  });
  return map;
}

function renderCalendar(container, year, month, bookedMap, onNav) {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nav = document.createElement("div");
  nav.className = "month-nav";
  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.textContent = "‹ Prev";
  prevBtn.addEventListener("click", () => onNav(-1));
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.textContent = "Next ›";
  nextBtn.addEventListener("click", () => onNav(1));
  const title = document.createElement("h3");
  title.textContent = `${monthNames[month]} ${year}`;
  nav.append(prevBtn, title, nextBtn);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  dayLabels.forEach((label) => {
    const el = document.createElement("div");
    el.className = "day-label";
    el.textContent = label;
    grid.appendChild(el);
  });

  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const key = dateKey(cellDate);
    const isPast = cellDate < today;
    const bookedNote = bookedMap.get(key);

    const cell = document.createElement("div");
    cell.className = "calendar-day " + (isPast ? "" : bookedNote ? "booked" : "open");

    const num = document.createElement("div");
    num.className = "date-num";
    num.textContent = String(day);
    cell.appendChild(num);

    if (!isPast) {
      const tag = document.createElement("div");
      tag.className = "tag";
      tag.textContent = bookedNote ? "Booked" : "Open";
      cell.appendChild(tag);
    }

    grid.appendChild(cell);
  }

  container.innerHTML = "";
  container.append(nav, grid);
}

async function initAvailabilityCalendar() {
  const app = document.getElementById("availability-app");
  const statusBox = document.getElementById("availability-status");
  const calendarBox = document.getElementById("availability-calendar");
  if (!app || !calendarBox) return;

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let bookedMap = new Map();

  function showStatus(type, message) {
    if (!statusBox) return;
    statusBox.className = "availability-status " + type;
    statusBox.textContent = message;
    statusBox.style.display = "block";
  }

  function draw() {
    renderCalendar(calendarBox, viewYear, viewMonth, bookedMap, (delta) => {
      viewMonth += delta;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      draw();
    });
  }

  try {
    const ranges = await fetchBookedRanges();
    bookedMap = buildBookedDateSet(ranges);
    showStatus("ok", "Live availability loaded from our booking sheet. Dates shown are indicative — please confirm with us before finalising travel.");
    draw();
  } catch (err) {
    if (err.message === "NOT_CONFIGURED") {
      showStatus("warn", "Availability calendar isn't connected yet. Please contact us directly on WhatsApp or by phone to check open dates.");
    } else {
      showStatus("error", "We couldn't load the live availability calendar right now. Please contact us on WhatsApp or by phone to check open dates.");
    }
    draw();
  }
}
