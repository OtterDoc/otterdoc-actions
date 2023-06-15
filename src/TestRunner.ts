import * as path from 'path'
require('dotenv').config({path: path.resolve(__dirname, './.env')})

import {RunActionStep} from './RunActionStep'

console.log(`TestRunner`)
process.env['GITHUB_WORKSPACE'] = path.join(__dirname, '../samples')
process.env['INPUT_INCLUDEFILES'] = 'sample.ts'
console.log(`Working in repo at: ${process.env['GITHUB_WORKSPACE']}`)
console.log(`Included File Filter: ${process.env['INPUT_INCLUDEFILES']}`)

/**
 * Executes the Go function asynchronously.
 * @async
 * @function
 * @returns {void}
 */
async function Go() {
  await RunActionStep()
}

Go()
