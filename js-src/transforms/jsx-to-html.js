const t = require('@babel/types');
const generate = require('@babel/generator').default;

/**
 * Transform JSX element to HTML string
 * @param {Object} jsxElement - Babel JSX element node
 * @param {Array} props - Component props
 * @returns {string} - HTML string
 */
function transformJsxToHtml(jsxElement, props) {
  if (!t.isJSXElement(jsxElement)) {
    throw new Error('Not a JSX element');
  }
  
  const tagName = getTagName(jsxElement.openingElement);
  const attributes = transformAttributes(jsxElement.openingElement.attributes, props);
  
  // Check for self-closing tag
  if (jsxElement.closingElement === null) {
    return `<${tagName}${attributes} />`;
  }
  
  // Process children
  const children = transformChildren(jsxElement.children, props);
  
  return `<${tagName}${attributes}>${children}</${tagName}>`;
}

/**
 * Get tag name from JSX opening element
 * @param {Object} openingElement - Babel JSX opening element node
 * @returns {string} - Tag name
 */
function getTagName(openingElement) {
  if (t.isJSXIdentifier(openingElement.name)) {
    // Handle HTML elements (lowercase tag names)
    const name = openingElement.name.name;
    
    if (name.charAt(0) === name.charAt(0).toLowerCase()) {
      return name;
    }
    
    // Handle custom components (PascalCase tag names)
    // Map them to view_component renders
    return name.toLowerCase();
  } else if (t.isJSXMemberExpression(openingElement.name)) {
    // Handle namespaced components (e.g., UI.Button)
    // In this case, we'll use the last identifier as the component name
    const name = openingElement.name.property.name;
    return name.toLowerCase();
  }
  
  throw new Error(`Unsupported JSX tag: ${generate(openingElement.name).code}`);
}

/**
 * Transform JSX attributes to HTML attributes
 * @param {Array} attributes - Babel JSX attributes
 * @param {Array} props - Component props
 * @returns {string} - HTML attributes string
 */
function transformAttributes(attributes, props) {
  let result = '';
  
  attributes.forEach(attr => {
    if (t.isJSXAttribute(attr)) {
      // Regular attribute
      const name = attr.name.name;
      
      // Skip React-specific attributes
      if (isReactSpecificAttr(name)) {
        return;
      }
      
      // Transform attribute name (camelCase to kebab-case and handle special cases)
      const htmlAttrName = transformAttributeName(name);
      
      // Transform attribute value
      let value;
      
      if (attr.value === null) {
        // Boolean attribute
        result += ` ${htmlAttrName}`;
        return;
      } else if (t.isStringLiteral(attr.value)) {
        // String literal attribute
        value = attr.value.value;
      } else if (t.isJSXExpressionContainer(attr.value)) {
        // Expression attribute - map to ERB
        value = transformExpressionToErb(attr.value.expression, props);
      } else {
        // Unsupported attribute value
        value = `"TODO: Unsupported attribute value type: ${attr.value.type}"`;
      }
      
      result += ` ${htmlAttrName}="${value}"`;
    } else if (t.isJSXSpreadAttribute(attr)) {
      // Spread attributes are not directly supported in HTML
      // We'll handle them as dynamic attributes in ERB
      result += ' <%= render_attributes(local_assigns) %>';
    }
  });
  
  return result;
}

/**
 * Transform JSX children to HTML
 * @param {Array} children - Babel JSX children nodes
 * @param {Array} props - Component props
 * @returns {string} - HTML content
 */
function transformChildren(children, props) {
  let result = '';
  
  children.forEach(child => {
    if (t.isJSXText(child)) {
      // Regular text content
      result += child.value;
    } else if (t.isJSXElement(child)) {
      // Nested JSX element
      result += transformJsxToHtml(child, props);
    } else if (t.isJSXExpressionContainer(child)) {
      // Expression container
      if (t.isJSXEmptyExpression(child.expression)) {
        // Empty expression, skip
        return;
      }
      
      // Convert the expression to ERB
      result += transformExpressionToErb(child.expression, props);
    } else if (t.isJSXFragment(child)) {
      // JSX Fragment
      result += transformChildren(child.children, props);
    } else {
      // Unsupported child type
      result += `<!-- TODO: Unsupported child type: ${child.type} -->`;
    }
  });
  
  return result;
}

/**
 * Transform a JSX expression to ERB syntax
 * @param {Object} expression - Babel expression node
 * @param {Array} props - Component props
 * @returns {string} - ERB expression
 */
