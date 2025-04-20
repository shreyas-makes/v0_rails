/**
 * Generate Stimulus controller from IR
 * @param {Object} ir - Intermediate Representation
 * @returns {string} - Stimulus controller JavaScript code
 */
function generateStimulusController(ir) {
  const events = ir.events || [];
  const warnings = ir.warnings || [];
  
  // Generate event handler methods
  const handlers = generateEventHandlers(events);
  
  // Generate controller
  let controller = `import { Controller } from "@hotwired/stimulus"

// Converted from React component: ${ir.name}
export default class extends Controller {
  connect() {
    // Controller connected to DOM
    console.log("${ir.snakeCaseName} controller connected")
  }
${handlers}
}
`;

  // Add warnings as comments at the top if present
  if (warnings.length > 0) {
    const warningComments = warnings
      .filter(warning => warning.includes('hook') || warning.includes('state') || warning.includes('effect'))
      .map(warning => `// WARNING: ${warning}`)
      .join('\n');
    
    if (warningComments) {
      controller = `${warningComments}\n\n${controller}`;
    }
  }
  
  return controller;
}

/**
 * Generate event handler methods for Stimulus controller
 * @param {Array} events - Events information
 * @returns {string} - Event handler methods
 */
function generateEventHandlers(events) {
  if (!events || events.length === 0) {
    return `
  // Example event handler (from React's onClick, etc.)
  // click(event) {
  //   // Handle click event
  // }
`;
  }
  
  // Group events by handler name to avoid duplicates
  const handlerMap = {};
  
  events.forEach(event => {
    handlerMap[event.name] = event;
  });
  
  // Generate handler methods
  return Object.values(handlerMap).map(event => {
    // Process parameters
    const params = event.params.length > 0 
      ? event.params.join(', ')
      : 'event';
    
    return `
  ${event.name}(${params}) {
    // TODO: Implement ${event.handler} logic
    console.log("${event.name} event triggered", ${params})
  }`;
  }).join('\n');
}

module.exports = {
  generateStimulusController
}; 