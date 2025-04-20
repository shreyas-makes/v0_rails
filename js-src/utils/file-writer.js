const fs = require('fs').promises;
const path = require('path');
const { generateRubyClass } = require('../generators/ruby-class-generator');
const { generateErbTemplate } = require('../generators/erb-template-generator');
const { generateStimulusController } = require('../generators/stimulus-controller-generator');
const { generateComponentTest } = require('../generators/component-test-generator');

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
    generateTests = true
  } = options;
  
  // Create destination directory structure
  const componentDir = path.join(destPath, namespace.toLowerCase());
  await ensureDir(componentDir);
  
  // Base filenames
  const baseFilename = `${ir.snakeCaseName}_component`;
  const componentPath = path.join(componentDir, `${baseFilename}.rb`);
  const templatePath = path.join(componentDir, `${baseFilename}.html.erb`);
  const testPath = path.join('spec/components', namespace.toLowerCase(), `${baseFilename}_spec.rb`);
  
  // Generate component files
  const rubyClass = generateRubyClass(ir, namespace);
  const erbTemplate = generateErbTemplate(ir);
  
  // Write Ruby class
  await writeFileWithBackup(componentPath, rubyClass, update);
  
  // Write ERB template
  await writeFileWithBackup(templatePath, erbTemplate, update);
  
  // Generate and write Stimulus controller if needed
  if (generateStimulus && ir.needsStimulus) {
    const stimulusDir = path.join('app/javascript/controllers');
    await ensureDir(stimulusDir);
    
    const controllerName = `${ir.snakeCaseName}_controller`;
    const controllerPath = path.join(stimulusDir, `${controllerName}.js`);
    
    const stimulusController = generateStimulusController(ir);
    await writeFileWithBackup(controllerPath, stimulusController, update);
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
    stimulusControllerPath: ir.needsStimulus ? path.join('app/javascript/controllers', `${ir.snakeCaseName}_controller.js`) : null
  };
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

const writeFiles = (outputs, options) => {
  outputs.forEach(output => {
    if (output.type === 'css') {
      const destDir = path.dirname(output.destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.writeFileSync(output.destPath, output.content);
      if (options.verbose) {
        console.log(`Wrote CSS to: ${output.destPath}`);
      }
    }
    // ... existing file writing logic ...
  });
};

module.exports = {
  writeComponentFiles
}; 