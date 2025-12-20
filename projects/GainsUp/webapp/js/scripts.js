// ============================================
// CONFIG
// ============================================
const baseApiAddress = "https://www.sofianeennali-odisee.be/wm/perso/GainsUp/api/";
const alertContainer = document.getElementById("alert");

let registerModal = null;

// ============================================
// HELPERS
// ============================================
function alerter(message, type = "info") {
    alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

// ============================================
// LOGIN
// ============================================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        alerter("❌ Username et mot de passe sont obligatoires", "danger");
        return;
    }

    try {
        const res = await fetch(baseApiAddress + "login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        // Si PHP renvoie du HTML (error), ça va throw ici -> catch
        const data = await res.json();

        // Ton API renvoie: { status: 200, data: {...} } ou { status: 401, data: "..." }
        if (!res.ok || data.status !== 200) {
            alerter(data.data || "Login échoué", "danger");
            return;
        }

        // ✅ login OK
        // data.data = { user_id, username }
        localStorage.setItem("user", JSON.stringify(data.data));

        // ✅ IMPORTANT : compat avec ton menu existant (sélection utilisateur)
        localStorage.setItem("selectedUserId", String(data.data.user_id));
        localStorage.setItem("selectedUsername", data.data.username);

        window.location.href = "menu.html";
    } catch (err) {
        console.error(err);
        alerter("Erreur serveur (API ou JSON invalide)", "danger");
    }
});

// ============================================
// REGISTER (MODAL)
// ============================================
document.getElementById("btnOpenRegister").addEventListener("click", () => {
    if (registerModal) registerModal.show();
});

document.getElementById("btnRegister").addEventListener("click", async () => {
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!username || !password) {
        alerter("❌ Tous les champs sont obligatoires", "danger");
        return;
    }

    try {
        const res = await fetch(baseApiAddress + "users.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok || (data.status !== 200 && data.status !== 201)) {
            alerter(data.message || data.data || "Création échouée", "danger");
            return;
        }

        alerter(`✅ Compte "${username}" créé avec succès`, "success");

        // reset inputs
        document.getElementById("registerUsername").value = "";
        document.getElementById("registerPassword").value = "";

        // close modal
        if (registerModal) registerModal.hide();
    } catch (err) {
        console.error(err);
        alerter("Erreur serveur (register)", "danger");
    }
});

// ============================================
// TOGGLE PASSWORD (LOGIN)
// ============================================
document.getElementById("togglePassword").addEventListener("click", () => {
    const pwInput = document.getElementById("loginPassword");
    const btn = document.getElementById("togglePassword");

    const isHidden = pwInput.type === "password";
    pwInput.type = isHidden ? "text" : "password";
    btn.textContent = isHidden ? "🙈" : "👁️";
});

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const modalEl = document.getElementById("registerModal");
    if (modalEl) registerModal = new bootstrap.Modal(modalEl);

    // (Optionnel) si déjà connecté -> direct menu
    const user = localStorage.getItem("user");
    if (user) window.location.href = "menu.html";
});
