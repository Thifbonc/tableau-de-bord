/* =================================================================
   Page Veille — liste d'articles/liens partagés (Firebase + fallback local)
   ================================================================= */
(function () {
  "use strict";

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
  if (!firebaseReady) {
    banner.innerHTML =
      "⚠️ Mode local (non partagé). Renseigne tes clés dans <strong>config.js</strong> pour partager la veille.";
    banner.classList.remove("hidden");
  }

  // ----- Stockage (même API, fallback localStorage) -----
  function store(path) {
    if (firebaseReady) {
      const ref = db.ref(path);
      return {
        onValue: (cb) => ref.on("value", (snap) => cb(snap.val())),
        push: (val) => ref.push(val).key,
        update: (key, val) => ref.child(key).update(val),
        remove: (key) => ref.child(key).remove(),
      };
    }
    const read = () => JSON.parse(localStorage.getItem("dash_" + path) || "null");
    const write = (v) => localStorage.setItem("dash_" + path, JSON.stringify(v));
    let listener = null;
    const fire = () => listener && listener(read());
    window.addEventListener("storage", (e) => { if (e.key === "dash_" + path) fire(); });
    return {
      onValue: (cb) => { listener = cb; fire(); },
      push: (val) => {
        const all = read() || {};
        const key = "id" + Date.now() + Math.random().toString(36).slice(2, 7);
        all[key] = val; write(all); fire(); return key;
      },
      update: (key, val) => {
        const all = read() || {};
        all[key] = Object.assign({}, all[key], val); write(all); fire();
      },
      remove: (key) => { const all = read() || {}; delete all[key]; write(all); fire(); },
    };
  }

  const vStore = store("veille");
  const grid = document.getElementById("veilleGrid");

  // ----- Catégories (calques) -----
  const VEILLE_CATS = [
    { id: "intl",    label: "Médias internationaux", icon: "🌍", color: "#6c8cff" },
    { id: "afrique", label: "Médias africains",      icon: "🌍", color: "#f0a35e" },
    { id: "reseaux", label: "Réseaux sociaux",       icon: "💬", color: "#4dd6c1" },
  ];
  const catOf = (id) => VEILLE_CATS.find((c) => c.id === id) || VEILLE_CATS[0];

  // ----- Modal -----
  const modal = document.getElementById("veilleModal");
  const elTitle = document.getElementById("vTitle");
  const elUrl = document.getElementById("vUrl");
  const elNote = document.getElementById("vNote");
  const elDelete = document.getElementById("vDelete");
  const catRow = document.getElementById("vCatRow");
  let editingKey = null;
  let selectedCat = "intl";

  VEILLE_CATS.forEach((c) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "cat-chip";
    chip.dataset.cat = c.id;
    chip.style.color = c.color;
    chip.innerHTML = `<span class="dot" style="background:${c.color}"></span><span style="color:var(--text)">${c.label}</span>`;
    chip.addEventListener("click", () => selectCat(c.id));
    catRow.appendChild(chip);
  });
  function selectCat(id) {
    selectedCat = id;
    catRow.querySelectorAll(".cat-chip").forEach((ch) => {
      ch.classList.toggle("active", ch.dataset.cat === id);
    });
  }

  function openModal(item) {
    editingKey = (item && item.key) || null;
    document.getElementById("vModalTitle").textContent = editingKey ? "Modifier l'article" : "Nouvel article";
    elTitle.value = (item && item.title) || "";
    elUrl.value = (item && item.url) || "";
    elNote.value = (item && item.note) || "";
    selectCat((item && item.category) || "intl");
    elDelete.classList.toggle("hidden", !editingKey);
    modal.classList.remove("hidden");
    setTimeout(() => elTitle.focus(), 50);
  }
  function closeModal() { modal.classList.add("hidden"); }

  document.getElementById("addVeilleBtn").addEventListener("click", () => openModal(null));
  document.getElementById("vModalClose").addEventListener("click", closeModal);
  document.getElementById("vCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });

  document.getElementById("vSave").addEventListener("click", () => {
    const title = elTitle.value.trim();
    let url = elUrl.value.trim();
    if (!title) { elTitle.focus(); return; }
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
    const data = { title, url, note: elNote.value.trim(), category: selectedCat, ts: Date.now() };
    if (editingKey) vStore.update(editingKey, data);
    else vStore.push(data);
    closeModal();
  });

  elDelete.addEventListener("click", () => {
    if (editingKey) vStore.remove(editingKey);
    closeModal();
  });

  // Construit une carte d'article
  function buildCard(key, it) {
    let host = "";
    try { host = it.url ? new URL(it.url).hostname.replace(/^www\./, "") : ""; } catch (e) {}

    const card = document.createElement("div");
    card.className = "veille-card";
    card.style.borderTopColor = catOf(it.category).color;

    const head = document.createElement("div");
    head.className = "vc-head";
    const fav = document.createElement("img");
    fav.className = "vc-fav";
    fav.src = host ? `https://www.google.com/s2/favicons?domain=${host}&sz=32` : "";
    fav.alt = "";
    const h = document.createElement("h3");
    h.textContent = it.title || host || "Sans titre";
    head.appendChild(fav);
    head.appendChild(h);
    card.appendChild(head);

    if (it.note) {
      const note = document.createElement("p");
      note.className = "vc-note";
      note.textContent = it.note;
      card.appendChild(note);
    }

    const foot = document.createElement("div");
    foot.className = "vc-foot";
    if (it.url) {
      const a = document.createElement("a");
      a.href = it.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.className = "vc-open";
      a.textContent = (host || "Ouvrir le lien") + " ↗";
      foot.appendChild(a);
    } else {
      const span = document.createElement("span");
      span.className = "hint";
      span.textContent = "Pas de lien";
      foot.appendChild(span);
    }
    const edit = document.createElement("button");
    edit.className = "vc-edit";
    edit.textContent = "Modifier";
    edit.addEventListener("click", () =>
      openModal({ key, title: it.title, url: it.url, note: it.note, category: it.category }));
    foot.appendChild(edit);

    card.appendChild(foot);
    return card;
  }

  // ----- Rendu groupé par catégorie (calques) -----
  vStore.onValue((val) => {
    grid.innerHTML = "";
    const items = val || {};
    const keys = Object.keys(items).sort((a, b) => (items[b].ts || 0) - (items[a].ts || 0));

    VEILLE_CATS.forEach((cat) => {
      const section = document.createElement("section");
      section.className = "veille-section";

      const title = document.createElement("h2");
      title.className = "veille-section-title";
      title.innerHTML =
        `<span class="vs-dot" style="background:${cat.color}"></span>` +
        `${cat.icon} ${cat.label}`;
      section.appendChild(title);

      const catKeys = keys.filter((k) => (items[k].category || "intl") === cat.id);
      if (catKeys.length === 0) {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = "Aucun article — clique sur « + Ajouter un article » et choisis cette catégorie.";
        section.appendChild(empty);
      } else {
        const cards = document.createElement("div");
        cards.className = "veille-grid";
        catKeys.forEach((k) => cards.appendChild(buildCard(k, items[k])));
        section.appendChild(cards);
      }
      grid.appendChild(section);
    });
  });
})();
