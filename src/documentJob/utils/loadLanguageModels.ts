import models from './languageModels.json'

type Model = {
  type: string;
  modelName: string;
  maxTokens: number;
  available: boolean;
}

type ModelsMaxTokens = { [key: string]: number }

export const loadLanguageModels = (): ModelsMaxTokens => {
  const modelsMaxTokens: ModelsMaxTokens = {}

  models.forEach((model: Model) => {
    if (model.available) {
      modelsMaxTokens[model.type] = model.maxTokens
    }
  })

  return modelsMaxTokens
}
