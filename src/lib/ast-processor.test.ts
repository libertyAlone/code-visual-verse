import { describe, it, expect } from 'vitest';
import { processFile } from './ast-processor';

describe('ast-processor', () => {
  describe('processFile - JavaScript/TypeScript', () => {
    it('should extract function declarations', () => {
      const code = `
        function hello() { return 'world'; }
        function foo() { return 'bar'; }
      `;
      const result = processFile(code, 'test.js');
      expect(result.functions).toContain('hello');
      expect(result.functions).toContain('foo');
      expect(result.functions.length).toBe(2);
    });

    it('should extract arrow functions assigned to variables', () => {
      const code = `
        const myFunc = () => {};
        const anotherFunc = (x) => x * 2;
      `;
      const result = processFile(code, 'test.js');
      expect(result.functions).toContain('myFunc');
      expect(result.functions).toContain('anotherFunc');
    });

    it('should extract function expressions', () => {
      const code = `
        const myFunc = function() {};
      `;
      const result = processFile(code, 'test.js');
      expect(result.functions).toContain('myFunc');
    });

    it('should extract class methods', () => {
      const code = `
        class MyClass {
          method1() {}
          method2() {}
        }
      `;
      const result = processFile(code, 'test.js');
      expect(result.functions).toContain('method1');
      expect(result.functions).toContain('method2');
    });

    it('should extract ES6 imports', () => {
      const code = `
        import React from 'react';
        import { useState } from 'react';
        import lodash from 'lodash';
      `;
      const result = processFile(code, 'test.js');
      expect(result.imports).toContain('react');
      expect(result.imports).toContain('lodash');
    });

    it('should extract CommonJS requires', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');
      `;
      const result = processFile(code, 'test.js');
      expect(result.imports).toContain('fs');
      expect(result.imports).toContain('path');
    });

    it('should calculate complexity for function declarations', () => {
      const code = `
        function simple() { return 1; }
      `;
      const result = processFile(code, 'test.js');
      expect(result.complexity).toBeGreaterThanOrEqual(1);
    });

    it('should increase complexity for if statements', () => {
      const code = `
        function withIf(x) {
          if (x) { return 1; }
          return 0;
        }
      `;
      const result1 = processFile(code, 'test.js');

      const codeNoIf = `
        function noIf() { return 0; }
      `;
      const result2 = processFile(codeNoIf, 'test.js');

      expect(result1.complexity).toBeGreaterThan(result2.complexity);
    });

    it('should increase complexity for loops', () => {
      const code = `
        function withLoop() {
          for (let i = 0; i < 10; i++) {}
        }
      `;
      const result = processFile(code, 'test.js');
      expect(result.complexity).toBeGreaterThan(1);
    });

    it('should handle TypeScript files', () => {
      const code = `
        interface Props {
          name: string;
        }
        const Component: React.FC<Props> = ({ name }) => {
          return <div>{name}</div>;
        };
      `;
      const result = processFile(code, 'test.tsx');
      expect(result.functions).toContain('Component');
    });

    it('should handle TSX files', () => {
      const code = `
        import React from 'react';
        export const App = () => <div>Hello</div>;
      `;
      const result = processFile(code, 'test.tsx');
      expect(result.functions).toContain('App');
      expect(result.imports).toContain('react');
    });

    it('should handle empty content', () => {
      const result = processFile('', 'test.js');
      expect(result.functions).toEqual([]);
      expect(result.imports).toEqual([]);
      expect(result.complexity).toBe(0);
    });

    it('should handle whitespace only content', () => {
      const result = processFile('   \n\t  ', 'test.js');
      expect(result.functions).toEqual([]);
      expect(result.imports).toEqual([]);
      expect(result.complexity).toBe(0);
    });

    it('should handle syntax errors gracefully', () => {
      const code = `
        function broken() {
          // Invalid syntax below
          const x =
        }
        function valid() { return 1; }
      `;
      const result = processFile(code, 'test.js');
      // Should return partial results or empty, not throw
      expect(result).toBeDefined();
      expect(Array.isArray(result.functions)).toBe(true);
      expect(Array.isArray(result.imports)).toBe(true);
    });

    it('should calculate complexity for switch statements', () => {
      const code = `
        function withSwitch(x) {
          switch(x) {
            case 1: return 'one';
            case 2: return 'two';
            default: return 'other';
          }
        }
      `;
      const result = processFile(code, 'test.js');
      expect(result.complexity).toBeGreaterThan(1);
    });

    it('should calculate complexity for try-catch', () => {
      const code = `
        function withCatch() {
          try {
            doSomething();
          } catch (e) {
            handleError(e);
          }
        }
      `;
      const result = processFile(code, 'test.js');
      expect(result.complexity).toBeGreaterThan(1);
    });

    it('should calculate complexity for logical expressions', () => {
      const code = `
        function withLogic(a, b) {
          return a && b || !a;
        }
      `;
      const result = processFile(code, 'test.js');
      expect(result.complexity).toBeGreaterThan(1);
    });

    it('should handle complex real-world example', () => {
      const code = `
        import React, { useState, useEffect } from 'react';
        import axios from 'axios';

        export const UserList = () => {
          const [users, setUsers] = useState([]);
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState(null);

          useEffect(() => {
            fetchUsers();
          }, []);

          const fetchUsers = async () => {
            try {
              const response = await axios.get('/api/users');
              setUsers(response.data);
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          };

          if (loading) return <div>Loading...</div>;
          if (error) return <div>Error: {error}</div>;

          return (
            <ul>
              {users.map(user => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          );
        };
      `;
      const result = processFile(code, 'UserList.tsx');
      expect(result.functions).toContain('UserList');
      expect(result.functions).toContain('fetchUsers');
      expect(result.imports).toContain('react');
      expect(result.imports).toContain('axios');
      expect(result.complexity).toBeGreaterThan(0);
    });
  });
});
