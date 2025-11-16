// ============================================
// DECLARATIONS
// ============================================
const userIcon = document.getElementById('userIcon');
const userName = document.getElementById('userName');
const muscleGroupGrid = document.querySelector('.muscle-group-grid');
const btnStats = document.getElementById('btnStats');
const btnClassement = document.getElementById('btnClassement');
const btnChangeUser = document.getElementById('btnChangeUser');
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
        // Pas d'utilisateur sélectionné, rediriger vers la page de sélection
        alerter("⚠️ Veuillez d'abord sélectionner un utilisateur", "warning");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }
    
    // Afficher les informations de l'utilisateur
    displayUserInfo(selectedUsername);
}

// Afficher les informations de l'utilisateur
function displayUserInfo(username) {
    userName.textContent = username;
    userIcon.textContent = username.charAt(0).toUpperCase();
}

// Gérer la sélection d'un groupe musculaire
function handleMuscleGroupSelection(event) {
    const card = event.target.closest('.muscle-group-card');
    
    if (!card) return;
    
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
    // window.location.href = 'stats.html';
    alerter("📊 Statistiques - Page en cours de développement", "info");
}

// Gérer le clic sur Classement
function handleClassementClick() {
    console.log('Navigation vers Classement');
    // window.location.href = 'classement.html';
    alerter("🏆 Classement - Page en cours de développement", "info");
}

// Gérer le changement d'utilisateur
function handleChangeUser() {
    // Effacer les données de l'utilisateur sélectionné
    localStorage.removeItem('selectedUserId');
    localStorage.removeItem('selectedUsername');
    localStorage.removeItem('selectedMuscleGroup');
    
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
    btnStats.addEventListener('click', handleStatsClick);
    btnClassement.addEventListener('click', handleClassementClick);
    btnChangeUser.addEventListener('click', handleChangeUser);
});