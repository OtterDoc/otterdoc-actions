#!/usr/bin/env ts-node

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({path: path.resolve(__dirname, './.env')})

import {RunActionStep} from './src/RunActionStep'

import {program} from 'commander'

program
  .name('OtterDoc CLI')
  .description('OtterDoc Command Line Interface')
  .version('1.0.0')
  .argument('<path>', 'path to the repository to comment')

// program
//   .command('document')
//   .description('Comment a local repository')
//   .argument('<path>', 'path to the repository to comment')
//   .option('--first', 'display just the first substring')
//   .option('-s, --separator <char>', 'separator character', ',')
//   .action((str, options) => {
//     const limit = options.first ? 1 : undefined
//     console.log(str.split(options.separator, limit))
//   })

program.parse()

const key = process.env['OTTERDOC_KEY']

if (!key) {
  console.error('No API key found. Please add "OTTERDOC_KEY=XXXX" to .env')
  process.exit(1)
}


const pathToDocument = program.args[0]

process.env['GITHUB_WORKSPACE'] = path.join(__dirname, pathToDocument)
// process.env['INPUT_INCLUDEFILES'] = 'sample.ts'
console.log(`Working in repo at: ${process.env['GITHUB_WORKSPACE']}`)
console.log(`Included File Filter: ${process.env['INPUT_INCLUDEFILES']}`)

/**
 * Executes the Go function asynchronously.
 * @async
 * @function
 * @returns {void}
 */
async function Go(): Promise<void> {
  await RunActionStep();
}

Go()
