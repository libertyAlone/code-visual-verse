import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

export interface FileAnalysis {
  functions: string[];
  complexity: number;
  imports: string[];
}

export const processFile = (content: string, filename: string): FileAnalysis => {
  const functions: string[] = [];
  const imports: string[] = [];
  let complexity = 0;

  if (!content || content.trim().length === 0) {
    return { functions: [], complexity: 0, imports: [] };
  }

  try {
    const isTS = filename.endsWith(".ts") || filename.endsWith(".tsx");
    const isJSX = filename.endsWith(".jsx") || filename.endsWith(".tsx");

    const ast = parser.parse(content, {
      sourceType: "module",
      errorRecovery: true, // Be more resilient to parse errors
      plugins: [
        isTS ? "typescript" : "flow",
        isJSX ? "jsx" : [],
        "decorators-legacy",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "exportDefaultFrom",
        "dynamicImport",
        "objectRestSpread",
      ].flat() as any,
    });

    traverse(ast, {
      // Extract function names and calculate complexity
      FunctionDeclaration(path) {
        if (path.node.id) {
          functions.push(path.node.id.name);
          complexity += 2; // Functions increase complexity
        }
      },
      FunctionExpression(path) {
        complexity++;
        if (path.parentPath.isVariableDeclarator()) {
           const id = (path.parentPath.node as any).id;
           if (id && id.name) functions.push(id.name);
        }
      },
      ArrowFunctionExpression(path) {
        complexity++;
        if (path.parentPath.isVariableDeclarator()) {
          const id = (path.parentPath.node as any).id;
          if (id && id.type === "Identifier") {
            functions.push(id.name);
          }
        }
      },
      ClassMethod(path) {
        complexity += 2;
        if (path.node.key.type === "Identifier") {
          functions.push(path.node.key.name);
        }
      },
      // Complexity markers
      IfStatement() { complexity++; },
      SwitchCase() { complexity++; },
      ForStatement() { complexity++; },
      WhileStatement() { complexity++; },
      CatchClause() { complexity++; },
      LogicalExpression() { complexity++; },
      
      // Extract imports
      ImportDeclaration(path) {
        imports.push(path.node.source.value);
      },
      CallExpression(path) {
        if (
          path.node.callee.type === "Identifier" && 
          path.node.callee.name === "require" &&
          path.node.arguments[0]?.type === "StringLiteral"
        ) {
          imports.push(path.node.arguments[0].value);
        }
      }
    });

    return { functions, complexity: Math.max(1, complexity), imports };
  } catch (error) {
    console.error(`AST error for ${filename}:`, error);
    // Return partial results if some functions were already found
    return { functions, complexity: Math.max(1, complexity), imports };
  }
};
