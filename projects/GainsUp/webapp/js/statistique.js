/* ============================================
   GainsUP - stats.js (Statistiques)
   API: stats.php
   - muscles
   - exercises by muscle_group_id
   - progress by exercise_id + metric
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
    selectedMuscleId: '',
    selectedExerciseId: '',
    selectedMetric: 'poids_max',
    chart: null
};

function $(s) { return document.querySelector(s); }

function resetSelect(el, placeholder, disabled = true) {
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>`;
    el.disabled = disabled;
}

function fillSelect(el, items, placeholder) {
    if (!el) return;
    const opts = [`<option value="">${placeholder}</option>`];
    for (const it of items) opts.push(`<option value="${it.id}">${it.name}</option>`);
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

/* =========================
   API
   ========================= */
const API = {
    fetchMuscles() {
        return getJson({ action: 'muscles' });
    },
    fetchExercises(muscleGroupId) {
        return getJson({ action: 'exercises', muscle_group_id: muscleGroupId });
    },
    fetchProgress(exerciseId, metric) {
        return getJson({ action: 'progress', exercise_id: exerciseId, metric });
    }
};

/* =========================
   CHART (Chart.js optional)
   ========================= */
function destroyChart() {
    if (state.chart) {
        state.chart.destroy();
        state.chart = null;
    }
}

async function loadAndRenderChart() {
    if (!state.selectedExerciseId) return;

    showHint('Chargement de la progression...');
    destroyChart();

    try {
        const data = await API.fetchProgress(state.selectedExerciseId, state.selectedMetric);

        // Si tu n’as pas encore Chart.js, on affiche juste un message
        const canvas = $(CONFIG.selectors.chartCanvas);
        if (!canvas || typeof Chart === 'undefined') {
            showHint(`Données prêtes (${data.labels.length} points). Ajoute Chart.js pour afficher le graphique.`);
            console.log('Progress data:', data);
            return;
        }

        // Chart.js
        state.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: state.selectedMetric,
                    data: data.values,
                    tension: 0.25
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
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
        btnBack.addEventListener('click', () => window.location.href = 'menu.html');
    }

    if (selectMuscle) {
        selectMuscle.addEventListener('change', async () => {
            state.selectedMuscleId = selectMuscle.value;
            state.selectedExerciseId = '';
            state.exercises = [];

            destroyChart();
            resetSelect(selectExercise, '-- Choisir un groupe d\'abord --', true);
            showHint("Choisis un exercice pour voir la progression.");

            if (!state.selectedMuscleId) return;

            try {
                resetSelect(selectExercise, 'Chargement...', true);
                const exos = await API.fetchExercises(state.selectedMuscleId);

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

    if (selectMetric && !selectMetric.value) selectMetric.value = state.selectedMetric;

    try {
        const muscles = await API.fetchMuscles();
        state.muscles = Array.isArray(muscles) ? muscles : [];
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
