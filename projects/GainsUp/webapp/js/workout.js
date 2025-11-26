// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const btnBack = document.getElementById('btnBack');
const btnAddSet = document.getElementById('btnAddSet');
const repsInput = document.getElementById('reps');
const weightInput = document.getElementById('weight');
const noteInput = document.getElementById('note');
const exerciseName = document.getElementById('exerciseName');
const currentDate = document.getElementById('currentDate');
const lastWorkoutSection = document.getElementById('lastWorkoutSection');
const lastWorkoutCard = document.getElementById('lastWorkoutCard');
const currentSetsList = document.getElementById('currentSetsList');
const alertContainer = document.getElementById('alert');

// Variables de session
let sessionId = null;
let currentSets = [];
let selectedUserId = null;
let selectedExerciseId = null;
let selectedExerciseName = null;

// ============================================
// EVENT HANDLERS
// ============================================

// Initialisation de la page
function initWorkout() {
    console.log('🏋️ Initialisation de la page workout');
    
    selectedUserId = localStorage.getItem('selectedUserId');
    selectedExerciseId = localStorage.getItem('selectedExerciseId');
    selectedExerciseName = localStorage.getItem('selectedExerciseName');
    const activeSessionId = localStorage.getItem('activeSessionId');
    
    if (!selectedUserId || !selectedExerciseId || !selectedExerciseName) {
        alerter("⚠️ Données manquantes", "warning");
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 1500);
        return;
    }
    
    if (!activeSessionId) {
        alerter("⚠️ Aucune séance active. Retour au menu...", "warning");
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 1500);
        return;
    }
    
    console.log('✅ User:', selectedUserId);
    console.log('✅ Exercise:', selectedExerciseId, selectedExerciseName);
    console.log('✅ Session active:', activeSessionId);
    
    sessionId = activeSessionId;
    
    exerciseName.textContent = selectedExerciseName;
    currentDate.textContent = formatDate(new Date());
    
    loadLastWorkout();
}

