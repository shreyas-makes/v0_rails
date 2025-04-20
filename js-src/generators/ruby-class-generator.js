const { pascalCase } = require('../utils/string-utils');

/**
 * Generate Ruby ViewComponent class from IR
 * @param {Object} ir - Intermediate Representation
 * @param {string} namespace - Ruby module namespace
 * @returns {string} - Ruby class code
 */
function generateRubyClass(ir, namespace) {
  const className = pascalCase(ir.name);
  const moduleNamespace = pascalCase(namespace);
  const warnings = ir.warnings || [];
  
  // Generate props
  const props = generateProps(ir.props);
  
  // Generate class
  let rubyClass = `# frozen_string_literal: true

module ${moduleNamespace}
  class ${className}Component < ViewComponent::Base
${props}
    def initialize(${generateInitializerParams(ir.props)})
${generateInitializerBody(ir.props)}
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
 * @returns {string} - Initializer parameters
 */
function generateInitializerParams(props) {
  if (!props || props.length === 0) {
    return '';
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
  
  return [requiredParams, optionalParams, restParams].filter(Boolean).join(', ');
}

/**
 * Generate initializer body for Ruby class
 * @param {Array} props - Props information
 * @returns {string} - Initializer body
 */
function generateInitializerBody(props) {
  if (!props || props.length === 0) {
    return '';
  }
  
  const assignments = props.map(prop => {
    if (prop.isRest) {
      return `      @${prop.name} = ${prop.name}`;
    } else {
      return `      @${prop.name} = ${prop.name}`;
    }
  }).join('\n');
  
  return assignments;
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
  
  return methods;
}

module.exports = {
  generateRubyClass
}; 