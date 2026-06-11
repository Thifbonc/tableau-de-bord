/* =================================================================
   Tableau de bord partagé — logique principale
   - Agenda (FullCalendar) : créer / déplacer / redimensionner / supprimer
   - Notes & bookmarks partagés
   - Synchro temps réel via Firebase (fallback localStorage si non configuré)
   ================================================================= */

(function () {
  "use strict";

  // ---------- Détection du mode (Firebase configuré ou non) ----------
  const firebaseReady =
    typeof firebaseConfig !== "undefined" &&
    firebaseConfig.apiKey &&
    !String(firebaseConfig.apiKey).includes("REMPLACE_MOI");

  let db = null;
  if (firebaseReady) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
  }

  const banner = document.getElementById("connectionBanner");
  if (firebaseReady) {
    banner.textContent = "✅ Mode partagé activé — tout est synchronisé en temps réel.";
    banner.classList.add("ok");
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 4000);
  } else {
    banner.innerHTML =
      "⚠️ Mode local (non partagé). Renseigne tes clés dans <strong>config.js</strong> pour que tout le monde voie le même contenu. Voir le README.";
    banner.classList.remove("hidden");
  }

  /* =================================================================
     Couche de stockage : même API que Firebase, mais avec fallback local
     store(path) -> { onValue(cb), set(val), push(val)->key, update(key,val), remove(key) }
     ================================================================= */
  function store(path) {
    if (firebaseReady) {
      const ref = db.ref(path);
      return {
        onValue: (cb) => ref.on("value", (snap) => cb(snap.val())),
        set: (val) => ref.set(val),
        push: (val) => ref.push(val).key,
        update: (key, val) => ref.child(key).update(val),
        remove: (key) => ref.child(key).remove(),
      };
    }
    // ----- Fallback localStorage -----
    const read = () => JSON.parse(localStorage.getItem("dash_" + path) || "null");
    const write = (v) => localStorage.setItem("dash_" + path, JSON.stringify(v));
    let listener = null;
    const fire = () => listener && listener(read());
    window.addEventListener("storage", (e) => {
      if (e.key === "dash_" + path) fire();
    });
    return {
      onValue: (cb) => { listener = cb; fire(); },
      set: (val) => { write(val); fire(); },
      push: (val) => {
        const all = read() || {};
        const key = "id" + Date.now() + Math.random().toString(36).slice(2, 7);
        all[key] = val; write(all); fire(); return key;
      },
      update: (key, val) => {
        const all = read() || {};
        all[key] = Object.assign({}, all[key], val); write(all); fire();
      },
      remove: (key) => {
        const all = read() || {};
        delete all[key]; write(all); fire();
      },
    };
  }

  /* =================================================================
     HORLOGE
     ================================================================= */
  function updateClock() {
    const now = new Date();
    document.getElementById("clockTime").textContent =
      now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("clockDate").textContent =
      now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }
  updateClock();
  setInterval(updateClock, 1000 * 20);

  /* =================================================================
     MÉTÉO (Open-Meteo, sans clé)
     ================================================================= */
  const WMO = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌦️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    71: "🌨️", 73: "🌨️", 75: "❄️",
    80: "🌦️", 81: "🌧️", 82: "⛈️",
    95: "⛈️", 96: "⛈️", 99: "⛈️",
  };
  async function loadWeather() {
    try {
      let lat, lon, label;
      const city = (typeof WEATHER_CITY !== "undefined" && WEATHER_CITY) ? WEATHER_CITY : "";
      if (city) {
        const geo = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr`
        ).then((r) => r.json());
        if (geo.results && geo.results[0]) {
          lat = geo.results[0].latitude;
          lon = geo.results[0].longitude;
          label = geo.results[0].name;
        }
      }
      if (lat == null) {
        // fallback Paris
        lat = 48.8566; lon = 2.3522; label = "Paris";
      }
      const w = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
      ).then((r) => r.json());
      const t = Math.round(w.current.temperature_2m);
      const code = w.current.weather_code;
      document.getElementById("weatherTemp").textContent = t + "°";
      document.getElementById("weatherIcon").textContent = WMO[code] || "🌡️";
      document.getElementById("weatherCity").textContent = label || "";
    } catch (e) {
      document.getElementById("weatherCity").textContent = "météo indispo";
    }
  }
  loadWeather();
  setInterval(loadWeather, 1000 * 60 * 30);

  /* =================================================================
     NOTES PARTAGÉES
     ================================================================= */
  const notesStore = store("notes");
  const notesEl = document.getElementById("notes");
  const notesStatus = document.getElementById("notesStatus");
  let notesTimer = null;
  let notesLocalEdit = false;

  notesStore.onValue((val) => {
    if (notesLocalEdit) return; // ne pas écraser pendant la frappe
    notesEl.value = (val && val.text) || "";
  });

  notesEl.addEventListener("input", () => {
    notesLocalEdit = true;
    notesStatus.textContent = "enregistrement…";
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      notesStore.set({ text: notesEl.value, ts: Date.now() });
      notesStatus.textContent = "enregistré ✓";
      notesLocalEdit = false;
      setTimeout(() => (notesStatus.textContent = ""), 1500);
    }, 600);
  });

  /* =================================================================
     BOOKMARKS PARTAGÉS
     ================================================================= */
  const bmStore = store("bookmarks");
  const bmEl = document.getElementById("bookmarks");

  bmStore.onValue((val) => {
    bmEl.innerHTML = "";
    if (!val) return;
    Object.keys(val).forEach((key) => {
      const b = val[key];
      const a = document.createElement("a");
      a.className = "bookmark";
      a.href = b.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      let host = "";
      try { host = new URL(b.url).hostname; } catch (e) {}
      const fav = document.createElement("img");
      fav.src = `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
      fav.alt = "";
      const span = document.createElement("span");
      span.textContent = b.title || host;
      const del = document.createElement("button");
      del.className = "del";
      del.textContent = "×";
      del.title = "Supprimer";
      del.addEventListener("click", (e) => {
        e.preventDefault();
        bmStore.remove(key);
      });
      a.appendChild(fav);
      a.appendChild(span);
      a.appendChild(del);
      bmEl.appendChild(a);
    });
  });

  document.getElementById("addBookmarkBtn").addEventListener("click", () => {
    const url = prompt("URL du lien (ex. https://exemple.com) :");
    if (!url) return;
    const fullUrl = /^https?:\/\//i.test(url) ? url : "https://" + url;
    const title = prompt("Nom du lien :", "");
    bmStore.push({ url: fullUrl, title: title || "" });
  });

  /* =================================================================
     AGENDA (FullCalendar) PARTAGÉ
     ================================================================= */
  const evStore = store("events");
  let suppressReload = false; // évite le clignotement après une modif locale

  const calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    locale: "fr",
    firstDay: 1,
    initialView: "dayGridMonth",
    height: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },
    buttonText: { today: "aujourd'hui", month: "mois", week: "semaine", day: "jour", list: "liste" },
    selectable: true,
    editable: true,
    nowIndicator: true,
    dayMaxEvents: true,

    // Créer un créneau en sélectionnant une plage
    select: function (info) {
      const title = prompt("Titre du créneau :");
      if (title) {
        evStore.push({
          title: title,
          start: info.startStr,
          end: info.endStr,
          allDay: info.allDay,
        });
      }
      calendar.unselect();
    },

    // Cliquer un créneau : renommer ou supprimer
    eventClick: function (info) {
      const choice = prompt(
        `Modifier "${info.event.title}"\n\n` +
        `→ Tape un nouveau titre pour renommer\n` +
        `→ Tape SUPPR pour supprimer\n` +
        `→ Laisse vide pour annuler`,
        info.event.title
      );
      if (choice === null || choice.trim() === "") return;
      const key = info.event.id;
      if (choice.trim().toUpperCase() === "SUPPR") {
        suppressReload = true;
        evStore.remove(key);
      } else {
        suppressReload = true;
        evStore.update(key, { title: choice.trim() });
      }
    },

    // Déplacer un créneau
    eventDrop: function (info) {
      suppressReload = true;
      evStore.update(info.event.id, {
        start: info.event.startStr,
        end: info.event.endStr ? info.event.endStr : null,
        allDay: info.event.allDay,
      });
    },

    // Redimensionner un créneau
    eventResize: function (info) {
      suppressReload = true;
      evStore.update(info.event.id, {
        start: info.event.startStr,
        end: info.event.endStr ? info.event.endStr : null,
      });
    },
  });

  calendar.render();

  // Charger / recharger les créneaux à chaque changement distant
  evStore.onValue((val) => {
    calendar.removeAllEvents();
    if (val) {
      Object.keys(val).forEach((key) => {
        const e = val[key];
        calendar.addEvent({
          id: key,
          title: e.title,
          start: e.start,
          end: e.end || undefined,
          allDay: !!e.allDay,
        });
      });
    }
    suppressReload = false;
  });
})();
