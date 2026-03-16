use std::path::Path;
use walkdir::WalkDir;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct ProjectFile {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub extension: Option<String>,
    pub created_at: u64,
    pub modified_at: u64,
    pub commit_count: u32,
    pub has_readme: bool,
}

#[tauri::command]
pub async fn scan_project(path: String, only_src: bool, max_depth: usize) -> Result<Vec<ProjectFile>, String> {
    let mut files = Vec::new();
    let mut seen_paths = std::collections::HashSet::new();
    let root = Path::new(&path);

    if !root.exists() {
        return Err("Path does not exist".to_string());
    }

    // Determine the root for scanning
    let scan_root = if only_src && root.join("src").exists() {
        root.join("src")
    } else {
        root.to_path_buf()
    };

    // User's "directory depth 1" means they want to see files inside 1 level of folders.
    // WalkDir depth 1 is children of root. Files inside children are depth 2.
    let walk_max = max_depth + 1;

    let ignore_list = [
        "node_modules", ".git", ".next", "build", "dist", "target", 
        "out", ".docusaurus", "coverage", ".vercel", ".turbo", "__pycache__"
    ];
    
    let allowed_exts = [
        "js", "jsx", "ts", "tsx", "vue", "svelte", "css", "scss", "json", 
        "md", "rs", "go", "py", "java", "cpp", "c", "h", "html"
    ];

    for entry in WalkDir::new(&scan_root)
        .max_depth(walk_max)
        .sort_by_file_name()
        .into_iter()
        .filter_map(|e| e.ok()) {
            
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };

            let entry_path = entry.path().to_string_lossy().to_string();
            if seen_paths.contains(&entry_path) {
                continue;
            }

            let is_dir = entry.file_type().is_dir();
            let name = entry.file_name().to_string_lossy().to_string();
            
            if name.starts_with('.') && name != ".env" {
                continue;
            }

            let is_ignored = entry.path().components().any(|c| {
                if let Some(s) = c.as_os_str().to_str() {
                    ignore_list.contains(&s)
                } else {
                    false
                }
            });

            if is_ignored {
                continue;
            }

            if !is_dir {
                let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
                if !allowed_exts.contains(&ext) {
                    continue;
                }
            }

            let created_at = metadata.created()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            let modified_at = metadata.modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            seen_paths.insert(entry_path.clone());
            
            let mut commit_count = 0;
            if !is_dir {
                if let Ok(output) = std::process::Command::new("git")
                    .current_dir(&scan_root)
                    .args(["rev-list", "--count", "HEAD", "--", &entry_path])
                    .output() {
                        if output.status.success() {
                            let count_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                            commit_count = count_str.parse::<u32>().unwrap_or(0);
                        }
                    }
            }

            let has_readme = if is_dir {
                entry.path().join("README.md").exists()
            } else {
                false
            };

            files.push(ProjectFile {
                name,
                path: entry_path,
                is_dir,
                size: metadata.len(),
                extension: if is_dir { None } else { 
                    entry.path().extension().map(|e| e.to_string_lossy().to_string()) 
                },
                created_at,
                modified_at,
                commit_count,
                has_readme,
            });
    }

    Ok(files)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[derive(Serialize, Deserialize)]
pub struct GitLog {
    pub hash: String,
    pub author: String,
    pub date: String,
    pub message: String,
    pub branches: String,
}

#[tauri::command]
pub async fn get_git_log(path: String) -> Result<Vec<GitLog>, String> {
    let path_obj = Path::new(&path);
    let parent = path_obj.parent().unwrap_or(Path::new("."));

    let output = std::process::Command::new("git")
        .current_dir(parent)
        .args(["log", "--pretty=format:%H_DELIM_%an_DELIM_%ar_DELIM_%s_DELIM_%d_DELIM_", "--decorate=short", "-n", "20", "--", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Ok(Vec::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let logs = stdout.lines().filter_map(|line| {
        let parts: Vec<&str> = line.split("_DELIM_").collect();
        if parts.len() >= 5 {
            let branches = parts[4].trim();
            let branches = if branches.starts_with('(') && branches.ends_with(')') {
                branches[1..branches.len()-1].trim()
            } else {
                branches
            }.to_string();
            
            Some(GitLog {
                hash: parts[0].to_string(),
                author: parts[1].to_string(),
                date: parts[2].to_string(),
                message: parts[3].to_string(),
                branches,
            })
        } else {
            None
        }
    }).collect();

    Ok(logs)
}

#[tauri::command]
pub async fn get_git_blame(path: String) -> Result<String, String> {
    let path_obj = Path::new(&path);
    let parent = path_obj.parent().unwrap_or(Path::new("."));

    let output = std::process::Command::new("git")
        .current_dir(parent)
        .args(["blame", "--", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Ok("No blame info".to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn get_git_diff(path: String, hash: String) -> Result<String, String> {
    let path_obj = Path::new(&path);
    let parent = path_obj.parent().unwrap_or(Path::new("."));

    let output = std::process::Command::new("git")
        .current_dir(parent)
        .args(["show", &hash, "--", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to get diff".to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
