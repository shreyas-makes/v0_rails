const fs = require('fs').promises;
const path = require('path');
const { generateRubyClass } = require('../generators/ruby-class-generator');
const { generateErbTemplate } = require('../generators/erb-template-generator');
const { generateStimulusController } = require('../generators/stimulus-controller-generator');
const { generateComponentTest } = require('../generators/component-test-generator');
const { generateHelperMethods } = require('../generators/helper-generator');

/**
 * Write component files based on IR
 * @param {Object} ir - Intermediate Representation
 * @param {Object} options - Options for file generation
 * @returns {Promise<Object>} - Result of file writing operations
 */
async function writeComponentFiles(ir, options) {
  const {
    destPath = 'app/components',
    namespace = 'Ui',
    generateStimulus = false,
    update = false,
    generateTests = true,
    enhancedErbConversion = false,
    generateHelpers = false,
    maintainHierarchy = false
  } = options;
  
  // Determine directory structure
  let componentDir = '';
  
  if (maintainHierarchy && ir.originalPath) {
    // Extract relative path without file name to maintain directory structure
    const originalDir = path.dirname(ir.originalPath);
    const relativePath = path.relative(process.cwd(), originalDir);
    
    // If it's in a src or components directory, extract just that part
    const pathSegments = relativePath.split(path.sep);
    const componentSegments = [];
    
    let foundComponentPath = false;
    for (const segment of pathSegments) {
      if (foundComponentPath || segment === 'components' || segment === 'src') {
        componentSegments.push(segment);
        foundComponentPath = true;
      }
    }
    
    if (componentSegments.length > 0) {
      // Use the original directory structure but within the destPath
      componentDir = path.join(destPath, ...componentSegments, namespace.toLowerCase());
    } else {
      // Fallback to standard path if no components/src found
      componentDir = path.join(destPath, namespace.toLowerCase());
    }
  } else {
    // Standard path with namespace
    componentDir = path.join(destPath, namespace.toLowerCase());
  }
  
  await ensureDir(componentDir);
  
  // Base filenames
  const baseFilename = `${ir.snakeCaseName}_component`;
  const componentPath = path.join(componentDir, `${baseFilename}.rb`);
  const templatePath = path.join(componentDir, `${baseFilename}.html.erb`);
  const testPath = path.join('spec/components', namespace.toLowerCase(), `${baseFilename}_spec.rb`);
  const previewPath = path.join('spec/components/previews', namespace.toLowerCase(), `${baseFilename}_preview.rb`);
  
  // Generate component files
  const rubyClass = generateRubyClass(ir, namespace, { 
    detectSlots: options.detectSlots,
    slotMapping: options.slotMapping
  });
  
  const erbTemplate = generateErbTemplate(ir, { 
    enhancedErbConversion: enhancedErbConversion 
  });
  
  // Write Ruby class
  await writeFileWithBackup(componentPath, rubyClass, update);
  
  // Write ERB template
  await writeFileWithBackup(templatePath, erbTemplate, update);
  
  // Generate and write component preview
  const previewDir = path.join('spec/components/previews', namespace.toLowerCase());
  await ensureDir(previewDir);
  
  const previewContent = generateComponentPreview(ir, namespace);
  await writeFileWithBackup(previewPath, previewContent, update);
  
  // Generate and write Stimulus controller if needed
  if (generateStimulus && (ir.needsStimulus || ir.isInteractive)) {
    const stimulusDir = path.join('app/javascript/controllers');
    await ensureDir(stimulusDir);
    
    const controllerName = `${ir.snakeCaseName}_controller`;
    const controllerPath = path.join(stimulusDir, `${controllerName}.js`);
    
    const stimulusController = generateStimulusController(ir);
    await writeFileWithBackup(controllerPath, stimulusController, update);
  }
  
  // Generate and write helper if requested
  if (generateHelpers && (ir.isInteractive || ir.isIcon)) {
    const helpersDir = path.join('app/helpers');
    await ensureDir(helpersDir);
    
    const helperName = `${namespace.toLowerCase()}_${ir.snakeCaseName}_helper.rb`;
    const helperPath = path.join(helpersDir, helperName);
    
    const helperContent = generateHelperMethods(ir, namespace);
    await writeFileWithBackup(helperPath, helperContent, update);
  }
  
  // Generate and write test if enabled
  if (generateTests) {
    const testDir = path.join('spec/components', namespace.toLowerCase());
    await ensureDir(testDir);
    
    const componentTest = generateComponentTest(ir, namespace);
    await writeFileWithBackup(testPath, componentTest, update);
  }
  
  return {
    componentPath,
    templatePath,
    testPath,
    previewPath,
    stimulusControllerPath: (ir.needsStimulus || ir.isInteractive) ? 
      path.join('app/javascript/controllers', `${ir.snakeCaseName}_controller.js`) : null,
    helperPath: (generateHelpers && (ir.isInteractive || ir.isIcon)) ?
      path.join('app/helpers', `${namespace.toLowerCase()}_${ir.snakeCaseName}_helper.rb`) : null
  };
}

