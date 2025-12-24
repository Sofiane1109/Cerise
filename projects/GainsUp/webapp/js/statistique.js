const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const alertContainer = document.getElementById('alert');

const muscleSelect = document.getElementById('muscleSelect');
const exerciseSelect = document.getElementById('exerciseSelect');
const metricSelect = document.getElementById('metricSelect');
const hint = document.getElementById('hint');

let chart;
let exercises = [];

function alerter(message, type = "info") {
    alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
}

function getLoggedUserId() {
    // compat login + ancien système
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            const u = JSON.parse(userStr);
            if (u?.user_id) return u.user_id;
        } catch { }
    }
    const old = localStorage.getItem("selectedUserId");
    return old ? parseInt(old, 10) : null;
}

async function loadExercises() {
    const res = await fetch(baseApiAddress + "exercises.php", { method: "GET" });
    const data = await res.json();

    if (!res.ok) throw new Error("Erreur chargement exercices");
    exercises = Array.isArray(data.data) ? data.data : [];

    // groupes uniques
    const groups = [...new Set(exercises.map(e => e.muscle_group))].sort((a, b) => a.localeCompare(b));
    muscleSelect.innerHTML = `<option value="">-- Choisir --</option>` + groups.map(g => `<option value="${g}">${g}</option>`).join("");
}

function populateExercises(group) {
    const list = exercises.filter(e => e.muscle_group === group);

    exerciseSelect.disabled = list.length === 0;
    exerciseSelect.innerHTML =
        list.length === 0
            ? `<option value="">-- Aucun exercice --</option>`
            : `<option value="">-- Choisir --</option>` + list.map(e => `<option value="${e.exercise_id}">${e.name}</option>`).join("");
}

function initChart() {
    const ctx = document.getElementById("statsChart");
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Progression",
                data: [],
                tension: 0.25
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

async function loadStats(userId, exerciseId, metric) {
    const res = await fetch(baseApiAddress + "stats.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, exercise_id: parseInt(exerciseId, 10), metric })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.data || "Erreur stats");

    const points = Array.isArray(data.data) ? data.data : [];

    chart.data.labels = points.map(p => p.label);
    chart.data.datasets[0].data = points.map(p => p.value);

    const metricLabel =
        metric === "best_1rm" ? "1RM estimé" :
            metric === "volume" ? "Volume (kg)" :
                "Poids max";

    chart.data.datasets[0].label = metricLabel;
    chart.update();

    hint.textContent = points.length
        ? `✅ ${points.length} points chargés`
        : `Aucune donnée pour cet exercice.`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const userId = getLoggedUserId();
    if (!userId) {
        alerter("⚠️ Connecte-toi d'abord", "warning");
        setTimeout(() => window.location.href = "index.html", 800);
        return;
    }

    initChart();

    try {
        await loadExercises();
    } catch (e) {
        console.error(e);
        alerter("❌ Impossible de charger les exercices", "danger");
    }

    muscleSelect.addEventListener("change", () => {
        populateExercises(muscleSelect.value);
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
        hint.textContent = "Choisis un exercice pour voir la progression.";
    });

    async function refresh() {
        const group = muscleSelect.value;
        const exerciseId = exerciseSelect.value;
        const metric = metricSelect.value;

        if (!group || !exerciseId) return;

        try {
            await loadStats(userId, exerciseId, metric);
        } catch (e) {
            console.error(e);
            alerter("❌ " + e.message, "danger");
        }
    }

    exerciseSelect.addEventListener("change", refresh);
    metricSelect.addEventListener("change", refresh);
});
