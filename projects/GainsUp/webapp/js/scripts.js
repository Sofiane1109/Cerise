// ============================================
// scripts.js - LOGIN + REGISTER (GainsUp)
// ============================================

const baseApiAddress = "https://sofianeennali-odisee.be/wm/perso/GainsUp/api/";
const alertContainer = document.getElementById("alert");

let registerModal = null;

// --------------------------------------------
// Helpers
// --------------------------------------------

function alerter(message, type = "info") {
  if (!alertContainer) return;

  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function clearAlert() {
  if (alertContainer) alertContainer.innerHTML = "";
}

/**
 * Fetch JSON helper:
 * - probeerde JSON te parsen
 * - als server HTML / warnings terugstuurt → nette error
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);

  const raw = await res.text(); // eerst text lezen om HTML/warnings te detecteren
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {
    // Geen JSON (vaak PHP warning/fatal in HTML)
    throw new Error(
      "Server gaf geen geldige JSON terug. Check je PHP (warnings/fatal errors). Response begon met: " +
        raw.slice(0, 120)
    );
  }

  return { res, data };
}

/**
 * Normaliseert je API response, want sommige projecten gebruiken:
 * - {status, data}
 * - {status, message, user}
 * - {code, status, data}
 */
function getApiStatus(payload) {
  return payload?.status ?? payload?.code ?? 0;
}

function getApiMessage(payload) {
  return payload?.message ?? payload?.data ?? "Onbekende fout";
}

function getUserFromPayload(payload) {
  // meestal { data: {user_id, username} }
  if (payload?.data && typeof payload.data === "object") return payload.data;

  // soms { user: {...} }
  if (payload?.user && typeof payload.user === "object") return payload.user;

  return null;
}

/**
 * Toggle password helper (button + input)
 */
function setupTogglePassword(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";

    // Je kan icons gebruiken via textContent of class toggles
    // Hier: wissel oog/gesloten oog (emoji of jouw icon)
    btn.textContent = isHidden ? "🙈" : "👁️";
  });
}

// --------------------------------------------
// LOGIN
// --------------------------------------------
async function handleLoginSubmit(e) {
  e.preventDefault();
  clearAlert();

  const username = document.getElementById("loginUsername")?.value?.trim() || "";
  const password = document.getElementById("loginPassword")?.value || "";

  if (!username || !password) {
    alerter("❌ Username en password zijn verplicht", "danger");
    return;
  }

  try {
    const { res, data } = await fetchJson(baseApiAddress + "login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const status = getApiStatus(data);

    // Sommige scripts zetten res.ok, andere kijken naar status
    const ok = res.ok && status === 200;

    if (!ok) {
      alerter("❌ " + getApiMessage(data), "danger");
      return;
    }

    const user = getUserFromPayload(data);

    // user bewaren
    localStorage.setItem("user", JSON.stringify(user || { username }));

    // naar menu
    window.location.href = "menu.html";
  } catch (err) {
    console.error(err);
    alerter("⚠️ Erreur serveur: " + err.message, "danger");
  }
}

// --------------------------------------------
// REGISTER
// --------------------------------------------
function openRegisterModal() {
  clearAlert();
  if (!registerModal) return;

  // optioneel: form resetten
  const ru = document.getElementById("registerUsername");
  const rp = document.getElementById("registerPassword");
  if (ru) ru.value = "";
  if (rp) rp.value = "";

  registerModal.show();
}

async function handleRegisterSubmit() {
  clearAlert();

  const username = document.getElementById("registerUsername")?.value?.trim() || "";
  const password = document.getElementById("registerPassword")?.value || "";

  if (!username || !password) {
    alerter("❌ Tous les champs sont obligatoires", "danger");
    return;
  }

  try {
    const { res, data } = await fetchJson(baseApiAddress + "users.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const status = getApiStatus(data);

    // users.php kan 200 of 201 teruggeven
    const ok = res.ok && (status === 200 || status === 201);

    if (!ok) {
      alerter("❌ " + getApiMessage(data), "danger");
      return;
    }

    alerter(`✅ Compte "${username}" créé avec succès`, "success");
    registerModal?.hide();

    // (optioneel) username alvast invullen in login
    const loginU = document.getElementById("loginUsername");
    const loginP = document.getElementById("loginPassword");
    if (loginU) loginU.value = username;
    if (loginP) loginP.value = "";
  } catch (err) {
    console.error(err);
    alerter("⚠️ Erreur serveur: " + err.message, "danger");
  }
}

// --------------------------------------------
// INIT
// --------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Modal init
  const modalEl = document.getElementById("registerModal");
  if (modalEl && window.bootstrap?.Modal) {
    registerModal = new bootstrap.Modal(modalEl);
  }

  // Events
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLoginSubmit);

  const btnOpenRegister = document.getElementById("btnOpenRegister");
  if (btnOpenRegister) btnOpenRegister.addEventListener("click", openRegisterModal);

  const btnRegister = document.getElementById("btnRegister");
  if (btnRegister) btnRegister.addEventListener("click", handleRegisterSubmit);

  // Toggle password buttons
  setupTogglePassword("togglePassword", "loginPassword");
  setupTogglePassword("toggleRegisterPassword", "registerPassword");
});