/**
 * Generate component preview file
 * @param {Object} ir - Intermediate representation
 * @param {string} namespace - Component namespace
 * @returns {string} - Component preview content
 */
function generateComponentPreview(ir, namespace) {
  // Generate example props for preview
  const exampleProps = [];
  
  for (const prop of ir.props) {
    if (prop.type === 'String') {
      exampleProps.push(`${prop.name}: "Example ${prop.name}"`);
    } else if (prop.type === 'Boolean') {
      exampleProps.push(`${prop.name}: true`);
    } else if (prop.type === 'Number') {
      exampleProps.push(`${prop.name}: 42`);
    } else if (prop.type === 'Array') {
      exampleProps.push(`${prop.name}: []`);
    } else if (prop.type === 'Object') {
      exampleProps.push(`${prop.name}: {}`);
    }
  }
  
  // Handle variants if available
  let variantPreviews = '';
  if (ir.variants && ir.variants.length > 0) {
    variantPreviews = ir.variants.map(variant => `
  def ${variant}
    render(${namespace}::${ir.name}Component.new(${exampleProps.join(', ')}, variant: "${variant}"))
  end`).join('\n');
  }
  
  // Handle sizes if available
  let sizePreviews = '';
  if (ir.sizes && ir.sizes.length > 0) {
    sizePreviews = ir.sizes.map(size => `
  def ${size}
    render(${namespace}::${ir.name}Component.new(${exampleProps.join(', ')}, size: "${size}"))
  end`).join('\n');
  }
  
  return `# frozen_string_literal: true

module ${namespace}
  class ${ir.name}ComponentPreview < ViewComponent::Preview
    # @!group Default
    
    # Default preview
    def default
      render(${namespace}::${ir.name}Component.new(${exampleProps.join(', ')}))
    end
    ${variantPreviews}
    ${sizePreviews}
  end
end
`;
}

/**
 * Ensure a directory exists
 * @param {string} dir - Directory path
 * @returns {Promise<void>}
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Write a file with backup support for updates
 * @param {string} filePath - Path to write
 * @param {string} content - Content to write
 * @param {boolean} update - Whether to update existing files
 * @returns {Promise<void>}
 */
async function writeFileWithBackup(filePath, content, update) {
  try {
    // Check if file exists
    const exists = await fileExists(filePath);
    
    if (exists) {
      if (update) {
        // Create backup
        const backupPath = `${filePath}.bak`;
        await fs.copyFile(filePath, backupPath);
        
        // Write updated file
        await fs.writeFile(filePath, content, 'utf-8');
      } else {
        // Don't overwrite, create a .new file instead
        await fs.writeFile(`${filePath}.new`, content, 'utf-8');
      }
    } else {
      // Create new file
      await fs.writeFile(filePath, content, 'utf-8');
    }
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} - Whether the file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const writeFiles = async (outputs, options) => {
  for (const output of outputs) {
    if (output.type === 'css') {
      const destDir = path.dirname(output.destPath);
      await ensureDir(destDir);
      await fs.writeFile(output.destPath, output.content, 'utf-8');
      if (options.verbose) {
        console.log(`Wrote CSS to: ${output.destPath}`);
      }
    }
    // ... existing file writing logic ...
  }
};

module.exports = {
  writeComponentFiles
}; 