// Charger la dernière séance
function loadLastWorkout() {
    console.log('📊 Chargement dernière séance pour exercice:', selectedExerciseId);
    
    let url = baseApiAddress + "sets.php";
    
    fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        console.log('📡 Response status (GET):', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(responseData => {
        console.log('📦 Sets récupérés:', responseData);
        if (responseData.status === 200 && responseData.data) {
            // Filtrer les sets de CET exercice pour CET utilisateur
            const exerciseSets = responseData.data.filter(s => 
                s.exercise_id == selectedExerciseId
            );
            
            console.log('📊 Sets de cet exercice:', exerciseSets);
            
            if (exerciseSets.length === 0) {
                displayNoLastWorkout();
                return;
            }
            
            // Charger les sessions pour trouver celles de cet utilisateur
            loadSessionsForSets(exerciseSets);
        } else {
            displayNoLastWorkout();
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        displayNoLastWorkout();
    });
}

// Charger les sessions pour filtrer par utilisateur
function loadSessionsForSets(exerciseSets) {
    let url = baseApiAddress + "workout_sessions.php";
    
    fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(responseData => {
        if (responseData.status === 200 && responseData.data) {
            // Filtrer les sessions de cet utilisateur
            const userSessions = responseData.data.filter(s => s.user_id == selectedUserId);
            
            // Créer un map des session_id de cet utilisateur
            const userSessionIds = new Set(userSessions.map(s => s.session_id));
            
            // Filtrer les sets qui appartiennent aux sessions de cet utilisateur
            const userExerciseSets = exerciseSets.filter(s => 
                userSessionIds.has(parseInt(s.session_id))
            );
            
            if (userExerciseSets.length === 0) {
                displayNoLastWorkout();
                return;
            }
            
            // Grouper par session
            const sessionMap = new Map();
            userExerciseSets.forEach(set => {
                if (!sessionMap.has(set.session_id)) {
                    sessionMap.set(set.session_id, []);
                }
                sessionMap.get(set.session_id).push(set);
            });
            
            // Trouver la session la plus récente (qui n'est pas celle d'aujourd'hui)
            const today = new Date().toISOString().split('T')[0];
            const sessionsWithSets = Array.from(sessionMap.entries()).map(([session_id, sets]) => {
                const session = userSessions.find(s => s.session_id == session_id);
                return { session, sets };
            })
            .filter(item => item.session && item.session.date !== today) // Exclure aujourd'hui
            .sort((a, b) => new Date(b.session.date) - new Date(a.session.date));
            
            console.log('📊 Sessions triées:', sessionsWithSets);
            
            if (sessionsWithSets.length > 0) {
                const lastWorkout = sessionsWithSets[0];
                displayLastWorkout(lastWorkout.session, lastWorkout.sets);
            } else {
                displayNoLastWorkout();
            }
        } else {
            displayNoLastWorkout();
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        displayNoLastWorkout();
    });
}

// Afficher la dernière séance
function displayLastWorkout(session, sets) {
    const date = new Date(session.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long'
    });
    
    sets.sort((a, b) => a.set_number - b.set_number);
    
    let html = `
        <p class="last-workout-date">${date}</p>
        <div class="last-workout-sets">
    `;
    
    sets.forEach(set => {
        html += `
            <div class="last-workout-set">
                <span class="set-label">Série ${set.set_number}</span>
                <span class="set-details">${set.reps} × ${set.weight}kg</span>
                ${set.note ? `<span class="set-note-last">📝 ${set.note}</span>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    lastWorkoutCard.innerHTML = html;
}

// Afficher "Aucune séance précédente"
function displayNoLastWorkout() {
    lastWorkoutSection.style.display = 'none';
}

// Ajouter une série
function handleAddSet() {
    const reps = parseInt(repsInput.value);
    const weight = parseFloat(weightInput.value);
    const note = noteInput.value.trim() || null;
    
    // Validation
    if (!reps || reps < 1) {
        alerter("❌ Entrez un nombre de répétitions valide", "danger");
        repsInput.focus();
        return;
    }
    
    if (weight === null || weight === undefined || weight < 0) {
        alerter("❌ Entrez un poids valide", "danger");
        weightInput.focus();
        return;
    }
    
    if (!sessionId) {
        alerter("⚠️ Session non créée, veuillez patienter...", "warning");
        return;
    }
    
    const setNumber = currentSets.length + 1;
    
    const newSet = {
        set_number: setNumber,
        reps: reps,
        weight: weight,
        note: note,
        tempId: Date.now()
    };
    
    console.log('➕ Ajout série:', newSet);
    
    saveSetToAPI(newSet);
}

// Sauvegarder un set dans l'API
function saveSetToAPI(set) {
    let url = baseApiAddress + "sets.php";
    
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            session_id: sessionId,
            exercise_id: selectedExerciseId,
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight,
            note: set.note
        })
    })
    .then(response => response.json())
    .then(responseData => {
        console.log('📦 Response ajout set:', responseData);
        const setId = responseData.set_id || responseData.id;
        
        if ((responseData.status === 201 || responseData.status === 200) && setId) {
            console.log('✅ Set sauvegardé:', setId);
            
            set.set_id = setId;
            currentSets.push(set);
            
            displayCurrentSets();
            
            repsInput.value = '';
            weightInput.value = '';
            noteInput.value = '';
            repsInput.focus();
            
            alerter(`✅ Série ${set.set_number} ajoutée : ${set.reps}×${set.weight}kg`, "success");
        } else {
            alerter("❌ Erreur lors de l'ajout de la série", "danger");
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        alerter("⚠️ Erreur réseau: " + error.message, "danger");
    });
}

// Afficher les séries en cours
function displayCurrentSets() {
    if (currentSets.length === 0) {
        currentSetsList.innerHTML = `
            <div class="no-sets-yet">
                <p>Aucune série ajoutée pour le moment</p>
                <p style="font-size: 0.9rem; color: var(--text-gray);">Utilisez le formulaire ci-dessous pour ajouter votre première série</p>
            </div>
        `;
        return;
    }
    
    currentSetsList.innerHTML = '';
    
    currentSets.forEach(set => {
        const setItem = document.createElement('div');
        setItem.className = 'current-set-item';
        setItem.dataset.setId = set.set_id;
        
        setItem.innerHTML = `
            <div class="current-set-info">
                <div class="current-set-number">Série ${set.set_number}</div>
                <div class="current-set-details">
                    ${set.reps} × ${set.weight}kg
                    ${set.note ? `<span class="set-note">📝 ${set.note}</span>` : ''}
                </div>
            </div>
            <div class="current-set-actions">
                <button class="btn-delete-set" data-set-id="${set.set_id}" title="Supprimer">
                    🗑️
                </button>
            </div>
        `;
        
        currentSetsList.appendChild(setItem);
    });
}

// Supprimer une série
function handleDeleteSet(event) {
    const btn = event.target.closest('.btn-delete-set');
    
    if (!btn) return;
    
    const setId = btn.dataset.setId;
    
    if (!confirm('Supprimer cette série ?')) {
        return;
    }
    
    console.log('🗑️ Suppression série:', setId);
    
    let url = baseApiAddress + "sets.php";
    
    fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            set_id: setId
        })
    })
    .then(response => response.json())
    .then(responseData => {
        if (responseData.status === 200) {
            currentSets = currentSets.filter(s => s.set_id != setId);
            
            currentSets.forEach((set, index) => {
                set.set_number = index + 1;
            });
            
            displayCurrentSets();
            
            alerter("✅ Série supprimée", "success");
        } else {
            alerter("❌ Erreur lors de la suppression", "danger");
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        alerter("⚠️ Erreur réseau: " + error.message, "danger");
    });
}

// Retour à la page groupe
function handleBack() {
    window.location.href = 'groupe.html';
}

// Formater une date
function formatDate(date) {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
        return "Aujourd'hui";
    }
    
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
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
    initWorkout();
    
    btnAddSet.addEventListener('click', handleAddSet);
    btnBack.addEventListener('click', handleBack);
    currentSetsList.addEventListener('click', handleDeleteSet);
    
    weightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddSet();
        }
    });
});