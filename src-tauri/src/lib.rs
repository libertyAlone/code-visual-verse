mod commands;
#[cfg(test)]
mod commands_test;

// use tauri::menu::{Menu, Submenu, MenuItem};
// use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let _handle = app.handle();
            
            // Native menu removed for consistent dark theme UI
            /*
            // Create Language Submenu
            let lang_en = MenuItem::with_id(handle, "lang-en", "English", true, None::<&str>)?;
            let lang_zh = MenuItem::with_id(handle, "lang-zh", "中文 (Chinese)", true, None::<&str>)?;
            
            let lang_submenu = Submenu::with_items(
                handle,
                "Language / 语言",
                true,
                &[&lang_en, &lang_zh],
            )?;

            let settings_submenu = Submenu::with_items(
                handle,
                "Settings / 设置",
                true,
                &[&lang_submenu],
            )?;

            let menu = Menu::with_items(handle, &[&settings_submenu])?;
            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                match event.id.as_ref() {
                    "lang-en" => {
                        let _ = app.emit("change-lang", "en");
                    }
                    "lang-zh" => {
                        let _ = app.emit("change-lang", "zh");
                    }
                    _ => {}
                }
            });
            */

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan_project, 
            commands::read_file,
            commands::get_git_log,
            commands::get_project_git_history,
            commands::get_commit_files,
            commands::get_all_files_birth_times,
            commands::get_git_blame,
            commands::get_git_diff,
            commands::load_app_config,
            commands::save_app_config,
            commands::ai_chat
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
