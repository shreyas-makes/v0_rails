const t = require('@babel/types');

/**
 * Detect event handlers in JSX elements
 * @param {Object} jsxElement - Babel JSX element node
 * @returns {Array} - List of detected events
 */
function detectEvents(jsxElement) {
  const events = [];
  
  if (!jsxElement.openingElement || !jsxElement.openingElement.attributes) {
    return events;
  }
  
  jsxElement.openingElement.attributes.forEach(attr => {
    if (t.isJSXAttribute(attr) && 
        t.isJSXIdentifier(attr.name) && 
        attr.name.name.startsWith('on') &&
        attr.name.name.length > 2 && 
        attr.name.name[2] === attr.name.name[2].toUpperCase()) {
      
      // Extract event name (e.g., 'onClick' -> 'click')
      const eventName = attr.name.name.slice(2).toLowerCase();
      
      // Extract handler information
      let handler = '';
      let params = [];
      
      if (t.isJSXExpressionContainer(attr.value)) {
        if (t.isIdentifier(attr.value.expression)) {
          // Simple handler reference (e.g., onClick={handleClick})
          handler = attr.value.expression.name;
        } else if (t.isArrowFunctionExpression(attr.value.expression)) {
          // Arrow function (e.g., onClick={(e) => handleClick(e, id)})
          const arrowFunc = attr.value.expression;
          
          // Extract parameters
          if (arrowFunc.params.length > 0) {
            params = arrowFunc.params.map(param => 
              t.isIdentifier(param) ? param.name : 'param'
            );
          }
          
          // Extract handler from body
          if (t.isCallExpression(arrowFunc.body)) {
            handler = t.isIdentifier(arrowFunc.body.callee) 
              ? arrowFunc.body.callee.name 
              : 'complexHandler';
          } else if (t.isBlockStatement(arrowFunc.body)) {
            handler = `${eventName}Handler`;
          } else {
            handler = `${eventName}Handler`;
          }
        }
      }
      
      events.push({
        name: eventName,
        handler: handler || `${eventName}Handler`,
        params
      });
    }
  });
  
  return events;
}

module.exports = {
  detectEvents
}; 