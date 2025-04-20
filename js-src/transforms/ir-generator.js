const t = require('@babel/types');
const generate = require('@babel/generator').default;
const { transformJsxToHtml } = require('./jsx-to-html');
const { snakeCase } = require('../utils/string-utils');

/**
 * Generate Intermediate Representation (IR) from component information
 * @param {Object} componentInfo - Component information extracted from JSX
 * @returns {Object} - Intermediate Representation
 */
function generateIR(componentInfo) {
  const ir = {
    name: componentInfo.name,
    snakeCaseName: snakeCase(componentInfo.name),
    props: componentInfo.props.map(prop => ({
      name: prop.name,
      defaultValue: prop.defaultValue,
      type: prop.type || 'any',
      required: prop.required || false
    })),
    html: null,
    events: componentInfo.events.map(event => ({
      name: event.name,
      handler: event.handler,
      params: event.params || []
    })),
    warnings: componentInfo.warnings || [],
    originalPath: componentInfo.originalPath,
    needsStimulus: componentInfo.events.length > 0 || componentInfo.hasStateOrEffects
  };
  
  // Generate HTML from JSX
  if (componentInfo.jsxElements.length > 0) {
    // Find the return statement of the component
    let rootElement = componentInfo.jsxElements[0];
    
    // If there are multiple JSX elements, try to find the one that's returned
    // This is a heuristic and may not always be correct
    if (componentInfo.jsxElements.length > 1) {
      ir.warnings.push('Multiple JSX elements found, using heuristics to identify the root element');
    }
    
    try {
      ir.html = transformJsxToHtml(rootElement, ir.props);
    } catch (error) {
      ir.warnings.push(`Failed to transform JSX to HTML: ${error.message}`);
      
      // Provide a basic empty template as fallback
      ir.html = `<div><!-- TODO: Failed to convert JSX to HTML: ${error.message} --></div>`;
    }
  } else {
    ir.warnings.push('No JSX elements found in component');
    ir.html = '<div><!-- TODO: No JSX elements found in component --></div>';
  }
  
  // Add warning for state/effects
  if (componentInfo.hasStateOrEffects) {
    ir.warnings.push('Component uses state or effects, which may require manual Stimulus controller implementation');
  }
  
  return ir;
}

module.exports = {
  generateIR
}; 