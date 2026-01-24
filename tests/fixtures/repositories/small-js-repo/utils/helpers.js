// Utility functions
function greet(name) {
  return `Hello, ${name}!`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  greet,
  capitalize,
};
