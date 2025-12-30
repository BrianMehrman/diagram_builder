#!/usr/bin/env node
/**
 * CLI Entry Point
 * Command-line interface for diagram-builder
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('diagram-builder')
  .description('CLI tool for building code diagrams')
  .version('0.1.0');

program
  .command('parse <repository>')
  .description('Parse a repository and generate a code diagram')
  .option('-o, --output <path>', 'Output file path')
  .action((repository, options) => {
    console.log(`Parsing repository: ${repository}`);
    if (options.output) {
      console.log(`Output will be saved to: ${options.output}`);
    }
    // TODO: Implement parsing logic
  });

program.parse();
