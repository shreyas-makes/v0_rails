const t = require('@babel/types');
const generate = require('@babel/generator').default;

/**
 * Extract props from component parameters
 * @param {Array} params - Function parameters
 * @returns {Array} - Props information
 */
function extractProps(params) {
  const props = [];
  
  if (params.length === 0) {
    return props;
  }
  
  // Check for props parameter
  const propsParam = params[0];
  
  if (t.isIdentifier(propsParam)) {
    // Function with no destructuring, can't infer prop names
    // Return a generic props placeholder
    return [{ name: 'props', type: 'object', required: true }];
  } else if (t.isObjectPattern(propsParam)) {
    // Destructured props
    propsParam.properties.forEach(prop => {
      if (t.isObjectProperty(prop)) {
        const propName = prop.key.name;
        
        // Check for default value
        let defaultValue = null;
        let type = 'any';
        let required = true;
        
        if (t.isAssignmentPattern(prop.value)) {
          // Has default value
          required = false;
          
          // Extract default value
          if (t.isStringLiteral(prop.value.right)) {
            defaultValue = `"${prop.value.right.value}"`;
            type = 'string';
          } else if (t.isNumericLiteral(prop.value.right)) {
            defaultValue = prop.value.right.value.toString();
            type = 'number';
          } else if (t.isBooleanLiteral(prop.value.right)) {
            defaultValue = prop.value.right.value.toString();
            type = 'boolean';
          } else if (t.isNullLiteral(prop.value.right)) {
            defaultValue = 'nil';
            type = 'any';
          } else if (t.isArrayExpression(prop.value.right)) {
            defaultValue = '[]';
            type = 'array';
          } else if (t.isObjectExpression(prop.value.right)) {
            defaultValue = '{}';
            type = 'object';
          } else {
            // For complex default values, use a string representation
            defaultValue = generate(prop.value.right).code;
          }
        }
        
        props.push({
          name: propName,
          defaultValue,
          type,
          required
        });
      } else if (t.isRestElement(prop)) {
        // Rest props
        props.push({
          name: prop.argument.name,
          type: 'object',
          required: false,
          isRest: true
        });
      }
    });
  }
  
  return props;
}

module.exports = {
  extractProps
}; 