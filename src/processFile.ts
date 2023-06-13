import {readFileSync, writeFileSync} from 'fs'

import axios, {AxiosError} from 'axios'

import * as core from '@actions/core'
import {parse} from '@babel/parser'
import traverse, {Node, NodePath} from '@babel/traverse'

const API_BASE_URL = 'https://www.codescribe.co'

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
    InterfaceDeclaration(path) {
      declarations.push(path)
    },
    FunctionDeclaration(path) {
      declarations.push(path)
    },
    ClassDeclaration(path) {
      declarations.push(path)
      path.traverse({
        ClassMethod(innerPath) {
          declarations.push(innerPath)
        }
      })
    }
  })
  // merge into one array
  // Reverse sort the array to start from the bottom to avoid line clashes
  declarations.sort((a, b) => b.node.start || 0 - (a.node.start || 0)).reverse()

  console.log('Output Functions text')

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

function formatComment(comment: string): string {
  const match = comment.match(/\/\*\*[\s\S]*?\*\//)
  return match ? `${match[0]}\n` : ''
}

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
