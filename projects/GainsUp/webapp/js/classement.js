// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const btnBack = document.getElementById('btnBack');
const classementList = document.getElementById('classementList');
const alertContainer = document.getElementById('alert');

// Exercices à afficher dans le classement
const targetExercises = [
    { id: 1, name: 'Développé couché haltères', category: 'pectoraux', icon: '💪' },
    { id: 2, name: 'Développé incliné haltères', category: 'pectoraux', icon: '💪' },
    { id: 5, name: 'Peck deck couché', category: 'pectoraux', icon: '💪' },
    { id: 9, name: 'Dips', category: 'pectoraux', icon: '💪' },
    { id: 10, name: 'Tractions', category: 'dos', icon: '🦾' },
    { id: 32, name: 'Curl banc incliné', category: 'biceps', icon: '💪' },
    { id: 36, name: 'Hammer curl à la poulie', category: 'biceps', icon: '💪' },
    { id: 37, name: 'Curl pupitre', category: 'biceps', icon: '💪' },
    { id: 41, name: 'Leg press', category: 'jambes', icon: '🦵' },
    { id: 44, name: 'Leg curl', category: 'jambes', icon: '🦵' },
    { id: 45, name: 'Leg extensions', category: 'jambes', icon: '🦵' },
];

let currentFilter = 'all';
let allRecords = [];

// ============================================
// EVENT HANDLERS
// ============================================

// Initialisation de la page
function initClassement() {
    console.log('🏆 Initialisation de la page classement');
    loadAllRecords();
}

// Charger tous les records
function loadAllRecords() {
    console.log('🔄 Chargement des records...');

    Promise.all([
        fetch(baseApiAddress + "sets.php").then(r => r.json()),
        fetch(baseApiAddress + "users.php").then(r => r.json()),
        fetch(baseApiAddress + "workout_sessions.php").then(r => r.json())
    ])
        .then(([setsData, usersData, sessionsData]) => {
            if (setsData.status === 200 && usersData.status === 200 && sessionsData.status === 200) {
                const sets = setsData.data;
                const users = usersData.data;
                const sessions = sessionsData.data;

                console.log('📦 Sets:', sets.length);
                console.log('👥 Users:', users.length);
                console.log('📅 Sessions:', sessions.length);

                // Calculer les records pour chaque exercice
                allRecords = calculateRecords(sets, users, sessions);

                console.log('✅ Records calculés:', allRecords);

                displayRecords(allRecords);
            } else {
                alerter("❌ Erreur lors du chargement des données", "danger");
            }
        })
        .catch(error => {
            console.error('❌ Erreur:', error);
            alerter("⚠️ Erreur lors du chargement: " + error.message, "danger");
        });
}

// Calculer les records par exercice
function calculateRecords(sets, users, sessions) {
    const records = [];

    targetExercises.forEach(exercise => {
        // Filtrer les sets de cet exercice
        const exerciseSets = sets.filter(s => s.exercise_id == exercise.id);

        if (exerciseSets.length === 0) {
            records.push({
                exercise: exercise,
                rankings: []
            });
            return;
        }

        // Grouper par utilisateur
        const userRecords = new Map();

        exerciseSets.forEach(set => {
            // Trouver la session
            const session = sessions.find(s => s.session_id == set.session_id);
            if (!session) return;

            const userId = session.user_id;
            const user = users.find(u => u.user_id == userId);
            if (!user) return;

            // Utiliser le poids comme critère principal
            const weight = parseFloat(set.weight);

            if (!userRecords.has(userId)) {
                userRecords.set(userId, {
                    user: user,
                    bestWeight: weight,
                    bestReps: parseInt(set.reps),
                    bestDate: session.date
                });
            } else {
                const current = userRecords.get(userId);
                if (weight > current.bestWeight) {
                    current.bestWeight = weight;
                    current.bestReps = parseInt(set.reps);
                    current.bestDate = session.date;
                }
            }
        });

        // Convertir en tableau et trier par poids décroissant, puis par reps si égalité
        const rankings = Array.from(userRecords.values())
            .sort((a, b) => {
                // D'abord comparer les poids
                if (b.bestWeight !== a.bestWeight) {
                    return b.bestWeight - a.bestWeight;
                }
                // Si poids égal, comparer les reps
                return b.bestReps - a.bestReps;
            });

        records.push({
            exercise: exercise,
            rankings: rankings
        });
    });

    return records;
}

// Afficher les records
function displayRecords(records) {
    // Filtrer selon le filtre actif
    let filteredRecords = records;
    if (currentFilter !== 'all') {
        filteredRecords = records.filter(r => r.exercise.category === currentFilter);
    }

    if (filteredRecords.length === 0 || filteredRecords.every(r => r.rankings.length === 0)) {
        classementList.innerHTML = `
            <div class="no-history">
                <div class="no-history-icon">🏆</div>
                <p class="no-history-text">Aucun record trouvé</p>
            </div>
        `;
        return;
    }

    classementList.innerHTML = '';

    filteredRecords.forEach(record => {
        if (record.rankings.length === 0) return;

        const recordCard = createRecordCard(record);
        classementList.appendChild(recordCard);
    });
}

// Créer une carte de record
function createRecordCard(record) {
    const card = document.createElement('div');
    card.className = 'classement-card';

    let rankingsHTML = '';

    record.rankings.forEach((ranking, index) => {
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;

        const date = new Date(ranking.bestDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        rankingsHTML += `
            <div class="ranking-item ${position <= 3 ? 'ranking-podium' : ''}">
                <div class="ranking-position">${medal}</div>
                <div class="ranking-user-info">
                    <div class="ranking-user-name">${ranking.user.username}</div>
                    <div class="ranking-details">${ranking.bestReps} × ${ranking.bestWeight}kg</div>
                    <div class="ranking-date">${date}</div>
                </div>
            </div>
        `;
    });

    card.innerHTML = `
        <div class="classement-card-header">
            <div class="classement-exercise-icon">${record.exercise.icon}</div>
            <h3 class="classement-exercise-name">${record.exercise.name}</h3>
        </div>
        <div class="classement-rankings">
            ${rankingsHTML}
        </div>
    `;

    return card;
}

// Gérer les filtres
function handleFilterClick(event) {
    const btn = event.target.closest('.filter-btn');
    if (!btn) return;

    // Retirer la classe active de tous les boutons
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

    // Ajouter la classe active au bouton cliqué
    btn.classList.add('active');

    // Mettre à jour le filtre
    currentFilter = btn.dataset.filter;

    console.log('🔍 Filtre:', currentFilter);

    // Réafficher les records
    displayRecords(allRecords);
}

// Retour au menu
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
    initClassement();

    btnBack.addEventListener('click', handleBack);

    // Filtres
    const filtersContainer = document.querySelector('.classement-filters');
    filtersContainer.addEventListener('click', handleFilterClick);
});