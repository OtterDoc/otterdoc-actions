import * as core from '@actions/core'
import fs from 'fs'
import {DocumentRepo} from './documentJob/repoCrawl'
import {VerifyOtterDocKey} from './verify-key'
import {config as dotenvConfig} from 'dotenv'
dotenvConfig()

export async function RunActionStep(): Promise<boolean> {
  console.log('Running Otterdoc Action Step v0.1b')
  console.log(`The current path is: '${__dirname}'`)
  console.log(
    `Documenting code in this directory: '${process.env.GITHUB_WORKSPACE}'`
  )

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
