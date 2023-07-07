import * as core from '@actions/core'
import Bottleneck from 'bottleneck'
import fs from 'fs'
import { promises as fSAsync } from 'fs'
import path from 'path'
import ignore, {Ignore} from 'ignore'
import {DocumentTypeScriptFile} from './documentJsTs'
import {setTotal} from './utils/Progress'


let totalFiles = 0
let totalFilesProcessed = 0

export const shouldProcessFile = (file: string): boolean => {
  const ext = path.extname(file)
  switch (ext) {
    case '.js':
    case '.ts':
      return true
    // Add more cases if needed
  }
  return false
}

const readIgnoreFile = async (
  basePath: string,
  filename: string
): Promise<Ignore | null> => {
  const filePath = path.join(basePath, filename)
  try {
    const fileContent = await fSAsync.readFile(filePath, 'utf-8')
    return ignore().add(fileContent)
  } catch (error) {
    return null
  }
}

const traverseDirectory = async (
  directoryPath: string,
  basePath: string,
  ig: Ignore | null,
  maxDepth = 20
): Promise<string[]> => {
  console.log(`Traversing directory: ${directoryPath} with base: ${basePath}`)
  if (maxDepth < 0) {
    console.log(`Max depth reached for directory: ${directoryPath}`)
    return []
  }

  let filesAndFolders
  try {
    filesAndFolders = await fs.promises.opendir(directoryPath)
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
        const shouldProcess = shouldProcessFile(entryPath)
        if (shouldProcess) {
          console.log(`Found file to add: ${entryPath}`)
          filePaths.push(entryPath)
        }
      } catch (error) {
        console.error(`Failed to process file: ${entryPath}`)
      }
    } else if (entry.isDirectory()) {
      const subfolderFiles = await traverseDirectory(
        entryPath,
        basePath,
        ig,
        maxDepth - 1
      )
      filePaths.push(...subfolderFiles)
    }
  }

  return filePaths
}

export const addIncludedFiles = (includeFiles: string, basePath: string, filesToDocument: string[]): string[] => {
  if (includeFiles) {
    const includedFilesList = includeFiles.split(',').map(file => file.trim()) // Assuming the files are comma-separated
    
    for (const filePath of includedFilesList) {
      const fullPath = path.join(basePath, filePath)
      if (fs.existsSync(fullPath)) {
        const stat = fs.lstatSync(fullPath)
        if (stat.isDirectory()) {
          const directoryFiles = fs.readdirSync(fullPath).map((file: string) => path.join(fullPath, file))
          filesToDocument.push(...directoryFiles)
        } else if (stat.isFile()) {
          filesToDocument.push(fullPath)
        }
      }
    }
    
    // Removing duplicates
    filesToDocument = [...new Set(filesToDocument)]
  }
  return filesToDocument
}

export const DocumentRepo = async (directoryPath: string): Promise<void> => {
  console.log(`Documenting repo at: ${directoryPath}`)
  const basePath = path.join(directoryPath)
  const gitignore = await readIgnoreFile(basePath, '.gitignore')
  console.log(`gitignore: ${gitignore}`)
  const dockerignore = await readIgnoreFile(basePath, '.dockerignore')
  const otterdocIgnore = await readIgnoreFile(basePath, '.otterdocignore')

  // Create a combined ignore object
  const combinedIgnore = ignore()
  combinedIgnore.add('**/.*') // Ignore all hidden files and directories
  combinedIgnore.add(['*.compressed.js', '*.min.js'])
  if (gitignore) {
    combinedIgnore.add(gitignore)
  }
  if (dockerignore) {
    combinedIgnore.add(dockerignore)
  }
  if (otterdocIgnore) {
    combinedIgnore.add(otterdocIgnore)
  }

  let filesToDocument = await traverseDirectory(
    directoryPath,
    basePath,
    combinedIgnore
  )

  // Add files based on includeFiles input
  const includeFiles: string = core.getInput('includeFiles')
  filesToDocument = addIncludedFiles(includeFiles, basePath, filesToDocument)

  setTotal(filesToDocument.length)
  console.log(`Found ${filesToDocument.length} files to document`)

  const limiter = new Bottleneck({
    maxConcurrent: 25
  })

  for (const file of filesToDocument) {
    limiter.schedule(async () => DocumentTypeScriptFile(file))
  }  
}
