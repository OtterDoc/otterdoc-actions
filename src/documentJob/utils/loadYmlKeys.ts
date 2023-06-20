import * as core from '@actions/core'

interface Inputs {
  model: string;
  ignoreAlreadyCommented: boolean;
  functionLineThreshold: number;
}

export function loadYmlKeys(): Inputs {
    const model = core.getInput('model') || 'gpt3.5'

    // Convert the string inputs to boolean
    const ignoreAlreadyCommented = core.getInput('ignore-already-commented') === 'true'
    const functionLineThreshold = parseInt(core.getInput('function-line-threshold'))

    return { model, ignoreAlreadyCommented, functionLineThreshold }
}
