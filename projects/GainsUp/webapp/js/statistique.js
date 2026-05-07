/* ============================================
   GainsUP - statistique.js (Statistiques)
   API: stats.php
   - action=muscles -> retourne groupes musculaires (array OU {data: array})
   - action=exercises&muscle_group=... -> exercices d'un groupe (array OU {data: array})
   - action=progress&exercise_id=...&metric=... -> {labels,values} OU {data:{labels,values}}
   ============================================ */

const CONFIG = {
    baseApi: 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/',
    endpoint: 'stats.php',
    selectors: {
        btnBack: '#btnBack',
        selectMuscle: '#selectMuscle',
        selectExercise: '#selectExercise',
        selectMetric: '#selectMetric',
        chartHint: '#chartHint',
        chartCanvas: '#progressChart'
    }
};

const state = {
    muscles: [],
    exercises: [],
    selectedMuscleGroup: '',
    selectedExerciseId: '',
    selectedMetric: 'poids_max',
    chart: null
};

function $(s) {
    return document.querySelector(s);
}

function unwrap(payload) {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        let d = payload.data;

        // 🔥 Si base.php renvoie data comme STRING JSON -> on parse
        if (typeof d === 'string') {
            try { d = JSON.parse(d); } catch (e) { /* ignore */ }
        }
        return d;
    }
    return payload;
}


function resetSelect(el, placeholder, disabled = true) {
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>`;
    el.disabled = disabled;
}

function fillSelect(el, items, placeholder) {
    if (!el) return;

    const opts = [`<option value="">${placeholder}</option>`];
    for (const it of items) {
        // it.id et it.name attendus
        opts.push(`<option value="${it.id}">${it.name}</option>`);
    }

    el.innerHTML = opts.join('');
    el.disabled = false;
}

function showHint(msg) {
    const hint = $(CONFIG.selectors.chartHint);
    if (hint) hint.textContent = msg;
}

async function getJson(params) {
    const url = new URL(CONFIG.baseApi + CONFIG.endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${t}`);
    }

    return res.json();
}

function getSelectedUserId() {
    // adapte si ton nom de clé est différent
    return localStorage.getItem('selectedUserId') || localStorage.getItem('selected_user_id') || '';
}


/* =========================
   API
   ========================= */
const API = {
    fetchMuscles() {
        return getJson({ action: 'muscles' });
    },
    fetchExercises(muscleGroup) {
        // ✅ stats.php attend "muscle_group"
        return getJson({ action: 'exercises', muscle_group: muscleGroup });
    },
    fetchProgress(exerciseId, metric) {
        const userId = getSelectedUserId();
        return getJson({ action: 'progress', exercise_id: exerciseId, user_id: userId, metric });
    }
};

/* =========================
   CHART (Chart.js)
   ========================= */
function destroyChart() {
    if (state.chart) {
        state.chart.destroy();
        state.chart = null;
    }
}

function metricLabel(metric) {
    if (metric === 'poids_max') return 'Poids max (kg)';
    if (metric === 'reps_max') return 'Reps max';
    if (metric === 'volume') return 'Volume (kg×reps)';
    return metric;
}

async function loadAndRenderChart() {
    if (!state.selectedExerciseId) return;

    showHint('Chargement de la progression...');
    destroyChart();

    try {
        const payload = await API.fetchProgress(state.selectedExerciseId, state.selectedMetric);
        const data = unwrap(payload) || { labels: [], values: [] };

        const labels = Array.isArray(data.labels) ? data.labels : [];
        const values = Array.isArray(data.values) ? data.values.map(Number) : [];


        if (labels.length === 0) {
            showHint("Aucune donnée pour cet exercice.");
            return;
        }

        const canvas = $(CONFIG.selectors.chartCanvas);
        if (!canvas) {
            showHint("Canvas introuvable.");
            return;
        }

        if (typeof Chart === 'undefined') {
            showHint(`Données prêtes (${labels.length} points). Ajoute Chart.js pour afficher le graphique.`);
            console.log('Progress data:', data);
            return;
        }

        state.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: metricLabel(state.selectedMetric),
                    data: values,
                    tension: 0.25
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        showHint('');
    } catch (e) {
        console.error(e);
        showHint("Erreur chargement progression.");
    }
}

/* =========================
   EVENTS
   ========================= */
function bindEvents() {
    const btnBack = $(CONFIG.selectors.btnBack);
    const selectMuscle = $(CONFIG.selectors.selectMuscle);
    const selectExercise = $(CONFIG.selectors.selectExercise);
    const selectMetric = $(CONFIG.selectors.selectMetric);

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = 'menu.html';
        });
    }

    if (selectMuscle) {
        selectMuscle.addEventListener('change', async () => {
            state.selectedMuscleGroup = selectMuscle.value;
            state.selectedExerciseId = '';
            state.exercises = [];

            destroyChart();
            resetSelect(selectExercise, '-- Choisir un groupe d\'abord --', true);
            showHint("Choisis un exercice pour voir la progression.");

            if (!state.selectedMuscleGroup) return;

            try {
                resetSelect(selectExercise, 'Chargement...', true);

                const payload = await API.fetchExercises(state.selectedMuscleGroup);
                const exos = unwrap(payload);

                state.exercises = Array.isArray(exos) ? exos : [];

                if (state.exercises.length === 0) {
                    resetSelect(selectExercise, 'Aucun exercice', true);
                    showHint("Aucun exercice pour ce groupe.");
                    return;
                }

                fillSelect(selectExercise, state.exercises, '-- Choisir un exercice --');
            } catch (e) {
                console.error(e);
                resetSelect(selectExercise, 'Erreur chargement', true);
                showHint("Impossible de charger les exercices.");
            }
        });
    }

    if (selectExercise) {
        selectExercise.addEventListener('change', () => {
            state.selectedExerciseId = selectExercise.value;

            if (!state.selectedExerciseId) {
                destroyChart();
                showHint("Choisis un exercice pour voir la progression.");
                return;
            }

            loadAndRenderChart();
        });
    }

    if (selectMetric) {
        selectMetric.addEventListener('change', () => {
            state.selectedMetric = selectMetric.value || 'poids_max';
            if (state.selectedExerciseId) loadAndRenderChart();
        });
    }
}

/* =========================
   INIT
   ========================= */
async function initStats() {
    const selectMuscle = $(CONFIG.selectors.selectMuscle);
    const selectExercise = $(CONFIG.selectors.selectExercise);
    const selectMetric = $(CONFIG.selectors.selectMetric);

    resetSelect(selectMuscle, 'Chargement...', true);
    resetSelect(selectExercise, '-- Choisir un groupe d\'abord --', true);
    showHint("Choisis un exercice pour voir la progression.");

    if (selectMetric && !selectMetric.value) {
        selectMetric.value = state.selectedMetric;
    }

    try {
        const payload = await API.fetchMuscles();
        const muscles = unwrap(payload);

        state.muscles = Array.isArray(muscles) ? muscles : [];

        if (state.muscles.length === 0) {
            resetSelect(selectMuscle, 'Aucun groupe', true);
            showHint("Aucun groupe musculaire trouvé.");
            return;
        }

        fillSelect(selectMuscle, state.muscles, '-- Choisir --');
    } catch (e) {
        console.error(e);
        resetSelect(selectMuscle, 'Erreur chargement', true);
        showHint("Impossible de charger les groupes musculaires.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initStats();
});
