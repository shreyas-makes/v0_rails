/**
 * Generate ERB template from IR
 * @param {Object} ir - Intermediate Representation
 * @returns {string} - ERB template code
 */
function generateErbTemplate(ir) {
  let template = ir.html;
  
  // Add comments for warnings if any
  if (ir.warnings && ir.warnings.length > 0) {
    const warningComments = ir.warnings.map(warning => 
      `<%# WARNING: ${warning} %>`
    ).join('\n');
    
    template = `${warningComments}\n\n${template}`;
  }
  
  // Add stimulus controller if needed
  if (ir.needsStimulus) {
    // Find the root element
    const rootElementMatch = template.match(/^<([a-z][a-z0-9]*)/i);
    
    if (rootElementMatch) {
      const tagName = rootElementMatch[1];
      const controllerName = `${ir.snakeCaseName}`;
      
      // Add data-controller attribute to the root element
      template = template.replace(
        new RegExp(`^<${tagName}(\\s|>)`, 'i'),
        `<${tagName} data-controller="${controllerName}"$1`
      );
    } else {
      // If we can't find the root element, add a warning comment
      template = `<%# WARNING: Could not add Stimulus controller to root element %>\n${template}`;
    }
  }
  
  // Apply JSX-to-ERB conditional improvements
  template = improveConditionalLogic(template);
  
  // Post-process the template - clean up whitespace and format ERB tags
  template = formatErbTemplate(template);
  
  return template;
}

/**
 * Improve conditional logic conversion from JSX to ERB
 * @param {string} template - The template to process
 * @returns {string} - Processed template with improved conditionals
 */
function improveConditionalLogic(template) {
  // Convert common JSX conditional patterns to ERB
  
  // Pattern: {condition && <element>...</element>}
  const conditionalPattern = /\{([^{}]+)\s*&&\s*(<[^>]+>.*?<\/[^>]+>)\}/gs;
  return template.replace(conditionalPattern, (match, condition, content) => {
    return `<% if ${convertJsxConditionToErb(condition)} %>${content}<% end %>`;
  });
}

/**
 * Format and clean up ERB template
 * @param {string} template - Raw ERB template
 * @returns {string} - Formatted ERB template
 */
function formatErbTemplate(template) {
  return template
    // Ensure there's whitespace around ERB tags
    .replace(/([^\s])(<%=|<%|%>)([^\s])/g, '$1 $2 $3')
    // Normalize multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Clean up unnecessary spaces before closing tags
    .replace(/\s+>/g, '>')
    // Clean up unnecessary spaces before self-closing tags
    .replace(/\s+\/>/g, ' />')
    // Remove empty lines
    .replace(/^\s*[\r\n]/gm, '')
    // Ensure proper spacing in ERB tags
    .replace(/<%=/g, '<%= ')
    .replace(/<%(?!=)/g, '<% ')
    .replace(/\s+%>/g, ' %>');
}

/**
 * Convert JSX condition expressions to ERB compatible syntax
 * @param {string} condition - JSX condition expression
 * @returns {string} - ERB compatible condition
 */
function convertJsxConditionToErb(condition) {
  return condition
    // Replace common JavaScript operators with Ruby equivalents
    .replace(/===?/g, '==')
    .replace(/!==?/g, '!=')
    .replace(/&&/g, '&&')
    .replace(/\|\|/g, '||')
    .replace(/!/g, '!')
    // Convert JavaScript truthiness checks to more explicit Ruby conditions
    .replace(/\?\.length/g, '&.length')
    .replace(/\(\s*([a-zA-Z0-9_.]+)\s*\)/g, '$1.present?')
    // Convert common array/string checks
    .replace(/([a-zA-Z0-9_.]+)\.length\s*>/g, '$1.length >')
    .replace(/([a-zA-Z0-9_.]+)\.length\s*</g, '$1.length <')
    .replace(/([a-zA-Z0-9_.]+)\.length\s*==/g, '$1.length ==')
    .trim();
}

module.exports = {
  generateErbTemplate
}; 