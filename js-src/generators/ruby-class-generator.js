const { pascalCase } = require('../utils/string-utils');

/**
 * Generate Ruby ViewComponent class from IR
 * @param {Object} ir - Intermediate Representation
 * @param {string} namespace - Ruby module namespace
 * @param {Object} options - Options for class generation
 * @returns {string} - Ruby class code
 */
function generateRubyClass(ir, namespace, options = {}) {
  const className = pascalCase(ir.name);
  const moduleNamespace = pascalCase(namespace);
  const warnings = ir.warnings || [];
  
  // Generate slots declarations if any
  const slots = generateSlots(ir, options);
  
  // Generate props
  const props = generateProps(ir.props);
  
  // Handle variants for interactive components
  const variantHandling = generateVariantHandling(ir);
  
  // Generate class
  let rubyClass = `# frozen_string_literal: true

module ${moduleNamespace}
  class ${className}Component < ViewComponent::Base
${slots}${props}${variantHandling}
    def initialize(${generateInitializerParams(ir.props, ir)})
${generateInitializerBody(ir.props, ir)}
    end
${generateHelperMethods(ir)}
  end
end
`;

  // Add warnings as comments at the top if present
  if (warnings.length > 0) {
    const warningComments = warnings.map(warning => `# WARNING: ${warning}`).join('\n');
    rubyClass = `${warningComments}\n\n${rubyClass}`;
  }
  
  return rubyClass;
}

/**
 * Generate slot declarations for Ruby class
 * @param {Object} ir - Intermediate representation
 * @param {Object} options - Generation options
 * @returns {string} - Slot declarations
 */
function generateSlots(ir, options) {
  if (!ir.slots || ir.slots.length === 0) {
    // Always add content slot for components that might use yielded content
    if (ir.isInteractive || ir.html?.includes('{children}')) {
      return '    renders_one :content\n';
    }
    return '';
  }
  
  const slotDeclarations = ir.slots.map(slot => {
    return `    ${slot.type} :${slot.name}`;
  }).join('\n');
  
  return `${slotDeclarations}\n`;
}

/**
 * Generate variant handling for interactive components
 * @param {Object} ir - Intermediate representation
 * @returns {string} - Variant handling code
 */
function generateVariantHandling(ir) {
  if (!ir.isInteractive) return '';
  
  let variantCode = '';
  
  // Add variant methods if component has variants
  if (ir.variants && ir.variants.length > 0) {
    variantCode += `
    # Returns the current variant or default
    def variant_classes
      return "" unless variant
      case variant
${ir.variants.map(v => `      when "${v}" then "${v}"`).join('\n')}
      else ""
      end
    end

`;
  }
  
  // Add size methods if component has sizes
  if (ir.sizes && ir.sizes.length > 0) {
    variantCode += `
    # Returns the current size or default
    def size_classes
      return "" unless size
      case size
${ir.sizes.map(s => `      when "${s}" then "${s}"`).join('\n')}
      else ""
      end
    end

`;
  }
  
  // Add combined class method for convenience
  if ((ir.variants && ir.variants.length > 0) || (ir.sizes && ir.sizes.length > 0)) {
    variantCode += `
    # Combines base, variant, size and custom classes
    def class_names
      [
        base_classes,
        variant ? variant_classes : "",
        size ? size_classes : "",
        html_class
      ].compact.join(" ").strip
    end

`;
  }
  
  return variantCode;
}

/**
 * Generate props declarations for Ruby class
 * @param {Array} props - Props information
 * @returns {string} - Props declarations
 */
function generateProps(props) {
  if (!props || props.length === 0) {
    return '';
  }
  
  const requiredProps = props.filter(prop => prop.required && !prop.isRest)
    .map(prop => `    attr_reader :${prop.name}`).join('\n');
  
  const optionalProps = props.filter(prop => !prop.required && !prop.isRest)
    .map(prop => `    attr_reader :${prop.name}`).join('\n');
  
  const restProps = props.filter(prop => prop.isRest)
    .map(prop => `    attr_reader :${prop.name}`).join('\n');
  
  const sections = [requiredProps, optionalProps, restProps].filter(Boolean);
  
  return sections.length > 0 ? `${sections.join('\n')}\n` : '';
}

