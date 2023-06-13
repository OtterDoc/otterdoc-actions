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
  core.warning('Please make sure you have added your otterdoc key to your repo secrets')
  core.warning('To add:')
  core.warning('    - Go to your repo page')
  core.warning('    - Click "settings"')
  core.warning('    - Expand "secrets and variables" on the left hand side')
  core.warning('    - Select "Actions" submenu')
  core.warning('    - Select "Actions" submenu')
  core.warning('    - Click the "New repository secret" button')
  core.warning('    - Can be found at this url: https://github.com/<ORG>/<REPO>/settings/secrets/actions/new')
  core.warning('    - Key name: "OTTERDOC_KEY"')
  core.warning('    - Get your OtterDoc key at https://www.otterdoc.ai under your account')
  return false
}
