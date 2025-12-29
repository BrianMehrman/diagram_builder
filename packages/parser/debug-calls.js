import Parser from 'tree-sitter'
import TypeScript from 'tree-sitter-typescript'

const parser = new Parser()
parser.setLanguage(TypeScript.typescript)

const code1 = `
class ConsoleLogger implements ILogger {
  log(message: string) {
    console.log(message)
  }
}
`

const code2 = `
class DerivedClass extends BaseClass implements IInterface {}
`

function printNode(node, indent = 0) {
  const spaces = '  '.repeat(indent)
  console.log(`${spaces}${node.type}: "${node.text.substring(0, 80).replace(/\n/g, '\\n')}"`)
  for (const child of node.children) {
    printNode(child, indent + 1)
  }
}

console.log('=== TypeScript implements: ===')
const tree1 = parser.parse(code1)
printNode(tree1.rootNode)

console.log('\n=== TypeScript extends and implements: ===')
const tree2 = parser.parse(code2)
printNode(tree2.rootNode)