/**
 * Generate initializer parameters for Ruby class
 * @param {Array} props - Props information
 * @param {Object} ir - Intermediate representation
 * @returns {string} - Initializer parameters
 */
function generateInitializerParams(props, ir) {
  if (!props || props.length === 0) {
    return '';
  }
  
  // Add variant and size params for interactive components
  let additionalParams = [];
  if (ir.isInteractive) {
    additionalParams.push('variant: nil', 'size: nil');
  }
  
  // Add icon specific props
  if (ir.isIcon) {
    additionalParams.push('size: nil', 'color: nil');
  }
  
  const requiredParams = props.filter(prop => prop.required && !prop.isRest)
    .map(prop => `${prop.name}:`).join(', ');
  
  const optionalParams = props.filter(prop => !prop.required && !prop.isRest)
    .map(prop => {
      const defaultValue = prop.defaultValue !== null ? prop.defaultValue : 'nil';
      return `${prop.name}: ${defaultValue}`;
    }).join(', ');
  
  const restParams = props.filter(prop => prop.isRest)
    .map(prop => `**${prop.name}`).join(', ');
  
  // Add html_class for additional CSS classes
  additionalParams.push('html_class: nil');
  
  // If we have additionalParams and some other params, we need a separator
  const separator = (requiredParams || optionalParams || restParams) && additionalParams.length > 0 ? ', ' : '';
  
  const combinedParams = [
    requiredParams, 
    optionalParams, 
    separator + additionalParams.join(', '),
    restParams
  ].filter(Boolean).join(', ');
  
  return combinedParams;
}

/**
 * Generate initializer body for Ruby class
 * @param {Array} props - Props information
 * @param {Object} ir - Intermediate representation
 * @returns {string} - Initializer body
 */
function generateInitializerBody(props, ir) {
  if (!props || props.length === 0) {
    return '';
  }
  
  const assignments = props.map(prop => {
    if (prop.isRest) {
      return `      @${prop.name} = ${prop.name}`;
    } else {
      return `      @${prop.name} = ${prop.name}`;
    }
  });
  
  let additionalAssignments = [];
  
  // Add variant and size for interactive components
  if (ir.isInteractive) {
    additionalAssignments.push(
      '      @variant = variant',
      '      @size = size'
    );
  }
  
  // Add icon specific assignments
  if (ir.isIcon) {
    additionalAssignments.push(
      '      @size = size',
      '      @color = color'
    );
  }
  
  // Add html_class for additional CSS classes
  additionalAssignments.push('      @html_class = html_class');
  
  // Combine all assignments
  const allAssignments = [...assignments, ...additionalAssignments].join('\n');
  
  return allAssignments;
}

/**
 * Generate helper methods for the component
 * @param {Object} ir - Intermediate Representation
 * @returns {string} - Helper methods
 */
function generateHelperMethods(ir) {
  let methods = '';
  
  // Generate render_attributes method if needed
  if (ir.props.some(prop => prop.isRest)) {
    methods += `
    # Renders HTML attributes from rest props
    def render_attributes(attrs)
      attrs.except(:content).map { |key, value| "#{key}=\\"#{value}\\"" }.join(' ')
    end
`;
  }
  
  // Base classes method for interactive components
  if (ir.isInteractive) {
    methods += `
    # Base classes without variants
    def base_classes
      # Extract from your component's default classes
      "base-component-class"
    end
`;
  }
  
  // Add render_collection method if component seems to be used for collections
  const hasCollectionProp = ir.props.some(prop => 
    prop.name === 'items' || 
    prop.name === 'collection' || 
    prop.name === 'data' || 
    (prop.type === 'array' && prop.name.endsWith('s'))
  );
  
  if (hasCollectionProp) {
    methods += `
    # Renders a collection of items using this component
    def self.with_collection(collection, **options)
      collection.map { |item| new(item: item, **options) }
    end
`;
  }
  
  // Handle button rendering for interactive components
  if (ir.isInteractive && ir.name.toLowerCase().includes('button')) {
    methods += `
    # Button-specific helpers
    def button_type
      @type || "button"
    end
`;
  }
  
  return methods;
}

module.exports = {
  generateRubyClass
}; 