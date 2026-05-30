use tauri_plugin_notification::NotificationExt;

/// Called from the React frontend via `invoke('send_notification', { title, body })`.
/// Fires a native Windows notification using tauri-plugin-notification.
#[tauri::command]
fn send_notification(app: tauri::AppHandle, title: String, body: String) {
    let _ = app
        .notification()
        .builder()
        .title(&title)
        .body(&body)
        .show();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![send_notification])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
