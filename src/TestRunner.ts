import * as path from 'path'
require('dotenv').config({path: path.resolve(__dirname, './.env')})

import {RunActionStep} from './RunActionStep'

console.log(`TestRunner`)
process.env['GITHUB_WORKSPACE'] = path.join(__dirname, '../samples')
console.log(`Working in repo at: ${process.env['GITHUB_WORKSPACE']}`)

async function Go() {
  await RunActionStep()
}

Go()
