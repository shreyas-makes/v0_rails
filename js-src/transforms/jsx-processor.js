const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const path = require('path');
const { detectHooksUsage } = require('../utils/hook-detector');
const { detectEvents } = require('../utils/event-detector');
const { extractProps } = require('../utils/prop-extractor');

/**
 * Process a JSX component AST and extract relevant information
 * @param {Object} ast - Babel AST of the JSX file
 * @param {string} filePath - Path to the JSX file
 * @returns {Object} - Component information
 */
function processJsxComponent(ast, filePath) {
  const componentInfo = {
    name: path.basename(filePath, path.extname(filePath)),
    props: [],
    jsxElements: [],
    hasStateOrEffects: false,
    events: [],
    warnings: [],
    originalPath: filePath
  };
  
  // Find the component function declaration
  traverse(ast, {
    FunctionDeclaration(path) {
      if (t.isIdentifier(path.node.id)) {
        componentInfo.name = path.node.id.name;
        componentInfo.props = extractProps(path.node.params);
        
        // Detect hooks usage
        const hooksInfo = detectHooksUsage(path);
        componentInfo.hasStateOrEffects = hooksInfo.hasStateOrEffects;
        if (hooksInfo.hooks.length > 0) {
          componentInfo.warnings.push(...hooksInfo.hooks.map(hook => 
            `Component uses React hook: ${hook}. This may require manual conversion.`
          ));
        }
      }
    },
    
    // Also check for functional component as variable declaration (const X = () => {})
    VariableDeclaration(path) {
      if (path.node.declarations && path.node.declarations.length > 0) {
        const declaration = path.node.declarations[0];
        
        if (t.isIdentifier(declaration.id) && 
            (t.isArrowFunctionExpression(declaration.init) || 
             t.isFunctionExpression(declaration.init))) {
          componentInfo.name = declaration.id.name;
          componentInfo.props = extractProps(declaration.init.params);
          
          // Detect hooks usage
          const hooksInfo = detectHooksUsage(path);
          componentInfo.hasStateOrEffects = hooksInfo.hasStateOrEffects;
          if (hooksInfo.hooks.length > 0) {
            componentInfo.warnings.push(...hooksInfo.hooks.map(hook => 
              `Component uses React hook: ${hook}. This may require manual conversion.`
            ));
          }
        }
      }
    },
    
    // Extract JSX elements
    JSXElement(path) {
      componentInfo.jsxElements.push(path.node);
      
      // Detect events
      const events = detectEvents(path.node);
      if (events.length > 0) {
        componentInfo.events.push(...events);
      }
    },
    
    // Check for imports that might indicate complex React features
    ImportDeclaration(path) {
      if (t.isStringLiteral(path.node.source) && 
          path.node.source.value === 'react' &&
          path.node.specifiers) {
        
        const complexFeatures = ['useContext', 'createContext', 'Suspense', 'lazy', 'memo', 'forwardRef'];
        
        path.node.specifiers.forEach(specifier => {
          if (t.isImportSpecifier(specifier) && 
              t.isIdentifier(specifier.imported) && 
              complexFeatures.includes(specifier.imported.name)) {
            componentInfo.warnings.push(
              `Component uses advanced React feature: ${specifier.imported.name}. Manual conversion may be required.`
            );
          }
        });
      }
    }
  });
  
  // Validate component information
  if (!componentInfo.name) {
    throw new Error(`Could not determine component name from file: ${filePath}`);
  }
  
  return componentInfo;
}

module.exports = {
  processJsxComponent
}; 