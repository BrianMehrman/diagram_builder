import { describe, it, expect } from 'vitest'
import { parseContent } from '../parser/file-parser'
import { extractClasses } from './class-extractor'

describe('Class Extractor', () => {
  describe('extractClasses', () => {
    it('should extract simple ES6 class', () => {
      const code = `
class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return 'Hello, ' + this.name;
  }
}
`
      const { tree } = parseContent(code, 'javascript')
      const classes = extractClasses(tree)

      expect(classes).toHaveLength(1)
      expect(classes[0].name).toBe('User')
      expect(classes[0].methods).toHaveLength(2)
      expect(classes[0].methods.map(m => m.name)).toContain('constructor')
      expect(classes[0].methods.map(m => m.name)).toContain('greet')
    })

    it('should extract TypeScript class with types', () => {
      const code = `
class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return \`Hello, \${this.name}\`;
  }
}
`
      const { tree } = parseContent(code, 'typescript')
      const classes = extractClasses(tree)

      expect(classes).toHaveLength(1)
      expect(classes[0].name).toBe('User')
      expect(classes[0].properties).toHaveLength(2)
      expect(classes[0].properties.map(p => p.name)).toContain('name')
      expect(classes[0].properties.map(p => p.name)).toContain('age')
    })

    it('should extract class inheritance', () => {
      const code = `
class Animal {
  move() {}
}

class Dog extends Animal {
  bark() {}
}
`
      const { tree } = parseContent(code, 'javascript')
      const classes = extractClasses(tree)

      expect(classes).toHaveLength(2)

      const dog = classes.find(c => c.name === 'Dog')
      expect(dog).toBeDefined()
      expect(dog?.extends).toBe('Animal')
    })

    it('should extract TypeScript implements clause', () => {
      const code = `
interface Flyable {
  fly(): void;
}

class Bird implements Flyable {
  fly() {
    console.log('Flying!');
  }
}
`
      const { tree } = parseContent(code, 'typescript')
      const classes = extractClasses(tree)

      const bird = classes.find(c => c.name === 'Bird')
      expect(bird).toBeDefined()
      expect(bird?.implements).toContain('Flyable')
    })

    it('should extract TypeScript access modifiers', () => {
      const code = `
class User {
  public name: string;
  private password: string;
  protected email: string;

  public getName(): string {
    return this.name;
  }

  private hashPassword(): string {
    return 'hashed';
  }
}
`
      const { tree } = parseContent(code, 'typescript')
      const classes = extractClasses(tree)

      expect(classes).toHaveLength(1)
      const user = classes[0]

      const publicProp = user.properties.find(p => p.name === 'name')
      expect(publicProp?.visibility).toBe('public')

      const privateProp = user.properties.find(p => p.name === 'password')
      expect(privateProp?.visibility).toBe('private')

      const protectedProp = user.properties.find(p => p.name === 'email')
      expect(protectedProp?.visibility).toBe('protected')
    })

    it('should handle multiple classes in one file', () => {
      const code = `
class User {}
class Admin {}
class Guest {}
`
      const { tree } = parseContent(code, 'javascript')
      const classes = extractClasses(tree)

      expect(classes).toHaveLength(3)
      expect(classes.map(c => c.name)).toEqual(['User', 'Admin', 'Guest'])
    })

    it('should return empty array for no classes', () => {
      const code = `
function hello() {
  return 'world';
}
`
      const { tree } = parseContent(code, 'javascript')
      const classes = extractClasses(tree)

      expect(classes).toHaveLength(0)
    })

    it('should extract method parameters', () => {
      const code = `
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
`
      const { tree } = parseContent(code, 'typescript')
      const classes = extractClasses(tree)

      const calc = classes[0]
      const addMethod = calc.methods.find(m => m.name === 'add')

      expect(addMethod).toBeDefined()
      expect(addMethod?.parameters).toHaveLength(2)
      expect(addMethod?.parameters[0].name).toBe('a')
      expect(addMethod?.parameters[1].name).toBe('b')
    })
  })
})
