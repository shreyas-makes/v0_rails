/**
 * Generate ERB template from IR
 * @param {Object} ir - Intermediate Representation
 * @param {Object} options - Options for template generation
 * @returns {string} - ERB template code
 */
function generateErbTemplate(ir, options = {}) {
  let template = ir.html;
  
  // Add comments for warnings if any
  if (ir.warnings && ir.warnings.length > 0) {
    const warningComments = ir.warnings.map(warning => 
      `<%# WARNING: ${warning} %>`
    ).join('\n');
    
    template = `${warningComments}\n\n${template}`;
  }
  
  // Special handling for icon components
  if (ir.isIcon && ir.svgContent) {
    template = handleIconComponent(ir, template);
  }
  
  // Handle interactive elements like buttons
  if (ir.isInteractive) {
    template = handleInteractiveComponent(ir, template);
  }
  
  // Add stimulus controller if needed
  if (ir.needsStimulus || ir.isInteractive) {
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
  
  // Handle slots if any
  if (ir.slots && ir.slots.length > 0) {
    template = handleSlots(ir, template);
  }
  
  // Apply JSX-to-ERB improvements
  template = improveConditionalLogic(template);
  
  // Apply enhanced ERB conversion if requested
  if (options.enhancedErbConversion) {
    template = enhanceErbConversion(ir, template);
  }
  
  // Handle component composition if any references exist
  if (ir.componentReferences && ir.componentReferences.length > 0) {
    template = handleComponentReferences(ir, template);
  }
  
  // Post-process the template - clean up whitespace and format ERB tags
  template = formatErbTemplate(template);
  
  return template;
}

/**
 * Handle icon component special processing
 * @param {Object} ir - Intermediate representation
 * @param {string} template - Original template
 * @returns {string} - Processed template
 */
function handleIconComponent(ir, template) {
  // If we have SVG content, ensure it has dynamic props
  if (ir.svgContent) {
    let updatedSvg = ir.svgContent;
    
    // Add class attribute handling
    if (!updatedSvg.includes('class=')) {
      updatedSvg = updatedSvg.replace('<svg', '<svg class="<%= classes %>"');
    } else {
      updatedSvg = updatedSvg.replace(/class="([^"]*)"/, 'class="$1 <%= classes %>"');
    }
    
    // Add size attribute handling
    if (updatedSvg.includes('width=') && updatedSvg.includes('height=')) {
      updatedSvg = updatedSvg
        .replace(/width="([^"]*)"/, 'width="<%= size || \'$1\' %>"')
        .replace(/height="([^"]*)"/, 'height="<%= size || \'$1\' %>"');
    }
    
    // Add color/stroke handling
    if (updatedSvg.includes('stroke=')) {
      updatedSvg = updatedSvg.replace(/stroke="([^"]*)"/, 'stroke="<%= color || \'currentColor\' %>"');
    }
    
    if (updatedSvg.includes('fill=')) {
      updatedSvg = updatedSvg.replace(/fill="([^"]*)"/, 'fill="<%= fill || \'none\' %>"');
    }
    
    // Add stroke-width if it exists
    if (updatedSvg.includes('stroke-width=')) {
      updatedSvg = updatedSvg.replace(/stroke-width="([^"]*)"/, 'stroke-width="<%= stroke_width || \'$1\' %>"');
    }
    
    // Add helper method above SVG
    const helperComment = `
<%# 
  Icon component for ${ir.name}
  Usage:
  - Basic: <%= ${ir.snakeCaseName}(size: "24", color: "red") %>
  - With block: <%= ${ir.snakeCaseName} do %>Custom content<% end %>
%>
`;
    
    return helperComment + `<% classes = local_assigns[:class] || "" %>\n` + updatedSvg;
  }
  
  return template;
}

/**
 * Handle interactive component special processing
 * @param {Object} ir - Intermediate representation
 * @param {string} template - Original template
 * @returns {string} - Processed template
 */
