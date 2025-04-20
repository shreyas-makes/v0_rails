const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { processJsxComponent } = require('./jsx-processor');
const { generateIR } = require('./ir-generator');
const { writeComponentFiles } = require('../utils/file-writer');

/**
 * Main function to transform JSX files into ViewComponent files
 * @param {string} globPattern - Glob pattern for input files
 * @param {Object} options - Transformation options
 * @returns {Promise<Object>} - Transformation results
 */
async function transformJsxFiles(globPattern, options) {
  const result = {
    successCount: 0,
    errorCount: 0,
    warningCount: 0,
    errors: [],
    warnings: []
  };
  
  if (options.verbose) {
    console.log(`Finding files matching pattern: ${globPattern}`);
  }
  
  // Find all matching files
  const files = await glob(globPattern);
  
  if (files.length === 0) {
    throw new Error(`No files matching pattern: ${globPattern}`);
  }
  
  if (options.verbose) {
    console.log(`Found ${files.length} files to process`);
  }
  
  // Process each file
  for (const filePath of files) {
    try {
      if (options.verbose) {
        console.log(`Processing ${filePath}`);
      }
      
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse JSX/TSX
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'classProperties']
      });
      
      // Extract component information
      const componentInfo = processJsxComponent(ast, filePath);
      
      // Generate IR
      const ir = generateIR(componentInfo);
      
      // Output IR if requested
      if (options.irOutputPath) {
        if (options.verbose) {
          console.log(`Writing IR to ${options.irOutputPath}`);
        }
        await fs.writeFile(
          options.irOutputPath,
          JSON.stringify(ir, null, 2),
          'utf-8'
        );
      }
      
      // Generate files
      if (!options.dryRun) {
        await writeComponentFiles(ir, {
          destPath: options.destPath,
          namespace: options.namespace,
          generateStimulus: options.generateStimulus,
          update: options.update,
          generateTests: options.generateTests
        });
      } else if (options.verbose) {
        console.log('Dry run - not writing files');
        console.log(JSON.stringify(ir, null, 2));
      }
      
      result.successCount++;
      
      // Count warnings
      if (ir.warnings && ir.warnings.length > 0) {
        result.warningCount += ir.warnings.length;
        result.warnings.push({
          filePath,
          warnings: ir.warnings
        });
        
        if (options.verbose) {
          console.warn(`Warnings for ${filePath}:`);
          ir.warnings.forEach(warning => console.warn(`- ${warning}`));
        }
      }
    } catch (error) {
      result.errorCount++;
      result.errors.push({
        filePath,
        error: error.message,
        stack: error.stack
      });
      
      console.error(`Error processing ${filePath}: ${error.message}`);
      
      if (options.strict) {
        throw error;
      }
    }
  }
  
  return result;
}

const processFile = async (filePath, options) => {
  const ext = path.extname(filePath);
  
  if (ext === '.css') {
    return processCssFile(filePath, options);
  }
  // ... existing JSX/TSX processing ...
};

const processCssFile = (filePath, options) => {
  const cssContent = fs.readFileSync(filePath, 'utf8');
  const outputPath = path.join(options.cssDest, path.basename(filePath));
  
  return {
    type: 'css',
    sourcePath: filePath,
    destPath: outputPath,
    content: cssContent
  };
};

module.exports = {
  transformJsxFiles
}; 