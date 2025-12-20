const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const alertContainer = document.getElementById('alert');

let registerModal;

// ==============================
// LOGIN
// ==============================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const res = await fetch(baseApiAddress + "login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alerter(data.data || "Login échoué", "danger");
            return;
        }

        // ✅ login OK
        localStorage.setItem("user", JSON.stringify(data.data));
        window.location.href = "menu.html";

    } catch (err) {
        alerter("Erreur serveur", "danger");
    }
});

// ==============================
// REGISTER
// ==============================
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

        const data = await res.json();

        if (!res.ok) {
            alerter(data.message || "Création échouée", "danger");
            return;
        }

        alerter("✅ Compte créé avec succès", "success");
        registerModal.hide();

    } catch (err) {
        alerter("Erreur serveur", "danger");
    }
});

// Toggle password visibility
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


// ==============================
// ALERT
// ==============================
function alerter(message, type = "info") {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${message}
            <button class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    registerModal = new bootstrap.Modal(
        document.getElementById("registerModal")
    );
});
