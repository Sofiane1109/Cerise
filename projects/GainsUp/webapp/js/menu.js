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
// HELPERS
// ============================================
function getCurrentUserFromStorage() {
    // 1) ancien système
    let selectedUserId = localStorage.getItem('selectedUserId');
    let selectedUsername = localStorage.getItem('selectedUsername');

    if (selectedUserId && selectedUsername) {
        return { user_id: Number(selectedUserId), username: selectedUsername };
    }

    // 2) nouveau système (login)
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
        try {
            const user = JSON.parse(rawUser);

            if (user && user.user_id && user.username) {
                // on synchronise pour rester compatible avec le reste du projet
                localStorage.setItem("selectedUserId", String(user.user_id));
                localStorage.setItem("selectedUsername", user.username);
                return user;
            }
        } catch (e) {
            console.error("localStorage user JSON invalide", e);
        }
    }

    return null;
}

// ============================================
// EVENT HANDLERS
// ============================================

// Initialisation de la page
function initMenu() {
    const user = getCurrentUserFromStorage();

    if (!user) {
        alerter("⚠️ Veuillez d'abord vous connecter", "warning");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
        return;
    }

    // Afficher les informations de l'utilisateur
    displayUserInfo(user.username);

    // Vérifier s'il y a une session active
    checkActiveSession();
}

// Afficher les informations de l'utilisateur
function displayUserInfo(username) {
    userName.textContent = username;
    userIcon.textContent = username.charAt(0).toUpperCase();
}

// Vérifier s'il y a une session active
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

// Démarrer une nouvelle séance
function handleStartSession() {
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) {
        alerter("⚠️ Utilisateur introuvable, reconnectez-vous", "warning");
        window.location.href = "index.html";
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const url = baseApiAddress + "workout_sessions.php";

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: selectedUserId,
            date: today,
            notes: null
        })
    })
        .then(r => r.text())
        .then(t => {
            // certains endpoints peuvent renvoyer du texte avant du JSON
            const lastBrace = t.lastIndexOf('}');
            if (lastBrace === -1) throw new Error("Aucun JSON trouvé");

            let openBraces = 1;
            let firstBrace = lastBrace - 1;
            while (firstBrace >= 0 && openBraces > 0) {
                if (t[firstBrace] === '}') openBraces++;
                if (t[firstBrace] === '{') openBraces--;
                firstBrace--;
            }
            firstBrace++;

            const jsonString = t.substring(firstBrace, lastBrace + 1);
            const responseData = JSON.parse(jsonString);

            if (responseData.status === 200 && responseData.id) {
                localStorage.setItem('activeSessionId', responseData.id);
                checkActiveSession();
                alerter("✅ Séance démarrée ! Choisissez vos exercices", "success");
            } else {
                alerter("❌ Erreur lors du démarrage de la séance", "danger");
            }
        })
        .catch(err => {
            console.error(err);
            alerter("⚠️ Erreur réseau: " + err.message, "danger");
        });
}

// Terminer la séance
function handleEndSession() {
    if (!confirm("Terminer la séance ?")) return;

    localStorage.removeItem('activeSessionId');
    checkActiveSession();
    alerter("✅ Séance terminée ! Bon repos 💪", "success");
}

// Gérer la sélection d'un groupe musculaire
function handleMuscleGroupSelection(event) {
    const card = event.target.closest('.muscle-group-card');
    if (!card) return;

    const activeSessionId = localStorage.getItem('activeSessionId');
    if (!activeSessionId) {
        alerter("⚠️ Veuillez d'abord démarrer une séance", "warning");
        return;
    }

    const muscleGroup = card.dataset.muscle;
    localStorage.setItem('selectedMuscleGroup', muscleGroup);
    window.location.href = 'groupe.html';
}

// Gérer le clic sur Statistiques
function handleStatsClick() {
    alerter("📊 Statistiques - Page en cours de développement", "info");
}

// Gérer le clic sur Classement
function handleClassementClick() {
    window.location.href = 'classement.html';
}

// Gérer le changement d'utilisateur / logout
function handleChangeUser() {
    const activeSessionId = localStorage.getItem('activeSessionId');
    if (activeSessionId) {
        if (!confirm("Une séance est en cours. Changer d'utilisateur termine la séance. Continuer ?")) return;
    }

    // on efface tout ce qui concerne la session et l'user
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUsername');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedMuscleGroup');
    localStorage.removeItem('activeSessionId');
    localStorage.removeItem('selectedExerciseId');
    localStorage.removeItem('selectedExerciseName');

    window.location.href = 'index.html';
}

// Afficher un message d'alerte
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
            setTimeout(() => (alertContainer.innerHTML = ''), 150);
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
