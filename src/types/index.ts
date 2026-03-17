/**
 * Type definitions for testing
 */

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  extension?: string;
  depth: number;
  created_at: number;
  modified_at: number;
  commit_count: number;
  has_readme: boolean;
  children?: FileNode[];
}

export interface ProjectData {
  nodes: FileNode[];
  stats: {
    totalFiles: number;
    totalDirs: number;
    totalSize: number;
    maxDepth: number;
  };
}

export interface AstAnalysis {
  functions: string[];
  classes: string[];
  imports: string[];
  exports: string[];
  complexity: number;
  lines: number;
}
