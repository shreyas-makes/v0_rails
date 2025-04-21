#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { transformJsxFiles } = require('../lib/transforms/transformer');
const { version } = require('../package.json');

/**
 * Set up Rails app with required configurations
 */
function setupRailsApp() {
  console.log('🔧 Setting up Rails app for v0-rails...');
  
  // Check if application is a Rails app
  if (!fs.existsSync('./config/application.rb')) {
    console.error('❌ Not a Rails application. Run this command from your Rails app root.');
    process.exit(1);
  }
  
  // Check/update Gemfile
  let gemfileContent = fs.readFileSync('./Gemfile', 'utf8');
  if (!gemfileContent.includes('view_component')) {
    console.log('📦 Adding ViewComponent to Gemfile...');
    const gemAddition = "\n# ViewComponent for component-based views\ngem 'view_component'\n";
    fs.appendFileSync('./Gemfile', gemAddition);
    console.log('✅ Added ViewComponent to Gemfile. Run bundle install to complete installation.');
  }
  
  // Create component directories if they don't exist
  const componentDir = './app/components';
  if (!fs.existsSync(componentDir)) {
    console.log('📁 Creating components directory...');
    fs.mkdirSync(componentDir, { recursive: true });
  }
  
  // Create preview directory
  const previewDir = './spec/components/previews';
  if (!fs.existsSync(previewDir)) {
    console.log('📁 Creating component preview directory...');
    fs.mkdirSync(previewDir, { recursive: true });
  }
  
  // Check for Stimulus controllers directory
  const controllersDir = './app/javascript/controllers';
  if (!fs.existsSync(controllersDir)) {
    console.log('📁 Creating Stimulus controllers directory...');
    fs.mkdirSync(controllersDir, { recursive: true });
  }
  
  // Create example application.rb configuration if not exists
  const applicationRbPath = './config/application.rb';
  let applicationRbContent = fs.readFileSync(applicationRbPath, 'utf8');
  
  if (!applicationRbContent.includes('require "view_component"')) {
    console.log('⚙️ Adding ViewComponent configuration to application.rb...');
    // This is a simple string replacement and might need refinement for production
    const configLine = "require 'rails/all'\n";
    const newConfigLine = "require 'rails/all'\nrequire 'view_component'\n";
    applicationRbContent = applicationRbContent.replace(configLine, newConfigLine);
    
    // Add preview paths if not present
    if (!applicationRbContent.includes('preview_paths')) {
      const classLine = /class Application < Rails::Application/;
      const newClassLine = "class Application < Rails::Application\n    # View Component configuration\n    config.view_component.preview_paths << \"\#{Rails.root}/spec/components/previews\"\n";
      applicationRbContent = applicationRbContent.replace(classLine, newClassLine);
    }
    
    fs.writeFileSync(applicationRbPath, applicationRbContent);
  }
  
  console.log('✅ Rails app setup complete!');
  console.log('Next steps:');
  console.log('1. Run bundle install to install ViewComponent');
  console.log('2. Convert your React components using: v0-rails "path/to/components/**/*.jsx"');
}

program
  .name('v0-rails')
  .description('Convert React/JSX + Tailwind UI code to Rails ViewComponent classes and ERB templates')
  .version(version)
  .argument('<input-glob>', 'Input JSX/TSX/CSS files glob pattern')
  .option('-d, --dest <path>', 'Destination root', 'app/components')
  .option('-c, --css-dest <path>', 'CSS output directory', 'app/assets/stylesheets')
  .option('-n, --namespace <ns>', 'Ruby module namespace', 'Ui')
  .option('-s, --stimulus', 'Generate Stimulus controllers when needed')
  .option('-u, --update', 'Overwrite existing components diff-aware')
  .option('--ir <file>', 'Dump intermediate JSON for debugging')
  .option('--strict', 'Fail on any unsupported syntax')
  .option('--no-tests', 'Skip test generation')
  .option('--dry-run', 'Output to stdout only')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (inputGlob, options) => {
    try {
      // Validate input
      if (!inputGlob) {
        console.error('Error: Input glob pattern is required');
        process.exit(1);
      }
      
      
      // Process files
      const result = await transformJsxFiles(inputGlob, {
        destPath: options.dest,
        namespace: options.namespace,
        generateStimulus: options.stimulus,
        update: options.update,
        irOutputPath: options.ir,
        strict: options.strict,
        generateTests: !options.noTests,
        dryRun: options.dryRun,
        verbose: options.verbose
      });
      
      console.log(`✅ Successfully processed ${result.successCount} components`);
      if (result.warningCount > 0) {
        console.warn(`⚠️ Generated ${result.warningCount} components with warnings`);
      }
      
      if (result.errorCount > 0) {
        console.error(`❌ Failed to process ${result.errorCount} components`);
        process.exit(10);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('setup')
  .description('Set up Rails app with required configurations')
  .action(() => {
    setupRailsApp();
  });

program.parse(); 