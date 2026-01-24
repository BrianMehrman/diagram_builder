// Main entry point
const { greet } = require('./utils/helpers');
const Calculator = require('./lib/calculator');

function main() {
  console.log(greet('World'));

  const calc = new Calculator();
  const result = calc.add(5, 10);
  console.log('Result:', result);
}

module.exports = { main };
