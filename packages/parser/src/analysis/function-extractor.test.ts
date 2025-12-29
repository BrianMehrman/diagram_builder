import { describe, it, expect } from 'vitest'
import { parseContent } from '../parser/file-parser'
import { extractFunctions } from './function-extractor'

describe('Function Extractor', () => {
  describe('extractFunctions', () => {
    it('should extract function declaration', () => {
      const code = `
function greet(name) {
  return 'Hello, ' + name;
}
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('greet')
      expect(functions[0].parameters).toHaveLength(1)
      expect(functions[0].parameters[0].name).toBe('name')
    })

    it('should extract TypeScript function with types', () => {
      const code = `
function add(a: number, b: number): number {
  return a + b;
}
`
      const { tree } = parseContent(code, 'typescript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('add')
      expect(functions[0].parameters).toHaveLength(2)
      expect(functions[0].returnType).toBe('number')
    })

    it('should extract arrow function', () => {
      const code = `
const multiply = (a, b) => a * b;
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('multiply')
      expect(functions[0].isArrow).toBe(true)
    })

    it('should extract async function', () => {
      const code = `
async function fetchData() {
  return await fetch('/api/data');
}
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('fetchData')
      expect(functions[0].isAsync).toBe(true)
    })

    it('should extract generator function', () => {
      const code = `
function* generateSequence() {
  yield 1;
  yield 2;
  yield 3;
}
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('generateSequence')
      expect(functions[0].isGenerator).toBe(true)
    })

    it('should distinguish top-level from nested functions', () => {
      const code = `
function outer() {
  function inner() {
    return 'nested';
  }
  return inner();
}
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(2)

      const outer = functions.find(f => f.name === 'outer')
      const inner = functions.find(f => f.name === 'inner')

      expect(outer?.isTopLevel).toBe(true)
      expect(inner?.isTopLevel).toBe(false)
    })

    it('should extract function expression', () => {
      const code = `
const greet = function(name) {
  return 'Hello, ' + name;
};
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('greet')
    })

    it('should handle multiple functions', () => {
      const code = `
function first() {}
function second() {}
const third = () => {};
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(3)
      expect(functions.map(f => f.name)).toEqual(['first', 'second', 'third'])
    })

    it('should return empty array when no functions', () => {
      const code = `
const x = 42;
const y = 'hello';
`
      const { tree } = parseContent(code, 'javascript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(0)
    })

    it('should extract function with complex return type', () => {
      const code = `
function createUser(): { name: string; age: number } {
  return { name: 'John', age: 30 };
}
`
      const { tree } = parseContent(code, 'typescript')
      const functions = extractFunctions(tree)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('createUser')
      expect(functions[0].returnType).toBeDefined()
    })
  })
})
