// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const alertContainer = document.getElementById('alert');

let registerModal;

// ============================================
// LOGIN
// ============================================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        alerter("Veuillez remplir tous les champs", "danger");
        return;
    }

    try {
        const res = await fetch(baseApiAddress + "login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        // si ton API renvoie parfois du HTML/Warning, on essaie de parser proprement
        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("Réponse non JSON:", text);
            alerter("Erreur serveur (réponse non JSON)", "danger");
            return;
        }

        if (!res.ok || data.status !== 200) {
            alerter(data.data || data.message || "Login échoué", "danger");
            return;
        }

        // ✅ user data (selon ton login.php : { status:200, data:{user_id, username} })
        const user = data.data;

        // 1) nouveau système
        localStorage.setItem("user", JSON.stringify(user));

        // 2) ancien système (menu.js existant)
        localStorage.setItem("selectedUserId", String(user.user_id));
        localStorage.setItem("selectedUsername", user.username);

        // Nettoyage optionnel (évite conflits)
        localStorage.removeItem("activeSessionId");
        localStorage.removeItem("selectedMuscleGroup");
        localStorage.removeItem("selectedExerciseId");
        localStorage.removeItem("selectedExerciseName");

        window.location.href = "menu.html";

    } catch (err) {
        console.error(err);
        alerter("Erreur serveur", "danger");
    }
});

// ============================================
// REGISTER (Créer un compte)
// ============================================
document.getElementById("btnOpenRegister").addEventListener("click", () => {
    registerModal.show();
});

document.getElementById("btnRegister").addEventListener("click", async () => {
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;

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
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            console.error("Réponse non JSON:", text);
            alerter("Erreur serveur (réponse non JSON)", "danger");
            return;
        }

        if (!res.ok || (data.status !== 200 && data.status !== 201)) {
            alerter(data.message || data.data || "Création échouée", "danger");
            return;
        }

        alerter("✅ Compte créé avec succès", "success");
        registerModal.hide();

        // Optionnel: pré-remplir le login
        document.getElementById("loginUsername").value = username;
        document.getElementById("loginPassword").value = password;

    } catch (err) {
        console.error(err);
        alerter("Erreur serveur", "danger");
    }
});

// ============================================
// Toggle password visibility (login)
// ============================================
document.getElementById("togglePassword").addEventListener("click", () => {
    const pwInput = document.getElementById("loginPassword");
    const btn = document.getElementById("togglePassword");

    if (pwInput.type === "password") {
        pwInput.type = "text";
        btn.textContent = "🙈";
    } else {
        pwInput.type = "password";
        btn.textContent = "👁️";
    }
});

// ============================================
// ALERT
// ============================================
function alerter(message, type = "info") {
    alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const modalEl = document.getElementById("registerModal");
    if (modalEl) {
        registerModal = new bootstrap.Modal(modalEl);
    }
});
