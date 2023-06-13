/**
 * Asynchronously waits for the specified number of milliseconds before resolving with a string.
 * @param {number} milliseconds - The number of milliseconds to wait.
 * @returns {Promise<string>} A Promise that resolves with the string 'done!' after the specified number of milliseconds.
 * @throws {Error} If the input milliseconds is not a number.
 */
export async function wait(milliseconds: number): Promise<string> {
  return new Promise(resolve => {
    if (isNaN(milliseconds)) {
      throw new Error('milliseconds not a number')
    }

    setTimeout(() => resolve('done!'), milliseconds)
  })
}
