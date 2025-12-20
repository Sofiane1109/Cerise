function initMenu() {
    // ✅ Nouveau système : user (depuis login)
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            const user = JSON.parse(userStr);

            if (user && user.user_id != null && user.username) {
                // Compat ancienne logique (au cas où d'autres pages l'utilisent)
                localStorage.setItem("selectedUserId", String(user.user_id));
                localStorage.setItem("selectedUsername", String(user.username));

                displayUserInfo(user.username);
                checkActiveSession();
                return;
            }
        } catch (e) {
            console.warn("user localStorage invalide", e);
        }
    }

    // ✅ Ancien fallback (si jamais tu l’utilises encore)
    const selectedUserId = localStorage.getItem("selectedUserId");
    const selectedUsername = localStorage.getItem("selectedUsername");

    if (!selectedUserId || !selectedUsername) {
        alerter("⚠️ Veuillez d'abord vous connecter", "warning");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 800);
        return;
    }

    displayUserInfo(selectedUsername);
    checkActiveSession();
}
