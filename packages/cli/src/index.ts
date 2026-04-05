#!/usr/bin/env node
/**
 * CLI Entry Point
 * Command-line interface for diagram-builder
 */

import { Command } from 'commander'
import { logger, createModuleLogger } from './logger.js'

const log = createModuleLogger('cli')

const program = new Command()

program
  .name('diagram-builder')
  .description('CLI tool for building code diagrams')
  .version('0.1.0')
  .option('-v, --verbose', 'Enable debug logging')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts()
    if (opts['verbose']) {
      logger.level = 'debug'
    }
  })

program
  .command('parse <repository>')
  .description('Parse a repository and generate a code diagram')
  .option('-o, --output <path>', 'Output file path')
  .action((repository: string, options: { output?: string }) => {
    const start = Date.now()
    log.info('command started', { command: 'parse', repository, output: options.output })
    try {
      // TODO: Implement parsing logic
      log.info('command complete', { command: 'parse', durationMs: Date.now() - start })
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      log.error('command failed', { command: 'parse', error: err.message })
      process.exit(1)
    }
  })

program.parseAsync().catch((e: unknown) => {
  const err = e instanceof Error ? e : new Error(String(e))
  logger.error('unhandled error', { error: err.message })
  process.exit(1)
})
