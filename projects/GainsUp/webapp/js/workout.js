// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const btnBack = document.getElementById('btnBack');
const btnCancel = document.getElementById('btnCancel');
const btnFinish = document.getElementById('btnFinish');
const btnAddSet = document.getElementById('btnAddSet');
const repsInput = document.getElementById('reps');
const weightInput = document.getElementById('weight');
const exerciseName = document.getElementById('exerciseName');
const currentDate = document.getElementById('currentDate');
const lastWorkoutSection = document.getElementById('lastWorkoutSection');
const lastWorkoutCard = document.getElementById('lastWorkoutCard');
const currentSetsList = document.getElementById('currentSetsList');
const alertContainer = document.getElementById('alert');

// Variables de session
let sessionId = null;
let currentSets = []; // Stocke les sets en mémoire (avant sauvegarde finale)
let selectedUserId = null;
let selectedExerciseId = null;
let selectedExerciseName = null;

// ============================================
// EVENT HANDLERS
// ============================================

// Initialisation de la page
function initWorkout() {
    console.log('🏋️ Initialisation de la page workout');
    
    // Récupérer les données du localStorage
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
    
    // Utiliser la session existante
    sessionId = activeSessionId;
    
    // Afficher les informations
    exerciseName.textContent = selectedExerciseName;
    currentDate.textContent = formatDate(new Date());
    
    // Charger la dernière séance (NE PLUS créer de session !)
    loadLastWorkout();
}

// Créer une session d'entraînement
// NOTE: Cette fonction n'est plus utilisée. La session est maintenant créée dans menu.html
function createSession_OLD() {
    console.log('📝 Création de la session');
    
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
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
    .then(response => {
        console.log('📡 Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(responseText => {
        console.log('📄 Response brute:', responseText);
        
        // Extraire le dernier JSON valide (après les erreurs PHP)
        try {
            // Chercher le dernier { et } pour isoler le JSON final
            const lastBrace = responseText.lastIndexOf('}');
            if (lastBrace === -1) {
                throw new Error('Aucun JSON trouvé');
            }
            
            // Chercher le { qui correspond à ce }
            let openBraces = 1;
            let firstBrace = lastBrace - 1;
            while (firstBrace >= 0 && openBraces > 0) {
                if (responseText[firstBrace] === '}') openBraces++;
                if (responseText[firstBrace] === '{') openBraces--;
                firstBrace--;
            }
            firstBrace++; // Corriger la position
            
            const jsonString = responseText.substring(firstBrace, lastBrace + 1);
            console.log('📄 JSON extrait:', jsonString);
            
            const responseData = JSON.parse(jsonString);
            console.log('📦 Response data:', responseData);
            
            // Ton API retourne "id" et non "session_id"
            if (responseData.status === 200 && responseData.id) {
                sessionId = responseData.id;
                console.log('✅ Session créée:', sessionId);
            } else {
                console.error('❌ Erreur création session:', responseData);
                alerter("❌ Erreur lors de la création de la session", "danger");
            }
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError);
            console.error('📄 Texte reçu:', responseText);
            alerter("❌ Erreur de format de réponse", "danger");
        }
    })
    .catch(error => {
        console.error('❌ Erreur:', error);
        alerter("⚠️ Erreur réseau: " + error.message, "danger");
    });
}

// Charger la dernière séance
function loadLastWorkout() {
    console.log('📊 Chargement dernière séance');
    
    let url = baseApiAddress + "workout_sessions.php";
    
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
        console.log('📦 Sessions récupérées:', responseData);
        if (responseData.status === 200 && responseData.data) {
            // Filtrer les sessions de cet utilisateur
            const userSessions = responseData.data.filter(s => s.user_id == selectedUserId);
            
            if (userSessions.length > 0) {
                // Trier par date décroissante
                userSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Prendre la plus récente (qui n'est pas celle d'aujourd'hui)
                const today = new Date().toISOString().split('T')[0];
                const lastSession = userSessions.find(s => s.date !== today);
                
                if (lastSession) {
                    loadLastWorkoutSets(lastSession);
                } else {
                    displayNoLastWorkout();
                }
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

// Charger les sets de la dernière séance
function loadLastWorkoutSets(session) {
    let url = baseApiAddress + "sets.php";
    
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
        if (responseData.status === 200 && responseData.data) {
            // Filtrer les sets de cette session et cet exercice
            const sets = responseData.data.filter(s => 
                s.session_id == session.session_id && 
                s.exercise_id == selectedExerciseId
            );
            
            if (sets.length > 0) {
                displayLastWorkout(session, sets);
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
    
    // Trier les sets par numéro
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
    
    // Créer le set
    const setNumber = currentSets.length + 1;
    
    const newSet = {
        set_number: setNumber,
        reps: reps,
        weight: weight,
        tempId: Date.now() // ID temporaire pour le tracking
    };
    
    console.log('➕ Ajout série:', newSet);
    
    // Ajouter à l'API
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
            weight: set.weight
        })
    })
    .then(response => response.json())
    .then(responseData => {
        console.log('📦 Response ajout set:', responseData);
        // Ton API peut retourner "id" ou "set_id"
        const setId = responseData.set_id || responseData.id;
        
        // Accepter 200 ou 201
        if ((responseData.status === 201 || responseData.status === 200) && setId) {
            console.log('✅ Set sauvegardé:', setId);
            
            // Ajouter le set_id réel
            set.set_id = setId;
            
            // Ajouter à la liste locale
            currentSets.push(set);
            
            // Afficher
            displayCurrentSets();
            
            // Réinitialiser le formulaire
            repsInput.value = '';
            weightInput.value = '';
            repsInput.focus();
            
            // Message de succès
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
                <div class="current-set-details">${set.reps} × ${set.weight}kg</div>
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
            // Retirer de la liste locale
            currentSets = currentSets.filter(s => s.set_id != setId);
            
            // Renuméroter les sets
            currentSets.forEach((set, index) => {
                set.set_number = index + 1;
            });
            
            // Réafficher
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

// Terminer la séance
function handleFinish() {
    if (currentSets.length === 0) {
        alerter("⚠️ Ajoutez au moins une série avant de terminer", "warning");
        return;
    }
    
    if (!confirm(`Terminer la séance avec ${currentSets.length} série(s) ?`)) {
        return;
    }
    
    console.log('🎯 Fin de séance');
    
    alerter("✅ Séance terminée avec succès !", "success");
    
    setTimeout(() => {
        window.location.href = 'groupe.html';
    }, 1500);
}

// Annuler la séance
function handleCancel() {
    if (!confirm('Annuler la séance ? Toutes les séries seront supprimées.')) {
        return;
    }
    
    console.log('❌ Annulation séance');
    
    // Supprimer la session (cascade supprime aussi les sets)
    if (sessionId) {
        let url = baseApiAddress + "workout_sessions.php";
        
        fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        })
        .then(() => {
            window.location.href = 'groupe.html';
        })
        .catch(error => {
            console.error('❌ Erreur:', error);
            window.location.href = 'groupe.html';
        });
    } else {
        window.location.href = 'groupe.html';
    }
}

// Retour
function handleBack() {
    handleCancel();
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
    // Initialiser la page
    initWorkout();
    
    // Attacher les événements
    btnAddSet.addEventListener('click', handleAddSet);
    btnFinish.addEventListener('click', handleFinish);
    btnCancel.addEventListener('click', handleCancel);
    btnBack.addEventListener('click', handleBack);
    currentSetsList.addEventListener('click', handleDeleteSet);
    
    // Enter pour ajouter une série
    weightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddSet();
        }
    });
});