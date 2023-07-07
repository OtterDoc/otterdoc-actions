import fs from 'fs'
import path from 'path'

type Model = {
  type: string;
  modelName: string;
  maxTokens: number;
  available: boolean;
}

type ModelsMaxTokens = { [key: string]: number }

export const loadLanguageModels = (): ModelsMaxTokens => {
  const modelsPath = path.join(__dirname, 'languageModels.json')
  const modelsData = fs.readFileSync(modelsPath, 'utf-8')
  const models: Model[] = JSON.parse(modelsData)
  const modelsMaxTokens: ModelsMaxTokens = {}

  models.forEach((model: Model) => {
    if (model.available) {
      modelsMaxTokens[model.type] = model.maxTokens
    }
  })

  return modelsMaxTokens
}
