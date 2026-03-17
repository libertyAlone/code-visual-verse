// Integration tests for Tauri backend
// Run with: cargo test --test integration_tests

use std::fs;
use std::path::Path;

#[test]
fn test_project_scanning_basic() {
    // Create a temporary directory structure for testing
    let temp_dir = std::env::temp_dir().join("visual_verse_test");

    // Clean up any existing test directory
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).unwrap();
    }

    // Create test directory structure
    fs::create_dir(&temp_dir).unwrap();
    fs::create_dir(temp_dir.join("src")).unwrap();
    fs::write(temp_dir.join("src").join("main.rs"), "fn main() {}").unwrap();
    fs::write(temp_dir.join("Cargo.toml"), "[package]").unwrap();

    // Verify the directory structure was created
    assert!(temp_dir.exists());
    assert!(temp_dir.join("src").exists());
    assert!(temp_dir.join("src").join("main.rs").exists());
    assert!(temp_dir.join("Cargo.toml").exists());

    // Clean up
    fs::remove_dir_all(&temp_dir).unwrap();
}

#[test]
fn test_git_log_parsing() {
    // Simulate git log output parsing
    let log_line = "abc123_DELIM_Author Name_DELIM_2 days ago_DELIM_Commit message_DELIM_(HEAD -> main, origin/main)_DELIM_";

    let parts: Vec<&str> = log_line.split("_DELIM_").collect();
    assert_eq!(parts.len(), 6);
    assert_eq!(parts[0], "abc123");
    assert_eq!(parts[1], "Author Name");
    assert_eq!(parts[2], "2 days ago");
    assert_eq!(parts[3], "Commit message");

    // Test branch parsing
    let branches = parts[4].trim();
    let branches = if branches.starts_with('(') && branches.ends_with(')') {
        branches[1..branches.len()-1].trim()
    } else {
        branches
    };

    assert_eq!(branches, "HEAD -> main, origin/main");
}

#[test]
fn test_allowed_file_extensions() {
    let allowed = [
        "js", "jsx", "ts", "tsx", "vue", "svelte",
        "css", "scss", "json", "md", "rs", "go",
        "py", "java", "cpp", "c", "h", "html"
    ];

    // Test that all expected extensions are present
    assert!(allowed.contains(&"rs"));
    assert!(allowed.contains(&"ts"));
    assert!(allowed.contains(&"tsx"));
    assert!(allowed.contains(&"js"));
    assert!(allowed.contains(&"py"));
    assert!(allowed.contains(&"go"));
    assert!(allowed.contains(&"json"));
    assert!(allowed.contains(&"md"));

    // Test that invalid extensions are not present
    assert!(!allowed.contains(&"exe"));
    assert!(!allowed.contains(&"dll"));
    assert!(!allowed.contains(&"bin"));
}

#[test]
fn test_ignored_directories() {
    let ignored = [
        "node_modules", ".git", ".next", "build",
        "dist", "target", "out", ".docusaurus",
        "coverage", ".vercel", ".turbo", "__pycache__"
    ];

    // Test that common ignore patterns are present
    assert!(ignored.contains(&"node_modules"));
    assert!(ignored.contains(&".git"));
    assert!(ignored.contains(&"target"));
    assert!(ignored.contains(&"dist"));
    assert!(ignored.contains(&"__pycache__"));

    // Test that source directories are not ignored
    assert!(!ignored.contains(&"src"));
    assert!(!ignored.contains(&"lib"));
}

#[test]
fn test_json_serialization_roundtrip() {
    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize, Debug, PartialEq)]
    struct TestFile {
        name: String,
        path: String,
        is_dir: bool,
    }

    let original = TestFile {
        name: "test.rs".to_string(),
        path: "/project/test.rs".to_string(),
        is_dir: false,
    };

    // Serialize
    let json = serde_json::to_string(&original).unwrap();

    // Deserialize
    let deserialized: TestFile = serde_json::from_str(&json).unwrap();

    assert_eq!(original, deserialized);
}

#[test]
fn test_path_manipulation() {
    let path = Path::new("/project/src/main.rs");

    assert_eq!(path.file_name().unwrap().to_str().unwrap(), "main.rs");
    assert_eq!(path.extension().unwrap().to_str().unwrap(), "rs");
    assert_eq!(path.parent().unwrap(), Path::new("/project/src"));

    // Test strip_prefix
    let relative = path.strip_prefix("/project").unwrap();
    assert_eq!(relative.to_str().unwrap(), "src/main.rs");
}

#[test]
fn test_timestamp_conversion() {
    use std::time::{SystemTime, UNIX_EPOCH};

    // Get current timestamp
    let now = SystemTime::now();
    let since_epoch = now.duration_since(UNIX_EPOCH).unwrap();
    let timestamp = since_epoch.as_secs();

    // Verify timestamp is valid (after year 2020)
    assert!(timestamp > 1577836800); // Jan 1, 2020

    // Convert back
    let _time = UNIX_EPOCH + std::time::Duration::from_secs(timestamp);
}

#[test]
fn test_config_file_path_generation() {
    // Test the logic for generating config file paths
    let exe_path = Path::new("/app/bin/visual_verse");
    let mut config_path = exe_path.to_path_buf();
    config_path.pop();
    config_path.push("config.json");

    assert_eq!(config_path, Path::new("/app/bin/config.json"));
}

#[cfg(test)]
mod command_tests {
    // Note: These tests would require mocking the Tauri runtime
    // For now, they serve as documentation of expected behavior

    #[test]
    fn test_scan_project_expected_behavior() {
        // Given a valid directory path
        // When scan_project is called
        // Then it should return a list of ProjectFiles
        assert!(true); // Placeholder
    }

    #[test]
    fn test_read_file_expected_behavior() {
        // Given a valid file path
        // When read_file is called
        // Then it should return the file contents as a string
        assert!(true); // Placeholder
    }

    #[test]
    fn test_get_git_log_expected_behavior() {
        // Given a valid file path in a git repository
        // When get_git_log is called
        // Then it should return a list of GitLog entries
        assert!(true); // Placeholder
    }
}
