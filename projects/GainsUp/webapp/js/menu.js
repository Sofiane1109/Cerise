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
// EVENT HANDLERS
// ============================================

// Initialisation de la page
function initMenu() {
    // Vérifier si un utilisateur est sélectionné
    const selectedUserId = localStorage.getItem('selectedUserId');
    const selectedUsername = localStorage.getItem('selectedUsername');
    
    if (!selectedUserId || !selectedUsername) {
        alerter("⚠️ Veuillez d'abord sélectionner un utilisateur", "warning");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }
    
    // Afficher les informations de l'utilisateur
    displayUserInfo(selectedUsername);
    
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
        // Session active
        btnStartSession.style.display = 'none';
        activeSessionInfo.style.display = 'flex';
    } else {
        // Pas de session
        btnStartSession.style.display = 'block';
        activeSessionInfo.style.display = 'none';
    }
}

// Démarrer une nouvelle séance
function handleStartSession() {
    console.log("🏋️ Démarrage d'une nouvelle séance");
    
    const selectedUserId = localStorage.getItem('selectedUserId');
    const today = new Date().toISOString().split('T')[0];
    
    let url = baseApiAddress + "workout_sessions.php";
    
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: selectedUserId,
            date: today,
            notes: null
        })
    })
    .then(response => response.text())
    .then(responseText => {
        // Extraire le JSON
        const lastBrace = responseText.lastIndexOf('}');
        if (lastBrace === -1) {
            throw new Error('Aucun JSON trouvé');
        }
        
        let openBraces = 1;
        let firstBrace = lastBrace - 1;
        while (firstBrace >= 0 && openBraces > 0) {
            if (responseText[firstBrace] === '}') openBraces++;
            if (responseText[firstBrace] === '{') openBraces--;
            firstBrace--;
        }
        firstBrace++;
        
        const jsonString = responseText.substring(firstBrace, lastBrace + 1);
        const responseData = JSON.parse(jsonString);
        
        if (responseData.status === 200 && responseData.id) {
            const sessionId = responseData.id;
            console.log('✅ Séance démarrée, ID:', sessionId);
            
            // Sauvegarder l'ID de session dans localStorage
            localStorage.setItem('activeSessionId', sessionId);
            
            // Mettre à jour l'interface
            checkActiveSession();
            
            alerter("✅ Séance démarrée ! Choisissez vos exercices", "success");
        } else {
            alerter("❌ Erreur lors du démarrage de la séance", "danger");
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        alerter("⚠️ Erreur réseau: " + error.message, "danger");
    });
}

// Terminer la séance
function handleEndSession() {
    if (!confirm('Terminer la séance ? Vous ne pourrez plus ajouter d\'exercices.')) {
        return;
    }
    
    console.log('✅ Fin de séance');
    
    // Retirer l'ID de session
    localStorage.removeItem('activeSessionId');
    
    // Mettre à jour l'interface
    checkActiveSession();
    
    alerter("✅ Séance terminée ! Bon repos 💪", "success");
}

// Gérer la sélection d'un groupe musculaire
function handleMuscleGroupSelection(event) {
    const card = event.target.closest('.muscle-group-card');
    
    if (!card) return;
    
    // Vérifier qu'une session est active
    const activeSessionId = localStorage.getItem('activeSessionId');
    if (!activeSessionId) {
        alerter("⚠️ Veuillez d'abord démarrer une séance", "warning");
        return;
    }
    
    const muscleGroup = card.dataset.muscle;
    
    console.log('Groupe musculaire sélectionné:', muscleGroup);
    
    // Sauvegarder le groupe sélectionné dans localStorage
    localStorage.setItem('selectedMuscleGroup', muscleGroup);
    
    // Rediriger vers la page du groupe musculaire
    window.location.href = 'groupe.html';
}

// Gérer le clic sur Statistiques
function handleStatsClick() {
    console.log('Navigation vers Statistiques');
    alerter("📊 Statistiques - Page en cours de développement", "info");
}

// Gérer le clic sur Classement
function handleClassementClick() {
    console.log('Navigation vers Classement');
    alerter("🏆 Classement - Page en cours de développement", "info");
}

// Gérer le changement d'utilisateur
function handleChangeUser() {
    // Vérifier s'il y a une session active
    const activeSessionId = localStorage.getItem('activeSessionId');
    if (activeSessionId) {
        if (!confirm('Une séance est en cours. Voulez-vous vraiment changer d\'utilisateur ? La séance sera terminée.')) {
            return;
        }
    }
    
    // Effacer toutes les données
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUsername');
    localStorage.removeItem('selectedMuscleGroup');
    localStorage.removeItem('activeSessionId');
    localStorage.removeItem('selectedExerciseId');
    localStorage.removeItem('selectedExerciseName');
    
    // Rediriger vers la page de sélection
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
    // Initialiser la page
    initMenu();
    
    // Attacher les événements
    muscleGroupGrid.addEventListener('click', handleMuscleGroupSelection);
    btnStartSession.addEventListener('click', handleStartSession);
    btnEndSession.addEventListener('click', handleEndSession);
    btnStats.addEventListener('click', handleStatsClick);
    btnClassement.addEventListener('click', handleClassementClick);
    btnChangeUser.addEventListener('click', handleChangeUser);
});