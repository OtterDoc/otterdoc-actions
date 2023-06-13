import * as core from '@actions/core'
import {documentRepo} from './documentJob/repoCrawl'
import {VerifyOtterDocKey} from './verify-key'
import {config as dotenvConfig} from 'dotenv'
dotenvConfig()

/**
 * Runs the Otterdoc Action Step to document code in the specified directory.
 * @async
 * @function RunActionStep
 * @returns {Promise<boolean>} Returns a Promise that resolves to a boolean indicating if the function was successful.
 * @throws {Error} Throws an error if an invalid API key is provided.
 * @remarks This function requires an API key to be provided as an input parameter. The API key is used to verify the user's identity and access to the Otterdoc service.
 * @remarks If the API key is invalid, the function will log an error message and set the action status to failed.
 * @remarks If an error occurs during the documentation process, the function will log the error message and set the action status to failed.
 * @remarks If the function completes successfully, it will log a message indicating that the repo has been documented.
 * @example
 * const success = await RunActionStep();
 * if (success) {
 * console.log('Documentation complete');
 * } else {
 * console.log('Documentation failed');
 * }
 */
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
