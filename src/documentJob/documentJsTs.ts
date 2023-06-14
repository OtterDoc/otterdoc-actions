import axios from 'axios'
import { config as dotenvConfig } from 'dotenv'
import fs from 'fs'
import { encode } from 'gpt-3-encoder'
import ts from 'typescript'
import { getPercentComplete, inclementCount } from './utils/Progress'
import {
  getNodeDisplayName,
  getNodeTypeString,
  isNodeExported
} from './utils/nodeTypeHelper'
import { replaceOrInsertComment } from './utils/updateTsJsComment'
dotenvConfig()

/**
 * Interface for response data.
 * @param {string} comment - The comment for the response.
 */
interface ResponseData {
  comment: string
  // Define other properties here if necessary
}

/**
 * Options for extracting specific types of declarations from a codebase.
 * @property {boolean} ArrowFunctionExpression - Whether or not to extract Arrow Function Expressions.
 * @property {boolean} ClassDeclaration - Whether or not to extract Class Declarations.
 * @property {boolean} ClassMethod - Whether or not to extract Class Methods.
 * @property {boolean} FunctionDeclaration - Whether or not to extract Function Declarations.
 * @property {boolean} InterfaceDeclaration - Whether or not to extract Interface Declarations.
 * @property {boolean} TypeAlias - Whether or not to extract Type Aliases.
 * @property {boolean} EnumDeclaration - Whether or not to extract Enum Declarations.
 */
interface ExtractOptions {
  ArrowFunctionExpression?: boolean
  ClassDeclaration?: boolean
  ClassMethod?: boolean
  FunctionDeclaration?: boolean
  InterfaceDeclaration?: boolean
  TypeAlias?: boolean
  EnumDeclaration?: boolean
}

/**
 * Interface for a documentable part.
 * @property {string} type - The type of the documentable part.
 * @property {string} code - The code of the documentable part.
 * @property {boolean} isPublic - Indicates whether the documentable part is public or not.
 * @property {string} nodeDisplayName - The display name of the node.
 * @property {number} [lineNumber] - The line number of the documentable part (used for sorting).
 * @property {string} [documentation] - The documentation of the documentable part.
 * @property {Object[]} [leadingComments] - The leading comments of the documentable part, with each comment containing a string and a range.
 */
interface DocumentablePart {
  type: string
  code: string
  isPublic: boolean
  nodeDisplayName: string
  lineNumber?: number //used for sorting
  documentation?: string
  leadingComments?: {comment: string; range: ts.TextRange}[]
}

