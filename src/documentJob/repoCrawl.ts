import fs from 'fs/promises'
import path from 'path'
import ignore, {Ignore} from 'ignore'
import {documentJsTs} from './documentJsTs'

export const processFile = async (file: string): Promise<void> => {
  const ext = path.extname(file)
  switch (ext) {
    case '.js':
      await documentJsTs(file)
      break
    case '.ts':
      await documentJsTs(file)
      break
    // Add more cases if needed
  }
}

const readIgnoreFile = async (
  basePath: string,
  filename: string
): Promise<Ignore | null> => {
  const filePath = path.join(basePath, filename)
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    return ignore().add(fileContent)
  } catch (error) {
    return null
  }
}

const traverseDirectory = async (
  directoryPath: string,
  basePath: string,
  ig: Ignore | null,
  maxDepth = 3
): Promise<string[]> => {
  if (maxDepth < 0) {
    console.log(`Max depth reached for directory: ${directoryPath}`)
    return []
  }

  let filesAndFolders
  try {
    filesAndFolders = await fs.readdir(directoryPath, {withFileTypes: true})
  } catch (error) {
    console.error(`Failed to read this directory 2: ${directoryPath}`)
    return []
  }

  const filePaths = []

  for await (const entry of filesAndFolders) {
    const entryPath = path.join(directoryPath, entry.name)
    const relativePath = path.relative(basePath, entryPath)

    if (ig && ig.ignores(relativePath)) {
      continue
    }

    if (entry.isFile()) {
      try {
        filePaths.push(entryPath)
      } catch (error) {
        console.error(`Failed to process file: ${entryPath}`)
      }
    } else if (entry.isDirectory()) {
      const subfolderFiles = await traverseDirectory(
        entryPath,
        basePath,
        ig,
        maxDepth - 1
      ) // Decrease maxDepth by 1
      filePaths.push(...subfolderFiles)
    }
  }

  return filePaths
}

export const DocumentRepo = async (directoryPath: string): Promise<void> => {
  const basePath = path.join(directoryPath)
  const gitignore = await readIgnoreFile(basePath, '.gitignore')
  const dockerignore = await readIgnoreFile(basePath, '.dockerignore')
  const otterdocIgnore = await readIgnoreFile(basePath, '.otterdocignore')

  // Create a combined ignore object
  const combinedIgnore = ignore()
  combinedIgnore.add('**/.*') // Ignore all hidden files and directories
  combinedIgnore.add('*.compressed.js')
  if (gitignore) {
    combinedIgnore.add(gitignore)
  }
  if (dockerignore) {
    combinedIgnore.add(dockerignore)
  }
  if (otterdocIgnore) {
    combinedIgnore.add(otterdocIgnore)
  }

  if (combinedIgnore) {
    console.log('Skipping files based on ignore config')
  }

  const filesToDocument = await traverseDirectory(
    basePath,
    basePath,
    combinedIgnore
  )

  console.log(`Found ${filesToDocument.length} files to document`)

  for await (const file of filesToDocument) {
    console.log(`Processing file: ${file}`)
    await processFile(file)
    console.log(`Done processing file: ${file}`)
  }
}
