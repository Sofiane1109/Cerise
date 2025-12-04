// ============================================
// DECLARATIONS
// ============================================
const baseApiAddress = 'https://sofianeennali-odisee.be/wm/perso/GainsUp/api/';
const userListContainer = document.getElementById('userList');
const btnAddUser = document.getElementById('btnAddUser');
const btnSubmitUser = document.getElementById('btnSubmitUser');
const addUserForm = document.getElementById('addUserForm');
const alertContainer = document.getElementById('alert');

let addUserModal;

let opties = {
    method: "GET",
    headers: {
        "Content-Type": "application/json"
    }
};

// ============================================
// EVENT HANDLERS
// ============================================

// Charger tous les utilisateurs
function getApiUsers() {
    let url = baseApiAddress + "users.php";

    console.log('🔄 Chargement des utilisateurs depuis:', url);

    // IMPORTANT : Réinitialiser complètement opties pour supprimer le body
    opties = {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    };

    fetch(url, opties)
        .then((response) => {
            console.log('📡 Réponse HTTP status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((responseData) => {
            console.log('📦 Données reçues:', responseData);

            if (responseData.status === 200 && responseData.data && Array.isArray(responseData.data)) {
                console.log('✅ Nombre d\'utilisateurs:', responseData.data.length);
                displayUsers(responseData.data);
            } else {
                console.error('❌ Format de données invalide:', responseData);
                alerter("❌ Format de données invalide", "danger");
            }
        })
        .catch((error) => {
            console.error('❌ Erreur complète:', error);
            alerter("⚠️ Erreur lors du chargement des utilisateurs: " + error.message, "danger");
        });
}

// Afficher les utilisateurs
function displayUsers(users) {
    userListContainer.innerHTML = '';

    users.forEach(user => {
        const userCard = createUserCard(user);
        userListContainer.appendChild(userCard);
    });
}

// Créer une card utilisateur
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.dataset.userId = user.user_id;
    card.dataset.username = user.username;

    card.innerHTML = `
        <div class="user-card-content">
            <div class="user-icon">${user.username.charAt(0).toUpperCase()}</div>
            <p class="user-name">${user.username}</p>
        </div>
    `;

    return card;
}

// Gérer la sélection d'un utilisateur
function handleUserSelection(event) {

    // Sinon, c'est un clic sur la card
    const card = event.target.closest('.user-card');

    if (!card) return;

    const userId = card.dataset.userId;
    const username = card.dataset.username;

    console.log('👤 Utilisateur sélectionné:', username, 'ID:', userId);

    localStorage.setItem('selectedUserId', userId);
    localStorage.setItem('selectedUsername', username);

    // Rediriger vers la page du menu principal
    window.location.href = 'menu.html';
}

// Gérer la modification d'un utilisateur
function handleEditUser(userId, username) {
    console.log('✏️ Modifier utilisateur:', username);

    // Remplir le modal avec les données actuelles
    const usernameInput = document.getElementById('username');
    usernameInput.value = username;

    // Changer le titre du modal
    const modalTitle = document.getElementById('addUserModalLabel');
    modalTitle.textContent = 'Modifier l\'utilisateur';

    // Changer le texte du bouton
    const btnSubmit = document.getElementById('btnSubmitUser');
    btnSubmit.textContent = 'Modifier';

    // Stocker l'ID pour la modification
    btnSubmit.dataset.editMode = 'true';
    btnSubmit.dataset.userId = userId;

    // Ouvrir le modal
    addUserModal.show();
}

// Gérer la suppression d'un utilisateur
function handleDeleteUser(userId, username) {
    console.log('🗑️ Supprimer utilisateur:', username);

    // Demander confirmation
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${username}" ?\n\nToutes ses séances d'entraînement seront également supprimées.`)) {
        return;
    }

    deleteApiUser(userId, username);
}