const generateDocumentation = async (
  part: DocumentablePart
): Promise<string | null> => {
  try {
    const otterdocUrl = process.env.OTTERDOC_URL || 'https://www.otterdoc.ai'

    const previousComment =
      part.leadingComments && part.leadingComments.length > 0
        ? part.leadingComments[0].comment
        : ''
    const response = await axios.post(
      otterdocUrl + '/api/getComment',
      {
        apiKey: process.env.INPUT_KEY,
        functionString: part.code,
        previousComment: previousComment,
        funcType: part.type
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.data) {
      console.error(`    Request error! status: ${response.status}`)
      throw new Error(`Request error! status: ${response.status}`)
    }

    const data = response.data as ResponseData
    const documentation = data.comment

    return documentation
  } catch (error) {
    console.error('    Failed to generate comment for code.')
    return null
  }
}

const extractDocumentableParts = (
  code: string,
  options: ExtractOptions
): DocumentablePart[] => {
  // Define DocumentablePart array to be returned
  const documentableParts: DocumentablePart[] = []

  // Create source file
  const sourceFile = ts.createSourceFile(
    'example.ts',
    code,
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ true
  )

  /**
   * Checks if a given string is a key of the ExtractOptions object.
   * @param {string} key - The key to check.
   * @param {ExtractOptions} options - The options object to check against.
   * @returns {boolean} - True if the key is a valid option key, false otherwise.
   */
  function isOptionKey(
    key: string,
    options: ExtractOptions
  ): key is keyof ExtractOptions {
    return Object.keys(options).some(
      optionKey => optionKey === key && options[key as keyof ExtractOptions]
    )
  }

  // Helper function to check if a comment is a TypeDoc comment
  /**
   * Determines if a given string is a valid TypeDoc comment.
   * @param comment - The comment string to check.
   * @returns {boolean} - True if the comment is a valid TypeDoc comment, false otherwise.
   */
  function isTypeDocComment(comment: string): boolean {
    return comment.startsWith('/**') && !comment.startsWith('/***')
  }

  /**
   * Visits a TypeScript node and adds it to the list of documentable parts if it meets certain criteria.
   * @param node The TypeScript node to visit.
   * @returns void
   */
  function visit(node: ts.Node): void {
    // Get the node type
    const type = getNodeTypeString(node)
    const isExported = isNodeExported(node)
    const nodeDisplayName = getNodeDisplayName(node)
    // Check if the node is one we want to document
    if (type && isOptionKey(type, options)) {
      const leadingComments = ts.getLeadingCommentRanges(
        code,
        node.getFullStart()
      )
      let comments: {comment: string; range: ts.TextRange}[] = []
      if (leadingComments) {
        leadingComments.forEach(commentRange => {
          const comment = code.slice(commentRange.pos, commentRange.end)
          if (isTypeDocComment(comment)) {
            // Check if the comment is directly above the current node
            // This is done by checking if there is an empty line
            const commentEndLineNumber =
              sourceFile.getLineAndCharacterOfPosition(commentRange.end).line +
              1
            const nodeStartLineNumber =
              sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
            const diff = nodeStartLineNumber - commentEndLineNumber
            // Check if the lines between the comment and the node are empty
            let hasEmptyLine = false
            for (let i = 1; i < diff; i++) {
              const line = sourceFile.text
                .split('\n')
                [commentEndLineNumber + i - 1].trim()
              if (line === '') {
                hasEmptyLine = true
                break
              }
            }
            if (!hasEmptyLine) {
              comments.push({comment: comment, range: commentRange})
            }
          }
        })
      }

      const start =
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
      documentableParts.push({
        type,
        code: node.getText(),
        isPublic: isExported,
        nodeDisplayName,
        lineNumber: start,
        leadingComments: comments
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return documentableParts
}

const options: ExtractOptions = {
  ArrowFunctionExpression: true,
  ClassDeclaration: true,
  ClassMethod: true,
  FunctionDeclaration: true,
  InterfaceDeclaration: true,
  TypeAlias: true,
  EnumDeclaration: true
}

export const DocumentTypeScriptFile = async (file: string): Promise<void> => {
  let fileContent = fs.readFileSync(file, 'utf8')
  let documentableParts = extractDocumentableParts(fileContent, options)

  if (documentableParts.length === 0) {
    console.log(
      `${getPercentComplete()}- Nothing to document in ${file}`
    )
    return
  }

  // Sort documentableParts in descending order by lineNumber
  documentableParts = documentableParts.sort(
    (a, b) => b.lineNumber! - a.lineNumber!
  )

  // Create a copy of the file content split by lines
  let fileContentLines = fileContent.split('\n')

  let i = 1
  for await (const part of documentableParts) {
    // Check if the part exceeds the token limit
    const tokens = encode(part.code)
    if (tokens.length > 4096) {
      console.log(`Part exceeds the token limit. Cannot document at this time.`)
      continue
    }

    // Generate the documentation for this part
    // will be nothing if it fails
    part.documentation = (await generateDocumentation(part)) || ''
    if (part.documentation) {
      fileContentLines = replaceOrInsertComment(
        fileContentLines,
        fileContent,
        part
      )
    }

    console.log(
      `${getPercentComplete()}- Finished part [${i++}/${
        documentableParts.length
      }] of ${file}:`,
      part.nodeDisplayName.substring(0, 50),
      part.nodeDisplayName.length > 50 ? '...' : ''
    )
  }

  // Join the modified file content
  const updatedFileContent = fileContentLines.join('\n')

  // Write the modified file content to the original file, thus overwriting it
  fs.writeFileSync(file, updatedFileContent)
  inclementCount()

  console.log(`${getPercentComplete()}- Done with ${file}`)
}