function handleInteractiveComponent(ir, template) {
  // Add variant class handling
  if (ir.variants && ir.variants.length > 0) {
    // Find the root element's class attribute
    const classMatch = template.match(/class="([^"]*)"/);
    
    if (classMatch) {
      const classValue = classMatch[1];
      const variantClasses = {};
      
      // Extract variant-specific classes
      ir.variants.forEach(variant => {
        const variantRegex = new RegExp(`\\b${variant}\\b[-\\w]*`, 'g');
        const matches = classValue.match(variantRegex);
        
        if (matches) {
          variantClasses[variant] = matches.join(' ');
        }
      });
      
      // Build the variant class string
      let variantConditions = '';
      for (const [variant, classes] of Object.entries(variantClasses)) {
        variantConditions += `variant == "${variant}" ? "${classes}" : `;
      }
      
      // Default case
      variantConditions += '""';
      
      // Replace class attribute with dynamic class handling
      template = template.replace(
        /class="([^"]*)"/,
        `class="<%= [
          "${classValue.replace(/\b(primary|secondary|destructive|outline|ghost|link)\b[-\w]*/g, '')}",
          ${variantConditions},
          local_assigns[:class]
        ].compact.join(' ') %>"`
      );
    }
  }
  
  // Add size class handling
  if (ir.sizes && ir.sizes.length > 0) {
    // Skip if we already modified the class attribute for variants
    if (!template.includes('local_assigns[:class]')) {
      const classMatch = template.match(/class="([^"]*)"/);
      
      if (classMatch) {
        const classValue = classMatch[1];
        const sizeClasses = {};
        
        // Extract size-specific classes
        ir.sizes.forEach(size => {
          const sizeRegex = new RegExp(`\\b${size}\\b[-\\w]*`, 'g');
          const matches = classValue.match(sizeRegex);
          
          if (matches) {
            sizeClasses[size] = matches.join(' ');
          }
        });
        
        // Build the size class string
        let sizeConditions = '';
        for (const [size, classes] of Object.entries(sizeClasses)) {
          sizeConditions += `size == "${size}" ? "${classes}" : `;
        }
        
        // Default case
        sizeConditions += '""';
        
        // Replace class attribute with dynamic class handling
        template = template.replace(
          /class="([^"]*)"/,
          `class="<%= [
            "${classValue.replace(/\b(sm|md|lg|xl)\b[-\w]*/g, '')}",
            ${sizeConditions},
            local_assigns[:class]
          ].compact.join(' ') %>"`
        );
      }
    } else {
      // Already modified by variant handling, need to merge the size handling
      template = template.replace(
        /class="<%= \[([\s\S]*?)\] %>/,
        (match, content) => {
          const sizeClasses = {};
          
          // Extract size-specific classes for each size
          ir.sizes.forEach(size => {
            // This is a simplification - a real implementation would need more robust parsing
            const regex = new RegExp(`\\b${size}\\b[-\\w]*`, 'g');
            const matches = template.match(regex);
            
            if (matches) {
              sizeClasses[size] = matches.join(' ');
            }
          });
          
          // Build the size condition
          let sizeConditions = '';
          for (const [size, classes] of Object.entries(sizeClasses)) {
            sizeConditions += `size == "${size}" ? "${classes}" : `;
          }
          
          sizeConditions += '""';
          
          // Update the class attribute with both variant and size handling
          return `class="<%= [
            ${content.replace(/local_assigns\[:class\]/, `${sizeConditions},\n      local_assigns[:class]`)}
          ] %>`;
        }
      );
    }
  }
  
  // Add event handler mapping for React events to Stimulus actions
  const eventMap = {
    'onClick': 'click->',
    'onChange': 'change->',
    'onSubmit': 'submit->',
    'onBlur': 'blur->',
    'onFocus': 'focus->',
    'onKeyDown': 'keydown->',
    'onKeyUp': 'keyup->'
  };
  
  for (const [reactEvent, stimulusPrefix] of Object.entries(eventMap)) {
    const eventRegex = new RegExp(`${reactEvent}=\\{([^}]+)\\}`, 'g');
    template = template.replace(eventRegex, (match, handler) => {
      // Extract method name from handler
      const methodMatch = handler.match(/([a-zA-Z0-9_]+)(\(.*\))?/);
      if (methodMatch) {
        const methodName = methodMatch[1];
        return `data-action="${stimulusPrefix}${ir.snakeCaseName}#${methodName}"`;
      }
      return match;
    });
  }
  
  // Replace button/link content with yielded content
  if (template.includes('<button') || template.includes('<a ')) {
    template = template.replace(
      /(>)([^<]*?)(<\/(?:button|a)>)/i,
      '$1<%= content || "$2" %>$3'
    );
  }
  
  return template;
}

