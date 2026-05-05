const accounts = [
  { username: "Gert van Huizen", password: "Wonen2025!" },
  { username: "Jurgen Rosens", password: "Vergader2025#" },
  { username: "Urban Monnikhof", password: "Agenda2025*" }
];

function loadAgenda(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    return fallback;
  } catch (error) {
    return fallback;
  }
}

let residentAgenda = loadAgenda("residentAgenda", defaultResidentAgenda);
let boardAgenda = loadAgenda("boardAgenda", defaultBoardAgenda);

const residentAgendaList = document.getElementById("residentAgendaList");
const boardAgendaPublicList = document.getElementById("boardAgendaPublicList");
const boardAgendaAdminList = document.getElementById("boardAgendaAdminList");
const residentAgendaAdminList = document.getElementById("residentAgendaAdminList");
const residentSearch = document.getElementById("residentSearch");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginIntroText = document.getElementById("loginIntroText");
const adminPanel = document.getElementById("adminPanel");
const loggedInUser = document.getElementById("loggedInUser");
const logoutBtn = document.getElementById("logoutBtn");

const agendaForm = document.getElementById("agendaForm");
const adminMessage = document.getElementById("adminMessage");

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function saveResidentAgenda() {
  localStorage.setItem("residentAgenda", JSON.stringify(residentAgenda));
}

function saveBoardAgenda() {
  localStorage.setItem("boardAgenda", JSON.stringify(boardAgenda));
}

function sortAgenda(items) {
  return [...items].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });
}

function setMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = `message ${type}`;
}

function clearMessage(element) {
  if (!element) return;
  element.textContent = "";
  element.className = "message";
}

function setLoggedInUser(username) {
  localStorage.setItem("loggedInBoardUser", username);
}

function getLoggedInUser() {
  return localStorage.getItem("loggedInBoardUser");
}

function clearLoggedInUser() {
  localStorage.removeItem("loggedInBoardUser");
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Afbeelding kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}

/* ===== Scroll animaties: alleen omhoog ===== */

