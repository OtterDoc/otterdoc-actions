import {readFileSync, writeFileSync} from 'fs'

import axios, {AxiosError} from 'axios'

import * as core from '@actions/core'
import {parse} from '@babel/parser'
import traverse, {Node, NodePath} from '@babel/traverse'

const API_BASE_URL = 'https://www.codescribe.co'

/**
 * CommentFile function that takes in a file path and returns a Promise that resolves to a boolean.
 * @async
 * @function
 * @param {string} filePath - The path of the file to be commented.
 * @returns {Promise<boolean>} - A Promise that resolves to true if the file was successfully commented, false otherwise.
 */
export async function CommentFile(filePath: string): Promise<boolean> {
  console.log(`Commenting file: ${filePath}`)
  const commentedFileString = await GetCommentedFileString(filePath)
  console.log(`Got comments for file: ${filePath}`)
  if (commentedFileString) {
    writeFileSync(filePath, commentedFileString, 'utf8')
    return true
  }
  return false
}

/**
 * Asynchronously fetches comments for functions, interfaces, and classes in a given file path and inserts them into the source code.
 * @param {string} filePath - The path of the file to fetch comments for.
 * @returns {Promise<string>} - A promise that resolves with the updated source code with comments inserted.
 */
export async function GetCommentedFileString(
  filePath: string
  // scanType = ScanType.SCAN_NEW_FUNCTIONS
): Promise<string> {
  // Get the API key from the global state
  // Dummy value is used if the key is not found
  const apiKey = core.getInput('key')

  const sourceCode = readFileSync(filePath, 'utf8')
  console.log(`Reading File: ${filePath}`)

  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    ranges: true,
    tokens: true
  })

  const declarations: NodePath[] = []

  traverse(ast, {
    /**
     * Adds a declaration to the list of declarations.
     * @param {Path} path - The path of the declaration to add.
     */
    InterfaceDeclaration(path) {
      declarations.push(path)
    },
    /**
     * Adds a new function declaration to the list of declarations.
     *
     * @param {Path} path - The path of the function declaration.
     * @class
     * @remarks This method is part of the DeclarationCollector class.
     */
    FunctionDeclaration(path) {
      declarations.push(path)
    },
    /**
     * Adds the provided innerPath to the declarations array.
     *
     * @param {string} innerPath - The inner path to add to the declarations array.
     * @returns {void}
     */
    ClassDeclaration(path) {
      declarations.push(path)
      path.traverse({
        /**
         * Adds the provided innerPath to the declarations array.
         *
         * @param {string} innerPath - The inner path to add to the declarations array.
         * @returns {void}
         */
        ClassMethod(innerPath) {
          declarations.push(innerPath)
        }
      })
    }
  })
  // merge into one array
  // Reverse sort the array to start from the bottom to avoid line clashes
  declarations.sort((a, b) => b.node.start || 0 - (a.node.start || 0)).reverse()

  const fetchedCommentsPromises = declarations.map(async path => {
    if (path.node.leadingComments) {
      console.log('Existing comments found', path.node.leadingComments)
      return
    }

    const start = path.node.start || 0
    const end = path.node.end || 0
    const typedocComments =
      start && end ? getComments(sourceCode, path.node) : []

    // Fetch comments only for functions that match the scanType conditions
    const previousComment =
      typedocComments.length > 0 ? typedocComments[0] : undefined

    const fetchedComment = await fetchCommentForCodeChunk(
      sourceCode.slice(start, end),
      apiKey,
      previousComment
    )

    return {
      comment: fetchedComment ? formatComment(fetchedComment) : '',
      startPos: start
    }
  })

  const fetchedComments = await Promise.all(fetchedCommentsPromises)

  let updatedSourceCode = sourceCode

  console.log(`We fetched ${fetchedComments.length} comments`)

  for (const fetchedComment of fetchedComments) {
    if (!fetchedComment) {
      continue
    }
    console.log(`fetchedComment:\n------\n${fetchedComment.comment}\n------`)
    const insertPos = findPreviousNewlineCharacter(
      sourceCode,
      fetchedComment.startPos
    )
    updatedSourceCode =
      updatedSourceCode.substring(0, insertPos) +
      fetchedComment.comment +
      updatedSourceCode.substring(insertPos)
  }

  return updatedSourceCode
}

/**
 * Formats a comment string by extracting the TypeDoc comment block.
 * @param comment - The comment string to format.
 * @returns The formatted TypeDoc comment block.
 */
function formatComment(comment: string): string {
  const match = comment.match(/\/\*\*[\s\S]*?\*\//)
  return match ? `${match[0]}\n` : ''
}

/**
 * Fetches a comment for a given code chunk from an API using the provided API key and previous comment (if any).
 * @async
 * @function
 * @param {string} functionString - The code chunk to fetch a comment for.
 * @param {string} apiKey - The API key to use for authentication.
 * @param {string} [previousComment] - The previous comment for the code chunk, if any.
 * @returns {Promise<string>} The fetched comment.
 * @throws {Error} If the API key is missing or not provided, or if there is an error fetching the comment from the API.
 */
async function fetchCommentForCodeChunk(
  functionString: string,
  apiKey: string,
  previousComment?: string
): Promise<string> {
  try {
    console.log(`Fetching comment from API...`)

    if (!apiKey) {
      throw new Error('API key is missing or not provided.')
    }

    const response = await axios.post(`${API_BASE_URL}/api/getComment`, {
      apiKey,
      functionString,
      previousComment
    })

    // console.log('Got response from API', response)
    return response.data.comment
  } catch (error) {
    console.log('ERROR: Failed to fetch comment from API: ', error)
    if (error instanceof AxiosError && error.response) {
      const statusCode = error.response.status
      const errorMessage = error.response.data?.message || 'Unknown error'

      if (statusCode === 401) {
        throw new Error(`API Key no longer active. Please login again.`)
      }

      throw new Error(
        `Failed to fetch comment from API (HTTP status code: ${statusCode}): ${errorMessage}`
      )
    }

    throw new Error(
      `Failed to fetch comment from API: ${(error as Error).message}`
    )
  }
}

/**
 * Returns an array of TypeDoc comments from the leading comments of a given node in the provided source code.
 * @param {string} sourceCode - The source code to extract comments from.
 * @param {Node} node - The node to extract leading comments from.
 * @returns {string[]} - An array of TypeDoc comments.
 */
function getComments(sourceCode: string, node: Node): string[] {
  const leadingComments = node.leadingComments
  if (!leadingComments) {
    return []
  }
  const commentText = sourceCode.slice(
    leadingComments[0].start,
    leadingComments[leadingComments.length - 1].end
  )
  const typedocComments = Array.from(
    commentText.matchAll(/\/\*\*[\s\S]*?\*\//g),
    match => match[0]
  )
  return typedocComments
}

/**
 * Finds the index of the previous newline character in a given source code string, starting from a given position.
 * @param {string} sourceCode - The source code string to search in.
 * @param {number} position - The starting position to search from.
 * @returns {number} - The index of the previous newline character, or 0 if not found.
 */
function findPreviousNewlineCharacter(
  sourceCode: string,
  position: number
): number {
  let index = position
  while (index >= 0) {
    if (sourceCode[index] === '\n' || sourceCode[index] === '\r') {
      return index + 1
    }
    index--
  }
  return 0
}
