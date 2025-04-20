const fs = require('fs').promises;
const path = require('path');
const parser = require('@babel/parser');
const { processJsxComponent } = require('../js-src/transforms/jsx-processor');
const { generateIR } = require('../js-src/transforms/ir-generator');
const { transformJsxToHtml } = require('../js-src/transforms/jsx-to-html');

describe('JSX Transformer', () => {
  test('processJsxComponent extracts component information correctly', async () => {
    // Load example JSX file
    const filePath = path.join(__dirname, '../examples/Card.jsx');
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse JSX
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties']
    });
    
    // Process component
    const componentInfo = processJsxComponent(ast, filePath);
    
    // Assertions
    expect(componentInfo.name).toBe('Card');
    expect(componentInfo.props).toHaveLength(5);
    expect(componentInfo.props.map(p => p.name)).toContain('title');
    expect(componentInfo.props.map(p => p.name)).toContain('description');
    expect(componentInfo.props.map(p => p.name)).toContain('imageUrl');
    expect(componentInfo.props.map(p => p.name)).toContain('buttonText');
    expect(componentInfo.props.map(p => p.name)).toContain('onClick');
    expect(componentInfo.events).toHaveLength(1);
    expect(componentInfo.events[0].name).toBe('click');
  });
  
  test('generateIR creates correct intermediate representation', async () => {
    // Load example JSX file
    const filePath = path.join(__dirname, '../examples/Card.jsx');
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse JSX
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties']
    });
    
    // Process component and generate IR
    const componentInfo = processJsxComponent(ast, filePath);
    const ir = generateIR(componentInfo);
    
    // Assertions
    expect(ir.name).toBe('Card');
    expect(ir.snakeCaseName).toBe('card');
    expect(ir.props).toHaveLength(5);
    expect(ir.needsStimulus).toBe(true);
    expect(ir.html).toContain('<div class="max-w-sm rounded overflow-hidden shadow-lg">');
  });

  test('transformJsxToHtml handles conditional rendering', async () => {
    // Create a simple JSX element with a conditional
    const jsxElement = parser.parse(`
      <div>
        {showContent && <p>Conditional content</p>}
      </div>
    `, {
      sourceType: 'module',
      plugins: ['jsx']
    }).program.body[0].expression;
    
    // Transform to HTML
    const props = [{ name: 'showContent', type: 'boolean' }];
    const html = transformJsxToHtml(jsxElement, props);
    
    // Assertions
    expect(html).toContain('<div>');
    expect(html).toContain('<% if @showContent %>');
    expect(html).toContain('<p>Conditional content</p>');
    expect(html).toContain('<% end %>');
  });
}); 