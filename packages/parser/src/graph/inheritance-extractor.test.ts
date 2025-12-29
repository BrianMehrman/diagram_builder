import { describe, it, expect } from 'vitest'
import { parseContent } from '../parser/file-parser'
import { extractInheritance } from './inheritance-extractor'

describe('Inheritance Extractor', () => {
  describe('extractInheritance', () => {
    it('should extract class extends relationships', () => {
      const code = `
        class Animal {}
        class Dog extends Animal {}
        class Cat extends Animal {}
      `

      const parseResult = parseContent(code, 'javascript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(2)
      expect(inheritance[0].child).toBe('Dog')
      expect(inheritance[0].parent).toBe('Animal')
      expect(inheritance[0].type).toBe('extends')
      expect(inheritance[1].child).toBe('Cat')
      expect(inheritance[1].parent).toBe('Animal')
    })

    it('should extract TypeScript implements relationships', () => {
      const code = `
        interface ILogger {
          log(message: string): void
        }

        class ConsoleLogger implements ILogger {
          log(message: string) {
            console.log(message)
          }
        }
      `

      const parseResult = parseContent(code, 'typescript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(1)
      expect(inheritance[0].child).toBe('ConsoleLogger')
      expect(inheritance[0].parent).toBe('ILogger')
      expect(inheritance[0].type).toBe('implements')
    })

    it('should extract multiple implements relationships', () => {
      const code = `
        interface IReadable {}
        interface IWritable {}

        class Stream implements IReadable, IWritable {}
      `

      const parseResult = parseContent(code, 'typescript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(2)
      expect(inheritance.some(i => i.child === 'Stream' && i.parent === 'IReadable')).toBe(true)
      expect(inheritance.some(i => i.child === 'Stream' && i.parent === 'IWritable')).toBe(true)
      expect(inheritance.every(i => i.type === 'implements')).toBe(true)
    })

    it('should extract both extends and implements', () => {
      const code = `
        class BaseClass {}
        interface IInterface {}

        class DerivedClass extends BaseClass implements IInterface {}
      `

      const parseResult = parseContent(code, 'typescript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(2)
      expect(inheritance.some(i => i.child === 'DerivedClass' && i.parent === 'BaseClass' && i.type === 'extends')).toBe(true)
      expect(inheritance.some(i => i.child === 'DerivedClass' && i.parent === 'IInterface' && i.type === 'implements')).toBe(true)
    })

    it('should handle multi-level inheritance chains', () => {
      const code = `
        class Animal {}
        class Mammal extends Animal {}
        class Dog extends Mammal {}
      `

      const parseResult = parseContent(code, 'javascript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(2)
      expect(inheritance.some(i => i.child === 'Mammal' && i.parent === 'Animal')).toBe(true)
      expect(inheritance.some(i => i.child === 'Dog' && i.parent === 'Mammal')).toBe(true)
    })

    it('should extract interface extends relationships', () => {
      const code = `
        interface IBase {}
        interface IDerived extends IBase {}
      `

      const parseResult = parseContent(code, 'typescript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(1)
      expect(inheritance[0].child).toBe('IDerived')
      expect(inheritance[0].parent).toBe('IBase')
      expect(inheritance[0].type).toBe('extends')
    })

    it('should extract interface extends with multiple parents', () => {
      const code = `
        interface IFoo {}
        interface IBar {}
        interface ICombined extends IFoo, IBar {}
      `

      const parseResult = parseContent(code, 'typescript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(2)
      expect(inheritance.some(i => i.child === 'ICombined' && i.parent === 'IFoo')).toBe(true)
      expect(inheritance.some(i => i.child === 'ICombined' && i.parent === 'IBar')).toBe(true)
    })

    it('should include source location information', () => {
      const code = `
        class Parent {}
        class Child extends Parent {}
      `

      const parseResult = parseContent(code, 'javascript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(1)
      expect(inheritance[0].line).toBeGreaterThan(0)
      expect(inheritance[0].column).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty code', () => {
      const code = ``

      const parseResult = parseContent(code, 'javascript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(0)
    })

    it('should handle classes without inheritance', () => {
      const code = `
        class Standalone {}
        class AnotherStandalone {}
      `

      const parseResult = parseContent(code, 'javascript')
      const inheritance = extractInheritance(parseResult.tree)

      expect(inheritance).toHaveLength(0)
    })
  })
})
