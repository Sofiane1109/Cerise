// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const btnBack = document.getElementById('btnBack');
const muscleIcon = document.getElementById('muscleIcon');
const muscleGroupTitle = document.getElementById('muscleGroupTitle');
const exerciseCount = document.getElementById('exerciseCount');
const exerciseList = document.getElementById('exerciseList');
const alertContainer = document.getElementById('alert');

// Icônes par groupe musculaire
const muscleIcons = {
    'Pectoraux': '💪',
    'Dos': '🦾',
    'Épaules': '🏋️',
    'Biceps': '💪',
    'Triceps': '🔱'
};

// ============================================
// EVENT HANDLERS
// ============================================

// Initialisation de la page
function initGroupe() {
    console.log('🎯 Initialisation de la page groupe');
    
    // Vérifier qu'un utilisateur est sélectionné
    const selectedUserId = localStorage.getItem('selectedUserId');
    const selectedUsername = localStorage.getItem('selectedUsername');
    const selectedMuscleGroup = localStorage.getItem('selectedMuscleGroup');
    
    if (!selectedUserId || !selectedUsername) {
        alerter("⚠️ Veuillez d'abord sélectionner un utilisateur", "warning");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }
    
    if (!selectedMuscleGroup) {
        alerter("⚠️ Veuillez d'abord sélectionner un groupe musculaire", "warning");
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 1500);
        return;
    }
    
    console.log('✅ Utilisateur:', selectedUsername);
    console.log('✅ Groupe musculaire:', selectedMuscleGroup);
    
    // Afficher le groupe musculaire
    displayMuscleGroupHeader(selectedMuscleGroup);
    
    // Charger les exercices
    loadExercises(selectedMuscleGroup, selectedUserId);
}

// Afficher l'en-tête du groupe musculaire
function displayMuscleGroupHeader(muscleGroup) {
    muscleGroupTitle.textContent = muscleGroup;
    muscleIcon.textContent = muscleIcons[muscleGroup] || '💪';
}

// Charger les exercices du groupe
function loadExercises(muscleGroup, userId) {
    console.log('🔄 Chargement des exercices pour:', muscleGroup);
    
    let url = baseApiAddress + "exercises.php";
    
    fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(responseData => {
        console.log('📦 Exercices reçus:', responseData);
        
        if (responseData.status === 200 && responseData.data && Array.isArray(responseData.data)) {
            // Filtrer les exercices du groupe sélectionné
            const exercises = responseData.data.filter(ex => ex.muscle_group === muscleGroup);
            
            console.log('✅ Exercices filtrés:', exercises.length);
            
            // Mettre à jour le compteur
            exerciseCount.textContent = `${exercises.length} exercice${exercises.length > 1 ? 's' : ''}`;
            
            // Afficher les exercices
            displayExercises(exercises, userId);
        } else {
            console.error('❌ Format de données invalide');
            alerter("❌ Erreur lors du chargement des exercices", "danger");
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        alerter("⚠️ Erreur lors du chargement des exercices: " + error.message, "danger");
    });
}

// Afficher les exercices
function displayExercises(exercises, userId) {
    exerciseList.innerHTML = '';
    
    if (exercises.length === 0) {
        exerciseList.innerHTML = `
            <div class="no-history">
                <div class="no-history-icon">🏋️</div>
                <p class="no-history-text">Aucun exercice trouvé pour ce groupe musculaire</p>
            </div>
        `;
        return;
    }
    
    exercises.forEach(exercise => {
        const card = createExerciseCard(exercise, userId);
        exerciseList.appendChild(card);
    });
}

// Créer une carte d'exercice
function createExerciseCard(exercise, userId) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    
    card.innerHTML = `
        <div class="exercise-card-header">
            <h3 class="exercise-name">${exercise.name}</h3>
            <button class="btn-add-workout" data-exercise-id="${exercise.exercise_id}" data-exercise-name="${exercise.name}">
                + Séance
            </button>
        </div>
        <div class="workout-history" id="history-${exercise.exercise_id}">
            <div style="text-align: center; padding: 1rem; color: var(--text-gray);">
                ⏳ Chargement de l'historique...
            </div>
        </div>
    `;
    
    // Charger l'historique de cet exercice
    loadExerciseHistory(exercise.exercise_id, userId);
    
    return card;
}

// Charger l'historique d'un exercice
function loadExerciseHistory(exerciseId, userId) {
    console.log(`📊 Chargement historique exercice ${exerciseId} pour user ${userId}`);
    
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
            // Filtrer les séances de cet utilisateur
            const userSessions = responseData.data.filter(s => s.user_id == userId);
            
            // Pour chaque séance, charger les sets de cet exercice
            loadSetsForExercise(exerciseId, userSessions);
        } else {
            displayNoHistory(exerciseId);
        }
    })
    .catch(error => {
        console.error('❌ Erreur historique:', error);
        displayNoHistory(exerciseId);
    });
}

