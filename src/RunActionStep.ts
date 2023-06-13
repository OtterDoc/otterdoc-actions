import * as core from '@actions/core'
import {documentRepo} from './documentJob/repoCrawl'
import {VerifyOtterDocKey} from './verify-key'
import {config as dotenvConfig} from 'dotenv'
dotenvConfig()

export async function RunActionStep(): Promise<boolean> {
  console.log('Running Otterdoc Action Step')
  console.log(`The current path is: '${__dirname}'`)
  console.log(
    `Documenting code in this directory: '${process.env.GITHUB_WORKSPACE}'`
  )
  try {
    const key: string = core.getInput('key')

    if (!(await VerifyOtterDocKey(key))) {
      console.log('Invalid API key')
      core.setFailed('Invalid API key')
      return false
    }

    await documentRepo(process.env.GITHUB_WORKSPACE || __dirname)

    console.log('Done documenting repo')
  } catch (error) {
    console.log(error)
    if (error instanceof Error) core.setFailed(error.message)
  }
  return true
}
