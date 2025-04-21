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

/**
 * Set up Tailwind configuration
 */
function setupTailwindConfig(options) {
  console.log('🔧 Setting up Tailwind configuration...');
  
  const tailwindConfigPath = './tailwind.config.js';
  
  if (!fs.existsSync(tailwindConfigPath)) {
    console.error('❌ Tailwind configuration file not found. Make sure Tailwind is installed.');
    return false;
  }
  
  try {
    let tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');
    
    // Add shadcn theme if requested
    if (options.shadcnTheme) {
      console.log('🎨 Adding shadcn theme to Tailwind configuration...');
      
      // Basic shadcn theme implementation
      const shadcnTheme = `
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },`;
      
      // Replace theme section or add it if it doesn't exist
      if (tailwindConfig.includes('theme:')) {
        tailwindConfig = tailwindConfig.replace(/theme:\s*\{[^}]*\}/s, shadcnTheme);
      } else {
        tailwindConfig = tailwindConfig.replace('module.exports = {', 'module.exports = {\n' + shadcnTheme);
      }
      
      // Create CSS variables file if it doesn't exist
      const cssVarsPath = './app/assets/stylesheets/shadcn_theme.css';
      if (!fs.existsSync(cssVarsPath)) {
        const cssVars = `
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
 
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
 
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
 
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
 
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
 
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
 
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
 
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
 
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
 
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
 
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
 
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
 
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
 
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
 
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
 
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}`;
        fs.writeFileSync(cssVarsPath, cssVars);
        console.log(`✅ Created shadcn theme CSS variables at ${cssVarsPath}`);
      }
    }
    
    // Make sure container is configured
    if (!tailwindConfig.includes('container:')) {
      const containerConfig = `
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",
    },
  },`;
      tailwindConfig = tailwindConfig.replace('theme: {', 'theme: {' + containerConfig);
    }
    
    // Add additional common v0 plugin configurations
    if (!tailwindConfig.includes('@tailwindcss/forms')) {
      const pluginsSection = tailwindConfig.includes('plugins:') ? 
        tailwindConfig.match(/plugins:\s*\[[^\]]*\]/)[0] : 
        'plugins: []';
      
      const newPluginsSection = pluginsSection.replace(']', 
        pluginsSection.includes('require(') ? 
          ', require("@tailwindcss/forms")]' : 
          'require("@tailwindcss/forms")]');
      
      tailwindConfig = tailwindConfig.replace(pluginsSection, newPluginsSection);
    }
    
    fs.writeFileSync(tailwindConfigPath, tailwindConfig);
    console.log('✅ Tailwind configuration updated successfully!');
    
    // Inform about potential dependencies
    console.log('ℹ️ You may need to install additional dependencies:');
    console.log('npm install @tailwindcss/forms --save-dev');
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating Tailwind configuration: ${error.message}`);
    return false;
  }
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
  .option('--source-map <path>', 'Copy original v0 components to preserve for reference', null)
  .option('--maintain-hierarchy', 'Preserve directory structure of source components')
  .option('--generate-controllers-from-structure', 'Create controllers based on v0 page structure')
  .option('--generate-routes-from-structure', 'Create routes based on v0 page structure')
  .option('--generate-views-from-structure', 'Create view templates for pages')
  .option('--configure-tailwind', 'Set up Tailwind configuration for component styles')
  .option('--shadcn-theme', 'Use shadcn theme in Tailwind configuration')
  .option('--detect-slots', 'Automatically detect component slots (renders_one/renders_many)')
  .option('--slot-mapping <mapping>', 'Map JSX children to slots (format: content:renders_one,items:renders_many)')
  .option('--generate-helpers', 'Generate Rails helper methods for components')
  .option('--enhanced-erb-conversion', 'Improve JSX to ERB conversion with Rails-specific syntax')
  .option('--icon-component', 'Special handling for icon components')
  .option('--handle-composition', 'Handle nested component composition')
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
      
      // Configure Tailwind if requested
      if (options.configureTailwind) {
        setupTailwindConfig({
          shadcnTheme: options.shadcnTheme
        });
      }
      
      // Parse slot mapping if provided
      let slotMapping = {};
      if (options.slotMapping) {
        options.slotMapping.split(',').forEach(mapping => {
          const [key, value] = mapping.split(':');
          if (key && value) {
            slotMapping[key.trim()] = value.trim();
          }
        });
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
        verbose: options.verbose,
        sourceMap: options.sourceMap,
        maintainHierarchy: options.maintainHierarchy,
        generateControllersFromStructure: options.generateControllersFromStructure,
        generateRoutesFromStructure: options.generateRoutesFromStructure,
        generateViewsFromStructure: options.generateViewsFromStructure,
        detectSlots: options.detectSlots,
        slotMapping: slotMapping,
        generateHelpers: options.generateHelpers,
        enhancedErbConversion: options.enhancedErbConversion,
        iconComponent: options.iconComponent,
        handleComposition: options.handleComposition
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