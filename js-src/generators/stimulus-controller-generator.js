/**
 * Generate Stimulus controller for component
 * @param {Object} ir - Intermediate Representation
 * @returns {string} - Stimulus controller code
 */
function generateStimulusController(ir) {
  // Generate handler methods based on the component's JSX
  const handlers = extractEventHandlers(ir);
  const hasHandlers = handlers.length > 0;
  
  // Check if this is an interactive component that needs special handling
  const specialInteractions = generateSpecialInteractions(ir);
  
  const controllerName = ir.snakeCaseName;
  
  return `import { Controller } from "@hotwired/stimulus"

/**
 * ${ir.name} component controller
 * 
 * This controller handles the interactive behavior for the ${ir.name} component.
 */
export default class extends Controller {
  connect() {
    // Controller connected to the DOM
    console.log("${controllerName} controller connected")
  }
  
  disconnect() {
    // Controller disconnected from the DOM
    console.log("${controllerName} controller disconnected")
  }
${hasHandlers ? handlers.join('\n') : ''}
${specialInteractions}
}
`;
}

/**
 * Extract event handlers from component JSX
 * @param {Object} ir - Intermediate Representation
 * @returns {Array} - Array of handler method strings
 */
function extractEventHandlers(ir) {
  if (!ir.jsx) return [];
  
  const handlers = [];
  const handlerSet = new Set();
  
  // Common React event handler patterns
  const eventHandlers = [
    { pattern: /onClick\s*=\s*\{([^}]+)\}/g, name: 'click' },
    { pattern: /onChange\s*=\s*\{([^}]+)\}/g, name: 'change' },
    { pattern: /onSubmit\s*=\s*\{([^}]+)\}/g, name: 'submit' },
    { pattern: /onBlur\s*=\s*\{([^}]+)\}/g, name: 'blur' },
    { pattern: /onFocus\s*=\s*\{([^}]+)\}/g, name: 'focus' },
    { pattern: /onKeyDown\s*=\s*\{([^}]+)\}/g, name: 'keydown' },
    { pattern: /onKeyUp\s*=\s*\{([^}]+)\}/g, name: 'keyup' },
    { pattern: /onMouseOver\s*=\s*\{([^}]+)\}/g, name: 'mouseover' },
    { pattern: /onMouseOut\s*=\s*\{([^}]+)\}/g, name: 'mouseout' }
  ];
  
  for (const { pattern, name } of eventHandlers) {
    let match;
    while ((match = pattern.exec(ir.jsx)) !== null) {
      const handlerName = match[1].trim().replace(/[()]/g, '');
      
      // Skip if we've already processed this handler
      if (handlerSet.has(handlerName)) continue;
      handlerSet.add(handlerName);
      
      handlers.push(generateHandlerMethod(handlerName, name));
    }
  }
  
  // Handle interactive components even if no explicit handlers
  if (ir.isInteractive && handlers.length === 0) {
    if (ir.name.toLowerCase().includes('button')) {
      handlers.push(generateHandlerMethod('click', 'click'));
    }
  }
  
  return handlers;
}

/**
 * Generate a handler method for the given handler name and event
 * @param {string} handlerName - The name of the handler
 * @param {string} eventName - The event name
 * @returns {string} - Handler method string
 */
function generateHandlerMethod(handlerName, eventName) {
  return `
  /**
   * Handles the ${eventName} event
   * @param {Event} event - The DOM event
   */
  ${handlerName}(event) {
    // Handle ${eventName} event
    console.log("${handlerName} called with", event)
    
    // Example: Prevent default behavior if needed
    // event.preventDefault()
    
    // Example: Access dataset from element
    // const { myValue } = event.currentTarget.dataset
    
    // Example: Dispatch custom event
    // const customEvent = new CustomEvent("${handlerName}:success", { 
    //   detail: { value: someValue },
    //   bubbles: true
    // })
    // this.element.dispatchEvent(customEvent)
  }`;
}

/**
 * Generate special interactions for specific component types
 * @param {Object} ir - Intermediate Representation
 * @returns {string} - Special interaction methods
 */
function generateSpecialInteractions(ir) {
  if (!ir.isInteractive) return '';
  
  let specialMethods = '';
  
  // Button specific interactions
  if (ir.name.toLowerCase().includes('button')) {
    specialMethods += `
  /**
   * Toggle active state
   * @param {Event} event - The DOM event
   */
  toggleActive(event) {
    this.element.classList.toggle('active')
  }
    
  /**
   * Set loading state
   * @param {Boolean} isLoading - Whether the button is loading
   */
  setLoading(isLoading = true) {
    if (isLoading) {
      this.element.classList.add('loading')
      this.element.setAttribute('disabled', 'disabled')
    } else {
      this.element.classList.remove('loading')
      this.element.removeAttribute('disabled')
    }
  }`;
  }
  
  // Form input specific interactions
  if (ir.name.toLowerCase().includes('input') || ir.name.toLowerCase().includes('field')) {
    specialMethods += `
  /**
   * Clear the input
   */
  clear() {
    const inputElement = this.element.querySelector('input')
    if (inputElement) {
      inputElement.value = ''
    }
  }
    
  /**
   * Set validation state
   * @param {String} state - The validation state ('valid', 'invalid', null)
   */
  setValidationState(state) {
    this.element.classList.remove('is-valid', 'is-invalid')
    
    if (state === 'valid') {
      this.element.classList.add('is-valid')
    } else if (state === 'invalid') {
      this.element.classList.add('is-invalid')
    }
  }`;
  }
  
  // Dropdown/menu specific interactions
  if (ir.name.toLowerCase().includes('dropdown') || ir.name.toLowerCase().includes('menu')) {
    specialMethods += `
  /**
   * Toggle the dropdown
   * @param {Event} event - The DOM event
   */
  toggle(event) {
    event.preventDefault()
    const isOpen = this.element.classList.contains('is-open')
    
    if (isOpen) {
      this.close()
    } else {
      this.open()
    }
  }
    
  /**
   * Open the dropdown
   */
  open() {
    this.element.classList.add('is-open')
    
    // Example: Close when clicking outside
    // document.addEventListener('click', this.outsideClickHandler)
  }
    
  /**
   * Close the dropdown
   */
  close() {
    this.element.classList.remove('is-open')
    
    // Example: Remove outside click handler
    // document.removeEventListener('click', this.outsideClickHandler)
  }`;
  }
  
  return specialMethods;
}

module.exports = {
  generateStimulusController
}; 