use tauri::Manager;
use tauri::{WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
async fn create_widget_window(app: tauri::AppHandle, id: String) {
    if app.get_webview_window(&id).is_some() { return; }
    let _ = WebviewWindowBuilder::new(&app, &id, WebviewUrl::App("index.html".into()))
        .transparent(true)
        .decorations(false)
        .always_on_top(false)
        .shadow(false)
        .focused(false)
        .inner_size(400.0, 300.0)
        .build();
}

#[tauri::command]
async fn update_widget_geometry(app: tauri::AppHandle, id: String, x: f64, y: f64, width: f64, height: f64) {
    if let Some(win) = app.get_webview_window(&id) {
        let _ = win.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: x as i32, y: y as i32 }));
        let _ = win.set_size(tauri::Size::Physical(tauri::PhysicalSize { width: width as u32, height: height as u32 }));
    }
}

#[tauri::command]
async fn set_widget_state(app: tauri::AppHandle, id: String, visible: bool, ghost: bool) {
    if let Some(win) = app.get_webview_window(&id) {
        if visible { let _ = win.show(); } else { let _ = win.hide(); }
        let _ = win.set_ignore_cursor_events(ghost);
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_widget_window, update_widget_geometry, set_widget_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}