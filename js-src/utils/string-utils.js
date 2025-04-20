/**
 * Convert a string to snake_case
 * @param {string} str - String to convert
 * @returns {string} - Snake cased string
 */
function snakeCase(str) {
  return str
    // Add underscore before capital letters and convert to lowercase
    .replace(/([A-Z])/g, '_$1')
    // Remove leading underscore if present
    .replace(/^_/, '')
    .toLowerCase();
}

/**
 * Convert a string to camelCase
 * @param {string} str - String to convert
 * @returns {string} - Camel cased string
 */
function camelCase(str) {
  return str
    // Convert snake_case or kebab-case to camelCase
    .replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a string to PascalCase
 * @param {string} str - String to convert
 * @returns {string} - Pascal cased string
 */
function pascalCase(str) {
  return str
    // Convert to camelCase first
    .replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase())
    // Capitalize first letter
    .replace(/^([a-z])/, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} - Kebab cased string
 */
function kebabCase(str) {
  return str
    // Add hyphen before capital letters and convert to lowercase
    .replace(/([A-Z])/g, '-$1')
    // Remove leading hyphen if present
    .replace(/^-/, '')
    // Replace underscores with hyphens
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * Make first letter uppercase
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  snakeCase,
  camelCase,
  pascalCase,
  kebabCase,
  capitalize
}; 