function transformExpressionToErb(expression, props) {
  // Handle different expression types
  if (t.isIdentifier(expression)) {
    // Simple variable reference
    const name = expression.name;
    
    // Check if it's a prop
    const isProp = props.some(prop => prop.name === name);
    
    if (isProp) {
      return `<%= @${name} %>`;
    }
    
    // Local variable or unknown reference
    return `<%= ${name} %>`;
  } else if (t.isMemberExpression(expression)) {
    // Property access
    const code = generate(expression).code;
    
    // Check if it's accessing a prop
    const objectName = expression.object.name;
    const isPropAccess = props.some(prop => prop.name === objectName);
    
    if (isPropAccess) {
      // Replace props. with @
      return `<%= ${code.replace(/^props\./, '@')} %>`;
    }
    
    return `<%= ${code} %>`;
  } else if (t.isConditionalExpression(expression)) {
    // Ternary expression
    const test = generate(expression.test).code;
    const consequent = generate(expression.consequent).code;
    const alternate = generate(expression.alternate).code;
    
    // Simplify prop references
    const erbTest = test.replace(/props\./g, '@');
    const erbConsequent = consequent.replace(/props\./g, '@');
    const erbAlternate = alternate.replace(/props\./g, '@');
    
    return `<% if ${erbTest} %><%= ${erbConsequent} %><% else %><%= ${erbAlternate} %><% end %>`;
  } else if (t.isLogicalExpression(expression) && expression.operator === '&&') {
    // Logical AND expression (common pattern for conditional rendering)
    const left = generate(expression.left).code;
    const right = generate(expression.right).code;
    
    // Simplify prop references
    const erbLeft = left.replace(/props\./g, '@');
    const erbRight = right.replace(/props\./g, '@');
    
    return `<% if ${erbLeft} %><%= ${erbRight} %><% end %>`;
  } else if (t.isCallExpression(expression)) {
    // Function call
    const callee = generate(expression.callee).code;
    const args = expression.arguments.map(arg => generate(arg).code).join(', ');
    
    // Check for mapping function (common pattern)
    if (callee.endsWith('.map')) {
      // Try to extract the array and item names
      const arrayName = callee.replace(/\.map$/, '').replace(/props\./, '@');
      
      // For simple map functions with an arrow function
      if (expression.arguments.length === 1 && t.isArrowFunctionExpression(expression.arguments[0])) {
        const arrowFunc = expression.arguments[0];
        const paramName = arrowFunc.params[0].name;
        
        // Generate the map body
        let mapBody;
        if (t.isBlockStatement(arrowFunc.body)) {
          // Complex map body with multiple statements
          mapBody = '<!-- TODO: Complex map body, manual conversion required -->';
        } else {
          // Simple map body returning JSX
          mapBody = t.isJSXElement(arrowFunc.body) 
            ? transformJsxToHtml(arrowFunc.body, props)
            : `<%= ${generate(arrowFunc.body).code} %>`;
        }
        
        return `<% ${arrayName}.each do |${paramName}| %>${mapBody}<% end %>`;
      }
    }
    
    // Default function call
    return `<%= ${callee.replace(/props\./, '@')}(${args.replace(/props\./g, '@')}) %>`;
  } else {
    // Other expressions
    const code = generate(expression).code;
    return `<%= ${code.replace(/props\./g, '@')} %>`;
  }
}

/**
 * Check if an attribute is React-specific and should be skipped in HTML
 * @param {string} name - Attribute name
 * @returns {boolean} - True if React-specific
 */
function isReactSpecificAttr(name) {
  const reactSpecificAttrs = [
    'key', 'ref', 'dangerouslySetInnerHTML'
  ];
  
  return reactSpecificAttrs.includes(name);
}

/**
 * Transform JSX attribute names to HTML attribute names
 * @param {string} name - JSX attribute name
 * @returns {string} - HTML attribute name
 */
function transformAttributeName(name) {
  // Handle event handlers
  if (name.startsWith('on') && name.length > 2 && name[2].toUpperCase() === name[2]) {
    // Convert to data-action for Stimulus
    const eventName = name.slice(2).toLowerCase();
    return `data-action="${eventName}->${eventName}"`;
  }
  
  // Handle className specially
  if (name === 'className') {
    return 'class';
  }
  
  // Handle htmlFor specially
  if (name === 'htmlFor') {
    return 'for';
  }
  
  // Convert camelCase to kebab-case
  return name.replace(/([A-Z])/g, '-$1').toLowerCase();
}

module.exports = {
  transformJsxToHtml
}; 