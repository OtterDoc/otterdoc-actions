import * as core from '@actions/core'

interface Inputs {
  model: string;
  ignoreAlreadyCommented: boolean;
  ignoreSingleLineFunctions: boolean;
}

export function loadYmlKeys(): Inputs {
    const model = core.getInput('model')

    // Convert the string inputs to boolean
    const ignoreAlreadyCommented = core.getInput('ignore-already-commented') === 'true'
    const ignoreSingleLineFunctions = core.getInput('ignore-single-line-functions') === 'true'

    return { model, ignoreAlreadyCommented, ignoreSingleLineFunctions }
}
