import * as core from '@actions/core'
import axios from 'axios'

export async function VerifyOtterDocKey(key: string): Promise<boolean> {
  const otterdocUrl = process.env.OTTERDOC_URL || 'https://www.otterdoc.ai'
  const result = await axios
    .get(otterdocUrl + `/api/verify-key?key=${key}`)
    .catch(error => {
      console.log('Error verify key:', error.response)
    })

  if (result?.status === 200) {
    core.warning('Key is valid')
    return true
  }
  core.warning('Could not verify key')
  return false
}