// Charger les sets pour un exercice
function loadSetsForExercise(exerciseId, sessions) {
    let url = baseApiAddress + "sets.php";
    
    fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(responseData => {
        if (responseData.status === 200 && responseData.data) {
            // Filtrer les sets de cet exercice
            const exerciseSets = responseData.data.filter(s => s.exercise_id == exerciseId);
            
            // Grouper par session
            const sessionMap = new Map();
            
            exerciseSets.forEach(set => {
                const session = sessions.find(s => s.session_id == set.session_id);
                if (session) {
                    if (!sessionMap.has(set.session_id)) {
                        sessionMap.set(set.session_id, {
                            session: session,
                            sets: []
                        });
                    }
                    sessionMap.get(set.session_id).sets.push(set);
                }
            });
            
            // Convertir en tableau et trier par date (plus récent en premier)
            const workouts = Array.from(sessionMap.values())
                .sort((a, b) => new Date(b.session.date) - new Date(a.session.date))
                .slice(0, 5); // Garder seulement les 5 dernières
            
            displayExerciseHistory(exerciseId, workouts);
        } else {
            displayNoHistory(exerciseId);
        }
    })
    .catch(error => {
        console.error('❌ Erreur sets:', error);
        displayNoHistory(exerciseId);
    });
}

// Afficher l'historique d'un exercice
function displayExerciseHistory(exerciseId, workouts) {
    const container = document.getElementById(`history-${exerciseId}`);
    
    if (!container) return;
    
    if (workouts.length === 0) {
        displayNoHistory(exerciseId);
        return;
    }
    
    let html = `
        <table class="workout-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Séries</th>
                    <th>Détails</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    workouts.forEach(workout => {
        const date = new Date(workout.session.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short'
        });
        
        const setCount = workout.sets.length;
        
        // Créer le détail des séries (ex: "12×20kg, 10×20kg, 8×20kg")
        const setsDetail = workout.sets
            .sort((a, b) => a.set_number - b.set_number)
            .map(s => `${s.reps}×${s.weight}kg`)
            .join(', ');
        
        html += `
            <tr>
                <td class="workout-date">${date}</td>
                <td class="workout-sets">${setCount} série${setCount > 1 ? 's' : ''}</td>
                <td>${setsDetail}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    if (workouts.length === 5) {
        html += `<button class="btn-see-more" data-exercise-id="${exerciseId}">Voir plus</button>`;
    }
    
    container.innerHTML = html;
}

// Afficher "Aucun historique"
function displayNoHistory(exerciseId) {
    const container = document.getElementById(`history-${exerciseId}`);
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="no-history">
            <div class="no-history-icon">📊</div>
            <p class="no-history-text">Aucune séance enregistrée</p>
        </div>
    `;
}

// Gérer le clic sur "Ajouter séance"
function handleAddWorkout(event) {
    console.log('🖱️ Clic détecté:', event.target);
    
    const btn = event.target.closest('.btn-add-workout');
    
    console.log('🔍 Bouton trouvé:', btn);
    
    if (!btn) {
        console.log('❌ Pas de bouton .btn-add-workout trouvé');
        return;
    }
    
    const exerciseId = btn.dataset.exerciseId;
    const exerciseName = btn.dataset.exerciseName;
    
    console.log('➕ Ajouter séance pour:', exerciseName, 'ID:', exerciseId);
    console.log('📋 Dataset complet:', btn.dataset);
    
    // Sauvegarder l'exercice sélectionné
    localStorage.setItem('selectedExerciseId', exerciseId);
    localStorage.setItem('selectedExerciseName', exerciseName);
    
    console.log('💾 LocalStorage mis à jour');
    console.log('📦 Vérification localStorage:', {
        exerciseId: localStorage.getItem('selectedExerciseId'),
        exerciseName: localStorage.getItem('selectedExerciseName')
    });
    console.log('🔄 Redirection vers workout.html...');
    
    // Rediriger vers la page d'ajout de séance
    try {
        window.location.href = 'workout.html';
        console.log('✅ Redirection lancée');
    } catch(error) {
        console.error('❌ Erreur redirection:', error);
    }
}

// Gérer le retour
function handleBack() {
    window.location.href = 'menu.html';
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
    initGroupe();
    
    // Attacher les événements
    btnBack.addEventListener('click', handleBack);
    exerciseList.addEventListener('click', handleAddWorkout);
});