/**
 * Handle component slots
 * @param {Object} ir - Intermediate representation
 * @param {string} template - Original template
 * @returns {string} - Processed template
 */
function handleSlots(ir, template) {
  let processedTemplate = template;
  
  // Process each slot
  ir.slots.forEach(slot => {
    const slotPattern = new RegExp(`\\{${slot.jsxPattern.replace(/[{]/g, '\\{').replace(/[}]/g, '\\}')}\\}`, 'g');
    
    if (slot.type === 'renders_one') {
      // Replace with ViewComponent slot render
      processedTemplate = processedTemplate.replace(
        slotPattern,
        `<%= render ${slot.name} if ${slot.name} %>`
      );
    } else if (slot.type === 'renders_many') {
      // Replace with ViewComponent multiple slot renders
      processedTemplate = processedTemplate.replace(
        slotPattern,
        `<% ${slot.name}.each do |item| %>
  <%= render item %>
<% end %>`
      );
    }
  });
  
  // Replace {children} with content
  const childrenPattern = /\{children\}/g;
  processedTemplate = processedTemplate.replace(
    childrenPattern,
    `<%= content %>`
  );
  
  return processedTemplate;
}

/**
 * Handle component references in templates
 * @param {Object} ir - Intermediate representation
 * @param {string} template - Original template
 * @returns {string} - Processed template
 */
function handleComponentReferences(ir, template) {
  let processedTemplate = template;
  
  // Process each component reference
  ir.componentReferences.forEach(componentName => {
    // Convert PascalCase to snake_case
    const snakeCaseName = componentName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1); // Remove leading underscore
    
    // Find component usage in JSX format
    const componentRegex = new RegExp(`<${componentName}([^>]*)>(.*?)<\\/${componentName}>`, 'gs');
    const selfClosingRegex = new RegExp(`<${componentName}([^>]*\\/)>`, 'g');
    
    // Replace with Rails render
    processedTemplate = processedTemplate
      .replace(componentRegex, (match, propsStr, children) => {
        const props = parseJsxProps(propsStr);
        let rubyProps = formatRubyProps(props);
        
        if (children && children.trim()) {
          return `<%= render ${snakeCaseName}_component.new(${rubyProps}) do %>
  ${children}
<% end %>`;
        } else {
          return `<%= render ${snakeCaseName}_component.new(${rubyProps}) %>`;
        }
      })
      .replace(selfClosingRegex, (match, propsStr) => {
        const props = parseJsxProps(propsStr);
        let rubyProps = formatRubyProps(props);
        
        return `<%= render ${snakeCaseName}_component.new(${rubyProps}) %>`;
      });
  });
  
  return processedTemplate;
}

/**
 * Parse JSX props into a structured object
 * @param {string} propsStr - JSX props string
 * @returns {Object} - Structured props object
 */
function parseJsxProps(propsStr) {
  const props = {};
  
  // Match prop formats: propName="string" or propName={expression}
  const propRegex = /([a-zA-Z0-9_]+)(?:=(?:"([^"]*)"|{([^}]*)})|)/g;
  let match;
  
  while ((match = propRegex.exec(propsStr)) !== null) {
    const [_, name, stringValue, jsxExpression] = match;
    
    if (stringValue !== undefined) {
      props[name] = { value: stringValue, isExpression: false };
    } else if (jsxExpression !== undefined) {
      props[name] = { value: jsxExpression, isExpression: true };
    } else {
      // Boolean prop like <Component prop />
      props[name] = { value: true, isExpression: false };
    }
  }
  
  return props;
}

/**
 * Format props object to Ruby hash syntax
 * @param {Object} props - Structured props object
 * @returns {string} - Ruby hash syntax string
 */
