const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

/**
 * Detect React hooks usage in a component
 * @param {Object} path - Babel path object for the component
 * @returns {Object} - Information about hooks usage
 */
function detectHooksUsage(path) {
  const hooks = [];
  let hasStateOrEffects = false;
  
  traverse(path.node, {
    CallExpression(callPath) {
      if (t.isIdentifier(callPath.node.callee)) {
        const name = callPath.node.callee.name;
        
        // Check for common React hooks
        if (name.startsWith('use') && name[3] && name[3] === name[3].toUpperCase()) {
          hooks.push(name);
          
          // Check for state or effect hooks specifically
          if (['useState', 'useReducer', 'useEffect', 'useLayoutEffect'].includes(name)) {
            hasStateOrEffects = true;
          }
        }
      }
    }
  }, path.scope, path);
  
  return {
    hooks,
    hasStateOrEffects
  };
}

/**
 * Detects React hooks usage in the AST
 * @param {Object} ast - Babel AST
 * @return {Array<string>} - Array of hook names found
 */
function detectHooks(ast) {
  const hooks = new Set();
  
  // Find all function calls that look like React hooks
  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      if (t.isIdentifier(callee) && 
          callee.name.startsWith('use') && 
          callee.name.length > 3 &&
          callee.name[3] === callee.name[3].toUpperCase()) {
        hooks.add(callee.name);
      }
    }
  });
  
  return Array.from(hooks);
}

module.exports = {
  detectHooksUsage,
  detectHooks
}; 