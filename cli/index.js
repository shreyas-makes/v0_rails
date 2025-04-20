#!/usr/bin/env node



const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { transformJsxFiles } = require('../lib/transforms/transformer');
const { version } = require('../package.json');

program
  .name('v0-rails')
  .description('Convert React/JSX + Tailwind UI code to Rails ViewComponent classes and ERB templates')
  .version(version)
  .argument('<input-glob>', 'Input JSX/TSX files glob pattern')
  .option('-d, --dest <path>', 'Destination root', 'app/components')
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

program.parse(); 