import * as core from '@actions/core'
import fs from 'fs'
import {DocumentRepo} from './documentJob/repoCrawl'
import {VerifyOtterDocKey} from './verify-key'
import {config as dotenvConfig} from 'dotenv'
dotenvConfig()

/**
 * Runs the Otterdoc Action Step.
 *
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the action step was successfully executed.
 */
export async function RunActionStep(): Promise<boolean> {
  console.log('Running Otterdoc Action Step v0.1b')
  console.log(`The current path is: '${__dirname}'`)
  console.log(
    `Documenting code in this directory: '${process.env.GITHUB_WORKSPACE}'`
  )
  // print out directory contents
  try {
    const files = fs.readdirSync(process.env.GITHUB_WORKSPACE || __dirname)
    console.log('Files in directory:', files)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading directory: ${error.message}`)
    } else {
      console.error(`An unexpected error occurred: ${error}`)
    }
  }

  try {
    const key: string = core.getInput('key') || process.env.OTTERDOC_KEY || ''

    if (!(await VerifyOtterDocKey(key))) {
      console.log('Invalid API key')
      core.setFailed('Invalid API key')
      return false
    }

    await DocumentRepo(process.env.GITHUB_WORKSPACE || __dirname)

    console.log('Done documenting repo')
  } catch (error) {
    console.log(error)
    if (error instanceof Error) core.setFailed(error.message)
  }
  return true
}
