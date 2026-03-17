use std::path::{Path, PathBuf};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
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
pub async fn scan_project(
    path: String, 
    only_src: bool, 
    max_depth: usize,
    ignore_dot_files: bool,
    ignore_gitignore: bool
) -> Result<Vec<ProjectFile>, String> {
    println!("Scanning project at: {:?}", path);
    println!("Options: only_src={}, max_depth={}, ignore_dot_files={}, ignore_gitignore={}", only_src, max_depth, ignore_dot_files, ignore_gitignore);
    
    let mut files = Vec::new();
    let mut seen_paths = std::collections::HashSet::new();
    let root = Path::new(&path);

    if !root.exists() {
        println!("Error: Path does not exist");
        return Err("Path does not exist".to_string());
    }

    let scan_root: PathBuf = if only_src && root.join("src").exists() {
        println!("Scanning 'src' directory");
        root.join("src")
    } else {
        println!("Scanning root directory");
        root.to_path_buf()
    };

    let walk_max = max_depth + 1;

    let ignore_list = [
        "node_modules", ".git", ".next", "build", "dist", "target",
        "out", ".docusaurus", "coverage", ".vercel", ".turbo", "__pycache__"
    ];

    let allowed_exts = [
        "js", "jsx", "ts", "tsx", "vue", "svelte", "css", "scss", "json",
        "md", "rs", "go", "py", "java", "cpp", "c", "h", "html"
    ];

    println!("Scan root: {:?}", scan_root);
    println!("Walk max depth: {:?}", walk_max);

    let mut builder = ignore::WalkBuilder::new(&scan_root);
    builder
        .max_depth(Some(walk_max))
        .hidden(ignore_dot_files)
        .git_ignore(ignore_gitignore)
        .git_global(ignore_gitignore)
        .git_exclude(ignore_gitignore)
        .require_git(false)
        .sort_by_file_name(|a, b| a.cmp(b));

    for result in builder.build() {
        let entry = match result {
            Ok(e) => e,
            Err(err) => {
                println!("Walk error: {:?}", err);
                continue;
            },
        };

        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(err) => {
                println!("Metadata error for {:?}: {:?}", entry.path(), err);
                continue;
            },
        };

        let entry_path = entry.path().to_string_lossy().to_string();
        if seen_paths.contains(&entry_path) {
            continue;
        }

        let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
        let name = entry.file_name().to_string_lossy().to_string();

        // Robust ignored check: only ignore if the folder itself is in the ignore_list
        // and it's relative to the scan root.
        let is_ignored = entry.path().strip_prefix(&scan_root)
            .ok()
            .map(|rel| {
                rel.components().any(|c| {
                    if let Some(s) = c.as_os_str().to_str() {
                        ignore_list.contains(&s)
                    } else {
                        false
                    }
                })
            })
            .unwrap_or(false);

        if is_ignored {
            // println!("Skipping ignored: {:?}", entry.path());
            continue;
        }

        if !is_dir {
            let ext = entry.path().extension().and_then(|s| s.to_str()).unwrap_or("");
            if !allowed_exts.contains(&ext) {
                // println!("Skipping unsupported extension: {:?}", entry.path());
                continue;
            }
        }
        
        // println!("Valid entry: {:?}", entry.path());

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
            let relative_path = entry.path().strip_prefix(&scan_root)
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|_| entry_path.clone());

            let git_dir = scan_root.join(".git");
            let git_dir_alt = root.join(".git");

            if git_dir.exists() || git_dir_alt.exists() {
                let git_parent = if git_dir.exists() {
                    &scan_root
                } else {
                    root
                };

                let mut cmd = std::process::Command::new("git");
                cmd.current_dir(git_parent)
                   .args(["rev-list", "--count", "HEAD", "--", &relative_path]);
                
                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    cmd.creation_flags(0x08000000);
                }

                if let Ok(output) = cmd.output() {
                    if output.status.success() {
                        let count_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                        commit_count = count_str.parse::<u32>().unwrap_or(0);
                    }
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

    println!("Found {} valid files", files.len());
    Ok(files)
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[derive(Serialize, Deserialize, Debug)]
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

    let mut cmd = std::process::Command::new("git");
    cmd.current_dir(parent)
       .args(["log", "--pretty=format:%H_DELIM_%an_DELIM_%ct_DELIM_%s_DELIM_%d_DELIM_", "--decorate=short", "-n", "20", "--", &path]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;

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
pub async fn get_project_git_history(path: String) -> Result<Vec<GitLog>, String> {
    let mut cmd = std::process::Command::new("git");
    cmd.current_dir(&path)
       .args(["log", "--pretty=format:%H_DELIM_%an_DELIM_%ct_DELIM_%s_DELIM_%d_DELIM_", "--decorate=short", "-n", "100"]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;

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
pub async fn get_commit_files(path: String, hash: String) -> Result<Vec<String>, String> {
    let mut cmd = std::process::Command::new("git");
    cmd.current_dir(&path)
       .args(["show", "--name-only", "--pretty=format:", &hash]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Ok(Vec::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let files = stdout.lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();

    Ok(files)
}

#[tauri::command]
pub async fn get_all_files_birth_times(path: String) -> Result<std::collections::HashMap<String, u64>, String> {
    let mut cmd = std::process::Command::new("git");
    cmd.current_dir(&path)
       .args(["log", "--reverse", "--diff-filter=A", "--pretty=format:%ct", "--name-only", "--", "."]);
    
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;
    
    if !output.status.success() {
        return Ok(std::collections::HashMap::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut birth_times = std::collections::HashMap::new();
    let mut current_time: u64 = 0;

    for line in stdout.lines() {
        let line = line.trim().replace("\\", "/");
        if line.is_empty() { continue; }

        if let Ok(ts) = line.parse::<u64>() {
            current_time = ts;
        } else {
            // Clean paths: remove relative prefix if any
            let clean_path = line.trim_start_matches("./").to_string();
            birth_times.insert(clean_path, current_time);
        }
    }

    Ok(birth_times)
}

#[tauri::command]
pub async fn get_git_blame(path: String) -> Result<String, String> {
    let path_obj = Path::new(&path);
    let parent = path_obj.parent().unwrap_or(Path::new("."));

    let mut cmd = std::process::Command::new("git");
    cmd.current_dir(parent)
       .args(["blame", "--", &path]);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Ok("No blame info".to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn get_git_diff(path: String, hash: String) -> Result<String, String> {
    let path_obj = Path::new(&path);
    let parent = path_obj.parent().unwrap_or(Path::new("."));

    let mut cmd = std::process::Command::new("git");
    cmd.current_dir(parent)
       .args(["show", &hash, "--", &path]);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd.output().map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to get diff".to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
#[tauri::command]
pub async fn load_app_config() -> Result<String, String> {
    let mut config_path = std::env::current_exe().map_err(|e| e.to_string())?;
    config_path.pop(); // Remove exe name
    config_path.push("config.json");

    if config_path.exists() {
        std::fs::read_to_string(config_path).map_err(|e| e.to_string())
    } else {
        Ok("{}".to_string())
    }
}

#[tauri::command]
pub async fn save_app_config(config: String) -> Result<(), String> {
    let mut config_path = std::env::current_exe().map_err(|e| e.to_string())?;
    config_path.pop();
    config_path.push("config.json");

    std::fs::write(config_path, config).map_err(|e| e.to_string())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[tauri::command]
pub async fn ai_chat(
    protocol: String,
    base_url: String,
    api_key: String,
    model: String,
    messages: Vec<ChatMessage>
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    if protocol == "openai" {
        let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));
        let body = serde_json::json!({
            "model": model,
            "messages": messages,
            "stream": false
        });

        let response = client.post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            let err_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("OpenAI API Error: {}", err_text));
        }

        let res_json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        let content = res_json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("Invalid response from OpenAI")?
            .to_string();

        Ok(content)
    } else if protocol == "anthropic" {
        let url = format!("{}/v1/messages", base_url.trim_end_matches('/'));
        
        let system = messages.iter()
            .find(|m| m.role == "system")
            .map(|m| m.content.clone())
            .unwrap_or_default();
            
        let anthropic_messages: Vec<serde_json::Value> = messages.iter()
            .filter(|m| m.role != "system")
            .map(|m| serde_json::json!({
                "role": if m.role == "assistant" { "assistant" } else { "user" },
                "content": m.content
            }))
            .collect();

        let body = serde_json::json!({
            "model": model,
            "system": system,
            "messages": anthropic_messages,
            "max_tokens": 4096
        });

        let response = client.post(url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            let err_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("Anthropic API Error: {}", err_text));
        }

        let res_json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        let content = res_json["content"][0]["text"]
            .as_str()
            .ok_or("Invalid response from Anthropic")?
            .to_string();

        Ok(content)
    } else {
        Err("Unsupported protocol".to_string())
    }
}
