import fs from 'fs'

export const isMinified = (file: string): boolean => {
    const fileContent = fs.readFileSync(file, 'utf8')
    const fileLines = fileContent.split('\n')

    const singleLineFile = fileLines.length === 1
    const veryFewLongLines = fileLines.length < 5 && fileLines.every(line=> line.length > 200)
    const largeFile = fs.statSync(file).size > 1e6 // Size larger than 1MB
    
    return singleLineFile || veryFewLongLines || largeFile
}