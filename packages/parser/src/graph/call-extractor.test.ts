import { describe, it, expect } from 'vitest'
import { parseContent } from '../parser/file-parser'
import { extractFunctionCalls } from './call-extractor'

describe('Call Extractor', () => {
  describe('extractFunctionCalls', () => {
    it('should extract simple function calls', () => {
      const code = `
        function greet() {}

        greet()
        greet()
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls).toHaveLength(2)
      expect(calls[0].callee).toBe('greet')
      expect(calls[0].argumentCount).toBe(0)
    })

    it('should extract function calls with arguments', () => {
      const code = `
        function add(a, b) {}

        add(1, 2)
        add(3, 4, 5)
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls).toHaveLength(2)
      expect(calls[0].callee).toBe('add')
      expect(calls[0].argumentCount).toBe(2)
      expect(calls[1].argumentCount).toBe(3)
    })

    it('should extract method calls', () => {
      const code = `
        const obj = {
          method() {}
        }

        obj.method()
        obj.method(1, 2)
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls).toHaveLength(2)
      expect(calls[0].callee).toBe('method')
      expect(calls[0].receiver).toBe('obj')
      expect(calls[0].isMemberCall).toBe(true)
    })

    it('should extract chained method calls', () => {
      const code = `
        const result = obj.foo().bar().baz()
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls.length).toBeGreaterThanOrEqual(3)
      expect(calls.some(c => c.callee === 'foo')).toBe(true)
      expect(calls.some(c => c.callee === 'bar')).toBe(true)
      expect(calls.some(c => c.callee === 'baz')).toBe(true)
    })

    it('should extract constructor calls with new keyword', () => {
      const code = `
        class MyClass {}

        const instance = new MyClass()
        const another = new MyClass(1, 2, 3)
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls).toHaveLength(2)
      expect(calls[0].callee).toBe('MyClass')
      expect(calls[0].isConstructor).toBe(true)
      expect(calls[1].argumentCount).toBe(3)
    })

    it('should extract nested function calls', () => {
      const code = `
        function outer(x) {
          inner(x)
        }

        function inner(y) {
          deepest(y)
        }

        outer(1)
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls.length).toBeGreaterThanOrEqual(3)
      expect(calls.some(c => c.callee === 'outer')).toBe(true)
      expect(calls.some(c => c.callee === 'inner')).toBe(true)
      expect(calls.some(c => c.callee === 'deepest')).toBe(true)
    })

    it('should extract calls to imported functions', () => {
      const code = `
        import { helper } from './utils'
        import defaultExport from './other'

        helper(1, 2)
        defaultExport()
      `

      const parseResult = parseContent(code, 'typescript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls.length).toBeGreaterThanOrEqual(2)
      expect(calls.some(c => c.callee === 'helper')).toBe(true)
      expect(calls.some(c => c.callee === 'defaultExport')).toBe(true)
    })

    it('should handle async/await calls', () => {
      const code = `
        async function fetchData() {}

        await fetchData()
        const result = await fetchData()
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls).toHaveLength(2)
      expect(calls[0].callee).toBe('fetchData')
      expect(calls[1].callee).toBe('fetchData')
    })

    it('should extract calls within class methods', () => {
      const code = `
        class Calculator {
          add(a, b) {
            return this.validate(a, b)
          }

          validate(x, y) {
            return true
          }
        }

        const calc = new Calculator()
        calc.add(1, 2)
      `

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      // Should extract: new Calculator(), calc.add(), this.validate()
      expect(calls.length).toBeGreaterThanOrEqual(3)
      expect(calls.some(c => c.callee === 'Calculator' && c.isConstructor)).toBe(true)
      expect(calls.some(c => c.callee === 'add')).toBe(true)
      expect(calls.some(c => c.callee === 'validate')).toBe(true)
    })

    it('should handle empty code', () => {
      const code = ``

      const parseResult = parseContent(code, 'javascript')
      const calls = extractFunctionCalls(parseResult.tree)

      expect(calls).toHaveLength(0)
    })
  })
})
