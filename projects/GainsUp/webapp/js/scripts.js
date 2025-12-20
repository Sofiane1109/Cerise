// ============================================
// CONFIG
// ============================================
const baseApiAddress = "https://sofianeennali-odisee.be/wm/perso/GainsUp/api/";
const alertContainer = document.getElementById("alert");

let registerModal;

// ============================================
// HELPERS
// ============================================
function alerter(message, type = "info") {
    if (!alertContainer) return;

    alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

// Normalise la réponse API pour récupérer l'utilisateur
function extractUserFromResponse(data) {
    // ton API retourne souvent {status:200, data:{user_id, username}}
    if (data && data.data && typeof data.data === "object") return data.data;

    // parfois {status:200, user:{...}}
    if (data && data.user && typeof data.user === "object") return data.user;

    return null;
}

function saveUserSession(user) {
    // Stockage principal
    localStorage.setItem("user", JSON.stringify(user));

    // Compatibilité avec ton ancien code menu.js
    if (user.user_id != null) localStorage.setItem("selectedUserId", String(user.user_id));
    if (user.username != null) localStorage.setItem("selectedUsername", String(user.username));
}

// ============================================
// AUTO-REDIRECT (rester connecté)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    // Init modal register
    const modalEl = document.getElementById("registerModal");
    if (modalEl) registerModal = new bootstrap.Modal(modalEl);

    // Si déjà connecté -> menu direct
    const existing = localStorage.getItem("user");
    if (existing) {
        // Optionnel: tu peux vérifier ici la validité côté serveur si tu avais un token.
        window.location.href = "menu.html";
        return;
    }
});

// ============================================
// LOGIN
// ============================================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("loginUsername")?.value.trim();
        const password = document.getElementById("loginPassword")?.value;

        if (!username || !password) {
            alerter("❌ Username et mot de passe requis", "danger");
            return;
        }

        try {
            const res = await fetch(baseApiAddress + "login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data) {
                alerter("❌ Login échoué", "danger");
                return;
            }

            const user = extractUserFromResponse(data);
            if (!user || user.user_id == null || !user.username) {
                console.log("Réponse login inattendue:", data);
                alerter("❌ Réponse serveur invalide (user manquant)", "danger");
                return;
            }

            // ✅ Sauver session (rester connecté + compat ancienne logique)
            saveUserSession(user);

            // ✅ Redirect
            window.location.href = "menu.html";
        } catch (err) {
            console.error(err);
            alerter("⚠️ Erreur serveur", "danger");
        }
    });
}

// ============================================
// REGISTER
// ============================================
const btnOpenRegister = document.getElementById("btnOpenRegister");
if (btnOpenRegister) {
    btnOpenRegister.addEventListener("click", () => {
        if (registerModal) registerModal.show();
    });
}

const btnRegister = document.getElementById("btnRegister");
if (btnRegister) {
    btnRegister.addEventListener("click", async () => {
        const username = document.getElementById("registerUsername")?.value.trim();
        const password = document.getElementById("registerPassword")?.value;

        if (!username || !password) {
            alerter("❌ Tous les champs sont obligatoires", "danger");
            return;
        }

        try {
            const res = await fetch(baseApiAddress + "users.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                alerter((data && (data.message || data.data)) || "❌ Création échouée", "danger");
                return;
            }

            alerter("✅ Compte créé avec succès. Vous pouvez vous connecter.", "success");

            // reset champs + fermer modal
            const ru = document.getElementById("registerUsername");
            const rp = document.getElementById("registerPassword");
            if (ru) ru.value = "";
            if (rp) rp.value = "";
            if (registerModal) registerModal.hide();
        } catch (err) {
            console.error(err);
            alerter("⚠️ Erreur serveur", "danger");
        }
    });
}

// ============================================
// TOGGLE PASSWORD VISIBILITY (login)
// ============================================
const togglePasswordBtn = document.getElementById("togglePassword");
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
        const pwInput = document.getElementById("loginPassword");
        if (!pwInput) return;

        if (pwInput.type === "password") {
            pwInput.type = "text";
            togglePasswordBtn.textContent = "🙈";
        } else {
            pwInput.type = "password";
            togglePasswordBtn.textContent = "👁️";
        }
    });
}