// Gérer l'ajout d'un nouvel utilisateur
function handleAddUser() {
    console.log('➕ Ouverture du modal pour ajout');

    // Réinitialiser le modal
    const modalTitle = document.getElementById('addUserModalLabel');
    modalTitle.textContent = 'Ajouter un utilisateur';

    const btnSubmit = document.getElementById('btnSubmitUser');
    btnSubmit.textContent = 'Ajouter';
    btnSubmit.dataset.editMode = 'false';
    delete btnSubmit.dataset.userId;

    document.getElementById('addUserForm').reset();

    addUserModal.show();
}

// Soumettre le formulaire d'ajout/modification
function handleSubmitUser() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    const btnSubmit = document.getElementById('btnSubmitUser');

    if (username === '') {
        alerter("❌ Veuillez entrer un nom d'utilisateur", "danger");
        return;
    }

    // Vérifier si on est en mode édition
    if (btnSubmit.dataset.editMode === 'true') {
        const userId = btnSubmit.dataset.userId;
        updateApiUser(userId, username);
    } else {
        addApiUser(username);
    }
}

// Ajouter un utilisateur via l'API
function addApiUser(username) {
    let url = baseApiAddress + "users.php";

    // Créer un nouvel objet pour POST (ne pas modifier opties global)
    let postOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username
        })
    };

    fetch(url, postOptions)
        .then((response) => response.json())
        .then((responseData) => {
            if (responseData.status === 200 || responseData.status === 201) {
                alerter("✅ Utilisateur \"" + username + "\" ajouté avec succès!", "success");
                getApiUsers();
                addUserModal.hide();
                addUserForm.reset();
            } else {
                alerter("❌ Ajout échoué: " + (responseData.message || "Erreur inconnue"), "danger");
            }
        })
        .catch((error) => {
            console.error('Erreur:', error);
            alerter("⚠️ Erreur API: " + error, "danger");
        });
}

// Modifier un utilisateur via l'API
function updateApiUser(userId, username) {
    let url = baseApiAddress + "users.php";

    let putOptions = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: userId,
            username: username
        })
    };

    fetch(url, putOptions)
        .then((response) => response.json())
        .then((responseData) => {
            if (responseData.status === 200) {
                alerter("✅ Utilisateur modifié avec succès!", "success");
                getApiUsers();
                addUserModal.hide();
                addUserForm.reset();
            } else {
                alerter("❌ Modification échouée: " + (responseData.message || "Erreur inconnue"), "danger");
            }
        })
        .catch((error) => {
            console.error('Erreur:', error);
            alerter("⚠️ Erreur API: " + error, "danger");
        });
}

// Supprimer un utilisateur via l'API
function deleteApiUser(userId, username) {
    let url = baseApiAddress + "users.php";

    let deleteOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: userId
        })
    };

    fetch(url, deleteOptions)
        .then((response) => response.json())
        .then((responseData) => {
            if (responseData.status === 200) {
                alerter("✅ Utilisateur \"" + username + "\" supprimé avec succès!", "success");
                getApiUsers();
            } else {
                alerter("❌ Suppression échouée: " + (responseData.message || "Erreur inconnue"), "danger");
            }
        })
        .catch((error) => {
            console.error('Erreur:', error);
            alerter("⚠️ Erreur API: " + error, "danger");
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
    // Initialiser le modal Bootstrap
    addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));

    // Charger les utilisateurs
    getApiUsers();

    // Attacher les événements
    userListContainer.addEventListener('click', handleUserSelection);
    btnAddUser.addEventListener('click', handleAddUser);
    btnSubmitUser.addEventListener('click', handleSubmitUser);

    // // Empêche affichage multiple : on lit une valeur dans localStorage
    // const alreadyShown = localStorage.getItem("newsPopupShown");

    // if (!alreadyShown) {
    //     const modal = new bootstrap.Modal(document.getElementById("newsModal"));
    //     modal.show();

    //     // On l’enregistre pour ne l'afficher qu'une fois
    //     localStorage.setItem("newsPopupShown", "true");
    // }
});


