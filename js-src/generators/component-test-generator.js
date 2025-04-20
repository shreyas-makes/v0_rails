const { pascalCase } = require('../utils/string-utils');

/**
 * Generate component test from IR
 * @param {Object} ir - Intermediate Representation
 * @param {string} namespace - Ruby module namespace
 * @returns {string} - Component test code
 */
function generateComponentTest(ir, namespace) {
  const className = pascalCase(ir.name);
  const moduleNamespace = pascalCase(namespace);
  
  // Generate test props based on the component props
  const testProps = generateTestProps(ir.props);
  
  return `# frozen_string_literal: true

require "test_helper"

module ${moduleNamespace}
  class ${className}ComponentTest < ViewComponent::TestCase
    def test_component_renders
      # Arrange
      ${testProps}
      
      # Act
      render_inline(${moduleNamespace}::${className}Component.new(${generateTestPropsParams(ir.props)}))
      
      # Assert
      assert_selector("${getTestSelector(ir)}")
      assert_matches_snapshot
    end
  end
end
`;
}

/**
 * Generate test props for the component test
 * @param {Array} props - Props information
 * @returns {string} - Test props setup code
 */
function generateTestProps(props) {
  if (!props || props.length === 0) {
    return '# No props required';
  }
  
  return props.map(prop => {
    // Skip rest props
    if (prop.isRest) {
      return `# Rest props: ${prop.name}`;
    }
    
    // Generate value based on prop type
    let value;
    
    switch (prop.type) {
      case 'string':
        value = `"Test ${prop.name}"`;
        break;
      case 'number':
        value = '42';
        break;
      case 'boolean':
        value = 'true';
        break;
      case 'array':
        value = '[]';
        break;
      case 'object':
        value = '{}';
        break;
      default:
        if (prop.defaultValue) {
          value = prop.defaultValue;
        } else {
          value = 'nil';
        }
    }
    
    return `${prop.name} = ${value}`;
  }).join('\n      ');
}

/**
 * Generate test props parameters for component initialization
 * @param {Array} props - Props information
 * @returns {string} - Test props parameters
 */
function generateTestPropsParams(props) {
  if (!props || props.length === 0) {
    return '';
  }
  
  const paramStrings = props.map(prop => {
    // Handle rest props differently
    if (prop.isRest) {
      return '';
    }
    
    return `${prop.name}: ${prop.name}`;
  }).filter(Boolean);
  
  return paramStrings.join(', ');
}

/**
 * Generate test selector for the component test
 * @param {Object} ir - Intermediate Representation
 * @returns {string} - CSS selector for the component test
 */
function getTestSelector(ir) {
  // Try to determine a reasonable selector from the HTML
  // This is a heuristic and might not always work perfectly
  
  // Check if we have a div or other common element as the root
  const rootElementMatch = ir.html.match(/^<([a-z][a-z0-9]*)/i);
  
  if (rootElementMatch) {
    return rootElementMatch[1];
  }
  
  // Fallback to a generic selector
  return "*";
}

module.exports = {
  generateComponentTest
}; 