function setupScrollAnimations() {
  const elements = document.querySelectorAll(
    ".hero-copy, .hero-card, .about-copy, .product-card, .product-image, .team-mini, .agenda-item, .section-tag, .panel, .process-banner, .process-copy, .tech-grid article, .about-grid, .product-grid"
  );

  elements.forEach((element, index) => {
    element.classList.remove("scroll-visible");
    element.classList.add("scroll-hidden");
    element.style.transitionDelay = `${Math.min(index * 50, 250)}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  elements.forEach((element) => observer.observe(element));
}

function setupAgendaCardAnimations(container) {
  if (!container) return;

  const items = container.querySelectorAll(".agenda-item, .agenda-empty");

  items.forEach((item, index) => {
    item.classList.remove("scroll-visible");
    item.classList.add("scroll-hidden");
    item.style.transitionDelay = `${Math.min(index * 80, 300)}ms`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -30px 0px"
    }
  );

  items.forEach((item) => observer.observe(item));
}

function createAgendaItem(item, options = {}) {
  const {
    showDelete = false,
    deleteHandler = null,
    agendaType = "resident"
  } = options;

  const wrapper = document.createElement("article");
  wrapper.className = item.image ? "agenda-item has-image" : "agenda-item";

  const agendaBadge =
    agendaType === "board"
      ? `
        <div class="agenda-badge board">
          <i class="fa-solid fa-users-gear"></i>
          <span>Bestuur</span>
        </div>
      `
      : `
        <div class="agenda-badge resident">
          <i class="fa-solid fa-house"></i>
          <span>Bewoners</span>
        </div>
      `;

  wrapper.innerHTML = `
    ${item.image ? `<img src="${item.image}" alt="${item.title}" class="agenda-image" />` : ""}
    <div class="agenda-item-content">
      ${agendaBadge}
      <h4>${item.title}</h4>
      <div class="agenda-meta">
        <span class="meta-chip">
          <i class="fa-regular fa-calendar"></i>
          ${formatDate(item.date)}
        </span>
        <span class="meta-chip">
          <i class="fa-regular fa-clock"></i>
          ${item.time}
        </span>
        <span class="meta-chip">
          <i class="fa-solid fa-location-dot"></i>
          ${item.location}
        </span>
      </div>
      <p>${item.description}</p>
    </div>
  `;

  if (showDelete && deleteHandler) {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.type = "button";
    deleteBtn.innerHTML = `
      <i class="fa-regular fa-trash-can"></i>
      <span>Verwijderen</span>
    `;
    deleteBtn.addEventListener("click", deleteHandler);
    wrapper.querySelector(".agenda-item-content").appendChild(deleteBtn);
  }

  return wrapper;
}

function renderResidentAgenda(filterText = "") {
  if (!residentAgendaList) return;

  residentAgendaList.innerHTML = "";

  const filteredAgenda = sortAgenda(residentAgenda).filter((item) => {
    const combinedText = `${item.title} ${item.location} ${item.description}`.toLowerCase();
    return combinedText.includes(filterText.toLowerCase());
  });

  if (filteredAgenda.length === 0) {
    residentAgendaList.innerHTML = `
      <div class="agenda-empty">
        <i class="fa-regular fa-calendar-xmark"></i>
        <p>Geen resultaten gevonden in de bewonersagenda.</p>
      </div>
    `;
    setupAgendaCardAnimations(residentAgendaList);
    return;
  }

  filteredAgenda.forEach((item) => {
    residentAgendaList.appendChild(
      createAgendaItem(item, { agendaType: "resident" })
    );
  });

  setupAgendaCardAnimations(residentAgendaList);
}

function renderBoardAgenda() {
  if (!boardAgendaPublicList || !boardAgendaAdminList) return;

  boardAgendaPublicList.innerHTML = "";
  boardAgendaAdminList.innerHTML = "";

  const sortedAgenda = sortAgenda(boardAgenda);

  if (sortedAgenda.length === 0) {
    const emptyHtml = `
      <div class="agenda-empty">
        <i class="fa-regular fa-calendar-xmark"></i>
        <p>Er staan nog geen items in de bestuursagenda.</p>
      </div>
    `;
    boardAgendaPublicList.innerHTML = emptyHtml;
    boardAgendaAdminList.innerHTML = emptyHtml;
    setupAgendaCardAnimations(boardAgendaPublicList);
    setupAgendaCardAnimations(boardAgendaAdminList);
    return;
  }

  sortedAgenda.forEach((item) => {
    boardAgendaPublicList.appendChild(
      createAgendaItem(item, { agendaType: "board" })
    );

    boardAgendaAdminList.appendChild(
      createAgendaItem(item, {
        agendaType: "board",
        showDelete: true,
        deleteHandler: () => {
          boardAgenda = boardAgenda.filter((agendaItem) => agendaItem.id !== item.id);
          saveBoardAgenda();
          renderBoardAgenda();
          setMessage(adminMessage, "Agendapunt uit bestuursagenda verwijderd.", "success");
        }
      })
    );
  });

  setupAgendaCardAnimations(boardAgendaPublicList);
  setupAgendaCardAnimations(boardAgendaAdminList);
}

function renderResidentAgendaAdmin() {
  if (!residentAgendaAdminList) return;

  residentAgendaAdminList.innerHTML = "";
  const sortedAgenda = sortAgenda(residentAgenda);

  if (sortedAgenda.length === 0) {
    residentAgendaAdminList.innerHTML = `
      <div class="agenda-empty">
        <i class="fa-regular fa-calendar-xmark"></i>
        <p>Er staan nog geen items in de bewonersagenda.</p>
      </div>
    `;
    setupAgendaCardAnimations(residentAgendaAdminList);
    return;
  }

  sortedAgenda.forEach((item) => {
    residentAgendaAdminList.appendChild(
      createAgendaItem(item, {
        agendaType: "resident",
        showDelete: true,
        deleteHandler: () => {
          residentAgenda = residentAgenda.filter((agendaItem) => agendaItem.id !== item.id);
          saveResidentAgenda();
          renderResidentAgenda(residentSearch ? residentSearch.value : "");
          renderResidentAgendaAdmin();
          setMessage(adminMessage, "Agendapunt uit bewonersagenda verwijderd.", "success");
        }
      })
    );
  });

  setupAgendaCardAnimations(residentAgendaAdminList);
}

function updateAdminView() {
  const currentUser = getLoggedInUser();

  if (currentUser) {
    if (adminPanel) adminPanel.classList.remove("hidden");
    if (loggedInUser) loggedInUser.textContent = currentUser;
    if (loginIntroText) {
      loginIntroText.textContent = "U bent ingelogd. U kunt hieronder de agenda's beheren.";
    }
  } else {
    if (adminPanel) adminPanel.classList.add("hidden");
    if (loggedInUser) loggedInUser.textContent = "";
    if (loginIntroText) {
      loginIntroText.textContent = "Gebruik een van de demo-accounts om toegang te krijgen tot het beheer.";
    }
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage(loginMessage);

    const username = document.getElementById("username")?.value.trim() || "";
    const password = document.getElementById("password")?.value.trim() || "";

    const validUser = accounts.find(
      (account) => account.username === username && account.password === password
    );

    if (!validUser) {
      setMessage(loginMessage, "Onjuiste gebruikersnaam of wachtwoord.", "error");
      return;
    }

    setLoggedInUser(validUser.username);
    setMessage(loginMessage, `Succesvol ingelogd als ${validUser.username}.`, "success");
    updateAdminView();
    renderResidentAgendaAdmin();
    renderBoardAgenda();
    loginForm.reset();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    clearLoggedInUser();
    clearMessage(adminMessage);
    setMessage(loginMessage, "U bent uitgelogd.", "success");
    updateAdminView();
  });
}

if (agendaForm) {
  agendaForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!getLoggedInUser()) {
      setMessage(adminMessage, "Log eerst in om wijzigingen toe te passen.", "error");
      return;
    }

    const agendaType = document.getElementById("agendaType")?.value || "";
    const title = document.getElementById("eventTitle")?.value.trim() || "";
    const date = document.getElementById("eventDate")?.value || "";
    const time = document.getElementById("eventTime")?.value || "";
    const location = document.getElementById("eventLocation")?.value.trim() || "";
    const description = document.getElementById("eventDescription")?.value.trim() || "";
    const imageFile = document.getElementById("eventImageFile")?.files?.[0];

    if (!title || !date || !time || !location || !description) {
      setMessage(adminMessage, "Vul alle velden volledig in.", "error");
      return;
    }

    let image = "";

    try {
      if (imageFile) {
        image = await readImageFile(imageFile);
      }
    } catch (error) {
      setMessage(adminMessage, "De afbeelding kon niet worden toegevoegd.", "error");
      return;
    }

    const newItem = {
      id: crypto.randomUUID(),
      title,
      date,
      time,
      location,
      description,
      image
    };

    if (agendaType === "resident") {
      residentAgenda.push(newItem);
      saveResidentAgenda();
      renderResidentAgenda(residentSearch ? residentSearch.value : "");
      renderResidentAgendaAdmin();
      setMessage(adminMessage, "Agendapunt succesvol toegevoegd aan de bewonersagenda.", "success");
    } else {
      boardAgenda.push(newItem);
      saveBoardAgenda();
      renderBoardAgenda();
      setMessage(adminMessage, "Agendapunt succesvol toegevoegd aan de bestuursagenda.", "success");
    }

    agendaForm.reset();
  });
}

if (residentSearch) {
  residentSearch.addEventListener("input", (event) => {
    renderResidentAgenda(event.target.value);
  });
}

/* MOBIELE NAVIGATIE */
if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
    menuToggle.classList.toggle("is-open");

    const isOpen = mobileNav.classList.contains("open");
    menuToggle.setAttribute("aria-label", isOpen ? "Menu sluiten" : "Menu openen");
  });
}

document.querySelectorAll(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav?.classList.remove("open");
    menuToggle?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-label", "Menu openen");
  });
});

renderResidentAgenda();
renderBoardAgenda();
renderResidentAgendaAdmin();
updateAdminView();
setupScrollAnimations();

document.addEventListener("DOMContentLoaded", function () {
  const whatsappButton = document.getElementById("vve-kerkstraat-whatsapp-button");
  const whatsappChat = document.getElementById("vve-kerkstraat-whatsapp-chat");
  const whatsappClose = document.getElementById("vve-kerkstraat-chat-close");
  const whatsappSend = document.getElementById("vve-kerkstraat-chat-send");
  const whatsappInput = document.getElementById("vve-kerkstraat-chat-input");

  const phone = "31622775529";

  if (whatsappButton && whatsappChat) {
    whatsappButton.addEventListener("click", function () {
      whatsappChat.classList.toggle("is-open");
    });
  }

  if (whatsappClose && whatsappChat) {
    whatsappClose.addEventListener("click", function () {
      whatsappChat.classList.remove("is-open");
    });
  }

  function sendMessage() {
    let message = whatsappInput.value.trim();

    if (message === "") {
      message = "Hallo VVE Kerkstraat, ik heb een vraag via de website.";
    }

    const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank");
  }

  if (whatsappSend && whatsappInput) {
    whatsappSend.addEventListener("click", sendMessage);

    whatsappInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    });
  }
});
