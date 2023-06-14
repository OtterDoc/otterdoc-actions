let totalFiles = 0
let completedFiles = 0

export function setTotal(total: number): void {
  totalFiles = total
}

export function getTotal(): number {
  return totalFiles
}

export function getCompleted(): number {
  return completedFiles
}

export function inclementCount(): number {
  return completedFiles++
}

export function getPercentComplete(): string {
  if (completedFiles === 0) {
    return `0%`
  }
  return `${Math.floor((completedFiles / totalFiles) * 100)}%`
}
