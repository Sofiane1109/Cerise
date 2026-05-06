// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const userIcon = document.getElementById('userIcon');
const userName = document.getElementById('userName');
const muscleGroupGrid = document.querySelector('.muscle-group-grid');
const btnStats = document.getElementById('btnStats');
const btnClassement = document.getElementById('btnClassement');
const btnChangeUser = document.getElementById('btnChangeUser');
const btnStartSession = document.getElementById('btnStartSession');
const btnEndSession = document.getElementById('btnEndSession');
const activeSessionInfo = document.getElementById('activeSessionInfo');
const alertContainer = document.getElementById('alert');

// (OPTIONNEL) Si tu ajoutes un bouton "Nouveautés" dans le HTML avec id="btnNews"
// const btnNews = document.getElementById('btnNews');

// ============================================
// INITIALISATION
// ============================================
function initMenu() {
    let selectedUserId = localStorage.getItem('selectedUserId');
    let selectedUsername = localStorage.getItem('selectedUsername');

    // ✅ NOUVEAU : récupération depuis login
    if ((!selectedUserId || !selectedUsername) && localStorage.getItem("user")) {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (user && user.user_id != null && user.username) {
                selectedUserId = String(user.user_id);
                selectedUsername = String(user.username);

                localStorage.setItem('selectedUserId', selectedUserId);
                localStorage.setItem('selectedUsername', selectedUsername);
            }
        } catch (e) {
            console.error("❌ localStorage.user invalide", e);
        }
    }

    // ❌ Aucun utilisateur → retour login
    if (!selectedUserId || !selectedUsername) {
        alerter("⚠️ Veuillez d'abord vous connecter", "warning");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        return;
    }

    displayUserInfo(selectedUsername);
    checkActiveSession();

    // ✅ Pop-up "features à venir"
    initComingSoonModal();
}

// ============================================
// USER INFO
// ============================================
function displayUserInfo(username) {
    if (userName) userName.textContent = username;
    if (userIcon) userIcon.textContent = username.charAt(0).toUpperCase();
}

// ============================================
// SESSION
// ============================================
function checkActiveSession() {
    const activeSessionId = localStorage.getItem('activeSessionId');

    if (activeSessionId) {
        if (btnStartSession) btnStartSession.style.display = 'none';
        if (activeSessionInfo) activeSessionInfo.style.display = 'flex';
    } else {
        if (btnStartSession) btnStartSession.style.display = 'block';
        if (activeSessionInfo) activeSessionInfo.style.display = 'none';
    }
}

function handleStartSession() {
    const selectedUserId = localStorage.getItem('selectedUserId');
    const today = new Date().toISOString().split('T')[0];

    fetch(baseApiAddress + "workout_sessions.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: selectedUserId,
            date: today,
            notes: null
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === 200 && data.id) {
                localStorage.setItem('activeSessionId', data.id);
                checkActiveSession();
                alerter("✅ Séance démarrée !", "success");
            } else {
                alerter("❌ Erreur lors du démarrage de la séance", "danger");
            }
        })
        .catch(err => {
            console.error(err);
            alerter("⚠️ Erreur réseau", "danger");
        });
}

function handleEndSession() {
    if (!confirm("Terminer la séance ?")) return;

    localStorage.removeItem('activeSessionId');
    checkActiveSession();
    alerter("✅ Séance terminée", "success");
}

// ============================================
// NAVIGATION
// ============================================
function handleMuscleGroupSelection(event) {
    const card = event.target.closest('.muscle-group-card');
    if (!card) return;

    if (!localStorage.getItem('activeSessionId')) {
        alerter("⚠️ Démarrez une séance d'abord", "warning");
        return;
    }

    localStorage.setItem('selectedMuscleGroup', card.dataset.muscle);
    window.location.href = 'groupe.html';
}

function handleStatsClick() {
    window.location.href = "statistique.html";
}

function handleClassementClick() {
    window.location.href = 'classement.html';
}

function handleChangeUser() {
    if (localStorage.getItem('activeSessionId')) {
        if (!confirm("Une séance est en cours. Continuer ?")) return;
    }

    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUsername');
    localStorage.removeItem('selectedMuscleGroup');
    localStorage.removeItem('activeSessionId');
    localStorage.removeItem('selectedExerciseId');
    localStorage.removeItem('selectedExerciseName');
    localStorage.removeItem('user'); // 🔥 important

    window.location.href = 'index.html';
}

// ============================================
// COMING SOON MODAL (Bootstrap modal)
// Requiert : le HTML du modal (#comingSoonModal) dans menu.html
// ============================================
function initComingSoonModal() {
    const LS_KEY = "gainsup_hide_comingsoon";
    const modalEl = document.getElementById("comingSoonModal");

    // Si le modal n'existe pas dans le HTML, on ne fait rien
    if (!modalEl) return;

    // Bootstrap doit être chargé (bundle)
    if (typeof bootstrap === "undefined" || !bootstrap.Modal) {
        console.warn("⚠️ Bootstrap Modal non disponible. Vérifie bootstrap.bundle.min.js");
        return;
    }

    const dontShow = document.getElementById("dontShowComingSoon");
    const btnOk = document.getElementById("btnOkComingSoon");

    const modal = new bootstrap.Modal(modalEl, {
        backdrop: true,
        keyboard: true
    });

    // Ouvrir auto 1 seule fois (si pas désactivé)
    const hide = localStorage.getItem(LS_KEY);
    if (hide !== "1") {
        modal.show();
    }

    // OK ferme le modal
    if (btnOk) {
        btnOk.addEventListener("click", () => {
            if (dontShow && dontShow.checked) {
                localStorage.setItem(LS_KEY, "1");
            }
            modal.hide();
        });
    }

    // Si fermeture via X/backdrop, on applique aussi le "ne plus afficher" si coché
    modalEl.addEventListener("hidden.bs.modal", () => {
        if (dontShow && dontShow.checked) {
            localStorage.setItem(LS_KEY, "1");
        }
    });

    // Optionnel: l’ouvrir manuellement depuis un bouton
    window.openComingSoonModal = () => modal.show();
}

// ============================================
// ALERT
// ============================================
function alerter(message, type = "info") {
    if (!alertContainer) return;

    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 150);
        }
    }, 3000);
}

// ============================================
// EVENTS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initMenu();

    if (muscleGroupGrid) muscleGroupGrid.addEventListener('click', handleMuscleGroupSelection);
    if (btnStartSession) btnStartSession.addEventListener('click', handleStartSession);
    if (btnEndSession) btnEndSession.addEventListener('click', handleEndSession);
    if (btnStats) btnStats.addEventListener('click', handleStatsClick);
    if (btnClassement) btnClassement.addEventListener('click', handleClassementClick);
    if (btnChangeUser) btnChangeUser.addEventListener('click', handleChangeUser);

    // (OPTIONNEL) Bouton nouveautés si tu l’ajoutes
    if (btnNews) btnNews.addEventListener('click', () => window.openComingSoonModal?.());
});
