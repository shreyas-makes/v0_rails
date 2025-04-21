/**
 * Generate helper methods for components
 * @param {Object} ir - Intermediate representation
 * @param {string} namespace - Component namespace
 * @returns {string} - Helper methods content
 */
function generateHelperMethods(ir, namespace) {
  const componentName = `${namespace}::${ir.name}Component`;
  const helperModule = `${namespace.charAt(0).toUpperCase() + namespace.slice(1)}${ir.name}Helper`;
  
  let helperMethods = '';
  
  if (ir.isInteractive) {
    // Generate button/link helpers with variants
    helperMethods += generateInteractiveHelpers(ir, componentName);
  } else if (ir.isIcon) {
    // Generate icon helpers
    helperMethods += generateIconHelpers(ir, componentName);
  } else {
    // Generate basic helpers
    helperMethods += generateBasicHelpers(ir, componentName);
  }
  
  return `# frozen_string_literal: true

module ${helperModule}
${helperMethods}
end
`;
}

/**
 * Generate helpers for interactive components (buttons, links)
 * @param {Object} ir - Intermediate representation
 * @param {string} componentName - Full component name
 * @returns {string} - Helper method content
 */
function generateInteractiveHelpers(ir, componentName) {
  const componentType = ir.name.toLowerCase().includes('button') ? 'button' : 'link';
  let methods = '';
  
  // Basic helper
  methods += `  # Renders a ${ir.name} component
  #
  # @param text [String] The button text
  # @param options [Hash] Additional options to pass to the component
  # @param block [Block] Optional block for content
  # @return [String] Rendered component
  def ${ir.snakeCaseName}(text = nil, **options, &block)
    render(${componentName}.new(**options)) do
      block_given? ? capture(&block) : text
    end
  end

`;
  
  // Generate variant helpers if available
  if (ir.variants && ir.variants.length > 0) {
    ir.variants.forEach(variant => {
      methods += `  # Renders a ${variant} variant of ${ir.name}
  #
  # @param text [String] The button text
  # @param options [Hash] Additional options to pass to the component
  # @param block [Block] Optional block for content
  # @return [String] Rendered component
  def ${ir.snakeCaseName}_${variant}(text = nil, **options, &block)
    options[:variant] = "${variant}"
    render(${componentName}.new(**options)) do
      block_given? ? capture(&block) : text
    end
  end

`;
    });
  }
  
  // Generate size helpers if available
  if (ir.sizes && ir.sizes.length > 0) {
    ir.sizes.forEach(size => {
      methods += `  # Renders a ${size} size ${ir.name}
  #
  # @param text [String] The button text
  # @param options [Hash] Additional options to pass to the component
  # @param block [Block] Optional block for content
  # @return [String] Rendered component
  def ${ir.snakeCaseName}_${size}(text = nil, **options, &block)
    options[:size] = "${size}"
    render(${componentName}.new(**options)) do
      block_given? ? capture(&block) : text
    end
  end

`;
    });
  }
  
  return methods;
}

/**
 * Generate helpers for icon components
 * @param {Object} ir - Intermediate representation
 * @param {string} componentName - Full component name
 * @returns {string} - Helper method content
 */
function generateIconHelpers(ir, componentName) {
  return `  # Renders the ${ir.name} icon
  #
  # @param options [Hash] Additional options to pass to the component
  # @option options [String] :size The icon size
  # @option options [String] :class Additional CSS classes
  # @option options [String] :color The icon color
  # @return [String] Rendered icon component
  def ${ir.snakeCaseName}(**options)
    render(${componentName}.new(**options))
  end

  # Renders the ${ir.name} icon with a specific size
  #
  # @param size [String] The icon size (sm, md, lg, etc.)
  # @param options [Hash] Additional options to pass to the component
  # @return [String] Rendered icon component  
  def ${ir.snakeCaseName}_sized(size, **options)
    options[:size] = size
    render(${componentName}.new(**options))
  end
`;
}

/**
 * Generate basic helpers for standard components
 * @param {Object} ir - Intermediate representation
 * @param {string} componentName - Full component name
 * @returns {string} - Helper method content
 */
function generateBasicHelpers(ir, componentName) {
  const propList = ir.props.map(prop => prop.name).join(', ');
  
  return `  # Renders the ${ir.name} component
  #
  # @param options [Hash] Options for the component
  # @return [String] Rendered component
  def ${ir.snakeCaseName}(**options)
    render(${componentName}.new(**options))
  end
  
  # Renders the ${ir.name} component with a content block
  #
  # @param options [Hash] Options for the component
  # @param block [Block] Content to be rendered inside the component
  # @return [String] Rendered component with content
  def ${ir.snakeCaseName}_with_content(**options, &block)
    render(${componentName}.new(**options)) do
      capture(&block)
    end
  end
`;
}

module.exports = {
  generateHelperMethods
}; 