// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const alertContainer = document.getElementById('alert');

let registerModal = null;

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

function saveLoggedUser(userObj) {
    // userObj doit contenir user_id et username
    localStorage.setItem("user", JSON.stringify(userObj));
    localStorage.setItem("selectedUserId", String(userObj.user_id));
    localStorage.setItem("selectedUsername", String(userObj.username));
}

// Si l’API renvoie parfois {status, data:{...}} ou {status, user:{...}}
function extractUserFromApiResponse(payload) {
    if (!payload) return null;

    // cas 1 : { status:200, data:{ user_id, username } }
    if (payload.data && typeof payload.data === "object" && payload.data.user_id) {
        return payload.data;
    }

    // cas 2 : { status:200, user:{ user_id, username } }
    if (payload.user && typeof payload.user === "object" && payload.user.user_id) {
        return payload.user;
    }

    return null;
}

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
            alerter("❌ Username et mot de passe obligatoires", "danger");
            return;
        }

        try {
            const res = await fetch(baseApiAddress + "login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            // Attention: si ton PHP renvoie une erreur HTML, res.json() va crash
            const text = await res.text();
            let payload = null;

            try {
                payload = JSON.parse(text);
            } catch {
                console.error("Réponse non JSON:", text);
                alerter("❌ Réponse serveur invalide (pas du JSON).", "danger");
                return;
            }

            if (!res.ok || payload.status !== 200) {
                alerter(payload.data || payload.message || "Login échoué", "danger");
                return;
            }

            const user = extractUserFromApiResponse(payload);

            if (!user) {
                console.error("Payload reçu:", payload);
                alerter("❌ Login OK mais format utilisateur invalide.", "danger");
                return;
            }

            // ✅ on sauvegarde exactement ce que menu.js attend
            saveLoggedUser(user);

            // ✅ go menu
            window.location.href = "menu.html";
        } catch (err) {
            console.error(err);
            alerter("Erreur serveur", "danger");
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
            alerter("Tous les champs sont obligatoires", "danger");
            return;
        }

        try {
            const res = await fetch(baseApiAddress + "users.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const text = await res.text();
            let payload = null;

            try {
                payload = JSON.parse(text);
            } catch {
                console.error("Réponse non JSON:", text);
                alerter("❌ Réponse serveur invalide (pas du JSON).", "danger");
                return;
            }

            if (!res.ok || (payload.status !== 200 && payload.status !== 201)) {
                alerter(payload.message || payload.data || "Création échouée", "danger");
                return;
            }

            alerter("✅ Compte créé avec succès", "success");
            if (registerModal) registerModal.hide();

            // optionnel: préremplir le login
            const loginUsername = document.getElementById("loginUsername");
            const loginPassword = document.getElementById("loginPassword");
            if (loginUsername) loginUsername.value = username;
            if (loginPassword) loginPassword.value = password;
        } catch (err) {
            console.error(err);
            alerter("Erreur serveur", "danger");
        }
    });
}

// ============================================
// TOGGLE PASSWORD VISIBILITY (LOGIN)
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

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const registerModalEl = document.getElementById("registerModal");
    if (registerModalEl && window.bootstrap) {
        registerModal = new bootstrap.Modal(registerModalEl);
    }
});