function formatRubyProps(props) {
  const rubyProps = [];
  
  for (const [name, { value, isExpression }] of Object.entries(props)) {
    // Convert camelCase to snake_case
    const snakeCaseName = name.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    if (isExpression) {
      // Handle JSX expressions, converting to Ruby
      if (typeof value === 'boolean') {
        rubyProps.push(`${snakeCaseName}: ${value}`);
      } else if (value === 'true' || value === 'false') {
        rubyProps.push(`${snakeCaseName}: ${value}`);
      } else if (!isNaN(value)) {
        rubyProps.push(`${snakeCaseName}: ${value}`);
      } else {
        // Convert JS expression to Ruby
        const rubyExpression = convertJsxExpressionToRuby(value);
        rubyProps.push(`${snakeCaseName}: ${rubyExpression}`);
      }
    } else {
      // Handle string values
      if (typeof value === 'boolean') {
        rubyProps.push(`${snakeCaseName}: ${value}`);
      } else {
        rubyProps.push(`${snakeCaseName}: "${value}"`);
      }
    }
  }
  
  return rubyProps.join(', ');
}

/**
 * Convert JSX expression to Ruby syntax
 * @param {string} expression - JSX expression
 * @returns {string} - Equivalent Ruby expression
 */
function convertJsxExpressionToRuby(expression) {
  return expression
    .replace(/===?/g, '==')
    .replace(/!==?/g, '!=')
    .replace(/&&/g, '&&')
    .replace(/\|\|/g, '||')
    .replace(/!/g, '!')
    .replace(/null/g, 'nil')
    .replace(/undefined/g, 'nil')
    .replace(/true/g, 'true')
    .replace(/false/g, 'false');
}

/**
 * Apply enhanced ERB conversion with Rails-specific syntax
 * @param {Object} ir - Intermediate representation
 * @param {string} template - Original template
 * @returns {string} - Enhanced ERB template
 */
function enhanceErbConversion(ir, template) {
  // Convert React-like props to instance variables
  const propPattern = /\{props\.([a-zA-Z0-9_]+)\}/g;
  template = template.replace(propPattern, '<%= @$1 %>');
  
  // Convert direct variable references to instance variables
  const varPattern = /\{([a-zA-Z0-9_]+)\}/g;
  template = template.replace(varPattern, (match, varName) => {
    if (ir.props.some(p => p.name === varName)) {
      return `<%= @${varName} %>`;
    }
    return match; // Keep as is if not a prop
  });
  
  // Convert ternary operators to if/else
  const ternaryPattern = /\{([^?]+)\s*\?\s*([^:]+)\s*:\s*([^}]+)\}/g;
  template = template.replace(ternaryPattern, '<% if $1 %><%= $2 %><% else %><%= $3 %><% end %>');
  
  // Convert map functions to each loops
  const mapPattern = /\{([a-zA-Z0-9_.]+)\.map\(\(?([a-zA-Z0-9_]+)(?:,\s*[a-zA-Z0-9_]+)?\)?\s*=>\s*\{([\s\S]*?)\}\)/g;
  template = template.replace(mapPattern, (match, collection, item, content) => {
    return `<% @${collection}.each do |${item}| %>${content}<% end %>`;
  });
  
  // Process string concatenations
  const concatPattern = /\{"([^"]+)"\s*\+\s*([a-zA-Z0-9_.]+)\}/g;
  template = template.replace(concatPattern, '"$1<%= $2 %>"');
  
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
  const conditionalAndPattern = /\{([^{}]+)\s*&&\s*(<[^>]+>.*?<\/[^>]+>)\}/gs;
  template = template.replace(conditionalAndPattern, (match, condition, content) => {
    return `<% if ${convertJsxConditionToErb(condition)} %>${content}<% end %>`;
  });
  
  // Pattern: {condition ? <trueElement>...</trueElement> : <falseElement>...</falseElement>}
  const conditionalTernaryPattern = /\{([^{}?:]+)\s*\?\s*(<[^>]+>.*?<\/[^>]+>)\s*:\s*(<[^>]+>.*?<\/[^>]+>)\}/gs;
  template = template.replace(conditionalTernaryPattern, (match, condition, trueContent, falseContent) => {
    return `<% if ${convertJsxConditionToErb(condition)} %>${trueContent}<% else %>${falseContent}<% end %>`;
  });
  
  return template;
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
    // Convert undefined/null to nil
    .replace(/undefined/g, 'nil')
    .replace(/null/g, 'nil')
    // Convert props references to @variables
    .replace(/props\.([a-zA-Z0-9_]+)/g, '@$1')
    .trim();
}

module.exports = {
  generateErbTemplate
}; 