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
}

// ============================================
// USER INFO
// ============================================
function displayUserInfo(username) {
    userName.textContent = username;
    userIcon.textContent = username.charAt(0).toUpperCase();
}

// ============================================
// SESSION
// ============================================
function checkActiveSession() {
    const activeSessionId = localStorage.getItem('activeSessionId');

    if (activeSessionId) {
        btnStartSession.style.display = 'none';
        activeSessionInfo.style.display = 'flex';
    } else {
        btnStartSession.style.display = 'block';
        activeSessionInfo.style.display = 'none';
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
// ALERT
// ============================================
function alerter(message, type = "info") {
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

    muscleGroupGrid.addEventListener('click', handleMuscleGroupSelection);
    btnStartSession.addEventListener('click', handleStartSession);
    btnEndSession.addEventListener('click', handleEndSession);
    btnStats.addEventListener('click', handleStatsClick);
    btnClassement.addEventListener('click', handleClassementClick);
    btnChangeUser.addEventListener('click', handleChangeUser);
});
